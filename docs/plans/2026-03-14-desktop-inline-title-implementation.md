# Desktop Inline Title Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the desktop document title directly editable in the header and remove the duplicate title field from the writer surface.

**Architecture:** Keep `DocumentEditor` as the single owner of draft state, move the title input to the header, and simplify the writer surface to body-only editing. Update tests first to lock the new interaction, then change the component and CSS with minimal scope.

**Tech Stack:** React, TypeScript, Vitest, CSS

---

### Task 1: Lock the inline title behavior with tests

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.test.tsx`

**Step 1: Write the failing test**

- Assert the header title is an input with `aria-label="标题"`.
- Assert the writer surface no longer contains a second title input section.
- Assert the body editor still exists in the writer surface.

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- src/components/DocumentEditor.test.tsx`

Expected: FAIL because the header title is still static text or the duplicate writer title block still exists.

### Task 2: Implement inline title editing

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Write minimal implementation**

- Replace the static `document-editor-title` heading with an input bound to `draft.title`.
- Remove the separate writer title block.
- Keep the Markdown body editor in the writer surface.
- Adjust CSS so the header title input looks like the primary document title.

**Step 2: Run targeted test**

Run: `cd apps/desktop && npm test -- src/components/DocumentEditor.test.tsx`

Expected: PASS

### Task 3: Verify the desktop app still builds

**Files:**
- Modify: `docs/plans/2026-03-14-desktop-inline-title-design.md`
- Modify: `docs/plans/2026-03-14-desktop-inline-title-implementation.md`

**Step 1: Run full verification**

Run:

- `cd apps/desktop && npm test`
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- `cd apps/desktop && npm run build`
- `git diff --check`

Expected: all commands exit successfully.

**Step 2: Commit**

```bash
git add apps/desktop/src/components/DocumentEditor.tsx \
  apps/desktop/src/components/DocumentEditor.test.tsx \
  apps/desktop/src/styles.css \
  docs/plans/2026-03-14-desktop-inline-title-design.md \
  docs/plans/2026-03-14-desktop-inline-title-implementation.md
git commit -m "feat: inline desktop document title editing"
git push
```
