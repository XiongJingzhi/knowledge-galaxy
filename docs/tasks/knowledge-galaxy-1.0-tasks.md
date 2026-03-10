# Knowledge Galaxy 1.0 Task List

## Execution Note

This round only executes the documentation and repository skeleton work.

The remaining tasks stay pending until explicit confirmation.

## Phase 1. Foundation Docs And Skeleton

- [x] Create the formal requirements document in `docs/requirements/knowledge-galaxy-1.0.md`
- [x] Create the technical spec in `docs/specs/knowledge-galaxy-1.0-spec.md`
- [x] Create the implementation task list in `docs/tasks/knowledge-galaxy-1.0-tasks.md`
- [x] Create the top-level repository skeleton for knowledge content, assets, indexes, and scripts
- [x] Add placeholder files so empty directories remain visible in Git

## Phase 2. Document Templates

- [ ] Define Markdown templates for `daily`, `note`, `decision`, `review`, `reference`, `theme`, and `project`
- [ ] Define required and optional frontmatter examples for each template
- [ ] Add sample template files under a dedicated template location

## Phase 3. CLI Foundation

- [ ] Choose CLI runtime and packaging approach
- [ ] Scaffold the `kg` command entrypoint
- [ ] Implement create commands for `daily`, `note`, `decision`, and `review`
- [ ] Implement capture commands for append, `stdin`, and clipboard workflows

## Phase 4. Asset Management

- [ ] Define shared asset import rules for copy, rename, and reference generation
- [ ] Implement a project-specific asset convention
- [ ] Add asset reference examples to the spec

## Phase 5. Indexing And Query

- [ ] Define the SQLite schema for document metadata and full-text search
- [ ] Implement repository-to-index synchronization
- [ ] Implement `kg list`, `kg search`, and `kg stats`
- [ ] Define index rebuild and export behavior

## Phase 6. Validation

- [ ] Implement frontmatter validation
- [ ] Implement path and naming validation
- [ ] Implement unique ID validation
- [ ] Implement reference and asset validation

## Phase 7. Testing And Release Readiness

- [ ] Add tests for document creation rules
- [ ] Add tests for query and validation flows
- [ ] Add repository bootstrap documentation
- [ ] Review naming consistency and remove unused structure
