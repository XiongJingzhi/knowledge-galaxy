# Rust Implementation / Rust 实现

This directory contains the Rust implementation of the `kg` CLI.

这个目录包含 `kg` CLI 的 Rust 版本实现。

## Status / 状态

The Rust implementation is kept in-tree as an alternative implementation of the CLI. It builds successfully from this crate root and exposes the same top-level command surface as the other implementations: `create`, `validate`, `list`, `search`, `stats`, and `project`.

Rust 版本作为 CLI 的并行实现保留在仓库中。它目前可以从这个 crate 根目录成功构建，并暴露与其他实现相同的顶层命令集合：`create`、`validate`、`list`、`search`、`stats` 和 `project`。

The repository's automated end-to-end tests are not centered on this implementation. Python remains the primary validated path today.

仓库里的自动化端到端测试目前并不是围绕这套实现展开的。当前主要验证路径仍然是 Python 版本。

## Location / 目录位置

- Crate root: `implementations/rust/kg`
- Main entrypoint: `implementations/rust/kg/src/main.rs`
- Cargo manifest: `implementations/rust/kg/Cargo.toml`

- crate 根目录：`implementations/rust/kg`
- 主入口：`implementations/rust/kg/src/main.rs`
- Cargo 清单：`implementations/rust/kg/Cargo.toml`

## Build / 构建

From the repository root:

从仓库根目录执行：

```bash
make build-rust
make build-rust-cross
```

From the crate root:

从 crate 根目录执行：

```bash
cd implementations/rust/kg
cargo build
```

The root build target writes the release binary to `bin/kg-rs`.

根级构建命令会将 release 二进制文件输出到 `bin/kg-rs`。

The cross-platform build target writes named artifacts under `dist/rust/`. It requires the corresponding Rust targets and linker toolchains to be available on the build machine.

跨平台构建命令会把带平台名称的产物输出到 `dist/rust/`。执行这条命令时，构建机器需要已经安装对应的 Rust target 和链接工具链。

## Verification / 验证

From the repository root:

从仓库根目录执行：

```bash
make test-rust
```

This target currently performs a crate build check.

这个命令当前执行的是 crate 构建验证。

## Command Surface / 命令范围

The Rust implementation currently includes:

当前 Rust 实现包含：

- document creation commands under `create`
- repository validation
- repository listing, search, and stats
- project git operations under `project`

- `create` 下的文档创建命令
- 仓库校验
- 仓库的列表、搜索和统计
- `project` 下的项目 git 操作

Like the other implementations, CLI operations require `--repo <path>`.

和其他实现一样，CLI 操作要求传入 `--repo <path>`。

## Usage Examples / 使用示例

Build and run from the crate root:

在 crate 根目录中构建并运行：

```bash
cd implementations/rust/kg
cargo build
./target/debug/kg --repo /path/to/content-repo validate
```

Create documents:

创建文档：

```bash
./target/debug/kg --repo /path/to/content-repo create note --title "Test Note"
./target/debug/kg --repo /path/to/content-repo create daily --date 2026-03-11
./target/debug/kg --repo /path/to/content-repo create decision --title "Choose SQLite"
./target/debug/kg --repo /path/to/content-repo create review --title "Weekly Review" --date 2026-03-11
./target/debug/kg --repo /path/to/content-repo create project --title "Atlas" --git-worktree ~/src/atlas
```

Validate and query a repository:

校验和查询仓库：

```bash
./target/debug/kg --repo /path/to/content-repo validate
./target/debug/kg --repo /path/to/content-repo list
./target/debug/kg --repo /path/to/content-repo search idea
./target/debug/kg --repo /path/to/content-repo stats
```

Operate project repositories:

操作项目仓库：

```bash
./target/debug/kg --repo /path/to/content-repo project add-remote --project atlas --name origin --url git@github.com:org/atlas.git
./target/debug/kg --repo /path/to/content-repo project fetch --project atlas --remote origin
./target/debug/kg --repo /path/to/content-repo project push --project atlas --remote origin
./target/debug/kg --repo /path/to/content-repo project sync --project atlas --remote origin
```

## Relationship To Python / 与 Python 实现的关系

Python is still the reference implementation for examples and tests in this repository. The Rust implementation is intended to stay functionally aligned, but the repository currently treats it mainly as an in-tree implementation and build target rather than the primary documented runtime path.

Python 版本仍然是当前仓库中示例和测试的参考实现。Rust 版本的目标是保持功能对齐，但仓库目前主要把它作为树内实现和构建目标来维护，而不是作为首选运行路径来记录。

## Known Limitations / 已知限制

- The repository's main unit test suite does not execute this implementation end-to-end.
- Current Rust builds emit compiler warnings in `src/main.rs`.
- Root-level documentation still uses Python for detailed command examples.

- 仓库主单元测试套件目前不会对这套实现做端到端执行。
- 当前 Rust 构建在 `src/main.rs` 中仍会产生编译 warning。
- 根级文档中的详细命令示例仍然以 Python 版本为主。
