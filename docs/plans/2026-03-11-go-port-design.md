# Knowledge Galaxy Go Port Design

Date: 2026-03-11

Goal: Re-implement the Knowledge Galaxy CLI in Go while keeping the existing Python CLI and tests intact. Provide a clean directory structure, reproducible builds, and feature parity for create, validate, list, search, stats, and project git-remote operations.

Architecture:
- Keep Python package under `scripts/kg` (for current tests).
- Add a Go module at repo root with a `cmd/kg` entrypoint and internal packages for repository, frontmatter, templates, indexer, and git.
- The Go CLI reads/writes the same repository layout and templates, using a minimal in-process index (no third-party deps) to support list/search/stats.
- Optional delegation path: Python wrapper can call the Go binary if desired; default remains Python for tests.

Tech Stack:
- Go 1.25+ stdlib only (no external modules to avoid network fetch): `flag`, `os`, `path/filepath`, `time`, `encoding/json`, `regexp`, `os/exec`, `bufio`.

Commands:
- `kg create (note|daily|decision|review|project)`
- `kg validate`
- `kg list [--type <type>]`
- `kg search <query>`
- `kg stats`
- `kg project (add-remote|fetch|push|sync)`

Testing:
- Keep existing Python unit tests unchanged (they validate repo behavior).
- Add `Makefile` targets: `build` (Go), `test` (Python unittest), `all`.

Error Handling:
- Return non-zero exit and short error messages on invalid args, missing paths, git failures, or validation errors.

