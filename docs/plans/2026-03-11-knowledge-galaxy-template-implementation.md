# Knowledge Galaxy Template Implementation Plan

> 历史文档状态：本文记录 2026-03-11 的模板实施计划，不直接代表当前仓库状态。
> 当前权威文档：`README.md`、`docs/specs/knowledge-galaxy-template-rules.md`、`docs/specs/knowledge-galaxy-1.0-spec.md`
> 当前实现根目录：`implementations/python/kg`、`implementations/go/kg`、`implementations/rust/kg`
> 如果正文与当前模板文件或当前 spec 不一致，请以当前模板文件和 spec 为准。

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the Phase 2 template system for all supported Knowledge Galaxy 1.0 document types, plus the minimum spec and task updates needed to make the templates official.

**Architecture:** The work stays storage-first. Templates are plain Markdown files under a new top-level `templates/` directory, each using stable YAML frontmatter and minimal body sections. No rendering engine is introduced; future CLI work will perform direct placeholder substitution against these files.

**Tech Stack:** Markdown, YAML frontmatter, Git repository structure

---

### Task 1: Create the templates directory

**Files:**
- Create: `templates/.gitkeep`

**Step 1: Add the directory placeholder**

Create `templates/.gitkeep` so the new operational directory is visible in Git before template content is added.

**Step 2: Verify it exists**

Run: `find templates -maxdepth 1 -type f | sort`
Expected: `templates/.gitkeep`

**Step 3: Commit**

```bash
git add templates/.gitkeep
git commit -m "chore: add templates directory"
```

### Task 2: Update the technical spec to include templates

**Files:**
- Modify: `docs/specs/knowledge-galaxy-1.0-spec.md`

**Step 1: Add `templates/` to the repository layout**

Update the repository tree and directory rules so `templates/` is an official top-level directory.

**Step 2: Add a template rules section**

Document:

- one template file per supported type
- template filenames
- plain-text placeholder approach
- minimal body section expectation

**Step 3: Review consistency**

Confirm the new template language does not conflict with existing path, frontmatter, or CLI rules.

**Step 4: Verify the spec diff**

Run: `git diff -- docs/specs/knowledge-galaxy-1.0-spec.md`
Expected: shows `templates/` and template rules only

**Step 5: Commit**

```bash
git add docs/specs/knowledge-galaxy-1.0-spec.md
git commit -m "docs: add template rules to spec"
```

### Task 3: Update the task list to reflect Phase 2 execution detail

**Files:**
- Modify: `docs/tasks/knowledge-galaxy-1.0-tasks.md`

**Step 1: Refine the Phase 2 task wording**

Update Phase 2 so it explicitly references:

- the `templates/` directory
- one template per document type
- placeholder conventions

**Step 2: Keep future phases unchanged**

Do not re-scope CLI, indexing, validation, or testing work in this step.

**Step 3: Verify the diff**

Run: `git diff -- docs/tasks/knowledge-galaxy-1.0-tasks.md`
Expected: only Phase 2 wording changes

**Step 4: Commit**

```bash
git add docs/tasks/knowledge-galaxy-1.0-tasks.md
git commit -m "docs: refine phase 2 template tasks"
```

### Task 4: Create the `daily` and `note` templates

**Files:**
- Create: `templates/daily.md`
- Create: `templates/note.md`

**Step 1: Write `templates/daily.md`**

Use this content:

```md
---
id: <id>
type: daily
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
date: <date>
tags: []
summary: ""
---

## Notes

## Decisions

## Next
```

**Step 2: Write `templates/note.md`**

Use this content:

```md
---
id: <id>
type: note
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
theme: []
project: []
tags: []
summary: ""
---

## Summary

## Details
```

**Step 3: Verify file contents**

Run: `sed -n '1,120p' templates/daily.md && sed -n '1,120p' templates/note.md`
Expected: exact frontmatter order and headings match the plan

**Step 4: Commit**

```bash
git add templates/daily.md templates/note.md
git commit -m "feat: add daily and note templates"
```

### Task 5: Create the `decision` and `review` templates

**Files:**
- Create: `templates/decision.md`
- Create: `templates/review.md`

**Step 1: Write `templates/decision.md`**

Use this content:

```md
---
id: <id>
type: decision
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
theme: []
project: []
tags: []
summary: ""
---

## Context

## Decision

## Consequences
```

**Step 2: Write `templates/review.md`**

Use this content:

```md
---
id: <id>
type: review
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
date: <date>
theme: []
project: []
tags: []
summary: ""
---

## What Happened

## What Worked

## What To Change
```

**Step 3: Verify file contents**

Run: `sed -n '1,120p' templates/decision.md && sed -n '1,140p' templates/review.md`
Expected: exact frontmatter order and headings match the plan

**Step 4: Commit**

```bash
git add templates/decision.md templates/review.md
git commit -m "feat: add decision and review templates"
```

### Task 6: Create the `reference`, `theme`, and `project` templates

**Files:**
- Create: `templates/reference.md`
- Create: `templates/theme.md`
- Create: `templates/project.md`

**Step 1: Write `templates/reference.md`**

Use this content:

```md
---
id: <id>
type: reference
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
source: []
theme: []
project: []
tags: []
summary: ""
---

## Source

## Notes
```

**Step 2: Write `templates/theme.md`**

Use this content:

```md
---
id: <id>
type: theme
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
tags: []
summary: ""
---

## Scope

## Key Questions
```

**Step 3: Write `templates/project.md`**

Use this content:

```md
---
id: <id>
type: project
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
theme: []
tags: []
summary: ""
---

## Goal

## Status

## Notes
```

**Step 4: Verify file contents**

Run: `sed -n '1,120p' templates/reference.md && sed -n '1,120p' templates/theme.md && sed -n '1,120p' templates/project.md`
Expected: exact frontmatter order and headings match the plan

**Step 5: Commit**

```bash
git add templates/reference.md templates/theme.md templates/project.md
git commit -m "feat: add reference theme and project templates"
```

### Task 7: Add repository-level documentation for template usage

**Files:**
- Create: `docs/specs/knowledge-galaxy-template-rules.md`

**Step 1: Write the template reference document**

Document:

- placeholder token meanings
- which optional fields appear in which templates
- why lists default to `[]`
- how future `kg create` commands should consume the files

**Step 2: Keep the document short**

This file should be an operational reference, not a second spec.

**Step 3: Verify readability**

Run: `sed -n '1,220p' docs/specs/knowledge-galaxy-template-rules.md`
Expected: concise and aligned with the design doc

**Step 4: Commit**

```bash
git add docs/specs/knowledge-galaxy-template-rules.md
git commit -m "docs: add template usage reference"
```

### Task 8: Verify the template set end-to-end

**Files:**
- Verify: `templates/daily.md`
- Verify: `templates/note.md`
- Verify: `templates/decision.md`
- Verify: `templates/review.md`
- Verify: `templates/reference.md`
- Verify: `templates/theme.md`
- Verify: `templates/project.md`
- Verify: `docs/specs/knowledge-galaxy-1.0-spec.md`
- Verify: `docs/tasks/knowledge-galaxy-1.0-tasks.md`
- Verify: `docs/specs/knowledge-galaxy-template-rules.md`

**Step 1: List template files**

Run: `find templates -maxdepth 1 -type f | sort`
Expected:

```text
templates/.gitkeep
templates/daily.md
templates/decision.md
templates/note.md
templates/project.md
templates/reference.md
templates/review.md
templates/theme.md
```

**Step 2: Review frontmatter blocks**

Run: `for f in templates/*.md; do echo "[$f]"; sed -n '1,20p' "$f"; done`
Expected: each template starts with YAML frontmatter and the correct `type`

**Step 3: Review repository status**

Run: `git status --short`
Expected: clean working tree after the final commit

**Step 4: Manual consistency check**

Confirm:

- `daily` and `review` are the only templates using `date`
- `reference` is the only template using `source`
- `project` maps to `projects/<slug>/README.md`
- body sections stay intentionally minimal

**Step 5: Final commit if needed**

```bash
git add templates docs/specs docs/tasks
git commit -m "feat: add knowledge galaxy document templates"
```
