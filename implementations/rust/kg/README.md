# Rust 实现说明

这个目录包含 `kg` CLI 的 Rust 版本实现。

## 状态

Rust 版本作为 CLI 的并行实现保留在仓库中。它目前可以从这个 crate 根目录成功构建，并暴露与其他实现相同的 1.0 命令集合：

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

- crate 根目录：`implementations/rust/kg`
- 主入口：`implementations/rust/kg/src/main.rs`
- Cargo 清单：`implementations/rust/kg/Cargo.toml`

## 构建

从仓库根目录执行：

```bash
make build-rust
make build-rust-cross
```

从 crate 根目录执行：

```bash
cd implementations/rust/kg
cargo build
```

根级构建命令会将 release 二进制文件输出到 `bin/kg-rs`。

跨平台构建命令会把带平台名称的产物输出到 `dist/rust/`。执行这条命令时，构建机器需要已经安装对应的 Rust target 和链接工具链。

## 验证

从仓库根目录执行：

```bash
make test-rust
```

这个命令会运行 crate 单元测试以及仓库级 Rust 行为测试。

## 命令范围

当前 Rust 实现包含：

- `create` 下的文档创建命令
- `append` 和 `import` 下的捕获命令
- 仓库校验（包括 `assets/` / `references/` 相对链接存在性检查）
- 仓库的列表、搜索和统计
- `project` 下的项目 git 操作

如果没有传入 `--repo`，CLI 会默认使用 `~/.knowledge-galax`，并在需要时自动创建基础仓库结构。

## 使用示例

在 crate 根目录中构建并运行：

```bash
cd implementations/rust/kg
cargo build
./target/debug/kg --repo /path/to/content-repo validate
```

创建文档：

```bash
./target/debug/kg --repo /path/to/content-repo create note --title "Test Note"
./target/debug/kg --repo /path/to/content-repo create daily --date 2026-03-11
./target/debug/kg --repo /path/to/content-repo create decision --title "Choose SQLite"
./target/debug/kg --repo /path/to/content-repo create review --title "Weekly Review" --date 2026-03-11
./target/debug/kg --repo /path/to/content-repo create project --title "Atlas" --git-worktree ~/src/atlas
printf 'Captured from stdin\n' | ./target/debug/kg create note --title "Streamed Note" --stdin
printf 'Captured for today\n' | ./target/debug/kg append daily
./target/debug/kg import clipboard note --title "Clipboard Note"
```

校验和查询仓库：

```bash
./target/debug/kg --repo /path/to/content-repo validate
./target/debug/kg --repo /path/to/content-repo list
./target/debug/kg --repo /path/to/content-repo search idea
./target/debug/kg --repo /path/to/content-repo stats
```

操作项目仓库：

```bash
./target/debug/kg --repo /path/to/content-repo project add-remote --project atlas --name origin --url git@github.com:org/atlas.git
./target/debug/kg --repo /path/to/content-repo project fetch --project atlas --remote origin
./target/debug/kg --repo /path/to/content-repo project push --project atlas --remote origin
./target/debug/kg --repo /path/to/content-repo project sync --project atlas --remote origin
```

## 与 Python 实现的关系

Python 版本仍然是当前仓库中大多数叙述性示例的参考实现，但 Rust 版本现在已经纳入仓库级行为测试，并以保持 1.0 命令兼容为目标。

## 已知限制

- 当前 Rust 构建在 `src/main.rs` 中仍会产生编译 warning。
- 根级文档中的叙述性命令示例在只展示一种实现时仍优先使用 Python。
