# Pure Tool Repo Refactor Implementation Plan
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert repo into a pure tooling repository; keep only source, tests, templates, docs. Enforce CLI to operate only on external repos via --repo.

**Architecture:** CLI remains Python argparse. Make --repo required for all operations; default to help without repo. Remove in-repo content folders. Indexing still writes under the external repo path.

**Tech Stack:** Python 3 stdlib (argparse, pathlib, sqlite3, unittest)

---

### Task 1: Require --repo in CLI
**Files:**
- Modify: scripts/kg/app.py:28
- Tests: tests/test_cli_* (should already pass)
**Steps:**
1) Update parser to require --repo. 2) Keep normalize_argv so --repo is accepted after subcommands. 3) Run unit tests.

### Task 2: Remove content directories from this repo
**Files:**
- Delete: notes/, projects/, indexes/, dailies/, decisions/, reviews/, references/, inbox/, assets/, themes/
**Steps:**
1) Remove listed directories, preserving scripts/, tests/, templates/, docs/.

### Task 3: Update README for --repo-only usage
**Files:**
- Modify: README.md: usage examples, validation/query sections.
**Steps:**
1) State --repo is required. 2) Update all commands to include --repo. 3) Remove mention of in-repo indexes here.

### Task 4: Verify + Commit
**Steps:**
1) Run unit tests with python -m unittest -q. 2) git add/commit. 3) Attempt git push; if blocked, provide local push instructions.
