# Desktop Writer Surface Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the desktop document editor into an integrated writing surface so the title input and Markdown editor feel like one cohesive workspace.

**Architecture:** Keep the existing document routes and preview/meta structure, but reshape the left editor column into a dedicated writer surface container with a lightweight context header, title input, and body editor that share a common visual language.

**Tech Stack:** React, Vitest, Testing Library, CSS

---

### Task 1: Capture The Design

**Files:**
- Create: `docs/plans/2026-03-14-desktop-writer-surface-design.md`
- Create: `docs/plans/2026-03-14-desktop-writer-surface-implementation.md`

**Step 1: Write the design and implementation documents**

Document the chosen writer-surface approach and the testing scope.

**Step 2: Save both files**

Expected: both files exist under `docs/plans/`.

### Task 2: Add Failing Editor Tests

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.test.tsx`

**Step 1: Add a failing test for writer surface structure**

Assert that:
- the editor renders a `document-writer` container
- the title input is inside it
- the Markdown hint is rendered as a writer badge

**Step 2: Run the targeted test to verify red**

Run: `cd apps/desktop && npm test -- src/components/DocumentEditor.test.tsx`

Expected: FAIL because the writer surface markup does not exist yet.

### Task 3: Implement Writer Surface Markup And Styles

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Reshape the editor column markup**

Add:
- `document-writer`
- `document-writer__context`
- `document-writer__title`
- `document-writer__body`
- `document-writer__badge`

**Step 2: Style the writer surface**

Unify:
- title and body background
- border rhythm
- spacing
- subdued field labels

**Step 3: Rebalance the preview panel slightly**

Reduce competing emphasis so the left writing surface remains primary.

**Step 4: Run targeted tests**

Run: `cd apps/desktop && npm test -- src/components/DocumentEditor.test.tsx`

Expected: PASS

### Task 4: Verify And Ship

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.tsx`
- Modify: `apps/desktop/src/components/DocumentEditor.test.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Run full desktop verification**

Run:
- `cd apps/desktop && npm test`
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `cd apps/desktop && npm run build`
- `git diff --check`

Expected: all commands pass.

**Step 2: Commit**

```bash
git add docs/plans/2026-03-14-desktop-writer-surface-design.md \
  docs/plans/2026-03-14-desktop-writer-surface-implementation.md \
  apps/desktop/src/components/DocumentEditor.tsx \
  apps/desktop/src/components/DocumentEditor.test.tsx \
  apps/desktop/src/styles.css
git commit -m "feat: refine desktop writer surface"
git push
```
