import argparse
from datetime import date, datetime, UTC
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
from typing import Sequence
import os
import shutil
import subprocess

from .core.frontmatter import generate_document_id, utc_timestamp
from .core.indexer import rebuild_index
from .core.repository import (
    add_git_remote,
    asset_path,
    daily_path,
    decision_path,
    fetch_git_remote,
    note_path,
    push_git_remote,
    project_path,
    resolve_git_worktree,
    resolve_project_git_worktree,
    resolve_repo_root,
    review_path,
    slugify,
)
from .core.templates import render_document
from .core.validation import validate_repository


class CommandError(Exception):
    pass


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="kg")
    parser.add_argument("--repo")

    subparsers = parser.add_subparsers(dest="command")
    create_parser = subparsers.add_parser("create")
    create_subparsers = create_parser.add_subparsers(dest="create_type")
    create_subparsers.required = True

    note_parser = create_subparsers.add_parser("note")
    note_parser.add_argument("--title", required=True)
    note_parser.add_argument("--stdin", action="store_true")

    daily_parser = create_subparsers.add_parser("daily")
    daily_parser.add_argument("--date")

    decision_parser = create_subparsers.add_parser("decision")
    decision_parser.add_argument("--title", required=True)

    review_parser = create_subparsers.add_parser("review")
    review_parser.add_argument("--title", required=True)
    review_parser.add_argument("--date")

    project_parser = create_subparsers.add_parser("project")
    project_parser.add_argument("--title", required=True)
    project_parser.add_argument("--git-worktree", required=True)

    append_parser = subparsers.add_parser("append")
    append_subparsers = append_parser.add_subparsers(dest="append_type")
    append_subparsers.required = True

    append_daily_parser = append_subparsers.add_parser("daily")
    append_daily_parser.add_argument("--date")

    import_parser = subparsers.add_parser("import")
    import_subparsers = import_parser.add_subparsers(dest="import_type")
    import_subparsers.required = True

    clipboard_parser = import_subparsers.add_parser("clipboard")
    clipboard_subparsers = clipboard_parser.add_subparsers(dest="clipboard_type")
    clipboard_subparsers.required = True

    clipboard_note_parser = clipboard_subparsers.add_parser("note")
    clipboard_note_parser.add_argument("--title", required=True)

    asset_parser = import_subparsers.add_parser("asset")
    asset_parser.add_argument("--file", required=True)
    asset_parser.add_argument("--name")
    asset_parser.add_argument("--project")

    project_ops_parser = subparsers.add_parser("project")
    project_ops_subparsers = project_ops_parser.add_subparsers(dest="project_command")
    project_ops_subparsers.required = True

    add_remote_parser = project_ops_subparsers.add_parser("add-remote")
    add_remote_parser.add_argument("--project", required=True)
    add_remote_parser.add_argument("--name", required=True)
    add_remote_parser.add_argument("--url", required=True)

    fetch_parser = project_ops_subparsers.add_parser("fetch")
    fetch_parser.add_argument("--project", required=True)
    fetch_parser.add_argument("--remote", default="origin")

    push_parser = project_ops_subparsers.add_parser("push")
    push_parser.add_argument("--project", required=True)
    push_parser.add_argument("--remote", default="origin")
    push_parser.add_argument("--branch")

    sync_parser = project_ops_subparsers.add_parser("sync")
    sync_parser.add_argument("--project", required=True)
    sync_parser.add_argument("--remote", default="origin")
    sync_parser.add_argument("--branch")

    list_parser = subparsers.add_parser("list")
    list_parser.add_argument("--type")
    list_parser.add_argument("--status")
    list_parser.add_argument("--project")
    list_parser.add_argument("--date")
    list_parser.add_argument("--theme")
    list_parser.add_argument("--tag")
    list_parser.add_argument("--source")

    search_parser = subparsers.add_parser("search")
    search_parser.add_argument("query")
    search_parser.add_argument("--status")
    search_parser.add_argument("--project")
    search_parser.add_argument("--date")
    search_parser.add_argument("--theme")
    search_parser.add_argument("--tag")
    search_parser.add_argument("--source")

    subparsers.add_parser("stats")
    subparsers.add_parser("validate")

    export_parser = subparsers.add_parser("export")
    export_subparsers = export_parser.add_subparsers(dest="export_type")
    export_subparsers.required = True
    export_subparsers.add_parser("document-list")
    export_subparsers.add_parser("manifest")
    export_subparsers.add_parser("change-list")
    export_subparsers.add_parser("asset-list")

    return parser


def parse_iso_date(value: str | None) -> date:
    if value is None:
        return datetime.now(UTC).date()
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise CommandError(f"Invalid date: {value}") from exc


def create_document(
    repo_root: Path,
    template_name: str,
    title: str,
    target_path: Path,
    extra_replacements: dict[str, str] | None = None,
    body: str | None = None,
) -> Path:
    if target_path.exists():
        raise CommandError(f"Target file already exists: {target_path}")

    timestamp = utc_timestamp()
    replacements = {
        "id": generate_document_id(),
        "title": title,
        "slug": target_path.stem,
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    if extra_replacements:
        replacements.update(extra_replacements)

    rendered = render_document(
        repo_root,
        template_name,
        replacements,
    )
    if body:
        rendered = append_body(rendered, body)

    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(rendered, encoding="utf-8")
    return target_path


def append_body(rendered: str, body: str) -> str:
    cleaned = body.strip()
    if not cleaned:
        return rendered
    return f"{rendered.rstrip()}\n\n{cleaned}\n"


def read_stdin_text() -> str:
    body = sys.stdin.read().strip()
    if not body:
        raise CommandError("stdin is empty")
    return body


def read_clipboard_text() -> str:
    if sys.platform == "darwin":
        commands = (["pbpaste"],)
    elif sys.platform.startswith("win"):
        commands = (["powershell", "-NoProfile", "-Command", "Get-Clipboard"],)
    else:
        commands = (
            ["wl-paste", "-n"],
            ["xclip", "-selection", "clipboard", "-o"],
        )

    last_error = "clipboard command is unavailable"
    for command in commands:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0:
            text = result.stdout.strip()
            if not text:
                raise CommandError("clipboard is empty")
            return text
        stderr = result.stderr.strip() or result.stdout.strip()
        if stderr:
            last_error = stderr
    raise CommandError(last_error)


def append_daily_capture(repo_root: Path, target_date: date, body: str) -> Path:
    target_path = daily_path(repo_root, target_date)
    if not target_path.exists():
        create_document(
            repo_root=repo_root,
            template_name="daily",
            title=target_date.isoformat(),
            target_path=target_path,
            extra_replacements={
                "date": target_date.isoformat(),
                "slug": target_date.isoformat(),
            },
        )

    timestamp = utc_timestamp()
    entry = f"\n\n## Capture {timestamp}\n\n{body.strip()}\n"
    target_path.write_text(
        f"{target_path.read_text(encoding='utf-8').rstrip()}{entry}",
        encoding="utf-8",
    )
    return target_path


def run(args: argparse.Namespace) -> int:
    if args.command == "create":
        repo_root = resolve_repo_root(args.repo, create_if_missing=True)
        if args.create_type == "note":
            slug = slugify(args.title)
            body = read_stdin_text() if args.stdin else None
            created_path = create_document(
                repo_root=repo_root,
                template_name="note",
                title=args.title,
                target_path=note_path(repo_root, slug),
                body=body,
            )
        elif args.create_type == "daily":
            target_date = parse_iso_date(args.date)
            date_text = target_date.isoformat()
            created_path = create_document(
                repo_root=repo_root,
                template_name="daily",
                title=date_text,
                target_path=daily_path(repo_root, target_date),
                extra_replacements={"date": date_text, "slug": date_text},
            )
        elif args.create_type == "decision":
            slug = slugify(args.title)
            created_path = create_document(
                repo_root=repo_root,
                template_name="decision",
                title=args.title,
                target_path=decision_path(repo_root, slug),
            )
        elif args.create_type == "review":
            slug = slugify(args.title)
            target_date = parse_iso_date(args.date)
            created_path = create_document(
                repo_root=repo_root,
                template_name="review",
                title=args.title,
                target_path=review_path(repo_root, slug),
                extra_replacements={"date": target_date.isoformat(), "slug": slug},
            )
        elif args.create_type == "project":
            slug = slugify(args.title)
            git_worktree = resolve_git_worktree(args.git_worktree)
            created_path = create_document(
                repo_root=repo_root,
                template_name="project",
                title=args.title,
                target_path=project_path(repo_root, slug),
                extra_replacements={
                    "git_worktree": str(git_worktree),
                    "slug": slug,
                },
            )
        else:
            raise CommandError("Unsupported create type")
        print(created_path.relative_to(repo_root).as_posix())
        return 0
    if args.command == "append":
        repo_root = resolve_repo_root(args.repo, create_if_missing=True)
        if args.append_type != "daily":
            raise CommandError("Unsupported append type")
        target_date = parse_iso_date(args.date)
        created_path = append_daily_capture(repo_root, target_date, read_stdin_text())
        print(created_path.relative_to(repo_root).as_posix())
        return 0
    if args.command == "import":
        repo_root = resolve_repo_root(args.repo, create_if_missing=True)
        if args.import_type == "clipboard" and args.clipboard_type == "note":
            slug = slugify(args.title)
            created_path = create_document(
                repo_root=repo_root,
                template_name="note",
                title=args.title,
                target_path=note_path(repo_root, slug),
                body=read_clipboard_text(),
            )
            print(created_path.relative_to(repo_root).as_posix())
            return 0
        if args.import_type == "asset":
            imported_path = import_asset(
                repo_root=repo_root,
                source_path=Path(args.file).expanduser(),
                target_name=args.name,
                project_slug=args.project,
            )
            print(imported_path.relative_to(repo_root).as_posix())
            return 0
        raise CommandError("Unsupported import type")
    if args.command == "validate":
        repo_root = resolve_repo_root(args.repo)
        errors = validate_repository(repo_root)
        if errors:
            for error in errors:
                print(error)
            return 1
        print("OK")
        return 0
    if args.command == "project":
        repo_root = resolve_repo_root(args.repo, create_if_missing=True)
        try:
            git_worktree = resolve_project_git_worktree(repo_root, args.project)
            if args.project_command == "add-remote":
                configured_url = add_git_remote(git_worktree, args.name, args.url)
                print(f"{args.project}\tremote-added\t{args.name}\t{configured_url}")
                return 0
            if args.project_command == "fetch":
                fetch_git_remote(git_worktree, args.remote)
                print(f"{args.project}\tfetched\t{args.remote}")
                return 0
            if args.project_command == "push":
                branch = push_git_remote(git_worktree, args.remote, args.branch)
                print(f"{args.project}\tpushed\t{args.remote}\t{branch}")
                return 0
            if args.project_command == "sync":
                fetch_git_remote(git_worktree, args.remote)
                branch = push_git_remote(git_worktree, args.remote, args.branch)
                print(f"{args.project}\tfetched\t{args.remote}")
                print(f"{args.project}\tpushed\t{args.remote}\t{branch}")
                return 0
            raise CommandError("Unsupported project command")
        except (FileNotFoundError, RuntimeError, ValueError) as exc:
            raise CommandError(str(exc)) from exc
    if args.command in {"list", "search", "stats", "export"}:
        repo_root = resolve_repo_root(args.repo)
        index_path = rebuild_index(repo_root)
        with sqlite3.connect(index_path) as connection:
            if args.command == "list":
                return run_list(connection, args)
            if args.command == "search":
                return run_search(connection, args)
            if args.command == "export":
                return run_export(repo_root, connection, args.export_type)
            return run_stats(connection)
    return 0


def run_list(connection: sqlite3.Connection, args: argparse.Namespace) -> int:
    query = "SELECT type, title, path FROM documents"
    parameters: list[str] = []
    where_clauses: list[str] = []
    if args.type:
        where_clauses.append("type = ?")
        parameters.append(args.type)
    if args.status:
        where_clauses.append("status = ?")
        parameters.append(args.status)
    if args.project:
        where_clauses.append("project LIKE ?")
        parameters.append(f'%"{args.project}"%')
    if args.date:
        where_clauses.append("date = ?")
        parameters.append(args.date)
    if args.theme:
        where_clauses.append("theme LIKE ?")
        parameters.append(f'%"{args.theme}"%')
    if args.tag:
        where_clauses.append("tags LIKE ?")
        parameters.append(f'%"{args.tag}"%')
    if args.source:
        where_clauses.append("source LIKE ?")
        parameters.append(f'%"{args.source}"%')
    if where_clauses:
        query += f" WHERE {' AND '.join(where_clauses)}"
    query += " ORDER BY path"

    for row in connection.execute(query, parameters):
        print("\t".join(row))
    return 0


def run_search(connection: sqlite3.Connection, args: argparse.Namespace) -> int:
    like_query = f"%{args.query.lower()}%"
    parameters: list[str] = [like_query, like_query, like_query]
    where_clauses = [
        "(lower(title) LIKE ? OR lower(summary) LIKE ? OR lower(body) LIKE ?)"
    ]
    if args.status:
        where_clauses.append("status = ?")
        parameters.append(args.status)
    if args.project:
        where_clauses.append("project LIKE ?")
        parameters.append(f'%"{args.project}"%')
    if args.date:
        where_clauses.append("date = ?")
        parameters.append(args.date)
    if args.theme:
        where_clauses.append("theme LIKE ?")
        parameters.append(f'%"{args.theme}"%')
    if args.tag:
        where_clauses.append("tags LIKE ?")
        parameters.append(f'%"{args.tag}"%')
    if args.source:
        where_clauses.append("source LIKE ?")
        parameters.append(f'%"{args.source}"%')
    rows = connection.execute(
        f"""
        SELECT type, title, path FROM documents
        WHERE {' AND '.join(where_clauses)}
        ORDER BY path
        """,
        parameters,
    )
    for row in rows:
        print("\t".join(row))
    return 0


def run_stats(connection: sqlite3.Connection) -> int:
    total = connection.execute("SELECT COUNT(*) FROM documents").fetchone()
    print(f"total\t{total[0] if total else 0}")

    for doc_type, count in connection.execute(
        "SELECT type, COUNT(*) FROM documents GROUP BY type ORDER BY type"
    ):
        print(f"type:{doc_type}\t{count}")

    for status, count in connection.execute(
        "SELECT status, COUNT(*) FROM documents GROUP BY status ORDER BY status"
    ):
        print(f"status:{status}\t{count}")

    for prefix, column in (("theme", "theme"), ("tag", "tags"), ("source", "source")):
        counts: dict[str, int] = {}
        for (payload,) in connection.execute(f"SELECT {column} FROM documents"):
            for value in json.loads(payload or "[]"):
                counts[value] = counts.get(value, 0) + 1
        for key in sorted(counts):
            print(f"{prefix}:{key}\t{counts[key]}")
    return 0


def run_export(repo_root: Path, connection: sqlite3.Connection, export_type: str) -> int:
    if export_type == "document-list":
        payload = export_document_list(connection)
    elif export_type == "manifest":
        documents = export_document_list(connection)
        payload = {
            "generated_at": utc_timestamp(),
            "total": len(documents),
            "documents": documents,
        }
    elif export_type == "change-list":
        payload = export_change_list(connection)
    elif export_type == "asset-list":
        payload = export_asset_list(repo_root)
    else:
        raise CommandError("Unsupported export type")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


def export_document_list(connection: sqlite3.Connection) -> list[dict[str, str]]:
    rows = connection.execute(
        """
        SELECT path, id, type, title, status, created_at, updated_at
        FROM documents
        ORDER BY path
        """
    )
    return [
        {
            "path": row[0],
            "id": row[1],
            "type": row[2],
            "title": row[3],
            "status": row[4],
            "created_at": row[5],
            "updated_at": row[6],
        }
        for row in rows
    ]


def export_change_list(connection: sqlite3.Connection) -> list[dict[str, str]]:
    rows = connection.execute(
        """
        SELECT path, id, type, title, status, updated_at
        FROM documents
        ORDER BY updated_at DESC, path ASC
        """
    )
    return [
        {
            "path": row[0],
            "id": row[1],
            "type": row[2],
            "title": row[3],
            "status": row[4],
            "updated_at": row[5],
        }
        for row in rows
    ]


def export_asset_list(repo_root: Path) -> list[dict[str, object]]:
    assets: list[dict[str, object]] = []
    repo_assets = repo_root / "assets"
    if repo_assets.exists():
        for path in sorted(repo_assets.rglob("*")):
            if path.is_file():
                assets.append(
                    {
                        "path": path.relative_to(repo_root).as_posix(),
                        "scope": "repo",
                        "size_bytes": path.stat().st_size,
                        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                    }
                )

    projects_root = repo_root / "projects"
    if projects_root.exists():
        for asset_dir in sorted(projects_root.glob("*/assets")):
            project_slug = asset_dir.parent.name
            for path in sorted(asset_dir.rglob("*")):
                if path.is_file():
                    assets.append(
                        {
                            "path": path.relative_to(repo_root).as_posix(),
                            "scope": "project",
                            "project": project_slug,
                            "size_bytes": path.stat().st_size,
                            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                        }
                    )
    return assets


def import_asset(
    repo_root: Path,
    source_path: Path,
    target_name: str | None = None,
    project_slug: str | None = None,
) -> Path:
    source = source_path.resolve()
    if not source.exists() or not source.is_file():
        raise CommandError(f"Asset file does not exist: {source}")
    filename = target_name or source.name
    try:
        target_path = asset_path(repo_root, filename, project_slug)
    except ValueError as exc:
        raise CommandError(str(exc)) from exc
    if target_path.exists():
        raise CommandError(f"Target file already exists: {target_path}")
    target_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target_path)
    return target_path


def normalize_argv(argv: Sequence[str] | None) -> list[str] | None:
    if argv is None:
        return None

    normalized = list(argv)
    if "--repo" not in normalized:
        return normalized

    repo_index = normalized.index("--repo")
    if repo_index + 1 >= len(normalized):
        return normalized

    repo_pair = normalized[repo_index : repo_index + 2]
    remainder = normalized[:repo_index] + normalized[repo_index + 2 :]
    return repo_pair + remainder


def main(argv: Sequence[str] | None = None) -> int:
    # Optional delegation order:
    # 1) If KG_USE_RUST=1 and bin/kg-rs exists, prefer Rust CLI
    # 2) If KG_USE_GO=1 and bin/kg exists, use Go CLI
    raw_argv = list(argv) if argv is not None else sys.argv[1:]
    if os.environ.get("KG_USE_RUST") == "1":
        bin_rs = Path(__file__).resolve().parents[3] / "bin" / "kg-rs"
        if bin_rs.exists() and os.access(bin_rs, os.X_OK):
            try:
                result = subprocess.run(
                    [str(bin_rs), *raw_argv],
                    check=False,
                    capture_output=True,
                    text=True,
                )
                if result.stdout:
                    sys.stdout.write(result.stdout)
                if result.stderr and result.returncode != 0:
                    sys.stderr.write(result.stderr)
                return int(result.returncode)
            except Exception:
                # Fallback to next delegate on any failure
                pass
    if os.environ.get("KG_USE_GO") == "1":
        repo_prefix = []
        if "--repo" not in raw_argv:
            # tests always pass --repo; keep behavior simple
            pass
        bin_path = Path(__file__).resolve().parents[3] / "bin" / "kg"
        if bin_path.exists() and os.access(bin_path, os.X_OK):
            try:
                result = subprocess.run(
                    [str(bin_path), *raw_argv],
                    check=False,
                    capture_output=True,
                    text=True,
                )
                if result.stdout:
                    sys.stdout.write(result.stdout)
                if result.stderr and result.returncode != 0:
                    sys.stderr.write(result.stderr)
                return int(result.returncode)
            except Exception:
                # Fallback to Python CLI on any failure
                pass

    parser = build_parser()
    try:
        args = parser.parse_args(normalize_argv(raw_argv))
        return run(args)
    except (CommandError, FileNotFoundError, ValueError) as exc:
        sys.stderr.write(f"{exc}\n")
        return 1
    except SystemExit as exc:
        return int(exc.code)
