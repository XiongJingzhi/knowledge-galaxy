# Desktop Dashboard And Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the desktop home screen into a denser dashboard and make Markdown editing the primary document workflow with working preview rendering.

**Architecture:** Keep the current React page split, but refactor the home shell and document editor composition. The home page becomes a dashboard-style grid built from existing shared shell components, and the document editor gets a dedicated Markdown preview renderer plus a new two-column editing layout.

**Tech Stack:** React 18, TypeScript, Vitest, Tauri desktop shell, CSS, `react-markdown`, `remark-gfm`

---

### Task 1: Capture dashboard and preview regressions with tests

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`
- Modify: `apps/desktop/src/components/DocumentEditor.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- The home screen shows a top-level search toolbar and dashboard section labels after render
- The document editor renders Markdown preview output for headings, emphasis, and list items instead of raw Markdown text

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- App.test.tsx src/components/DocumentEditor.test.tsx`

Expected: FAIL because the current home page is not arranged as the new dashboard and preview still uses raw `<pre>` output.

**Step 3: Write minimal implementation**

Do not implement yet. This task only establishes the red baseline.

**Step 4: Run test to verify it still fails for the right reason**

Run the same command again if the first failure was noisy.

**Step 5: Commit**

Do not commit yet.

### Task 2: Rebuild the home screen shell into a dashboard

**Files:**
- Modify: `apps/desktop/src/components/DesktopMasthead.tsx`
- Modify: `apps/desktop/src/pages/HomePage.tsx`
- Modify: `apps/desktop/src/styles.css`
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Implement the new home structure**

Create:

- A top `home-toolbar` with search and actions
- A lighter `desktop-masthead`
- A modular `home-dashboard-grid` that positions overview cards, quick-entry cards, and recent activity

**Step 2: Update copy and semantics**

Ensure dashboard labels and headings match the new structure while preserving existing navigation behavior.

**Step 3: Run focused tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: PASS for home behavior and navigation assertions.

**Step 4: Refine styles**

Tighten spacing, card rhythm, and hierarchy to reflect a denser desktop dashboard rather than a stacked hero page.

**Step 5: Commit**

Do not commit yet.

### Task 3: Make Markdown editing the primary document workflow

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.tsx`
- Modify: `apps/desktop/src/styles.css`
- Modify: `apps/desktop/src/components/DocumentEditor.test.tsx`
- Modify: `apps/desktop/package.json`
- Modify: `apps/desktop/package-lock.json`

**Step 1: Add Markdown rendering support**

Install and use:

- `react-markdown`
- `remark-gfm`

Render preview content through Markdown components instead of `<pre>`.

**Step 2: Recompose the editor layout**

Make the main editor area larger than the metadata area:

- Main column: Markdown textarea
- Side column: preview + metadata summary + compact fields

**Step 3: Reduce input density**

Shrink text inputs, labels, spacing, and metadata controls so the frontmatter area reads as auxiliary.

**Step 4: Run focused editor tests**

Run: `cd apps/desktop && npm test -- src/components/DocumentEditor.test.tsx`

Expected: PASS, including the new Markdown preview assertion.

**Step 5: Commit**

Do not commit yet.

### Task 4: Run full desktop verification

**Files:**
- No source changes required unless failures appear

**Step 1: Run all desktop tests**

Run: `cd apps/desktop && npm test`

Expected: PASS

**Step 2: Run production build**

Run: `cd apps/desktop && npm run build`

Expected: PASS

**Step 3: Run Tauri backend check**

Run: `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`

Expected: PASS

**Step 4: Check whitespace / patch hygiene**

Run: `git diff --check`

Expected: no output

**Step 5: Commit**

```bash
git add apps/desktop/package.json apps/desktop/package-lock.json apps/desktop/src/App.test.tsx apps/desktop/src/components/DocumentEditor.test.tsx apps/desktop/src/components/DocumentEditor.tsx apps/desktop/src/components/DesktopMasthead.tsx apps/desktop/src/pages/HomePage.tsx apps/desktop/src/styles.css docs/plans/2026-03-14-desktop-dashboard-editor-design.md docs/plans/2026-03-14-desktop-dashboard-editor-implementation.md
git commit -m "feat: redesign desktop dashboard and editor"
git push origin main
```
