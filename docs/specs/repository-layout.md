# Current Repository Layout

This document describes the active source layout of the tooling repository after the multi-language reorganization completed on 2026-03-11.

The managed knowledge repository created or operated by `kg` is separate from this tooling repository. If `--repo` is omitted, the current CLI implementations default to `~/.knowledge-galax`.

`kg` 创建或操作的知识仓库与这个工具仓库是分开的。如果省略 `--repo`，当前 CLI 实现会默认使用 `~/.knowledge-galax`。

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
- `tests/` stores repository-level verification, including Python unit tests plus Go and Rust behavior tests run from the repository root.
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

## Default Managed Repository

All three CLI implementations support omitting `--repo`.

When omitted, they resolve the managed content repository to:

```text
~/.knowledge-galax
```

and create the base layout on demand for write operations.

在写入类操作中，如果目标仓库不存在，CLI 会按需创建基础目录结构。

## Historical Documents

Some files under `docs/plans/` describe earlier repository states and therefore mention paths like `scripts/kg`, `cmd/kg`, `internal/kg`, or `packages/rust`.

Treat those references as historical context unless a document explicitly says it reflects the current layout.

For governance rules on current vs historical documents, see `docs/specs/documentation-governance.md`.

关于当前文档与历史文档的治理规则，请参考 `docs/specs/documentation-governance.md`。
