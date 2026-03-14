# Desktop Sidebar Repo Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move repository controls into the desktop sidebar and simplify the home screen into search, overview, and recent activity only.

**Architecture:** Replace the main-area repo shell with a sidebar repo card that owns repo switching and open-directory actions. Remove the masthead-heavy home chrome and keep a lighter main workspace anchored by a larger search control.

**Tech Stack:** React 18, TypeScript, Vitest, CSS, Tauri desktop commands

---

### Task 1: Capture sidebar repo card and home simplification regressions with tests

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- The sidebar shows the current repo path and repo actions
- The home view no longer shows command desk, knowledge overview, current page, repo status, or function entry copy

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: FAIL because the current app still renders top-level shell chrome.

### Task 2: Move repo controls into the sidebar

**Files:**
- Modify: `apps/desktop/src/components/Sidebar.tsx`
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/lib/api.ts`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Add sidebar repo card**

Render:

- current repo path
- choose-directory icon/button
- open-current-directory action

**Step 2: Remove main-area repo shell**

Drop `RepoSwitcher` from `App.tsx` and wire the sidebar actions to the existing repo handlers.

**Step 3: Run focused tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: repo-card assertions pass.

### Task 3: Simplify the home screen and remove masthead chrome

**Files:**
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/pages/HomePage.tsx`
- Modify: `apps/desktop/src/components/DesktopMasthead.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Remove command desk and masthead**

Delete the command desk and knowledge overview from the main workflow.

**Step 2: Slim the home screen**

Keep only:

- larger search
- overview cards
- recent activity

Remove repo status and function entry sections.

**Step 3: Run focused tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: home assertions pass and removed shell text is absent.

### Task 4: Full verification and delivery

**Files:**
- Create: `docs/plans/2026-03-14-desktop-sidebar-repo-card-design.md`
- Create: `docs/plans/2026-03-14-desktop-sidebar-repo-card-implementation.md`

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
git add apps/desktop/src/App.test.tsx apps/desktop/src/components/Sidebar.tsx apps/desktop/src/App.tsx apps/desktop/src/pages/HomePage.tsx apps/desktop/src/components/DesktopMasthead.tsx apps/desktop/src/styles.css docs/plans/2026-03-14-desktop-sidebar-repo-card-design.md docs/plans/2026-03-14-desktop-sidebar-repo-card-implementation.md
git commit -m "feat: move desktop repo controls into sidebar"
git push origin main
```
