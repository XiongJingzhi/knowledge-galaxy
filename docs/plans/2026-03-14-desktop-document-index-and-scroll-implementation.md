# Desktop Document Index And Scroll Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the desktop documents index show real update times and tighten the document workspace layout so scrolling is isolated to the main content area.

**Architecture:** Extend the shared document list payload with `updatedAt` from the Tauri backend, format it in the documents table, and refine the document editor shell so the workspace content becomes the scroll container while the outer shell stays fixed. Keep routes and document workflows unchanged.

**Tech Stack:** React, React Router, Vitest, Testing Library, Tauri, Rust

---

### Task 1: Capture The Design

**Files:**
- Create: `docs/plans/2026-03-14-desktop-document-index-and-scroll-design.md`
- Create: `docs/plans/2026-03-14-desktop-document-index-and-scroll-implementation.md`

**Step 1: Write the design and implementation documents**

Describe the payload change, table rendering, title refinement, and scroll-container behavior.

**Step 2: Save both files**

Expected: both files exist under `docs/plans/`.

### Task 2: Add Failing Tests For Real Document Timestamps

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Update mocked document list items to include `updatedAt`**

Use ISO timestamps in the mocked payloads.

**Step 2: Write a failing test for the documents index timestamp**

Assert the documents table renders a formatted timestamp instead of the placeholder copy `最近更新`.

**Step 3: Run the targeted test to verify red**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: FAIL because the table still renders placeholder copy.

### Task 3: Add Failing Tests For Workspace Structure

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.test.tsx`

**Step 1: Add a failing structure test**

Assert the editor header exposes a dedicated title element and the component renders a labeled main workspace content container for scrolling.

**Step 2: Run the targeted test to verify red**

Run: `cd apps/desktop && npm test -- src/components/DocumentEditor.test.tsx`

Expected: FAIL because the new structure does not yet exist.

### Task 4: Implement Document Index Data And Layout

**Files:**
- Modify: `apps/desktop/src/lib/types.ts`
- Modify: `apps/desktop/src/pages/DocumentsPage.tsx`
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/lib/api.ts`
- Modify: `apps/desktop/src-tauri/src/lib.rs`

**Step 1: Extend `DocumentListItem` with `updatedAt`**

Add the field to the TypeScript type and Rust struct with camelCase serialization.

**Step 2: Return `updated_at` from Tauri list/search commands**

Map existing metadata into the response payload.

**Step 3: Format and render timestamps in `DocumentsPage.tsx`**

Replace placeholder text with a small formatter that produces a short zh-CN datetime string.

**Step 4: Run targeted app tests**

Run: `cd apps/desktop && npm test -- App.test.tsx`

Expected: PASS

### Task 5: Implement Editor Header And Scroll Refinement

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Refine the editor header markup**

Expose a more compact title wrapper and add a labeled content container that can be targeted as the main scroll region.

**Step 2: Move overflow responsibility**

Set outer workspace containers to fixed-height/flex-safe values and assign scrolling to `workspace__content`.

**Step 3: Adjust editor title styling**

Reduce display intensity and align the header with editing-focused layout.

**Step 4: Run targeted editor tests**

Run: `cd apps/desktop && npm test -- src/components/DocumentEditor.test.tsx`

Expected: PASS

### Task 6: Verify And Ship

**Files:**
- Modify: `README.md`
- Modify: `apps/desktop/README.md`

**Step 1: Update docs if behavior changed**

Mention that the document index shows real update times and the workspace scrolls within the main content area.

**Step 2: Run full desktop verification**

Run:
- `cd apps/desktop && npm test`
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `cd apps/desktop && npm run build`
- `git diff --check`

Expected: all commands pass.

**Step 3: Commit**

```bash
git add docs/plans/2026-03-14-desktop-document-index-and-scroll-design.md \
  docs/plans/2026-03-14-desktop-document-index-and-scroll-implementation.md \
  apps/desktop/src/App.test.tsx \
  apps/desktop/src/components/DocumentEditor.test.tsx \
  apps/desktop/src/components/DocumentEditor.tsx \
  apps/desktop/src/lib/types.ts \
  apps/desktop/src/pages/DocumentsPage.tsx \
  apps/desktop/src/styles.css \
  apps/desktop/src-tauri/src/lib.rs \
  README.md apps/desktop/README.md
git commit -m "feat: refine desktop document index layout"
git push
```
