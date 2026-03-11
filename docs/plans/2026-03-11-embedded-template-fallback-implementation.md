# Embedded Template Fallback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Python, Go, and Rust `kg` implementations use external repository templates when present and embedded built-in templates when external templates are missing.

**Architecture:** Keep the current `--repo/templates/*.md` lookup as the first choice in every implementation, then add language-local built-in template maps for fallback. Preserve existing template names and placeholder formats so the rest of the CLI code remains unchanged.

**Tech Stack:** Python 3, Go, Rust, unittest, Makefile

---

### Task 1: Add Python fallback coverage

**Files:**
- Modify: `tests/test_cli_create.py`
- Modify: `implementations/python/kg/core/templates.py`

**Step 1: Write the failing test**

Add a test proving `create note` still succeeds after deleting `<repo>/templates/note.md`.

**Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_cli_create.KGCreateTests.test_create_note_falls_back_to_builtin_template -v`
Expected: FAIL because Python currently requires the external template file

**Step 3: Write minimal implementation**

Add a built-in template map in Python and use it when the external template file is absent.

**Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_cli_create.KGCreateTests.test_create_note_falls_back_to_builtin_template -v`
Expected: PASS

### Task 2: Add Go fallback

**Files:**
- Modify: `implementations/go/kg/cmd/kg/main.go`

**Step 1: Add built-in template strings**

Embed current template contents in the Go implementation.

**Step 2: Switch template loading to external-first fallback**

If `<repo>/templates/<name>.md` exists, use it; otherwise use the built-in mapping.

**Step 3: Verify build**

Run: `make build-go`
Expected: PASS

### Task 3: Add Rust fallback

**Files:**
- Modify: `implementations/rust/kg/src/main.rs`

**Step 1: Add built-in template strings**

Embed current template contents in the Rust implementation.

**Step 2: Switch template loading to external-first fallback**

If `<repo>/templates/<name>.md` exists, use it; otherwise use the built-in mapping.

**Step 3: Verify build**

Run: `make build-rust`
Expected: PASS

### Task 4: Verify aggregate behavior

**Files:**
- Modify: `README.md` only if command behavior documentation needs updates

**Step 1: Run focused Python tests**

Run: `python3 -m unittest tests.test_cli_create -v`
Expected: PASS

**Step 2: Run aggregate verification**

Run: `make test`
Expected: PASS
