# Desktop Structural Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the desktop app with the product constitution and visual design docs by rebuilding the shell into a dark structural control desk.

**Architecture:** Keep the current React/Tauri data flow and component boundaries, but add one top-level masthead in `App.tsx` and refactor the global CSS token system in `styles.css` to a dark structural theme. Verify behavior with focused `App.test.tsx` assertions before implementation changes.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, Vite, CSS

---

### Task 1: Add failing tests for the new desktop control layer

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

Add a test that expects:
- `结构总控台` heading
- `当前区段`
- `文档工作台`
- `知识结构总量`

**Step 2: Run test to verify it fails**

Run: `npm test -- App.test.tsx`
Expected: FAIL because the new masthead text does not exist yet.

**Step 3: Write minimal implementation**

Add a masthead section in `apps/desktop/src/App.tsx` that renders the new desktop control copy and summary metrics.

**Step 4: Run test to verify it passes**

Run: `npm test -- App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/App.test.tsx apps/desktop/src/App.tsx
git commit -m "feat: add desktop structural masthead"
```

### Task 2: Refactor desktop shell styles into the structural theme

**Files:**
- Modify: `apps/desktop/src/styles.css`
- Modify: `apps/desktop/src/components/Sidebar.tsx`
- Modify: `apps/desktop/src/App.tsx`

**Step 1: Write the failing test**

Reuse the masthead test from Task 1 as the behavioral guard. No visual snapshot test.

**Step 2: Run test to verify it fails**

Run: `npm test -- App.test.tsx`
Expected: Already red before implementation.

**Step 3: Write minimal implementation**

Change tokens, shell, panel, hero, list, form, and sidebar styling to match the dark structural language while keeping interactions intact.

**Step 4: Run test to verify it passes**

Run: `npm test -- App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/styles.css apps/desktop/src/components/Sidebar.tsx apps/desktop/src/App.tsx
git commit -m "feat: apply desktop structural theme"
```

### Task 3: Full verification

**Files:**
- Modify: `docs/plans/2026-03-14-desktop-structural-theme-design.md`
- Modify: `docs/plans/2026-03-14-desktop-structural-theme-implementation.md`

**Step 1: Run focused tests**

Run: `npm test -- App.test.tsx`
Expected: PASS

**Step 2: Run full desktop test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add docs/plans/2026-03-14-desktop-structural-theme-design.md docs/plans/2026-03-14-desktop-structural-theme-implementation.md apps/desktop/src/App.test.tsx apps/desktop/src/App.tsx apps/desktop/src/components/Sidebar.tsx apps/desktop/src/styles.css
git commit -m "feat: evolve desktop structural theme"
```
