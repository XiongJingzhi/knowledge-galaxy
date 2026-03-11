# Multi-Language Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize the repository into a language-first source layout while keeping the Python, Go, and Rust `kg` implementations working through stable repository-level entry points.

**Architecture:** Move each implementation into `implementations/<language>/kg`, keep shared repository assets at the root, and repair all affected build, test, and runtime entry points after the move. Use repository-level wrappers only where they simplify migration, and remove obsolete source-layout artifacts once validation passes.

**Tech Stack:** Python 3, Go, Rust, Makefile, repository docs, shell-based verification

---

### Task 1: Baseline the Current Repository Layout

**Files:**
- Modify: `docs/plans/2026-03-11-multi-language-layout-design.md`
- Create: `docs/plans/2026-03-11-multi-language-layout-baseline.txt`

**Step 1: Record the current top-level tree**

Run: `find . -maxdepth 3 -type d | sort > docs/plans/2026-03-11-multi-language-layout-baseline.txt`
Expected: a checked-in snapshot of the pre-migration directory layout

**Step 2: Verify the baseline file was created**

Run: `sed -n '1,120p' docs/plans/2026-03-11-multi-language-layout-baseline.txt`
Expected: output includes `./cmd`, `./internal`, `./packages/rust`, and `./scripts/kg`

**Step 3: Commit**

```bash
git add docs/plans/2026-03-11-multi-language-layout-baseline.txt docs/plans/2026-03-11-multi-language-layout-design.md docs/plans/2026-03-11-multi-language-layout-implementation.md
git commit -m "docs: add multi-language layout plan"
```

### Task 2: Move The Python Implementation Under `implementations/python`

**Files:**
- Create: `implementations/python/`
- Modify: `implementations/python/kg/**`
- Remove: `scripts/kg/**`
- Test: `tests/**`

**Step 1: Move the Python source tree**

Run: `mkdir -p implementations/python && mv scripts/kg implementations/python/kg`
Expected: Python source now lives at `implementations/python/kg`

**Step 2: Find broken Python path references**

Run: `rg -n "scripts\\.kg|python3 -m scripts\\.kg" .`
Expected: remaining references are in docs, tests, or scripts that still need updates

**Step 3: Update Python import and module-entry references**

Change all code, docs, and test references so the canonical module path targets the new Python location.

**Step 4: Run the smallest Python command that exercises CLI loading**

Run: `python3 -m implementations.python.kg --help`
Expected: help output renders without import errors

**Step 5: Commit**

```bash
git add implementations/python scripts README.md Makefile tests
git commit -m "refactor: move python implementation under implementations"
```

### Task 3: Move The Go Implementation Under `implementations/go`

**Files:**
- Create: `implementations/go/`
- Modify: `implementations/go/kg/**`
- Remove: `cmd/kg/**`
- Remove: `internal/kg/**`

**Step 1: Create the Go implementation root**

Run: `mkdir -p implementations/go/kg`
Expected: destination directory exists

**Step 2: Move the Go source directories**

Run: `mv cmd implementations/go/kg/cmd && mv internal implementations/go/kg/internal`
Expected: Go source is nested under `implementations/go/kg`

**Step 3: Inspect Go module and imports**

Run: `rg -n "module |internal/kg|cmd/kg" implementations/go/kg .`
Expected: enough context to update module files or import paths if the move broke them

**Step 4: Repair Go module and package references**

Update `go.mod`, imports, and any scripts so the Go CLI still builds from its new root while preserving valid `internal/` access rules.

**Step 5: Verify the Go CLI still builds**

Run: `go build ./...`
Workdir: `implementations/go/kg`
Expected: successful build with no package resolution errors

**Step 6: Commit**

```bash
git add implementations/go cmd internal README.md Makefile
git commit -m "refactor: move go implementation under implementations"
```

### Task 4: Move The Rust Implementation Under `implementations/rust`

**Files:**
- Create: `implementations/rust/`
- Modify: `implementations/rust/kg/**`
- Remove: `packages/rust/**`

**Step 1: Create the Rust implementation root**

Run: `mkdir -p implementations/rust`
Expected: destination directory exists

**Step 2: Move the Rust source tree**

Run: `mv packages/rust implementations/rust/kg`
Expected: Rust implementation now lives at `implementations/rust/kg`

**Step 3: Find stale Rust path references**

Run: `rg -n "packages/rust|implementations/rust/kg" .`
Expected: old references are limited to files that still need updates

**Step 4: Update Rust build references**

Adjust `Makefile`, docs, scripts, and any delegation logic to use `implementations/rust/kg`.

**Step 5: Verify the Rust CLI still builds**

Run: `cargo build`
Workdir: `implementations/rust/kg`
Expected: successful build

**Step 6: Commit**

```bash
git add implementations/rust packages README.md Makefile
git commit -m "refactor: move rust implementation under implementations"
```

### Task 5: Re-scope Repository-Level Scripts And Artifacts

**Files:**
- Create: `scripts/dev/`
- Modify: `scripts/**`
- Modify: `.gitignore`
- Remove: `bin/**` if tracked and obsolete

**Step 1: Audit the remaining root-level scripts**

Run: `find scripts -maxdepth 3 -type f | sort`
Expected: identify which files are repository helpers versus implementation code

**Step 2: Move repository helper scripts under `scripts/dev` when needed**

Keep only repository-level helper scripts in `scripts/` and ensure none of them still imply that `scripts/` is the Python implementation root.

**Step 3: Audit `bin/` usage**

Run: `find bin -maxdepth 3 -type f | sort`
Expected: determine whether `bin/` is source, generated output, or obsolete

**Step 4: Remove or ignore obsolete artifacts**

If `bin/` is not source, remove tracked content and update `.gitignore` so generated outputs remain out of the source layout.

**Step 5: Commit**

```bash
git add scripts .gitignore bin
git commit -m "chore: clean repository-level script and artifact layout"
```

### Task 6: Repair Root-Level Tooling And Documentation

**Files:**
- Modify: `Makefile`
- Modify: `README.md`
- Modify: `docs/**`
- Modify: `tests/**`

**Step 1: Update root-level commands**

Add or repair targets such as `test-python`, `test-go`, `test-rust`, and aggregate verification commands in `Makefile`.

**Step 2: Rewrite README execution examples**

Replace every old path-based command with the new canonical commands and explain the repository structure as a multi-implementation tool repository.

**Step 3: Sweep for stale path references**

Run: `rg -n "scripts/kg|cmd/kg|internal/kg|packages/rust|python3 -m scripts\\.kg" README.md docs tests Makefile .`
Expected: no user-facing references remain to the old source layout unless intentionally kept for compatibility

**Step 4: Commit**

```bash
git add README.md Makefile docs tests
git commit -m "docs: update tooling and docs for new layout"
```

### Task 7: Verify All Implementations And Aggregate Flows

**Files:**
- Modify: `README.md` only if verification discovers documented mismatches

**Step 1: Verify Python CLI**

Run: `python3 -m implementations.python.kg --help`
Expected: command succeeds

**Step 2: Verify Go build**

Run: `go build ./...`
Workdir: `implementations/go/kg`
Expected: command succeeds

**Step 3: Verify Rust build**

Run: `cargo build`
Workdir: `implementations/rust/kg`
Expected: command succeeds

**Step 4: Verify aggregate repository workflow**

Run: `make test`
Expected: aggregate verification runs the intended per-language checks successfully

**Step 5: Capture the final tree**

Run: `find . -maxdepth 3 -type d | sort`
Expected: top-level output includes `implementations/python`, `implementations/go`, and `implementations/rust`, and no longer exposes the old mixed source layout

**Step 6: Commit**

```bash
git add README.md Makefile implementations docs tests .gitignore
git commit -m "test: verify multi-language repository layout"
```
