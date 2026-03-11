# Knowledge Galaxy CLI MVP

Knowledge Galaxy is a multi-implementation `kg` CLI repository. It currently keeps Python, Go, and Rust implementations side by side under `implementations/`, while shared docs, templates, tests, and developer tooling stay at the repository root.

## Repository Layout

```text
implementations/
  go/kg
  python/kg
  rust/kg
docs/
templates/
tests/
Makefile
```

The Python CLI remains the most complete end-to-end interface. The root `Makefile` exposes aggregate build and verification commands for all implementations.

Current layout and entrypoint details also live in `docs/specs/repository-layout.md`.

## Requirements

- Python 3
- No third-party dependencies

## Run The CLI

```bash
python3 -m implementations.python.kg --help
make test-python
make test-go
make test-rust
```

## Build Entrypoints

```bash
make build-go
make build-rust
make test
```

Direct implementation entrypoints:

```bash
python3 -m implementations.python.kg --help
cd implementations/go/kg && go build ./cmd/kg
cd implementations/rust/kg && cargo build
```

Note: `--repo <path>` is REQUIRED. The CLI only operates on an external repository path. This repository contains only tooling code, tests, templates, and docs.

## Create Documents

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create note --title "Test Note"
python3 -m implementations.python.kg --repo /path/to/content-repo create daily --date 2026-03-11
python3 -m implementations.python.kg --repo /path/to/content-repo create decision --title "Choose SQLite"
python3 -m implementations.python.kg --repo /path/to/content-repo create review --title "Weekly Review" --date 2026-03-11
python3 -m implementations.python.kg --repo /path/to/content-repo create project --title "Atlas" --git-worktree ~/src/atlas
```

Each command prints the created relative path.

`create project` only accepts an already existing local git working directory. The CLI still does not clone repositories or merge/pull changes, but it can manage remotes and run project-scoped `fetch`, `push`, and `sync`.

## Operate Project Repositories

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo project add-remote --project atlas --name origin --url git@github.com:org/atlas.git
python3 -m implementations.python.kg --repo /path/to/content-repo project fetch --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project push --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project sync --project atlas --remote origin
```

These commands resolve the project's `git_worktree` from `projects/<slug>/README.md` and run the matching git operation against that external repository.

## Validate Repository Content

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo validate
```

The command prints `OK` when the repository is valid. Validation errors are printed one per line and the command exits non-zero.

## Query The Repository

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo list
python3 -m implementations.python.kg --repo /path/to/content-repo list --type note
python3 -m implementations.python.kg --repo /path/to/content-repo search idea
python3 -m implementations.python.kg --repo /path/to/content-repo stats
```

`list`, `search`, and `stats` rebuild the SQLite index under the specified `--repo` path.

## Documentation Notes

- `docs/specs/repository-layout.md` describes the current repository layout and canonical entrypoints.
- Historical files under `docs/plans/` may mention the pre-2026-03-11 layout such as `scripts/kg` or `packages/rust`. Treat those as change history, not current usage docs.
