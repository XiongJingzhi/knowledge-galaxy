# Go Implementation / Go 实现

This directory contains the Go implementation of the `kg` CLI.

这个目录包含 `kg` CLI 的 Go 版本实现。

## Status / 状态

The Go implementation is kept in-tree as an alternative implementation of the CLI. It currently builds successfully from this module root and covers the same top-level command surface as the other implementations: `create`, `validate`, `list`, `search`, `stats`, and `project`.

Go 版本作为 CLI 的并行实现保留在仓库中。它目前可以从这个模块根目录成功构建，并覆盖与其他实现相同的顶层命令集合：`create`、`validate`、`list`、`search`、`stats` 和 `project`。

The repository's automated end-to-end tests are not centered on this implementation. Python remains the primary validated path today.

仓库里的自动化端到端测试目前并不是围绕这套实现展开的。当前主要验证路径仍然是 Python 版本。

## Location / 目录位置

- Module root: `implementations/go/kg`
- Main entrypoint: `implementations/go/kg/cmd/kg/main.go`
- Module file: `implementations/go/kg/go.mod`

- 模块根目录：`implementations/go/kg`
- 主入口：`implementations/go/kg/cmd/kg/main.go`
- 模块文件：`implementations/go/kg/go.mod`

## Build / 构建

From the repository root:

从仓库根目录执行：

```bash
make build-go
make build-go-cross
```

From the Go module root:

从 Go 模块根目录执行：

```bash
cd implementations/go/kg
go build ./cmd/kg
```

The root build target writes the binary to `bin/kg`.

根级构建命令会将二进制文件输出到 `bin/kg`。

The cross-platform build target writes named artifacts under `dist/go/`.

跨平台构建命令会把带平台名称的产物输出到 `dist/go/`。

## Verification / 验证

From the repository root:

从仓库根目录执行：

```bash
make test-go
```

This target performs a module-root build check without leaving build artifacts in the source tree.

这个命令会在模块根目录执行构建验证，同时避免把构建产物留在源码目录里。

## Command Surface / 命令范围

The Go implementation currently includes:

当前 Go 实现包含：

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

Build and run from the Go module root:

在 Go 模块根目录中构建并运行：

```bash
cd implementations/go/kg
go build -o kg ./cmd/kg
./kg --repo /path/to/content-repo validate
```

Create documents:

创建文档：

```bash
./kg --repo /path/to/content-repo create note --title "Test Note"
./kg --repo /path/to/content-repo create daily --date 2026-03-11
./kg --repo /path/to/content-repo create decision --title "Choose SQLite"
./kg --repo /path/to/content-repo create review --title "Weekly Review" --date 2026-03-11
./kg --repo /path/to/content-repo create project --title "Atlas" --git-worktree ~/src/atlas
```

Validate and query a repository:

校验和查询仓库：

```bash
./kg --repo /path/to/content-repo validate
./kg --repo /path/to/content-repo list
./kg --repo /path/to/content-repo search idea
./kg --repo /path/to/content-repo stats
```

Operate project repositories:

操作项目仓库：

```bash
./kg --repo /path/to/content-repo project add-remote --project atlas --name origin --url git@github.com:org/atlas.git
./kg --repo /path/to/content-repo project fetch --project atlas --remote origin
./kg --repo /path/to/content-repo project push --project atlas --remote origin
./kg --repo /path/to/content-repo project sync --project atlas --remote origin
```

## Relationship To Python / 与 Python 实现的关系

Python is still the reference implementation for examples and tests in this repository. The Go implementation is intended to stay functionally aligned, but its documentation is currently focused on buildability and implementation location rather than full operational parity guarantees.

Python 版本仍然是当前仓库中示例和测试的参考实现。Go 版本的目标是保持功能对齐，但目前文档重点放在构建方式和实现位置上，而不是对完整运行一致性做强保证。

## Known Limitations / 已知限制

- The repository's main unit test suite does not execute this implementation end-to-end.
- Root-level documentation still uses Python for detailed command examples.
- Any future behavior comparisons should be verified explicitly against the Python implementation.

- 仓库主单元测试套件目前不会对这套实现做端到端执行。
- 根级文档中的详细命令示例仍然以 Python 版本为主。
- 未来如果要比较行为一致性，需要显式对照 Python 版本验证。
