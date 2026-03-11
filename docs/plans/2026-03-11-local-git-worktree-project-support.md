# Local Git Worktree Project Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `project` document creation backed by an already existing local git working directory path, without implementing any remote management.

**Architecture:** Extend the existing Python CLI with a `create project` subcommand, add repository helpers for project paths and git worktree detection, and widen validation/index scanning to include project documents and their `git_worktree` metadata.

**Tech Stack:** Python standard library, argparse, pathlib, subprocess, unittest, Markdown frontmatter

---

### Task 1: Add failing tests for project creation

**Files:**
- Modify: `tests/helpers.py`
- Modify: `tests/test_cli_create.py`

**Step 1: Write the failing test**

Add fixture support for a project template and a test that runs:

```bash
python3 -m scripts.kg --repo <repo> create project --title "Alpha" --git-worktree <path>
```

Assert that:

- exit code is `0`
- `projects/alpha/README.md` is created
- frontmatter contains `type: project`
- frontmatter contains `git_worktree: <resolved-path>`

**Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_cli_create.KGCreateTests.test_create_project_uses_project_directory_and_git_worktree`

Expected: FAIL because `create project` is unsupported.

**Step 3: Commit**

```bash
git add tests/helpers.py tests/test_cli_create.py
git commit -m "test: add failing project creation coverage"
```

### Task 2: Add failing tests for project validation and indexing

**Files:**
- Modify: `tests/test_cli_validate.py`
- Modify: `tests/test_cli_query.py`

**Step 1: Write the failing tests**

Add tests that verify:

- a `project` document in `projects/<slug>/README.md` validates successfully
- a `project` document with a non-git `git_worktree` path fails validation
- `kg list` includes project documents

**Step 2: Run tests to verify they fail**

Run: `python3 -m unittest tests.test_cli_validate tests.test_cli_query`

Expected: FAIL because `project` is not currently supported.

**Step 3: Commit**

```bash
git add tests/test_cli_validate.py tests/test_cli_query.py
git commit -m "test: add failing project validation and query coverage"
```

### Task 3: Implement project creation and git worktree helpers

**Files:**
- Modify: `scripts/kg/app.py`
- Modify: `scripts/kg/core/repository.py`
- Modify: `tests/helpers.py`

**Step 1: Write minimal implementation**

Add:

- `create project` parser with `--title` and `--git-worktree`
- `project_path(repo_root, slug)` helper
- local git worktree detection using `git rev-parse --is-inside-work-tree`
- project document replacements including `git_worktree`

**Step 2: Run targeted tests**

Run: `python3 -m unittest tests.test_cli_create`

Expected: PASS

**Step 3: Commit**

```bash
git add scripts/kg/app.py scripts/kg/core/repository.py tests/helpers.py tests/test_cli_create.py
git commit -m "feat: add project creation from local git worktree"
```

### Task 4: Implement validation and indexing support for project documents

**Files:**
- Modify: `scripts/kg/core/validation.py`
- Modify: `scripts/kg/core/indexer.py`

**Step 1: Write minimal implementation**

Add:

- `project` to allowed types
- `projects` to document scanning
- project path validation against `projects/<slug>/README.md`
- `git_worktree` validation for existing local git working trees

**Step 2: Run targeted tests**

Run: `python3 -m unittest tests.test_cli_validate tests.test_cli_query`

Expected: PASS

**Step 3: Commit**

```bash
git add scripts/kg/core/validation.py scripts/kg/core/indexer.py tests/test_cli_validate.py tests/test_cli_query.py
git commit -m "feat: validate and index project worktrees"
```

### Task 5: Update user-facing documentation

**Files:**
- Modify: `README.md`

**Step 1: Document the new command and operational boundary**

Add usage for `create project` and explicitly state that local paths are supported while remote sync remains user-managed.

**Step 2: Run documentation spot check**

Run: `sed -n '1,220p' README.md`

Expected: command and scope are clear.

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document local git worktree project support"
```

### Task 6: Verify the full change

**Files:**
- Verify: `scripts/kg/app.py`
- Verify: `scripts/kg/core/repository.py`
- Verify: `scripts/kg/core/validation.py`
- Verify: `scripts/kg/core/indexer.py`
- Verify: `tests/test_cli_create.py`
- Verify: `tests/test_cli_validate.py`
- Verify: `tests/test_cli_query.py`
- Verify: `README.md`

**Step 1: Run the full test suite**

Run: `python3 -m unittest`

Expected: all tests pass.

**Step 2: Review git status**

Run: `git status --short`

Expected: only intended files are modified.

**Step 3: Final commit**

```bash
git add docs/plans README.md scripts/kg tests
git commit -m "feat: support local git worktrees for projects"
```
