from __future__ import annotations

from datetime import date
from pathlib import Path
import re
import subprocess

from .frontmatter import parse_frontmatter_file


SLUG_PARTS_PATTERN = re.compile(r"[^a-z0-9]+")


def resolve_repo_root(repo: str | None) -> Path:
    root = Path(repo).expanduser().resolve() if repo else Path.cwd().resolve()
    if not root.exists() or not root.is_dir():
        raise FileNotFoundError(f"Repository path does not exist: {root}")
    return root


def resolve_git_worktree(path_text: str) -> Path:
    path = Path(path_text).expanduser().resolve()
    if not path.exists() or not path.is_dir():
        raise FileNotFoundError(f"Git worktree path does not exist: {path}")
    if not is_git_worktree(path):
        raise ValueError(f"Git worktree path is not a git working tree: {path}")
    return path


def is_git_worktree(path: Path) -> bool:
    result = subprocess.run(
        ["git", "rev-parse", "--is-inside-work-tree"],
        cwd=path,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.returncode == 0 and result.stdout.strip() == "true"


def resolve_project_git_worktree(repo_root: Path, slug: str) -> Path:
    project_readme = project_path(repo_root, slug)
    if not project_readme.exists():
        raise FileNotFoundError(f"Project document does not exist: {project_readme}")

    metadata, _body = parse_frontmatter_file(project_readme)
    git_worktree = str(metadata.get("git_worktree", "")).strip()
    if not git_worktree:
        raise ValueError(f"Project document is missing git_worktree: {project_readme}")

    return resolve_git_worktree(git_worktree)


def add_git_remote(worktree: Path, name: str, url: str) -> str:
    run_git_command(worktree, "remote", "add", name, url)
    return url


def fetch_git_remote(worktree: Path, remote: str) -> None:
    run_git_command(worktree, "fetch", remote, "--prune")


def push_git_remote(worktree: Path, remote: str, branch: str | None = None) -> str:
    target_branch = branch or current_git_branch(worktree)
    run_git_command(worktree, "push", "-u", remote, target_branch)
    return target_branch


def current_git_branch(worktree: Path) -> str:
    branch = run_git_command(worktree, "branch", "--show-current")
    if not branch:
        raise ValueError(f"Git worktree is not on a branch: {worktree}")
    return branch


def run_git_command(worktree: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=worktree,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        stderr = result.stderr.strip() or result.stdout.strip() or "git command failed"
        raise RuntimeError(stderr)
    return result.stdout.strip()


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


def project_path(repo_root: Path, slug: str) -> Path:
    return repo_root / "projects" / slug / "README.md"


def daily_path(repo_root: Path, target_date: date) -> Path:
    return repo_root / "dailies" / target_date.strftime("%Y") / target_date.strftime("%m") / f"{target_date.strftime('%d')}.md"
