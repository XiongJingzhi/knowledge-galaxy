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
CONTENT_ROOTS = ("notes", "dailies", "decisions", "reviews", "projects")


def validate_repository(repo_root: Path) -> list[str]:
    errors: list[str] = []
    id_paths: defaultdict[str, list[str]] = defaultdict(list)

    for path in iter_documents(repo_root):
        relative_path = path.relative_to(repo_root).as_posix()
        try:
            metadata, _body = parse_frontmatter_file(path)
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


def stringify(value: object | None) -> str:
    if value is None:
        return ""
    return str(value)
