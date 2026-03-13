from __future__ import annotations

from collections import defaultdict
from pathlib import Path
import re

from .frontmatter import parse_frontmatter_file
from .repository import is_git_worktree


ALLOWED_TYPES = {"daily", "note", "decision", "review", "project"}
ALLOWED_STATUSES = {"inbox", "active", "evergreen", "archived"}
REQUIRED_FIELDS = {"id", "type", "title", "slug", "created_at", "updated_at", "status"}
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
MARKDOWN_LINK_PATTERN = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
CONTENT_ROOTS = ("notes", "dailies", "decisions", "reviews", "projects")


def validate_repository(repo_root: Path) -> list[str]:
    errors: list[str] = []
    id_paths: defaultdict[str, list[str]] = defaultdict(list)

    for path in iter_documents(repo_root):
        relative_path = path.relative_to(repo_root).as_posix()
        try:
            metadata, body = parse_frontmatter_file(path)
        except ValueError as exc:
            errors.append(f"{relative_path}: {exc}")
            continue

        for field in REQUIRED_FIELDS:
            value = metadata.get(field)
            if value in (None, ""):
                errors.append(f"{relative_path}: missing required field: {field}")

        document_type = stringify(metadata.get("type"))
        if document_type not in ALLOWED_TYPES:
            errors.append(f"{relative_path}: unsupported type: {document_type}")
            continue

        status = stringify(metadata.get("status"))
        if status and status not in ALLOWED_STATUSES:
            errors.append(f"{relative_path}: unsupported status: {status}")

        slug = stringify(metadata.get("slug"))
        if slug and not SLUG_PATTERN.fullmatch(slug):
            errors.append(f"{relative_path}: invalid slug: {slug}")

        if document_type == "daily":
            validate_daily_document(relative_path, metadata, errors)
        else:
            validate_slug_path(relative_path, document_type, slug, errors)
            if document_type == "project":
                validate_project_document(relative_path, metadata, errors)

        document_id = stringify(metadata.get("id"))
        if document_id:
            id_paths[document_id].append(relative_path)

        validate_markdown_links(repo_root, path, body, errors)

    for document_id, paths in sorted(id_paths.items()):
        if len(paths) > 1:
            errors.append(f"duplicate id: {document_id} -> {', '.join(paths)}")

    return errors


def iter_documents(repo_root: Path) -> list[Path]:
    paths: list[Path] = []
    for root_name in CONTENT_ROOTS:
        root = repo_root / root_name
        if not root.exists():
            continue
        paths.extend(sorted(root.rglob("*.md")))
    return paths


def validate_slug_path(
    relative_path: str, document_type: str, slug: str, errors: list[str]
) -> None:
    expected_prefixes = {
        "note": "notes/",
        "decision": "decisions/",
        "review": "reviews/",
    }
    if document_type == "project":
        expected_path = Path("projects") / slug / "README.md"
        if relative_path != expected_path.as_posix():
            errors.append(f"{relative_path}: invalid path for type: {document_type}")
        return
    prefix = expected_prefixes.get(document_type)
    if prefix is None:
        return
    if not relative_path.startswith(prefix):
        errors.append(f"{relative_path}: invalid path for type: {document_type}")
        return
    expected_name = f"{slug}.md"
    if slug and Path(relative_path).name != expected_name:
        errors.append(f"{relative_path}: slug does not match file name")


def validate_daily_document(
    relative_path: str, metadata: dict[str, object], errors: list[str]
) -> None:
    date_value = stringify(metadata.get("date"))
    if not date_value:
        errors.append(f"{relative_path}: missing required field: date")
        return

    expected_path = Path("dailies") / date_value[:4] / date_value[5:7] / f"{date_value[8:10]}.md"
    if relative_path != expected_path.as_posix():
        errors.append(f"{relative_path}: invalid daily path")

    slug = stringify(metadata.get("slug"))
    if slug != date_value:
        errors.append(f"{relative_path}: daily slug must match date")


def validate_project_document(
    relative_path: str, metadata: dict[str, object], errors: list[str]
) -> None:
    git_worktree = stringify(metadata.get("git_worktree"))
    if not git_worktree:
        return

    worktree_path = Path(git_worktree).expanduser()
    if not worktree_path.exists() or not worktree_path.is_dir():
        errors.append(f"{relative_path}: git_worktree path does not exist")
        return
    if not is_git_worktree(worktree_path.resolve()):
        errors.append(f"{relative_path}: git_worktree is not a git working tree")


def validate_markdown_links(
    repo_root: Path, document_path: Path, body: str, errors: list[str]
) -> None:
    relative_document = document_path.relative_to(repo_root).as_posix()
    assets_root = (repo_root / "assets").resolve()
    references_root = (repo_root / "references").resolve()

    for raw_target in MARKDOWN_LINK_PATTERN.findall(body):
        target = clean_markdown_target(raw_target)
        if not target or is_external_target(target):
            continue

        resolved = (document_path.parent / target).resolve()
        if is_under_root(resolved, assets_root) and not resolved.exists():
            errors.append(f"{relative_document}: missing asset path: {target}")
        elif is_under_root(resolved, references_root) and not resolved.exists():
            errors.append(f"{relative_document}: missing reference path: {target}")


def clean_markdown_target(raw_target: str) -> str:
    target = raw_target.strip()
    if not target:
        return ""
    if " " in target:
        target = target.split(" ", 1)[0]
    return target.strip("<>")


def is_external_target(target: str) -> bool:
    lowered = target.lower()
    return (
        target.startswith("#")
        or target.startswith("/")
        or "://" in target
        or lowered.startswith("mailto:")
        or lowered.startswith("data:")
    )


def is_under_root(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def stringify(value: object | None) -> str:
    if value is None:
        return ""
    return str(value)
