# Knowledge Galaxy Template Rules

## Placeholder Tokens

The Phase 2 template set uses plain-text placeholder tokens:

- `<id>`: globally unique document identifier
- `<title>`: human-readable title
- `<slug>`: lowercase kebab-case identifier
- `<created_at>`: document creation timestamp in ISO 8601 format
- `<updated_at>`: latest document update timestamp in ISO 8601 format
- `<date>`: ISO date for time-based documents

## Optional Fields

Optional list-like fields default to empty lists:

- `theme: []`
- `project: []`
- `tags: []`
- `source: []`

Optional free-text fields default to empty strings:

- `summary: ""`

This keeps templates stable for manual editing and future CLI replacement.

## Template Coverage

The template set includes:

- `daily`
- `note`
- `decision`
- `review`
- `reference`
- `theme`
- `project`

## CLI Usage

Future `kg create` commands should:

1. load the matching file from `templates/`
2. replace placeholders with generated values
3. write the document to the spec-defined target path
4. leave the minimal body sections for later editing

No template engine is required for Knowledge Galaxy 1.0.
