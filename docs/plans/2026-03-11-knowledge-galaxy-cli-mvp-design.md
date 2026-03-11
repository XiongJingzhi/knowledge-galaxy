# Knowledge Galaxy CLI MVP Design

> Historical note: this document reflects the repository layout before 2026-03-11. Current implementation paths live under `implementations/python/kg`, `implementations/go/kg`, and `implementations/rust/kg`.

**Date:** 2026-03-11

## Goal

Define the MVP implementation for the `kg` command so Knowledge Galaxy can create documents from templates, validate repository structure, and provide basic list, search, and stats queries.

## Scope

This MVP includes:

- Python CLI implementation
- create commands for `daily`, `note`, `decision`, and `review`
- repository validation for frontmatter, path, slug, type, and duplicate id
- SQLite-backed indexing for repository documents
- `list`, `search`, and `stats` commands

This MVP does not include:

- asset import
- clipboard capture
- stdin capture
- export commands
- incremental index synchronization
- rich semantic search

## Runtime Choice

Use Python with the standard library as the default approach.

Main modules:

- `argparse` for the CLI
- `pathlib` for file operations
- `sqlite3` for the derived index
- `uuid` and `datetime` for identifiers and timestamps
- `json` for storing list-like metadata fields in SQLite
- `unittest` for tests

No third-party dependency is required for the MVP.

## Repository Layout

Add a Python package under `scripts/kg/`:

```text
scripts/
  kg/
    __init__.py
    __main__.py
    app.py
    commands/
    core/
```

Tests live under:

```text
tests/
  test_cli_create.py
  test_cli_validate.py
  test_cli_query.py
  helpers.py
```

The SQLite index remains derived data under:

`indexes/knowledge-galaxy.db`

## Command Surface

The MVP command surface is:

- `kg create daily`
- `kg create note --title <title>`
- `kg create decision --title <title>`
- `kg create review --title <title>`
- `kg validate`
- `kg list`
- `kg search <query>`
- `kg stats`

The command should also support a repository override for testing:

- `--repo <path>`

## Create Flow

`create` loads the matching file from `templates/`, fills placeholders, computes the target path, and writes the new document.

Rules:

- `daily` defaults to the current date unless `--date YYYY-MM-DD` is provided
- `note`, `decision`, and `review` require `--title`
- `slug` is derived from the title for non-daily types
- `id` is a generated stable UUID string
- `created_at` and `updated_at` are current UTC timestamps
- file creation fails if the target file already exists

## Validation Flow

`validate` scans repository Markdown content and checks:

- frontmatter exists
- required fields exist
- `type` is supported
- file path matches type mapping
- `slug` matches the file or directory slug
- `date` exists for `daily`
- `status` is in the controlled vocabulary
- duplicate `id` values are reported

The validator returns a non-zero exit code if any issue exists.

## Indexing And Query Flow

Every query command first rebuilds the SQLite index from repository Markdown files.

This avoids incremental-sync complexity while the corpus is small.

Index contents:

- path
- id
- type
- title
- slug
- status
- date
- theme
- project
- tags
- source
- summary
- body
- created_at
- updated_at

`list` supports filtering by:

- `--type`
- `--status`
- `--tag`
- `--theme`
- `--project`

`search` performs case-insensitive text matching against:

- title
- summary
- body

`stats` returns:

- total document count
- counts by type
- counts by status

## Frontmatter Parsing

The MVP uses a narrow frontmatter parser implemented in-repo rather than a YAML dependency.

Supported value shapes:

- unquoted scalar strings
- empty strings in double quotes
- empty lists
- inline string lists such as `["a", "b"]`

This is sufficient for the shipped templates and the documents produced by the MVP CLI.

## Output Rules

Output should be short and scriptable:

- `create` prints the created path
- `validate` prints `OK` or one error per line
- `list` prints one tab-separated row per document
- `search` prints one tab-separated row per match
- `stats` prints simple key-value lines

## Error Handling

Use structured command errors with short messages.

Typical failures:

- unsupported command type
- missing required arguments
- invalid date format
- target file already exists
- invalid repository path
- validation errors in repository documents

## Testing Strategy

Use `unittest` with temporary repository fixtures.

Cover:

- create command path generation and placeholder substitution
- validate command success and common failure modes
- list filtering
- search matching
- stats counts

The tests should invoke the CLI entrypoint in-process for speed and determinism.
