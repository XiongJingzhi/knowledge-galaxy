# Desktop Documents Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the standalone desktop create module with a routed documents flow, add a dedicated `/documents/new` editor workspace, and switch desktop build/release checks to Tauri-first outputs.

**Architecture:** Move the desktop shell from local section state to `react-router` routes while keeping repository and data loading in `App.tsx`. Rebuild the documents area into an index page for search and classification plus a routed creation page with a left editor and right preview. Update desktop build commands and GitHub workflows so Tauri/Rust build artifacts are the delivery target.

**Tech Stack:** React 18, TypeScript, React Router, Vitest, CSS, Tauri 2, Rust, GitHub Actions

---

### Task 1: Lock the routed documents flow with failing tests

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing tests**

Add tests that assert:

- the sidebar no longer shows `创建`
- the documents page renders search, category filters, and a table-style list
- clicking `新建文档` navigates to the routed creation page
- the creation page renders an editor column and preview column

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: FAIL because the app still uses local section state and the standalone create page.

### Task 2: Add router support and remove the standalone create page

**Files:**
- Modify: `apps/desktop/package.json`
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/components/Sidebar.tsx`
- Modify: `apps/desktop/src/lib/types.ts`
- Delete: `apps/desktop/src/pages/CreatePage.tsx`

**Step 1: Install and wire React Router**

Add `react-router-dom` and wrap the desktop shell in routed page rendering.

**Step 2: Replace section state with route navigation**

Use route location for active nav state and navigation actions.

**Step 3: Remove create navigation**

Delete the standalone create route and any remaining create-only section metadata.

**Step 4: Run focused tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: route and nav assertions pass.

### Task 3: Rebuild the documents index and creation workspaces

**Files:**
- Modify: `apps/desktop/src/pages/DocumentsPage.tsx`
- Create: `apps/desktop/src/pages/DocumentCreatePage.tsx`
- Modify: `apps/desktop/src/components/DocumentEditor.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Rebuild Documents page**

Render:

- enlarged search
- classification controls
- table-like document list
- `新建文档` action

**Step 2: Create routed document creation page**

Build a two-column workspace with:

- left Markdown editing panel
- right Markdown preview panel

**Step 3: Reuse editor logic without the old recipe shell**

Keep necessary metadata fields, but reduce form density and remove the recipe cards.

**Step 4: Run focused tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: routed creation flow and editor/preview assertions pass.

### Task 4: Switch desktop build and CI to Tauri-first outputs

**Files:**
- Modify: `apps/desktop/package.json`
- Modify: `Makefile`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/integration.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `README.md`
- Modify: `apps/desktop/README.md`

**Step 1: Adjust local build commands**

Make desktop build scripts express Tauri build as the production output path.

**Step 2: Update CI checks**

Ensure desktop CI validates:

- front-end tests
- Rust/Tauri checks
- Tauri build packaging

Do not upload `apps/desktop/dist` as the desktop release artifact.

**Step 3: Update docs**

Document that desktop artifacts are built via Tauri/Rust, not shipped as web assets.

**Step 4: Run verification**

Run:

- `cd apps/desktop && npm test`
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `cd apps/desktop && npm run build`
- `git diff --check`

Expected: PASS, with desktop build now targeting Tauri packaging semantics.

### Task 5: Final delivery

**Files:**
- Create: `docs/plans/2026-03-14-desktop-documents-routing-design.md`
- Create: `docs/plans/2026-03-14-desktop-documents-routing-implementation.md`

**Step 1: Stage changes**

```bash
git add apps/desktop/package.json apps/desktop/src/App.tsx apps/desktop/src/App.test.tsx apps/desktop/src/components/Sidebar.tsx apps/desktop/src/components/DocumentEditor.tsx apps/desktop/src/pages/DocumentsPage.tsx apps/desktop/src/pages/DocumentCreatePage.tsx apps/desktop/src/styles.css Makefile .github/workflows/ci.yml .github/workflows/integration.yml .github/workflows/release.yml README.md apps/desktop/README.md docs/plans/2026-03-14-desktop-documents-routing-design.md docs/plans/2026-03-14-desktop-documents-routing-implementation.md
```

**Step 2: Commit**

```bash
git commit -m "feat: route desktop documents flow"
git push origin main
```
