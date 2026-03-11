# Knowledge Galaxy 1.0 Template Design

**Date:** 2026-03-11

## Goal

Define the Phase 2 document template system for Knowledge Galaxy 1.0 so the repository can support consistent document creation before CLI implementation begins.

## Context

Knowledge Galaxy 1.0 already defines:

- product boundaries in `docs/requirements/knowledge-galaxy-1.0.md`
- repository and metadata rules in `docs/specs/knowledge-galaxy-1.0-spec.md`
- Phase 2 template work in `docs/tasks/knowledge-galaxy-1.0-tasks.md`

The missing piece is a concrete template layer that turns the spec into reusable Markdown files for manual authoring and future `kg create` commands.

## Design Decision

Use a minimal template system.

This means:

- every supported document type gets one Markdown template file
- templates share the same core frontmatter shape
- only type-specific fields are added where they are necessary
- body sections stay intentionally small

This is preferred over heavier templates because 1.0 is still storage-first. The project needs stable document creation rules before it needs rich authoring workflows.

## Alternatives Considered

### Option 1: Unified Minimal Templates

Each document type has a separate file, but the structure is mostly shared.

Pros:

- easiest CLI generation path
- simplest validation rules
- low maintenance cost

Cons:

- weaker semantic guidance inside the document body

### Option 2: Type-Specific Rich Templates

Each document type has its own detailed sections and stronger writing guidance.

Pros:

- clearer human semantics
- better structure for certain document types such as `decision` and `review`

Cons:

- more branching in CLI generation
- higher chance of premature overdesign

### Option 3: Composable Template Fragments

A shared base template is combined with type fragments.

Pros:

- good reuse
- good extensibility

Cons:

- more moving parts
- unnecessary complexity for 1.0

## Recommendation

Adopt Option 1.

It best matches the current repository maturity and the existing 1.0 principles:

- Git is the source of truth
- documents are the unit of storage
- the index is derived data
- CLI should remain simple and scriptable

## Template Location

Add a dedicated top-level directory:

```text
templates/
  daily.md
  note.md
  decision.md
  review.md
  reference.md
  theme.md
  project.md
```

This keeps templates outside `docs/` because they are operational assets, not planning documents.

## Shared Template Rules

All templates should:

- use UTF-8 Markdown
- begin with YAML frontmatter
- preserve the field order for predictable diffs
- use placeholder values that a CLI or human can replace directly
- include only minimal body headings

The shared frontmatter field order should be:

1. `id`
2. `type`
3. `title`
4. `slug`
5. `created_at`
6. `updated_at`
7. `status`

Optional fields appear after the shared core, only when relevant to that template.

## Placeholder Convention

Templates should use explicit placeholder tokens so later automation is unambiguous.

Recommended tokens:

- `<id>`
- `<title>`
- `<slug>`
- `<created_at>`
- `<updated_at>`
- `<date>`

List-like optional fields should default to empty lists instead of omitted placeholders where helpful for consistency:

- `tags: []`

Reference-like optional fields may be empty strings when singular:

- `summary: ""`

## Template Definitions

### `daily`

Path target:

`dailies/YYYY/MM/DD.md`

Frontmatter:

- shared core fields
- `date`
- `tags`
- `summary`

Body:

- `## Notes`
- `## Decisions`
- `## Next`

### `note`

Path target:

`notes/<slug>.md`

Frontmatter:

- shared core fields
- `theme`
- `project`
- `tags`
- `summary`

Body:

- `## Summary`
- `## Details`

### `decision`

Path target:

`decisions/<slug>.md`

Frontmatter:

- shared core fields
- `theme`
- `project`
- `tags`
- `summary`

Body:

- `## Context`
- `## Decision`
- `## Consequences`

### `review`

Path target:

`reviews/<slug>.md`

Frontmatter:

- shared core fields
- `date`
- `theme`
- `project`
- `tags`
- `summary`

Body:

- `## What Happened`
- `## What Worked`
- `## What To Change`

### `reference`

Path target:

`references/<slug>.md`

Frontmatter:

- shared core fields
- `source`
- `theme`
- `project`
- `tags`
- `summary`

Body:

- `## Source`
- `## Notes`

### `theme`

Path target:

`themes/<slug>.md`

Frontmatter:

- shared core fields
- `tags`
- `summary`

Body:

- `## Scope`
- `## Key Questions`

### `project`

Path target:

`projects/<slug>/README.md`

Frontmatter:

- shared core fields
- `theme`
- `tags`
- `summary`

Body:

- `## Goal`
- `## Status`
- `## Notes`

## CLI Compatibility Rules

The template format should support a future `kg` implementation that:

- loads the template by type
- replaces placeholders with generated values
- writes the document to the spec-defined path
- leaves optional body content for the user to fill in

This implies:

- no conditional sections inside templates
- no template engine dependency in 1.0
- placeholders must be plain text tokens

## Validation Implications

The template system should make validation easier, not harder.

Expected validation rules derived from these templates:

- `type` matches the selected template
- file path matches the type-to-directory mapping
- `slug` matches the file or directory name
- `project` and `theme` references point to valid repository targets
- `date` is present for `daily`

`review` may include `date`, but this is not required to block initial template rollout if the validator is introduced later.

## Testing Strategy

Phase 2 should focus on file-level confidence:

- verify every template file exists
- verify frontmatter is present and parseable
- verify field order and required fields remain stable
- verify placeholder tokens are consistent across templates

Behavioral tests for CLI substitution belong to the later CLI phase.

## Out Of Scope

This design does not add:

- a template rendering engine
- dynamic includes or fragments
- localization
- rich editorial guidance
- sample knowledge documents in content directories

## Success Criteria

Phase 2 is successful when:

- each supported document type has a stable template file
- the templates are directly usable by a person editing Markdown
- the templates are simple for a future `kg create` command to consume
- the structure remains aligned with the 1.0 spec
