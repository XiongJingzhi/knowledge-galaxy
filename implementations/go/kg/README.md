# Go 实现说明

这个目录包含 `kg` CLI 的 Go 版本实现。

## 状态

Go 版本作为 CLI 的并行实现保留在仓库中。它目前可以从这个模块根目录成功构建，并覆盖与其他实现相同的 1.0 命令集合：

- `create`
- `append`
- `import`
- `validate`
- `list`
- `search`
- `stats`
- `project`

仓库现在会对这套实现运行专门的行为测试，同时 Python 仍然是文档最完整的实现路径。

## 目录位置

- 模块根目录：`implementations/go/kg`
- 主入口：`implementations/go/kg/cmd/kg/main.go`
- 模块文件：`implementations/go/kg/go.mod`

## 构建

从仓库根目录执行：

```bash
make build-go
make build-go-cross
```

从 Go 模块根目录执行：

```bash
cd implementations/go/kg
go build ./cmd/kg
```

根级构建命令会将二进制文件输出到 `bin/kg`。

跨平台构建命令会把带平台名称的产物输出到 `dist/go/`。

## 验证

从仓库根目录执行：

```bash
make test-go
```

这个命令会从仓库根目录运行 Go 行为测试套件。

## 命令范围

当前 Go 实现包含：

- `create` 下的文档创建命令
- `append` 和 `import` 下的捕获命令
- 仓库校验
- 仓库的列表、搜索和统计
- `project` 下的项目 git 操作

如果没有传入 `--repo`，CLI 会默认使用 `~/.knowledge-galax`，并在需要时自动创建基础仓库结构。

## 使用示例

在 Go 模块根目录中构建并运行：

```bash
cd implementations/go/kg
go build -o kg ./cmd/kg
./kg --repo /path/to/content-repo validate
```

创建文档：

```bash
./kg --repo /path/to/content-repo create note --title "Test Note"
./kg --repo /path/to/content-repo create daily --date 2026-03-11
./kg --repo /path/to/content-repo create decision --title "Choose SQLite"
./kg --repo /path/to/content-repo create review --title "Weekly Review" --date 2026-03-11
./kg --repo /path/to/content-repo create project --title "Atlas" --git-worktree ~/src/atlas
printf 'Captured from stdin\n' | ./kg create note --title "Streamed Note" --stdin
printf 'Captured for today\n' | ./kg append daily
./kg import clipboard note --title "Clipboard Note"
```

校验和查询仓库：

```bash
./kg --repo /path/to/content-repo validate
./kg --repo /path/to/content-repo list
./kg --repo /path/to/content-repo search idea
./kg --repo /path/to/content-repo stats
```

操作项目仓库：

```bash
./kg --repo /path/to/content-repo project add-remote --project atlas --name origin --url git@github.com:org/atlas.git
./kg --repo /path/to/content-repo project fetch --project atlas --remote origin
./kg --repo /path/to/content-repo project push --project atlas --remote origin
./kg --repo /path/to/content-repo project sync --project atlas --remote origin
```

## 与 Python 实现的关系

Python 版本仍然是当前仓库中大多数叙述性示例的参考实现，但 Go 版本现在已经纳入仓库级行为测试，并以保持 1.0 命令兼容为目标。

## 已知限制

- 根级文档中的叙述性命令示例在只展示一种实现时仍优先使用 Python。
- 未来如果要比较行为一致性，需要显式对照 Python 版本验证。
