# Desktop Create And Assets Workbench Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the desktop create and assets pages into clearer workbenches that match the newer dashboard and documents shell.

**Architecture:** Keep the current React page boundaries and API flow, but reorganize page composition into distinct desktop panels. Create page becomes a three-zone drafting workbench, while assets page becomes an index-and-import desk with clearer module boundaries.

**Tech Stack:** React 18, TypeScript, Vitest, CSS, existing desktop app structure

---

### Task 1: Capture workbench regressions with tests

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- The create page shows `配方台` and `正文起草`
- The assets page shows `资源索引台` and `导入面板`

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: FAIL because the current pages do not expose those workbench sections.

**Step 3: Write minimal implementation**

Do not implement yet.

**Step 4: Run the same test again if needed**

Expected: still FAIL for the intended missing UI.

**Step 5: Commit**

Do not commit yet.

### Task 2: Rebuild the create page as a drafting workbench

**Files:**
- Modify: `apps/desktop/src/pages/CreatePage.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Split layout into three modules**

Introduce:

- recipe chooser panel
- create fields panel
- Markdown draft panel

**Step 2: Tighten copy and controls**

Keep the form fields compact and move the main writing area into its own panel.

**Step 3: Run focused tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: create-page assertions pass.

### Task 3: Rebuild the assets page as an index-and-import desk

**Files:**
- Modify: `apps/desktop/src/pages/AssetsPage.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Split layout into index and import panels**

Introduce:

- assets index panel with scope/filter controls
- inventory table panel
- import panel with target details and action area

**Step 2: Align spacing and headers**

Match the new desktop workbench language already used by home and documents.

**Step 3: Run focused tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: assets-page assertions pass.

### Task 4: Full verification and delivery

**Files:**
- Create: `docs/plans/2026-03-14-desktop-create-assets-workbench-design.md`
- Create: `docs/plans/2026-03-14-desktop-create-assets-workbench-implementation.md`

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
git add apps/desktop/src/App.test.tsx apps/desktop/src/pages/CreatePage.tsx apps/desktop/src/pages/AssetsPage.tsx apps/desktop/src/styles.css docs/plans/2026-03-14-desktop-create-assets-workbench-design.md docs/plans/2026-03-14-desktop-create-assets-workbench-implementation.md
git commit -m "feat: refine desktop create and assets workbenches"
git push origin main
```
