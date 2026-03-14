# Desktop Shell And Panel System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the desktop shell into a command-bar-driven workspace and unify secondary pages under a cleaner panel system.

**Architecture:** Keep the current React page split, but redesign shared shell components and page-level panel composition. The shell becomes a reusable command bar plus compact section hero, while documents/create/assets pages adopt a more consistent panel hierarchy.

**Tech Stack:** React 18, TypeScript, Vitest, CSS, existing desktop component architecture

---

### Task 1: Capture shell and documents explorer regressions with tests

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- The top shell shows a `命令台` section and recent repository chips still render
- The documents page shows a `文档指挥台` shell and a `焦点筛选` block when entering documents

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: FAIL because the current shell and documents page do not use these structures.

**Step 3: Write minimal implementation**

Do not implement yet.

**Step 4: Run the same test again if needed**

Expected: still FAIL for the intended missing UI.

**Step 5: Commit**

Do not commit yet.

### Task 2: Turn RepoSwitcher into a command bar

**Files:**
- Modify: `apps/desktop/src/components/RepoSwitcher.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Rebuild shell structure**

Convert the header into:

- command title/status area
- main input field
- action group
- recent repo chips row

**Step 2: Adjust styling**

Add compact desktop command bar styling that visually matches the dashboard shell.

**Step 3: Run focused tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: shell-related assertions pass.

**Step 4: Commit**

Do not commit yet.

### Task 3: Rebuild documents/create/assets into unified panel desks

**Files:**
- Modify: `apps/desktop/src/pages/DocumentsPage.tsx`
- Modify: `apps/desktop/src/pages/CreatePage.tsx`
- Modify: `apps/desktop/src/pages/AssetsPage.tsx`
- Modify: `apps/desktop/src/components/SectionHero.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Refactor documents explorer shell**

Create a clearer documents explorer area with:

- `文档指挥台`
- `焦点筛选`
- queue/list section

**Step 2: Refactor create page modules**

Separate recipe rail, context, fields, and body input into cleaner panel groupings.

**Step 3: Refactor assets page modules**

Separate filtering, asset inventory, and import workflow into distinct desk panels.

**Step 4: Align section hero density**

Reduce hero heaviness and match the new shell language.

**Step 5: Run focused tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: page-level layout assertions pass without breaking navigation tests.

### Task 4: Full verification and delivery

**Files:**
- Modify: `docs/plans/2026-03-14-desktop-shell-panels-design.md`
- Modify: `docs/plans/2026-03-14-desktop-shell-panels-implementation.md`

**Step 1: Run all desktop tests**

Run: `cd apps/desktop && npm test`

Expected: PASS

**Step 2: Run production build**

Run: `cd apps/desktop && npm run build`

Expected: PASS

**Step 3: Run Tauri backend check**

Run: `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`

Expected: PASS

**Step 4: Check patch hygiene**

Run: `git diff --check`

Expected: no output

**Step 5: Commit**

```bash
git add apps/desktop/src/App.test.tsx apps/desktop/src/components/RepoSwitcher.tsx apps/desktop/src/components/SectionHero.tsx apps/desktop/src/pages/DocumentsPage.tsx apps/desktop/src/pages/CreatePage.tsx apps/desktop/src/pages/AssetsPage.tsx apps/desktop/src/styles.css docs/plans/2026-03-14-desktop-shell-panels-design.md docs/plans/2026-03-14-desktop-shell-panels-implementation.md
git commit -m "feat: refine desktop shell and panel system"
git push origin main
```
