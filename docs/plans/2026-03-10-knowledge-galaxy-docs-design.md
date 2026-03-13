# Knowledge Galaxy 1.0 Docs And Skeleton Design

> 历史文档状态：本文记录 2026-03-10 的设计阶段，不直接代表当前仓库状态。
> 当前权威文档：`README.md`、`docs/specs/repository-layout.md`、`docs/specs/knowledge-galaxy-1.0-spec.md`、`docs/tasks/knowledge-galaxy-1.0-tasks.md`
> 当前实现根目录：`implementations/python/kg`、`implementations/go/kg`、`implementations/rust/kg`
> 如果正文提到旧路径、旧命令或未完成实现，请优先以当前权威文档为准。

**Date:** 2026-03-10

## Goal

Create the initial documentation set and repository skeleton for Knowledge Galaxy 1.0 without implementing the CLI, SQLite indexer, or runtime behaviors.

## Scope

This design covers four deliverables:

1. A formal requirements document derived from the provided product brief.
2. A technical spec that translates the product brief into repository and data structure rules.
3. A checkbox task list that sequences future implementation work while marking only the current documentation and skeleton work as in scope for execution.
4. A visible repository skeleton matching the 1.0 information architecture.

## Non-Goals

- No `kg` CLI implementation.
- No SQLite schema or index sync code.
- No runtime validation scripts.
- No sample knowledge documents beyond minimal placeholders needed to preserve structure.

## Deliverables

### Requirements

Path: `docs/requirements/knowledge-galaxy-1.0.md`

This document should preserve the product language and intent:

- product vision
- system boundary
- three-layer architecture
- design principles
- core concepts
- document model
- directory model
- CLI scope
- lifecycle
- success criteria

### Spec

Path: `docs/specs/knowledge-galaxy-1.0-spec.md`

This document should convert the product brief into implementation-ready rules:

- repository tree
- document type taxonomy
- frontmatter schema
- naming and path conventions
- tag and status constraints
- indexing scope
- CLI 1.0 command surface
- explicit non-goals

### Tasks

Path: `docs/tasks/knowledge-galaxy-1.0-tasks.md`

This document should contain staged checkbox tasks:

- foundation docs and skeleton
- templates
- CLI scaffolding
- indexing
- validation
- tests and polish

Only the foundation stage is executed in this round.

### Repository Skeleton

Create the 1.0 top-level structure:

- `docs/`
- `dailies/`
- `notes/`
- `decisions/`
- `reviews/`
- `references/`
- `themes/`
- `projects/`
- `assets/`
- `inbox/`
- `indexes/`
- `scripts/`

Use minimal placeholder files so the structure is visible in git.

## Approach

Keep the first pass deliberately stable and simple:

- prefer prose over premature schema complexity
- document future implementation boundaries clearly
- avoid fake completeness by leaving unimplemented features as planned work
- preserve the repository structure expected by downstream AI tooling

## Validation

Before claiming completion:

- verify all planned files exist
- verify the directory skeleton exists
- inspect resulting tree output
