# 知识星系

Knowledge Galaxy 是一个多实现版本并存的 `kg` CLI 仓库。

这个仓库同时维护 Python、Go、Rust 三种实现。各语言实现统一放在 `implementations/` 下，仓库级文档、模板、测试、CI 与发布配置放在仓库根目录。

## 仓库结构

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

- `implementations/python/kg`：Python CLI，实现最完整、文档也最完整
- `implementations/go/kg`：Go CLI，实现与 Python 保持同一套 1.0 命令面
- `implementations/rust/kg`：Rust CLI，实现与 Python 保持同一套 1.0 命令面
- `docs/`：规格、需求、任务和历史计划文档
- `templates/`：仓库级模板目录，CLI 会优先读取外部仓库模板，缺失时回退到内置模板
- `tests/`：仓库级测试，包含 Python 单测以及 Go / Rust 行为测试

当前源码布局请参考 `docs/specs/repository-layout.md`。
文档维护规范请参考 `docs/specs/documentation-governance.md`。

## 环境要求

- Python 3
- Go
- Rust / Cargo

## 当前实现状态

截至 2026-03-13，Python、Go、Rust 三种实现都已经覆盖同一组 1.0 核心命令：

- `create daily`
- `create note`
- `create decision`
- `create review`
- `create project`
- `append daily`
- `create note --stdin`
- `import clipboard note`
- `import asset`
- `validate`
- `list`
- `search`
- `stats`
- `export document-list`
- `export manifest`
- `export change-list`
- `project add-remote`
- `project fetch`
- `project push`
- `project sync`

## 默认知识仓库

如果命令行没有传入 `--repo`，三种实现都会默认使用：

```text
~/.knowledge-galax
```

写入类命令会在需要时自动创建该仓库及其基础目录结构。基础目录包括：

```text
templates/
notes/
dailies/
decisions/
reviews/
references/
themes/
projects/
assets/
inbox/
indexes/
```

## 运行与测试

可以通过根目录 `Makefile` 执行统一验证：

```bash
make test
make test-python
make test-go
make test-rust
```

## 构建

根目录提供统一构建入口：

```bash
make build-go
make build-rust
make build-go-cross
make build-rust-cross
```

跨平台构建产物会输出到 `dist/` 目录。
本地临时构建产物会输出到 `bin/` 目录。

## CI 与发布

GitHub Actions 当前会执行以下流程：

- 在推送到 `main` 和创建 `pull_request` 时运行 `make test`
- 构建 Go 与 Rust 的 macOS / Linux / Windows 二进制
- 在每次推送到 `main` 时更新固定的 `Nightly` 预发布版本

Nightly 预发布会同时包含 Go 和 Rust 的各平台产物，并使用语言前缀避免重名覆盖。

## 直接入口

### Python

```bash
python3 -m implementations.python.kg --help
```

### Go

```bash
cd implementations/go/kg && go build ./cmd/kg
./kg --help
```

### Rust

```bash
cd implementations/rust/kg && cargo build
./target/debug/kg --help
```

## 常用示例

以下示例使用 Python 实现作为演示入口；Go 和 Rust 的命令面与之保持一致。

### 创建文档

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create note --title "Test Note"
python3 -m implementations.python.kg --repo /path/to/content-repo create daily --date 2026-03-11
python3 -m implementations.python.kg --repo /path/to/content-repo create decision --title "Choose SQLite"
python3 -m implementations.python.kg --repo /path/to/content-repo create review --title "Weekly Review" --date 2026-03-11
python3 -m implementations.python.kg --repo /path/to/content-repo create project --title "Atlas" --git-worktree ~/src/atlas
```

成功时命令会输出相对于仓库根目录的目标路径。

### 捕获内容

```bash
python3 -m implementations.python.kg append daily --date 2026-03-12 < capture.txt
printf 'Captured from stdin\n' | python3 -m implementations.python.kg create note --title "Streamed Note" --stdin
python3 -m implementations.python.kg import clipboard note --title "Clipboard Note"
python3 -m implementations.python.kg import asset --file ~/Downloads/diagram.png
python3 -m implementations.python.kg import asset --file ~/Downloads/cover.png --project atlas --name hero.png
```

- `append daily` 会向目标 daily 末尾追加带时间戳的捕获块
- 如果目标 daily 不存在，会先自动创建
- `create note --stdin` 会从标准输入读取正文
- `import clipboard note` 会读取系统剪贴板中的纯文本
- `import asset` 会复制资源文件到 `assets/`，或复制到 `projects/<slug>/assets/`

### 查询与校验

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo validate
python3 -m implementations.python.kg --repo /path/to/content-repo list
python3 -m implementations.python.kg --repo /path/to/content-repo search idea
python3 -m implementations.python.kg --repo /path/to/content-repo stats
python3 -m implementations.python.kg --repo /path/to/content-repo export document-list
python3 -m implementations.python.kg --repo /path/to/content-repo export manifest
python3 -m implementations.python.kg --repo /path/to/content-repo export change-list
```

`validate` 当前会检查：

- frontmatter 必填字段
- 文档路径与 slug 规则
- 重复 ID
- project 的 `git_worktree`
- Markdown 正文中指向 `assets/` 与 `references/` 的相对链接是否存在

`export` 当前会输出 JSON：

- `document-list`：按路径排序的当前文档快照
- `manifest`：带 `generated_at` 与 `total` 的整体快照
- `change-list`：按 `updated_at` 倒序排列的当前变更视图

### 项目远端操作

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo project add-remote --project atlas --name origin --url git@github.com:org/atlas.git
python3 -m implementations.python.kg --repo /path/to/content-repo project fetch --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project push --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project sync --project atlas --remote origin
```

这些命令会读取 `projects/<slug>/README.md` 中的 `git_worktree`，并对对应外部仓库执行 git 操作。

## 文档说明

- `docs/specs/repository-layout.md`：当前工具仓库的源码布局与标准入口
- `docs/specs/knowledge-galaxy-1.0-spec.md`：当前 1.0 技术规格
- `docs/requirements/knowledge-galaxy-1.0.md`：产品边界与设计目标
- `docs/tasks/knowledge-galaxy-1.0-tasks.md`：任务完成状态
- `docs/specs/documentation-governance.md`：文档治理规范

`docs/plans/` 下的历史文档可能仍会提到旧路径，例如 `scripts/kg`、`cmd/kg`、`packages/rust`。这些内容应视为历史记录，不应当作当前使用说明。

## Skill 分发

仓库中附带了一份可分发的 agent skill：

```text
skills/knowledge-galaxy-cli/SKILL.md
```

如果要安装到其他 agent 环境，请参考：

```text
skills/knowledge-galaxy-cli/INSTALL.md
```
