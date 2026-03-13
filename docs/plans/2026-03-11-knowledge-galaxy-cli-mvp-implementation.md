# Knowledge Galaxy CLI MVP Implementation Plan

> 历史文档状态：本文记录 2026-03-11 的 CLI MVP 实施计划，不直接代表当前仓库状态。
> 当前权威文档：`README.md`、`docs/specs/repository-layout.md`、`docs/specs/knowledge-galaxy-1.0-spec.md`
> 当前实现根目录：`implementations/python/kg`、`implementations/go/kg`、`implementations/rust/kg`
> 文中提到的 `scripts/kg` 等路径属于历史布局，当前实现路径请以上述目录为准。

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Python MVP of the `kg` CLI that can create documents from templates, validate repository documents, and provide basic list, search, and stats commands backed by a derived SQLite index.

**Architecture:** The CLI lives under `scripts/kg/` and uses only the Python standard library. Commands operate directly on the repository root, frontmatter parsing is intentionally narrow to match the shipped templates, and every query command rebuilds the SQLite index before reading from it so the MVP stays simple and predictable.

**Tech Stack:** Python 3, argparse, pathlib, sqlite3, json, uuid, datetime, unittest

---

### Task 1: Add the Python package skeleton and a smoke test

**Files:**
- Create: `scripts/kg/__init__.py`
- Create: `scripts/kg/__main__.py`
- Create: `scripts/kg/app.py`
- Create: `tests/test_cli_smoke.py`

**Step 1: Write the failing smoke test**

Create `tests/test_cli_smoke.py` with a test that imports `scripts.kg.app`, invokes the CLI with `["--help"]`, and expects exit code `0`.

**Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_cli_smoke -v`
Expected: FAIL because `scripts.kg.app` does not exist

**Step 3: Write minimal CLI bootstrap**

Add the package files and a minimal `main(argv)` implementation that supports `--help`.

**Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_cli_smoke -v`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/kg tests/test_cli_smoke.py
git commit -m "feat: scaffold python kg cli"
```

### Task 2: Implement repository helpers and `create note`

**Files:**
- Create: `scripts/kg/core/repository.py`
- Create: `scripts/kg/core/templates.py`
- Create: `scripts/kg/core/frontmatter.py`
- Create: `tests/helpers.py`
- Create: `tests/test_cli_create.py`
- Modify: `scripts/kg/app.py`

**Step 1: Write the failing create test**

Add a test that creates a temporary repo fixture with `templates/note.md`, runs `kg create note --title "Test Note" --repo <path>`, and asserts that `notes/test-note.md` is created with substituted placeholders.

**Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_cli_create.KGCreateTests.test_create_note_writes_file -v`
Expected: FAIL because the command is not implemented

**Step 3: Write minimal implementation**

Implement:

- repo root resolution
- title-to-slug conversion
- UUID generation
- UTC timestamp generation
- template loading
- placeholder replacement
- file write for `note`

**Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_cli_create.KGCreateTests.test_create_note_writes_file -v`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/kg/core scripts/kg/app.py tests/helpers.py tests/test_cli_create.py
git commit -m "feat: add note creation command"
```

### Task 3: Implement `create daily`, `create decision`, and `create review`

**Files:**
- Modify: `scripts/kg/app.py`
- Modify: `scripts/kg/core/repository.py`
- Modify: `scripts/kg/core/templates.py`
- Modify: `tests/test_cli_create.py`

**Step 1: Write failing tests**

Add tests for:

- `daily` default path generation under `dailies/YYYY/MM/DD.md`
- `decision` path generation under `decisions/<slug>.md`
- `review` path generation under `reviews/<slug>.md`

**Step 2: Run tests to verify they fail**

Run: `python3 -m unittest tests.test_cli_create -v`
Expected: FAIL on unimplemented command types

**Step 3: Write minimal implementation**

Implement type-specific target path logic and argument validation.

**Step 4: Run tests to verify they pass**

Run: `python3 -m unittest tests.test_cli_create -v`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/kg/app.py scripts/kg/core tests/test_cli_create.py
git commit -m "feat: add remaining create commands"
```

### Task 4: Implement validation

**Files:**
- Create: `scripts/kg/core/validation.py`
- Modify: `scripts/kg/core/frontmatter.py`
- Modify: `scripts/kg/app.py`
- Create: `tests/test_cli_validate.py`

**Step 1: Write failing validation tests**

Add tests for:

- valid repository returns exit code `0`
- missing required field returns non-zero
- duplicate `id` returns non-zero
- invalid daily path or slug returns non-zero

**Step 2: Run tests to verify they fail**

Run: `python3 -m unittest tests.test_cli_validate -v`
Expected: FAIL because validation is not implemented

**Step 3: Write minimal implementation**

Implement repository scanning, frontmatter parsing, required-field validation, status/type checks, path checks, and duplicate id detection.

**Step 4: Run tests to verify they pass**

Run: `python3 -m unittest tests.test_cli_validate -v`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/kg/core/validation.py scripts/kg/core/frontmatter.py scripts/kg/app.py tests/test_cli_validate.py
git commit -m "feat: add repository validation"
```

### Task 5: Implement SQLite indexing and query commands

**Files:**
- Create: `scripts/kg/core/indexer.py`
- Modify: `scripts/kg/app.py`
- Create: `tests/test_cli_query.py`

**Step 1: Write failing query tests**

Add tests for:

- `list` returns repository documents
- `list --type note` filters correctly
- `search idea` finds matching title or body
- `stats` returns total and grouped counts

**Step 2: Run tests to verify they fail**

Run: `python3 -m unittest tests.test_cli_query -v`
Expected: FAIL because query commands are not implemented

**Step 3: Write minimal implementation**

Implement:

- SQLite schema creation under `indexes/knowledge-galaxy.db`
- full repository rebuild before query
- simple SQL filters for `list`
- case-insensitive matching for `search`
- grouped counts for `stats`

**Step 4: Run tests to verify they pass**

Run: `python3 -m unittest tests.test_cli_query -v`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/kg/core/indexer.py scripts/kg/app.py tests/test_cli_query.py
git commit -m "feat: add query commands"
```

### Task 6: Add repository bootstrap documentation

**Files:**
- Create: `README.md`

**Step 1: Write the failing documentation test surrogate**

Review the implemented commands and list the exact invocation patterns that a new user needs.

**Step 2: Write the README**

Document:

- project purpose
- Python version expectation
- how to run `python3 -m scripts.kg --help`
- how to create docs
- how to validate
- how to query

**Step 3: Verify readability**

Run: `sed -n '1,220p' README.md`
Expected: concise and consistent with the implemented CLI

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add cli bootstrap readme"
```

### Task 7: Run full verification

**Files:**
- Verify: `scripts/kg/__main__.py`
- Verify: `scripts/kg/app.py`
- Verify: `scripts/kg/core/frontmatter.py`
- Verify: `scripts/kg/core/repository.py`
- Verify: `scripts/kg/core/templates.py`
- Verify: `scripts/kg/core/validation.py`
- Verify: `scripts/kg/core/indexer.py`
- Verify: `tests/test_cli_smoke.py`
- Verify: `tests/test_cli_create.py`
- Verify: `tests/test_cli_validate.py`
- Verify: `tests/test_cli_query.py`
- Verify: `README.md`

**Step 1: Run the full test suite**

Run: `python3 -m unittest discover -s tests -v`
Expected: PASS with all tests green

**Step 2: Run CLI smoke commands**

Run: `python3 -m scripts.kg --help`
Expected: exit code `0`

Run: `python3 -m scripts.kg validate --repo .`
Expected: exit code reflects current repository validity

**Step 3: Review git status**

Run: `git status --short`
Expected: clean working tree after final commit

**Step 4: Final commit if needed**

```bash
git add scripts tests README.md
git commit -m "feat: complete knowledge galaxy cli mvp"
```
