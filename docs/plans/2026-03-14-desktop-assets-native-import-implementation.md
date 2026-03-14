# Desktop Assets Native Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把桌面端资源页升级为原生文件选择导入的资源工作区，并补齐资源详情联动与测试覆盖。

**Architecture:** 保持现有桌面端 React + Tauri 壳层不变，在前端增加资源页的选中态、文件选择动作和详情面板。复用现有 `import_asset` 命令，通过 Tauri dialog plugin 选择文件，导入后刷新资源列表并聚焦新资源。

**Tech Stack:** React, TypeScript, React Router, Vitest, Testing Library, Tauri dialog plugin, Rust/Tauri backend

---

### Task 1: Add failing assets workflow tests

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`
- Modify: `apps/desktop/src/lib/api.ts`

**Step 1: Write the failing test**

Add tests that assert:
- the assets page exposes a `选择文件` button
- clicking the button calls a file chooser API
- choosing a file fills the asset path and target name fields
- selecting an asset row shows its metadata in a details panel
- importing an asset refreshes the list and surfaces the imported asset details

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: FAIL because no file chooser API, no asset detail panel, or no refreshed selection behavior exists yet.

**Step 3: Write minimal implementation support**

Add the API surface needed for the tests, but no feature logic beyond what the tests force.

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: targeted tests PASS after the feature is implemented.

**Step 5: Commit**

```bash
git add apps/desktop/src/App.test.tsx apps/desktop/src/lib/api.ts
git commit -m "test: cover desktop asset import workflow"
```

### Task 2: Implement native file choosing for assets

**Files:**
- Modify: `apps/desktop/src/lib/api.ts`
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/pages/AssetsPage.tsx`

**Step 1: Write the failing test**

Use the tests from Task 1 to keep the change red until the chooser behavior is wired.

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: FAIL on chooser-related assertions.

**Step 3: Write minimal implementation**

- Add a `chooseAssetFile()` helper in `api.ts` using the Tauri dialog plugin.
- In `App.tsx`, handle file selection, derive a default target name from the chosen path, and update asset form state.
- Pass a `onChooseAssetFile` callback into `AssetsPage.tsx`.

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: chooser tests PASS.

**Step 5: Commit**

```bash
git add apps/desktop/src/lib/api.ts apps/desktop/src/App.tsx apps/desktop/src/pages/AssetsPage.tsx
git commit -m "feat: add native desktop asset file chooser"
```

### Task 3: Add asset details selection and import refresh

**Files:**
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/pages/AssetsPage.tsx`
- Modify: `apps/desktop/src/components/AssetTable.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Write the failing test**

Keep the metadata-panel and import-refresh assertions red until the selection model and detail panel exist.

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: FAIL because asset rows are not selectable and no details panel is rendered.

**Step 3: Write minimal implementation**

- Track the selected asset in `App.tsx`.
- Let `AssetTable.tsx` expose row selection.
- Render a details card in `AssetsPage.tsx` with `path`, `scope`, `project`, `size`, and `sha256`.
- After importing, refresh assets and select the imported record.
- Tighten styles so the right column becomes “details + import” instead of a plain form.

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- App.test.tsx`
Expected: PASS for asset selection, details, and import refresh behavior.

**Step 5: Commit**

```bash
git add apps/desktop/src/App.tsx apps/desktop/src/pages/AssetsPage.tsx apps/desktop/src/components/AssetTable.tsx apps/desktop/src/styles.css
git commit -m "feat: add desktop asset details workbench"
```

### Task 4: Update documentation

**Files:**
- Modify: `apps/desktop/README.md`
- Modify: `README.md`
- Create: `docs/plans/2026-03-14-desktop-assets-native-import-design.md`
- Create: `docs/plans/2026-03-14-desktop-assets-native-import-implementation.md`

**Step 1: Write the failing test**

No automated test required for documentation changes.

**Step 2: Run test to verify it fails**

Skip.

**Step 3: Write minimal implementation**

Document that desktop assets use native file selection and that the assets page now includes list, details, and import workflow.

**Step 4: Run test to verify it passes**

Run: `git diff --check`
Expected: PASS with no whitespace or patch issues.

**Step 5: Commit**

```bash
git add README.md apps/desktop/README.md docs/plans/2026-03-14-desktop-assets-native-import-design.md docs/plans/2026-03-14-desktop-assets-native-import-implementation.md
git commit -m "docs: update desktop asset import workflow"
```

### Task 5: Verify desktop app quality gates

**Files:**
- Verify only

**Step 1: Write the failing test**

No new test file; verification uses the completed suite.

**Step 2: Run test to verify it fails**

Skip.

**Step 3: Write minimal implementation**

None. This task validates prior work.

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
git commit -m "feat: improve desktop asset workflow"
```
