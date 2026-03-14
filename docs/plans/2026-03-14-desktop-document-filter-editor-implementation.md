# Desktop Document Filter And Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把桌面端文档页收敛成搜索加弹出筛选的轻索引台，并把文档编辑页调整为 Markdown 主体优先、时间字段自动生成的写作工作区。

**Architecture:** 复用现有 React Router 文档路由和 `DocumentFilters` 组件，在文档页增加弹层开关而不是新增独立页面。编辑页保持左侧编辑、右侧预览，但把元数据下沉为次级区块，并在前端草稿初始化阶段自动填充时间字段。

**Tech Stack:** React, TypeScript, React Router, Vitest, Testing Library

---

### Task 1: Add failing tests for the lighter document index

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:
- the documents page shows a filter button near search
- the old signal-rail explanation copy is no longer rendered
- clicking the filter button reveals the filter fields in a popover/panel

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: FAIL because the current page still renders signal cards and has no filter toggle.

**Step 3: Write minimal implementation**

Only add enough state and markup later to satisfy the new tests.

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: targeted document-index tests PASS.

**Step 5: Commit**

```bash
git add apps/desktop/src/App.test.tsx
git commit -m "test: cover desktop document filter popover"
```

### Task 2: Add failing tests for the editor information hierarchy

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`
- Modify: `apps/desktop/src/components/DocumentEditor.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:
- the editor still exposes the Markdown textarea prominently
- created/updated/date metadata appears as read-only information
- the date input is no longer editable as a primary field

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx src/components/DocumentEditor.test.tsx`
Expected: FAIL because metadata is still rendered as editable fields.

**Step 3: Write minimal implementation**

Implement only the data-display changes required by the tests.

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- App.test.tsx src/components/DocumentEditor.test.tsx`
Expected: PASS for editor hierarchy assertions.

**Step 5: Commit**

```bash
git add apps/desktop/src/App.test.tsx apps/desktop/src/components/DocumentEditor.test.tsx
git commit -m "test: cover desktop markdown-first editor layout"
```

### Task 3: Implement filter icon and popover behavior

**Files:**
- Modify: `apps/desktop/src/pages/DocumentsPage.tsx`
- Modify: `apps/desktop/src/components/DocumentFilters.tsx`
- Modify: `apps/desktop/src/styles.css`
- Modify: `apps/desktop/src/lib/desktop-ui.ts`

**Step 1: Write the failing test**

Use the tests from Task 1.

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: FAIL on missing filter button/popover and stale signal text.

**Step 3: Write minimal implementation**

- Remove signal-card rendering from `DocumentsPage.tsx`
- Add local state for showing a filter popover
- Render `DocumentFilters` inside the popover
- Trim helper copy so the page focuses on search, filters, and the table

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: PASS for document page filter behavior.

**Step 5: Commit**

```bash
git add apps/desktop/src/pages/DocumentsPage.tsx apps/desktop/src/components/DocumentFilters.tsx apps/desktop/src/styles.css apps/desktop/src/lib/desktop-ui.ts
git commit -m "feat: simplify desktop document filters"
```

### Task 4: Implement markdown-first editor layout and auto timestamps

**Files:**
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/components/DocumentEditor.tsx`
- Modify: `apps/desktop/src/pages/DocumentCreatePage.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Write the failing test**

Use the tests from Task 2.

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx src/components/DocumentEditor.test.tsx`
Expected: FAIL while the editor still exposes editable date metadata as primary fields.

**Step 3: Write minimal implementation**

- Auto-fill create draft `createdAt`, `updatedAt`, and `date` in `App.tsx`
- In `DocumentEditor.tsx`, place title and Markdown editor ahead of metadata controls
- Move metadata into a lighter side/secondary section
- Render timestamps as read-only information instead of editable inputs
- Tighten the page header copy in `DocumentCreatePage.tsx`

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- App.test.tsx src/components/DocumentEditor.test.tsx`
Expected: PASS for editor layout and auto-time behavior.

**Step 5: Commit**

```bash
git add apps/desktop/src/App.tsx apps/desktop/src/components/DocumentEditor.tsx apps/desktop/src/pages/DocumentCreatePage.tsx apps/desktop/src/styles.css
git commit -m "feat: prioritize markdown in desktop editor"
```

### Task 5: Update documentation

**Files:**
- Modify: `README.md`
- Modify: `apps/desktop/README.md`
- Create: `docs/plans/2026-03-14-desktop-document-filter-editor-design.md`
- Create: `docs/plans/2026-03-14-desktop-document-filter-editor-implementation.md`

**Step 1: Write the failing test**

No automated test required for docs.

**Step 2: Run test to verify it fails**

Skip.

**Step 3: Write minimal implementation**

Update desktop docs to describe filter popovers and markdown-first editing with automatic timestamps.

**Step 4: Run test to verify it passes**

Run: `git diff --check`
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md apps/desktop/README.md docs/plans/2026-03-14-desktop-document-filter-editor-design.md docs/plans/2026-03-14-desktop-document-filter-editor-implementation.md
git commit -m "docs: update desktop document workflow"
```

### Task 6: Verify the desktop quality gates

**Files:**
- Verify only

**Step 1: Write the failing test**

No new test file.

**Step 2: Run test to verify it fails**

Skip.

**Step 3: Write minimal implementation**

None.

**Step 4: Run test to verify it passes**

Run:
- `cd apps/desktop && npm test`
- `cd apps/desktop && npm run build`
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `git diff --check`

Expected: all commands PASS.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: simplify desktop document workflow"
```
