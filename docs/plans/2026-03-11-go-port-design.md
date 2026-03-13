# Knowledge Galaxy Go Port Design

> 历史文档状态：本文记录 2026-03-11 的 Go 迁移设计，不直接代表当前仓库状态。
> 当前权威文档：`README.md`、`docs/specs/repository-layout.md`、`implementations/go/kg/README.md`
> 当前实现根目录：`implementations/python/kg`、`implementations/go/kg`、`implementations/rust/kg`
> 文中出现的 `scripts/kg`、仓库根 `cmd/kg`、`internal/*` 等布局说明应视为历史迁移背景。当前 Go 实现根目录是 `implementations/go/kg`。

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
