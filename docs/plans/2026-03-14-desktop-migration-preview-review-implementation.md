# Desktop Migration Preview Review Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance desktop knowledge migration so preview drafts can be expanded for review and imported results can open directly in the document editor.

**Architecture:** Keep migration inside the Assets workbench. Extend the React preview list with local expand/collapse state and render import results as actionable rows that deep-link into the document editor. Reuse existing Tauri migration commands; no backend protocol changes are needed.

**Tech Stack:** React, React Router, Vitest, Testing Library, Tauri

---

### Task 1: Document The Design

**Files:**
- Create: `docs/plans/2026-03-14-desktop-migration-preview-review-design.md`
- Create: `docs/plans/2026-03-14-desktop-migration-preview-review-implementation.md`

**Step 1: Write the design and plan documents**

Describe the chosen approach, UI behavior, state model, and test scope.

**Step 2: Save both files**

Expected: Both files exist under `docs/plans/`.

### Task 2: Add Failing App Tests

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test for expanded migration preview**

Add a test that:
- opens the Assets page
- seeds migration preview with at least one draft containing `originLabel` and `body`
- clicks the expand action
- asserts `原始来源` and `正文预览` appear with the correct values

**Step 2: Run the targeted test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx --runInBand`

Expected: FAIL because the preview UI does not yet expose the expand/review content.

**Step 3: Write the failing test for import result deep-link**

Add a test that:
- completes a migration import with multiple `createdPaths`
- clicks one `打开文档`
- asserts the app navigates to the document editor and loads the chosen path

**Step 4: Run the targeted test again**

Run: `cd apps/desktop && npm test -- App.test.tsx --runInBand`

Expected: FAIL on the new result-link behavior if it is not fully rendered/actionable yet.

### Task 3: Implement Preview Review UI

**Files:**
- Modify: `apps/desktop/src/pages/AssetsPage.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Add local expanded-row state in `AssetsPage.tsx`**

Track expanded draft indices with component state and toggle them from a button per row.

**Step 2: Render expanded review sections**

For expanded rows, render:
- `原始来源`
- `正文预览`

Use `<pre>` or a read-only code/text block for the Markdown body.

**Step 3: Adjust import result rendering**

Render each `createdPaths` entry as a row with a dedicated `打开文档` button.

**Step 4: Update styles**

Add styles for:
- preview row actions
- expanded review panel
- import result rows

**Step 5: Run targeted tests**

Run: `cd apps/desktop && npm test -- App.test.tsx --runInBand`

Expected: PASS

### Task 4: Verify And Ship

**Files:**
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/App.test.tsx`
- Modify: `apps/desktop/src/pages/AssetsPage.tsx`
- Modify: `apps/desktop/src/styles.css`
- Modify: `README.md`
- Modify: `apps/desktop/README.md`

**Step 1: Update documentation if product copy or behavior changed**

Note that migration preview supports expanded review and imported documents can be opened directly.

**Step 2: Run the full desktop verification suite**

Run:
- `cd apps/desktop && npm test`
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `cd apps/desktop && npm run build`
- `git diff --check`

Expected: All commands pass.

**Step 3: Commit**

```bash
git add docs/plans/2026-03-14-desktop-migration-preview-review-design.md \
  docs/plans/2026-03-14-desktop-migration-preview-review-implementation.md \
  apps/desktop/src/App.tsx \
  apps/desktop/src/App.test.tsx \
  apps/desktop/src/pages/AssetsPage.tsx \
  apps/desktop/src/styles.css \
  README.md \
  apps/desktop/README.md
git commit -m "feat: improve desktop migration review flow"
git push
```
