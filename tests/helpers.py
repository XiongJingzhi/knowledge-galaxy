from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path


NOTE_TEMPLATE = """---
id: <id>
type: note
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
theme: []
project: []
tags: []
summary: ""
---

## Summary

## Details
"""

DAILY_TEMPLATE = """---
id: <id>
type: daily
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
date: <date>
tags: []
summary: ""
---

## Notes
"""

DECISION_TEMPLATE = """---
id: <id>
type: decision
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
theme: []
project: []
tags: []
summary: ""
---

## Decision
"""

REVIEW_TEMPLATE = """---
id: <id>
type: review
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
date: <date>
theme: []
project: []
tags: []
summary: ""
---

## Review
"""

PROJECT_TEMPLATE = """---
id: <id>
type: project
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
git_worktree: <git_worktree>
theme: []
tags: []
summary: ""
---

## Goal

## Status

## Notes
"""


class TemporaryRepo:
    def __init__(self) -> None:
        self._temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self._temp_dir.name)

    def create_standard_layout(self) -> Path:
        (self.root / "templates").mkdir(parents=True, exist_ok=True)
        (self.root / "notes").mkdir(parents=True, exist_ok=True)
        (self.root / "dailies").mkdir(parents=True, exist_ok=True)
        (self.root / "decisions").mkdir(parents=True, exist_ok=True)
        (self.root / "reviews").mkdir(parents=True, exist_ok=True)
        (self.root / "projects").mkdir(parents=True, exist_ok=True)
        (self.root / "templates" / "note.md").write_text(NOTE_TEMPLATE, encoding="utf-8")
        (self.root / "templates" / "daily.md").write_text(DAILY_TEMPLATE, encoding="utf-8")
        (self.root / "templates" / "decision.md").write_text(DECISION_TEMPLATE, encoding="utf-8")
        (self.root / "templates" / "review.md").write_text(REVIEW_TEMPLATE, encoding="utf-8")
        (self.root / "templates" / "project.md").write_text(PROJECT_TEMPLATE, encoding="utf-8")
        return self.root

    def write_file(self, relative_path: str, content: str) -> Path:
        path = self.root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def create_git_worktree(self, relative_path: str, with_commit: bool = False) -> Path:
        worktree = self.root / relative_path
        worktree.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["git", "init"],
            cwd=worktree,
            check=True,
            capture_output=True,
            text=True,
        )
        self.configure_git_identity(worktree)
        if with_commit:
            (worktree / "README.md").write_text("# Temp Repo\n", encoding="utf-8")
            subprocess.run(
                ["git", "add", "README.md"],
                cwd=worktree,
                check=True,
                capture_output=True,
                text=True,
            )
            subprocess.run(
                ["git", "commit", "-m", "Initial commit"],
                cwd=worktree,
                check=True,
                capture_output=True,
                text=True,
            )
        return worktree

    def create_bare_remote(self, relative_path: str) -> Path:
        remote = self.root / relative_path
        remote.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["git", "init", "--bare", remote.name],
            cwd=remote.parent,
            check=True,
            capture_output=True,
            text=True,
        )
        return remote

    def clone_remote(self, remote_relative_path: str, clone_relative_path: str) -> Path:
        remote = self.root / remote_relative_path
        clone = self.root / clone_relative_path
        clone.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["git", "clone", str(remote), str(clone)],
            cwd=self.root,
            check=True,
            capture_output=True,
            text=True,
        )
        self.configure_git_identity(clone)
        return clone

    def configure_git_identity(self, repo_path: Path) -> None:
        subprocess.run(
            ["git", "config", "user.name", "Knowledge Galaxy Tests"],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        subprocess.run(
            ["git", "config", "user.email", "kg-tests@example.com"],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )

    def cleanup(self) -> None:
        self._temp_dir.cleanup()
