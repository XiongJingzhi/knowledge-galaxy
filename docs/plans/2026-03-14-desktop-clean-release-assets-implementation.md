# Desktop Clean Release Assets Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish only installer-level desktop artifacts in GitHub nightly releases instead of the full Tauri bundle contents.

**Architecture:** Keep Tauri build output unchanged, add an installer extraction step in the desktop release workflow, and publish only that extracted directory. Guard the workflow with a regression test that reads `release.yml` and verifies the installer-only paths and commands.

**Tech Stack:** GitHub Actions YAML, Vitest, Node.js file assertions

---

### Task 1: Add a failing workflow regression test

**Files:**
- Create: `apps/desktop/src/release-workflow.test.ts`

**Step 1: Write the failing test**

- Read `.github/workflows/release.yml`
- Assert desktop artifact upload no longer points at `target/release/bundle`
- Assert workflow contains an installer extraction directory
- Assert nightly release no longer uses `find release-artifacts -type f`

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- src/release-workflow.test.ts`

Expected: FAIL because the workflow still uploads the whole bundle and still flattens all files.

### Task 2: Update the desktop release workflow

**Files:**
- Modify: `.github/workflows/release.yml`

**Step 1: Write minimal implementation**

- Add a step after desktop build that copies only installer-level artifacts into a separate directory.
- Upload that installer directory as the desktop artifact.
- Change nightly artifact flattening so it only copies top-level files from downloaded artifact directories rather than all nested bundle files.

**Step 2: Run targeted test**

Run: `cd apps/desktop && npm test -- src/release-workflow.test.ts`

Expected: PASS

### Task 3: Update docs and verify

**Files:**
- Modify: `README.md`
- Modify: `apps/desktop/README.md`
- Modify: `docs/plans/2026-03-14-desktop-clean-release-assets-design.md`
- Modify: `docs/plans/2026-03-14-desktop-clean-release-assets-implementation.md`

**Step 1: Update docs**

- Replace wording that says nightly includes the desktop Tauri bundle.
- Clarify that nightly publishes desktop installer packages only.

**Step 2: Run verification**

Run:

- `cd apps/desktop && npm test -- src/release-workflow.test.ts`
- `cd apps/desktop && npm test`
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `cd apps/desktop && npm run build`
- `git diff --check`

Expected: all commands exit successfully.

**Step 3: Commit**

```bash
git add .github/workflows/release.yml \
  README.md \
  apps/desktop/README.md \
  apps/desktop/src/release-workflow.test.ts \
  docs/plans/2026-03-14-desktop-clean-release-assets-design.md \
  docs/plans/2026-03-14-desktop-clean-release-assets-implementation.md
git commit -m "ci: publish installer-only desktop release assets"
git push
```
