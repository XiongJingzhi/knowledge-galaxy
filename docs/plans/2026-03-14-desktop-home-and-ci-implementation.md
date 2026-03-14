# Desktop Home And CI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the desktop app into a one-screen home dashboard with secondary work pages, add a reusable galaxy logo, split GitHub Actions workflows by responsibility, and update repository documentation to match the implementation.

**Architecture:** Keep the current React/Tauri shell but introduce a `home` top-level view that owns search, overview, activity summary, and feature entry cards. Keep detailed workbenches in secondary views. Add an SVG logo asset consumed by the sidebar and docs, and split the current monolithic workflow into `ci.yml`, `integration.yml`, and `release.yml` while preserving current build/test behavior.

**Tech Stack:** React 18, TypeScript, Vitest, Vite, CSS, Tauri 2, GitHub Actions YAML, Markdown

---

### Task 1: Add failing tests for the new home-first desktop navigation

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

Add tests that expect:
- desktop defaults to a `home` summary view
- home renders a global search box
- pressing Enter in home search navigates to the documents view with the query applied
- clicking a feature card navigates to its secondary page

**Step 2: Run test to verify it fails**

Run: `npm test -- App.test.tsx`
Expected: FAIL because `home` does not exist yet.

**Step 3: Write minimal implementation**

Add a `home` section and enough navigation logic to satisfy the tests.

**Step 4: Run test to verify it passes**

Run: `npm test -- App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/App.test.tsx apps/desktop/src/App.tsx
git commit -m "feat: add desktop home dashboard"
```

### Task 2: Refactor the shell UI into home + secondary pages

**Files:**
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/styles.css`
- Modify: `apps/desktop/src/components/Sidebar.tsx`
- Create: `apps/desktop/src/assets/galaxy-logo.svg`

**Step 1: Write the failing test**

Extend the home tests to expect:
- sidebar shows the logo
- home summary fits the new content model
- secondary pages include a return-home affordance

**Step 2: Run test to verify it fails**

Run: `npm test -- App.test.tsx`
Expected: FAIL until the new shell is implemented.

**Step 3: Write minimal implementation**

Implement:
- home summary composition
- entry cards
- home search behavior
- sidebar logo usage
- secondary page header/back behavior

**Step 4: Run test to verify it passes**

Run: `npm test -- App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/App.tsx apps/desktop/src/styles.css apps/desktop/src/components/Sidebar.tsx apps/desktop/src/assets/galaxy-logo.svg
git commit -m "feat: redesign desktop home shell"
```

### Task 3: Split GitHub Actions workflows

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/integration.yml`
- Create: `.github/workflows/release.yml`

**Step 1: Write the failing test**

No automated workflow execution test is required locally; the guard is command parity and YAML validity by inspection.

**Step 2: Run targeted verification**

Run: `git diff -- .github/workflows`
Expected: New split files reflect existing jobs without losing desktop coverage.

**Step 3: Write minimal implementation**

Move current jobs into:
- lightweight `ci.yml`
- verification-oriented `integration.yml`
- artifact/release-oriented `release.yml`

**Step 4: Run verification**

Run: `git diff -- .github/workflows`
Expected: Clear split with desktop integration coverage preserved.

**Step 5: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/integration.yml .github/workflows/release.yml
git commit -m "ci: split integration and release workflows"
```

### Task 4: Update docs to match the current desktop and CI implementation

**Files:**
- Modify: `README.md`
- Modify: `apps/desktop/README.md`
- Modify: `docs/plans/2026-03-14-desktop-home-and-ci-design.md`
- Modify: `docs/plans/2026-03-14-desktop-home-and-ci-implementation.md`

**Step 1: Write the failing test**

No automated docs test. Use implementation parity as the guard.

**Step 2: Verify current behavior**

Re-read desktop shell and workflow files before editing docs.

**Step 3: Write minimal implementation**

Update docs to describe:
- home-first desktop architecture
- native directory picker
- logo presence
- workflow split and desktop CI coverage

**Step 4: Run verification**

Run: `rg -n "CI|桌面端|首页|integration|release" README.md apps/desktop/README.md .github/workflows`
Expected: Docs and workflow names align with implementation.

**Step 5: Commit**

```bash
git add README.md apps/desktop/README.md docs/plans/2026-03-14-desktop-home-and-ci-design.md docs/plans/2026-03-14-desktop-home-and-ci-implementation.md
git commit -m "docs: align desktop home and ci docs"
```

### Task 5: Full verification

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/styles.css`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/integration.yml`
- Modify: `.github/workflows/release.yml`

**Step 1: Run focused desktop tests**

Run: `npm test -- App.test.tsx`
Expected: PASS

**Step 2: Run full desktop test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run desktop build**

Run: `npm run build`
Expected: PASS

**Step 4: Run Tauri Rust verification**

Run: `cargo check`
Workdir: `apps/desktop/src-tauri`
Expected: PASS

**Step 5: Review workflow and docs diff**

Run: `git diff -- .github/workflows README.md apps/desktop/README.md`
Expected: split workflows and aligned documentation.

**Step 6: Commit**

```bash
git add apps/desktop/src/App.test.tsx apps/desktop/src/App.tsx apps/desktop/src/styles.css apps/desktop/src/components/Sidebar.tsx apps/desktop/src/assets/galaxy-logo.svg .github/workflows/ci.yml .github/workflows/integration.yml .github/workflows/release.yml README.md apps/desktop/README.md docs/plans/2026-03-14-desktop-home-and-ci-design.md docs/plans/2026-03-14-desktop-home-and-ci-implementation.md
git commit -m "feat: add desktop home dashboard and ci split"
```
