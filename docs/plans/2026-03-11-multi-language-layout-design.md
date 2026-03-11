# Multi-Language Layout Design

**Date:** 2026-03-11

## Goal

Restructure the repository so the Python, Go, and Rust `kg` CLI implementations are grouped by language, while preserving all existing implementations and keeping the repository-level developer experience coherent.

## Current Problem

The repository currently mixes language implementations and repository-level assets at the top level:

- Python implementation under `scripts/kg`
- Go implementation split across `cmd/kg` and `internal/kg`
- Rust implementation under `packages/rust`
- Shared docs, templates, tests, and helper files at the root

This makes the top-level structure read like several partially overlapping projects rather than one repository containing multiple implementations of the same tool.

## Decision

Adopt a language-first source layout:

```text
.
├── implementations/
│   ├── python/
│   │   └── kg/
│   ├── go/
│   │   └── kg/
│   └── rust/
│       └── kg/
├── docs/
├── scripts/
│   └── dev/
├── templates/
├── tests/
├── Makefile
├── README.md
└── .gitignore
```

## Layout Rules

### Implementations

- `implementations/python/kg` contains the Python CLI source and Python-specific support files.
- `implementations/go/kg` contains the Go CLI source, including what is currently split between `cmd/kg` and `internal/kg`.
- `implementations/rust/kg` contains the Rust CLI source and Rust-specific build files.
- Each implementation keeps its own build metadata and language-specific layout inside its language folder.

### Repository-Level Directories

- `docs/` remains the home for plans, requirements, specs, and tasks.
- `templates/` remains shared because it is repository content rather than implementation code.
- `tests/` remains the repository-level aggregation point. Language-specific tests may also exist within each implementation when required by the toolchain.
- `scripts/` is reserved for repository-level helper scripts only. It must no longer contain the primary Python implementation.

### Outputs And Generated Artifacts

- `bin/` should not remain a source directory. If it is only used for generated binaries or temporary outputs, it should be removed from the tracked layout and covered by `.gitignore` if still needed locally.
- Generated caches and build outputs must stay out of the conceptual source tree.

## Migration Mapping

- `scripts/kg` -> `implementations/python/kg`
- `cmd/kg` -> `implementations/go/kg/cmd/kg` or an equivalent Go-idiomatic sublayout under the new Go root
- `internal/kg` -> `implementations/go/kg/internal/kg`
- `packages/rust` -> `implementations/rust/kg`

The exact sublayout inside each language root should remain idiomatic for that language. The top-level organization is what becomes uniform.

## Compatibility Strategy

Repository-level interfaces must keep working after the move:

- Update `Makefile` to expose stable root commands for build and test workflows.
- Update README commands and path references to point at the new locations.
- Preserve a thin compatibility layer only where it meaningfully reduces migration pain.
- Avoid keeping duplicate source trees or long-term transitional structure.

For Python specifically, module execution paths will need to change because `python3 -m scripts.kg` will no longer be the canonical entry point.

## Implementation Boundaries

This effort includes:

- Moving source directories
- Repairing import paths and build/test entry points
- Updating root-level tooling and docs
- Cleaning obsolete path references and source-layout leftovers

This effort does not include:

- Rewriting CLI behavior
- Merging implementations
- Choosing a single “primary” language
- Opportunistic feature changes outside what is required by the move

## Risks

### Python Module Entry

The Python implementation currently relies on a root-level module path. This is the most likely place for execution breakage after the move and should be validated explicitly.

### Go Internal Package Boundaries

Go `internal/` visibility rules depend on directory structure. The move must preserve valid module boundaries and import behavior.

### Documentation Drift

README, Makefile targets, and any inline help or tests that reference old paths can easily lag behind the source move. A repository-wide search for stale paths is required before completion.

## Execution Order

1. Create the new `implementations/` layout and move each language implementation into place without intentionally changing behavior.
2. Repair language-specific entry points, imports, and build/test commands.
3. Update repository-level tooling such as `Makefile`, README, and helper scripts.
4. Remove obsolete tracked layout artifacts and verify no stale path references remain.
5. Run validation for Python, Go, Rust, and the root-level aggregate commands.

## Success Criteria

- The repository root clearly separates shared assets from language-specific implementations.
- Python, Go, and Rust implementations all remain present and independently runnable.
- Root-level developer workflows still exist and point to the new implementation locations.
- Documentation describes the repository as a multi-implementation tool repository instead of implying one mixed layout.
