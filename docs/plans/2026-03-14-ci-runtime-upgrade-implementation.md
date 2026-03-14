# CI Runtime Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade workflow action versions to current runtime-safe releases and remove invalid Go cache configuration warnings.

**Architecture:** Use a single regression test that reads all three workflow files and asserts the expected action versions and `setup-go` cache policy. Then update the YAML workflows and docs with the minimal changes needed to satisfy those assertions.

**Tech Stack:** GitHub Actions YAML, Vitest, Node.js file assertions

---

### Task 1: Add a failing workflow regression test

**Files:**
- Create: `apps/desktop/src/ci-workflow-runtime.test.ts`

**Step 1: Write the failing test**

- Read `ci.yml`, `integration.yml`, and `release.yml`
- Assert `checkout@v5` is used
- Assert `setup-node@v5` is used
- Assert `setup-go@v6` is used where present
- Assert `setup-python@v6` is used where present
- Assert each `setup-go` step includes `cache: false`

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- src/ci-workflow-runtime.test.ts`

Expected: FAIL because workflows still use older action versions and omit the Go cache setting.

### Task 2: Update workflow action versions and Go cache config

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/integration.yml`
- Modify: `.github/workflows/release.yml`

**Step 1: Write minimal implementation**

- Replace old action versions with the new versions
- Add `cache: false` under each `setup-go` step

**Step 2: Run targeted test**

Run: `cd apps/desktop && npm test -- src/ci-workflow-runtime.test.ts`

Expected: PASS

### Task 3: Update docs and verify

**Files:**
- Modify: `README.md`
- Modify: `apps/desktop/README.md`
- Modify: `docs/plans/2026-03-14-ci-runtime-upgrade-design.md`
- Modify: `docs/plans/2026-03-14-ci-runtime-upgrade-implementation.md`

**Step 1: Update docs**

- Clarify that workflows are pinned to current action majors and the Go setup avoids invalid root cache discovery.

**Step 2: Run verification**

Run:

- `cd apps/desktop && npm test -- src/ci-workflow-runtime.test.ts`
- `cd apps/desktop && npm test`
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `cd apps/desktop && npm run build`
- `git diff --check`

Expected: all commands exit successfully.

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml \
  .github/workflows/integration.yml \
  .github/workflows/release.yml \
  README.md \
  apps/desktop/README.md \
  apps/desktop/src/ci-workflow-runtime.test.ts \
  docs/plans/2026-03-14-ci-runtime-upgrade-design.md \
  docs/plans/2026-03-14-ci-runtime-upgrade-implementation.md
git commit -m "ci: upgrade workflow action runtimes"
git push
```
