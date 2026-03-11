import argparse
from datetime import date, datetime, UTC
from pathlib import Path
import sqlite3
import sys
from typing import Sequence
import os
import subprocess

from .core.frontmatter import generate_document_id, utc_timestamp
from .core.indexer import rebuild_index
from .core.repository import (
    add_git_remote,
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
    parser.add_argument("--repo", required=True)

    subparsers = parser.add_subparsers(dest="command")
    create_parser = subparsers.add_parser("create")
    create_subparsers = create_parser.add_subparsers(dest="create_type")
    create_subparsers.required = True

    note_parser = create_subparsers.add_parser("note")
    note_parser.add_argument("--title", required=True)

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

    search_parser = subparsers.add_parser("search")
    search_parser.add_argument("query")

    subparsers.add_parser("stats")
    subparsers.add_parser("validate")

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

    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(rendered, encoding="utf-8")
    return target_path


def run(args: argparse.Namespace) -> int:
    if args.command == "create":
        repo_root = resolve_repo_root(args.repo)
        if args.create_type == "note":
            slug = slugify(args.title)
            created_path = create_document(
                repo_root=repo_root,
                template_name="note",
                title=args.title,
                target_path=note_path(repo_root, slug),
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
        repo_root = resolve_repo_root(args.repo)
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
    if args.command in {"list", "search", "stats"}:
        repo_root = resolve_repo_root(args.repo)
        index_path = rebuild_index(repo_root)
        with sqlite3.connect(index_path) as connection:
            if args.command == "list":
                return run_list(connection, args)
            if args.command == "search":
                return run_search(connection, args.query)
            return run_stats(connection)
    return 0


def run_list(connection: sqlite3.Connection, args: argparse.Namespace) -> int:
    query = "SELECT type, title, path FROM documents"
    parameters: list[str] = []
    if args.type:
        query += " WHERE type = ?"
        parameters.append(args.type)
    query += " ORDER BY path"

    for row in connection.execute(query, parameters):
        print("\t".join(row))
    return 0


def run_search(connection: sqlite3.Connection, query_text: str) -> int:
    like_query = f"%{query_text.lower()}%"
    rows = connection.execute(
        """
        SELECT type, title, path FROM documents
        WHERE lower(title) LIKE ? OR lower(summary) LIKE ? OR lower(body) LIKE ?
        ORDER BY path
        """,
        (like_query, like_query, like_query),
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
    return 0


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
    # Optional delegation: if KG_USE_GO=1 and bin/kg exists, run Go CLI
    raw_argv = list(argv) if argv is not None else sys.argv[1:]
    if os.environ.get("KG_USE_GO") == "1":
        repo_prefix = []
        if "--repo" not in raw_argv:
            # tests always pass --repo; keep behavior simple
            pass
        bin_path = Path(__file__).resolve().parents[2] / "bin" / "kg"
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
    except CommandError as exc:
        parser.exit(status=1, message=f"{exc}\n")
    except SystemExit as exc:
        return int(exc.code)
