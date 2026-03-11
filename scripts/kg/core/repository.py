from __future__ import annotations

from pathlib import Path
from datetime import date
import re


SLUG_PARTS_PATTERN = re.compile(r"[^a-z0-9]+")


def resolve_repo_root(repo: str | None) -> Path:
    root = Path(repo).expanduser().resolve() if repo else Path.cwd().resolve()
    if not root.exists() or not root.is_dir():
        raise FileNotFoundError(f"Repository path does not exist: {root}")
    return root


def slugify(value: str) -> str:
    slug = SLUG_PARTS_PATTERN.sub("-", value.strip().lower()).strip("-")
    if not slug:
        raise ValueError("Title must contain at least one alphanumeric character")
    return slug


def note_path(repo_root: Path, slug: str) -> Path:
    return repo_root / "notes" / f"{slug}.md"


def decision_path(repo_root: Path, slug: str) -> Path:
    return repo_root / "decisions" / f"{slug}.md"


def review_path(repo_root: Path, slug: str) -> Path:
    return repo_root / "reviews" / f"{slug}.md"


def daily_path(repo_root: Path, target_date: date) -> Path:
    return repo_root / "dailies" / target_date.strftime("%Y") / target_date.strftime("%m") / f"{target_date.strftime('%d')}.md"
