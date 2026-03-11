# Knowledge Galaxy 1.0 Technical Specification

## 1. Scope

This specification defines the repository structure, document rules, metadata schema, and 1.0 operational boundary for Knowledge Galaxy.

Knowledge Galaxy 1.0 is a storage-first system. Markdown files in Git are the source of truth. Query and AI usage are downstream concerns built on top of this storage model.

## 2. Repository Layout

The repository root must contain:

```text
docs/
  plans/
  requirements/
  specs/
  tasks/
templates/
dailies/
notes/
decisions/
reviews/
references/
themes/
projects/
assets/
inbox/
indexes/
scripts/
```

### 2.1 Directory Rules

- `docs/` stores planning and product documentation.
- `templates/` stores reusable document templates for manual creation and future CLI generation.
- `dailies/` stores daily notes at `dailies/YYYY/MM/DD.md`.
- `notes/` stores standalone knowledge notes.
- `decisions/` stores decision records.
- `reviews/` stores retrospectives and reviews.
- `references/` stores curated external knowledge.
- `themes/` stores theme anchor documents.
- `projects/` stores one subdirectory per project.
- `assets/` stores shared binary or imported resources.
- `inbox/` stores uncategorized captured material.
- `indexes/` stores derived query artifacts such as SQLite databases or exports.
- `scripts/` stores repository automation and CLI entrypoints.

### 2.2 Placeholder Rule

Directories that may otherwise be empty should contain a `.gitkeep` file so the intended structure remains visible in Git.

## 3. Document Model

### 3.1 File Format

Knowledge documents use:

- UTF-8 Markdown body
- YAML frontmatter at the beginning of the file

### 3.2 Supported Types

1.0 supports these document types:

- `daily`
- `note`
- `thought`
- `decision`
- `review`
- `reference`
- `theme`
- `project`

### 3.3 Type To Directory Mapping

- `daily` -> `dailies/YYYY/MM/DD.md`
- `note` -> `notes/<slug>.md`
- `thought` -> `notes/<slug>.md`
- `decision` -> `decisions/<slug>.md`
- `review` -> `reviews/<slug>.md`
- `reference` -> `references/<slug>.md`
- `theme` -> `themes/<slug>.md`
- `project` -> `projects/<slug>/README.md`

## 4. Frontmatter Schema

### 4.1 Required Fields

Every knowledge document should support these core fields. Required status may differ by type in a later implementation, but 1.0 standardizes the field set now.

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Globally unique stable identifier |
| `type` | string | Must be one of supported document types |
| `title` | string | Human-readable title |
| `slug` | string | Lowercase kebab-case identifier |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |
| `status` | string | Must be one of supported statuses |

### 4.2 Optional Fields

| Field | Type | Rule |
| --- | --- | --- |
| `date` | string | ISO date, mainly for `daily` and time-based notes |
| `theme` | string or list | Theme slug or list of theme slugs |
| `project` | string or list | Project slug or list of project slugs |
| `tags` | list | Zero or more tag strings |
| `source` | string or list | External source reference |
| `summary` | string | Short abstract for AI and human scanning |

### 4.3 Controlled Vocabularies

Supported statuses:

- `inbox`
- `active`
- `evergreen`
- `archived`

### 4.4 Naming Rules

- `slug` must be lowercase kebab-case.
- `tags` must be lowercase kebab-case with no spaces.
- `theme` values should reference files in `themes/`.
- `project` values should reference directories in `projects/`.

## 5. Knowledge Structure Rules

### 5.1 Theme

Themes are long-lived domains and should remain low in number.

Each theme should have one anchor document in `themes/<slug>.md`.

### 5.2 Project

Projects represent action spaces.

Each project should use its own directory:

`projects/<project-slug>/`

The project root document should be:

`projects/<project-slug>/README.md`

### 5.3 Daily

Daily notes are the canonical time entry point and must use a date-derived path.

### 5.4 Note

Notes are the generic durable unit for standalone knowledge.

## 6. Indexing Boundary

Knowledge Galaxy 1.0 defines the index layer but does not treat it as the source of truth.

### 6.1 Source

The index layer is derived from Git-tracked Markdown files.

### 6.2 Storage

The local index implementation is SQLite.

### 6.3 Query Surface

The system should support filtering by:

- `theme`
- `project`
- `tag`
- `type`
- `status`
- `date`

The system should also support:

- full-text search over body content
- document counts
- theme distribution
- tag frequency

## 7. Template Rules

Knowledge Galaxy 1.0 uses plain Markdown templates as the document creation baseline.

### 7.1 Location

Templates live in:

`templates/`

### 7.2 Files

The template set should include:

- `templates/daily.md`
- `templates/note.md`
- `templates/decision.md`
- `templates/review.md`
- `templates/reference.md`
- `templates/theme.md`
- `templates/project.md`

### 7.3 Format

Each template should:

- begin with YAML frontmatter
- follow the shared field order from this specification
- use plain-text placeholder tokens
- include only minimal body headings

### 7.4 Placeholder Style

Recommended placeholder tokens include:

- `<id>`
- `<title>`
- `<slug>`
- `<created_at>`
- `<updated_at>`
- `<date>`

The 1.0 template layer does not require a template engine.

## 8. CLI 1.0 Boundary

The CLI executable name is `kg`.

The 1.0 command surface should cover:

- create `daily`
- create `note`
- create `decision`
- create `review`
- append to daily
- create note from `stdin`
- import from clipboard
- import assets
- `list`
- `search`
- `stats`
- validate frontmatter, path, id, and references
- export document list, change list, and manifest

CLI output should be short, parseable, and suitable for scripting.

## 9. Non-Goals

Knowledge Galaxy 1.0 does not implement:

- embeddings
- vectorization
- semantic retrieval
- chunking
- agent orchestration
- AI reasoning
- vector database integration

These concerns belong to downstream AI applications.

## 10. Success Conditions

The repository is successful when an external RAG or agent system can consume the Markdown corpus with predictable paths and metadata, then build its own retrieval or inference layer without needing proprietary preprocessing from Knowledge Galaxy.
