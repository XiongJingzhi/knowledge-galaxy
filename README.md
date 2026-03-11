# Knowledge Galaxy / 知识星系

Knowledge Galaxy is a multi-implementation `kg` CLI repository.

Knowledge Galaxy 是一个包含多种实现版本的 `kg` CLI 仓库。

This repository keeps Python, Go, and Rust implementations side by side under `implementations/`, while shared docs, templates, tests, and developer tooling stay at the repository root.

这个仓库将 Python、Go、Rust 三种实现统一放在 `implementations/` 目录下，文档、模板、测试和开发辅助文件保留在仓库根目录。

## Repository Layout / 仓库结构

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

The root `Makefile` provides aggregate build and verification commands for all implementations.

根目录的 `Makefile` 为所有实现提供统一的构建和验证入口。

Current layout and entrypoint details also live in `docs/specs/repository-layout.md`.

当前目录结构和入口说明也记录在 `docs/specs/repository-layout.md`。

## Requirements / 环境要求

- Python 3
- Go
- Rust/Cargo

## Project Status / 项目状态

- `implementations/python/kg`: the main validated CLI path today, and the repository's automated tests are centered on this implementation
- `implementations/go/kg`: an alternative Go implementation with a build entrypoint under `cmd/kg`
- `implementations/rust/kg`: an alternative Rust implementation with its own Cargo crate

- `implementations/python/kg`：当前主要验证路径，仓库里的自动化测试主要围绕这套实现展开
- `implementations/go/kg`：Go 版本实现，构建入口位于 `cmd/kg`
- `implementations/rust/kg`：Rust 版本实现，使用独立的 Cargo crate

Shared assets used by the implementations:

各实现共同使用的仓库级资源包括：

- `templates/` for generated document templates
- `tests/` for repository-level Python verification
- `docs/` for specs, plans, and task records

- `templates/`：文档生成模板
- `tests/`：仓库级 Python 验证
- `docs/`：规格、计划和任务文档

## Run And Verify / 运行与验证

Use the root targets below to run repository-level verification.

可以使用下面这些根级命令执行仓库级验证。

```bash
make test
make test-python
make test-go
make test-rust
```

## Build Entrypoints / 构建入口

Use the root `Makefile` to build the Go and Rust binaries.

可以通过根目录 `Makefile` 构建 Go 和 Rust 二进制文件。

```bash
make build-go
make build-rust
make build-go-cross
make build-rust-cross
```

Cross-platform build outputs are written under `dist/`.

跨平台构建产物会输出到 `dist/` 目录。

Direct implementation entrypoints:

各实现的直接入口如下：

```bash
python3 -m implementations.python.kg --help
cd implementations/go/kg && go build ./cmd/kg
cd implementations/rust/kg && cargo build
```

## Implementation Notes / 实现说明

- Python is the only implementation currently covered by the repository's end-to-end unit tests.
- Go and Rust are kept in-tree as parallel CLI implementations and can be built independently from their language-specific roots.
- Go and Rust can also be built for multiple target platforms from the root `Makefile`.
- `--repo <path>` is required for CLI operations. This repository contains tooling code, tests, templates, and docs, not the managed knowledge content itself.

- 当前只有 Python 实现被仓库内的端到端单元测试完整覆盖。
- Go 和 Rust 作为并行 CLI 实现保留在仓库中，可以从各自语言目录独立构建。
- Go 和 Rust 也可以通过根目录 `Makefile` 构建多平台目标产物。
- CLI 操作要求传入 `--repo <path>`。这个仓库本身只保存工具代码、测试、模板和文档，不保存被管理的知识内容。

## Python CLI Usage / Python CLI 用法

The Python implementation is still the best documented operational path and serves as the reference implementation for the examples below.

Python 实现仍然是当前文档最完整、最适合作为参考的运行路径，下面的示例都以它为准。

### Create Documents / 创建文档

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create note --title "Test Note"
python3 -m implementations.python.kg --repo /path/to/content-repo create daily --date 2026-03-11
python3 -m implementations.python.kg --repo /path/to/content-repo create decision --title "Choose SQLite"
python3 -m implementations.python.kg --repo /path/to/content-repo create review --title "Weekly Review" --date 2026-03-11
python3 -m implementations.python.kg --repo /path/to/content-repo create project --title "Atlas" --git-worktree ~/src/atlas
```

Each command prints the created relative path.

每条命令都会输出创建后的相对路径。

`create project` only accepts an already existing local git working directory. The CLI still does not clone repositories or merge/pull changes, but it can manage remotes and run project-scoped `fetch`, `push`, and `sync`.

`create project` 只接受已经存在的本地 git 工作目录。CLI 目前仍不会自动 clone 仓库，也不会执行 merge/pull，但已经可以管理远端并执行项目级的 `fetch`、`push` 和 `sync`。

### Operate Project Repositories / 操作项目仓库

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo project add-remote --project atlas --name origin --url git@github.com:org/atlas.git
python3 -m implementations.python.kg --repo /path/to/content-repo project fetch --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project push --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project sync --project atlas --remote origin
```

These commands resolve the project's `git_worktree` from `projects/<slug>/README.md` and run the matching git operation against that external repository.

这些命令会从 `projects/<slug>/README.md` 读取项目的 `git_worktree`，然后对对应的外部仓库执行匹配的 git 操作。

### Validate Repository Content / 校验仓库内容

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo validate
```

The command prints `OK` when the repository is valid. Validation errors are printed one per line and the command exits non-zero.

如果仓库有效，这条命令会输出 `OK`。如果校验失败，会逐行打印错误，并以非零状态码退出。

### Query The Repository / 查询仓库

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo list
python3 -m implementations.python.kg --repo /path/to/content-repo list --type note
python3 -m implementations.python.kg --repo /path/to/content-repo search idea
python3 -m implementations.python.kg --repo /path/to/content-repo stats
```

`list`, `search`, and `stats` rebuild the SQLite index under the specified `--repo` path.

`list`、`search` 和 `stats` 会在指定的 `--repo` 路径下重建 SQLite 索引。

## Go And Rust Usage / Go 与 Rust 用法

At the repository level, Go and Rust are currently documented mainly as implementation roots and build targets.

在仓库级 README 中，Go 和 Rust 当前主要作为实现目录和构建目标来说明。

```bash
cd implementations/go/kg && go build ./cmd/kg
cd implementations/rust/kg && cargo build
```

If you need language-specific runtime guidance, it is better to add local READMEs under the implementation roots instead of overloading the repository root README.

如果需要 Go 或 Rust 的运行时说明，更适合在各自实现目录下增加本地 README，而不是继续把根 README 写得过重。

## Documentation Notes / 文档说明

- `docs/specs/repository-layout.md` describes the current repository layout and canonical entrypoints.
- Historical files under `docs/plans/` may mention the pre-2026-03-11 layout such as `scripts/kg` or `packages/rust`. Treat those as change history, not current usage docs.

- `docs/specs/repository-layout.md` 描述当前仓库结构和标准入口。
- `docs/plans/` 下的历史文件可能仍会提到 2026-03-11 之前的目录布局，例如 `scripts/kg` 或 `packages/rust`。这些内容应视为历史变更记录，而不是当前使用说明。

## Skill Distribution / Skill 分发

This repository includes a distributable agent skill at `skills/knowledge-galaxy-cli/SKILL.md`.

这个仓库还包含一份可分发的 agent skill，位置在 `skills/knowledge-galaxy-cli/SKILL.md`。

If you want to install it into another agent environment, see:

如果你想把它安装到别人的 agent 环境里，请查看：

- `skills/knowledge-galaxy-cli/INSTALL.md`
