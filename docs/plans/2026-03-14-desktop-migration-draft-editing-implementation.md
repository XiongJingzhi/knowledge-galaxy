# Desktop Migration Draft Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让桌面端知识迁移预览支持轻量编辑和移除候选项，并在导入后可直接跳转到文档编辑页。

**Architecture:** 保持现有 `Assets` 页与 Tauri 后端接口不变，把迁移预览结果提升为前端可编辑状态。通过 `App.tsx` 统一编排预览编辑、导入 payload 和导入结果导航，避免修改 Rust 侧协议。

**Tech Stack:** React 18, TypeScript, React Router, Vitest, CSS

---

### Task 1: Add failing tests for editable migration drafts

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- editing draft `title / type / summary` updates the import payload
- removing a draft excludes it from import
- clicking `打开文档` in the import result navigates to the document editor route

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: FAIL because the preview is still read-only.

### Task 2: Implement draft editing in app state

**Files:**
- Modify: `apps/desktop/src/App.tsx`

**Step 1: Add preview editing actions**

Implement handlers to:

- update a draft field by index
- remove a draft by index
- navigate to a created document path

**Step 2: Use edited drafts for import**

Ensure `importKnowledgeMigration()` receives the edited preview state.

**Step 3: Run targeted tests**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: still FAIL, but now only on missing UI controls.

### Task 3: Render editable draft cards and result actions

**Files:**
- Modify: `apps/desktop/src/pages/AssetsPage.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Replace read-only preview cards with editable controls**

Each draft card should include:

- title input
- type select
- summary textarea
- remove button
- readonly path/source

**Step 2: Add result actions**

Each imported path row should include `打开文档`.

**Step 3: Run targeted tests**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: PASS for draft editing and navigation behavior.

### Task 4: Update docs and verify

**Files:**
- Modify: `README.md`
- Modify: `apps/desktop/README.md`
- Create: `docs/plans/2026-03-14-desktop-migration-draft-editing-design.md`
- Create: `docs/plans/2026-03-14-desktop-migration-draft-editing-implementation.md`

**Step 1: Update docs**

Describe that migration previews are editable before import.

**Step 2: Run verification**

Run:

```bash
cd apps/desktop && npm test
cd apps/desktop && npm run build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
git diff --check
```

Expected: all commands pass.

### Task 5: Commit and push

**Step 1: Commit**

```bash
git add README.md apps/desktop/README.md apps/desktop/src/App.test.tsx apps/desktop/src/App.tsx apps/desktop/src/pages/AssetsPage.tsx apps/desktop/src/styles.css docs/plans/2026-03-14-desktop-migration-draft-editing-design.md docs/plans/2026-03-14-desktop-migration-draft-editing-implementation.md
git commit -m "Refine desktop migration draft editing"
```

**Step 2: Push**

```bash
git push origin main
```
