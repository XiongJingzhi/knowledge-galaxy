# Current Repository Layout

This document describes the active source layout after the multi-language reorganization completed on 2026-03-11.

## Top-Level Structure

```text
implementations/
  go/kg
  python/kg
  rust/kg
docs/
  plans/
  requirements/
  specs/
  tasks/
scripts/
  dev/
templates/
tests/
Makefile
README.md
```

## Implementation Roots

- `implementations/python/kg` is the Python `kg` CLI package and the canonical `python3 -m ...` entrypoint.
- `implementations/go/kg` is the Go implementation root. It contains the Go module and `cmd/kg`.
- `implementations/rust/kg` is the Rust crate root.

## Shared Repository Assets

- `docs/` stores specs, plans, requirements, and task lists.
- `templates/` stores shared Markdown templates used by the CLIs.
- `tests/` stores repository-level Python tests.
- `scripts/dev/` is reserved for repository-level helper scripts only.
- `bin/` is a local build-output directory and is ignored by Git.

## Canonical Commands

### Python

```bash
python3 -m implementations.python.kg --help
```

### Go

```bash
cd implementations/go/kg && go build ./cmd/kg
```

### Rust

```bash
cd implementations/rust/kg && cargo build
```

### Aggregate Verification

```bash
make test
```

## Historical Documents

Some files under `docs/plans/` describe earlier repository states and therefore mention paths like `scripts/kg`, `cmd/kg`, `internal/kg`, or `packages/rust`.

Treat those references as historical context unless a document explicitly says it reflects the current layout.
