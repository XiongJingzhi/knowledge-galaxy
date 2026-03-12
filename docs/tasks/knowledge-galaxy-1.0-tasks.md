# Knowledge Galaxy 1.0 Task List

## Execution Note

This task list now reflects the current repository state after the multi-language CLI, capture workflow, testing, and documentation work completed through March 12, 2026.

Only the still-missing 1.0 areas remain unchecked.

## Phase 1. Foundation Docs And Skeleton

- [x] Create the formal requirements document in `docs/requirements/knowledge-galaxy-1.0.md`
- [x] Create the technical spec in `docs/specs/knowledge-galaxy-1.0-spec.md`
- [x] Create the implementation task list in `docs/tasks/knowledge-galaxy-1.0-tasks.md`
- [x] Create the top-level repository skeleton for knowledge content, assets, indexes, and scripts
- [x] Add placeholder files so empty directories remain visible in Git

## Phase 2. Document Templates

- [x] Create a top-level `templates/` directory for reusable document templates (`templates/` with `.gitkeep`)
- [x] Provide one Markdown template per type: `daily`, `note`, `decision`, `review`, `reference`, `theme`, `project` (see `templates/*.md`)
- [x] Include required/optional frontmatter blocks in each template, following the spec field order
- [x] Standardize plain-text placeholders (`<id>`, `<title>`, `<slug>`, `<created_at>`, `<updated_at>`, `<date>`) for future `kg create` substitution

## Phase 3. CLI Foundation

- [x] Choose CLI runtime and packaging approach
- [x] Scaffold the `kg` command entrypoint
- [x] Implement create commands for `daily`, `note`, `decision`, and `review`
- [x] Implement capture commands for append, `stdin`, and clipboard workflows

## Phase 4. Asset Management

- [ ] Define shared asset import rules for copy, rename, and reference generation
- [ ] Implement a project-specific asset convention
- [ ] Add asset reference examples to the spec

## Phase 5. Indexing And Query

- [x] Define the SQLite schema for document metadata and full-text search
- [x] Implement repository-to-index synchronization
- [x] Implement `kg list`, `kg search`, and `kg stats`
- [ ] Define index rebuild and export behavior

## Phase 6. Validation

- [x] Implement frontmatter validation
- [x] Implement path and naming validation
- [x] Implement unique ID validation
- [ ] Implement reference and asset validation

## Phase 7. Testing And Release Readiness

- [x] Add tests for document creation rules
- [x] Add tests for query and validation flows
- [x] Add repository bootstrap documentation
- [x] Review naming consistency and remove unused structure
