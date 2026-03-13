---
name: knowledge-galaxy-cli
description: 当需要通过 kg CLI 管理 Knowledge Galaxy 内容仓库时使用，尤其适用于创建文档、捕获内容、校验仓库、搜索内容、查看统计或执行项目远端操作。
---

# Knowledge Galaxy CLI 技能说明

## 概述

当用户希望通过 `kg` 操作 Knowledge Galaxy 内容仓库时，使用这份技能说明。

`kg` 是一个面向知识仓库的 CLI。它可以基于模板创建 Markdown 文档、把内容捕获到 note 和 daily、校验仓库结构、列出和搜索文档、输出统计信息，并对项目条目执行有限的 git 操作。

当前最稳妥、文档最完整的运行入口是 Python：

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo ...
```

## 何时使用

当用户想做下面这些事时，应优先使用这份技能：

- 创建 note、daily、decision、review 或 project 文档
- 校验 Knowledge Galaxy 仓库
- 列出、搜索或查看仓库统计
- 通过 project 文档执行 add/fetch/push/sync 远端操作
- 询问某个内容仓库任务应该使用哪条 `kg` 命令

以下场景不适合使用这份技能：

- 开发 `kg` 软件本身
- 修改 CLI 实现细节
- 与 Knowledge Galaxy 项目文档无关的一般 git 问题

## 仓库假设

`kg` 操作的是内容仓库。如果省略 `--repo`，它会默认使用 `~/.knowledge-galax`，并按需创建基础目录结构。

目标仓库通常会包含这些内容目录：

- `notes/`
- `dailies/`
- `decisions/`
- `reviews/`
- `projects/`

模板行为：

- 如果 `<repo>/templates/<name>.md` 存在，`kg` 会优先使用外部模板
- 如果外部模板不存在，`kg` 会回退到内置模板

## 主要入口

推荐入口：

```bash
python3 -m implementations.python.kg [--repo /path/to/content-repo] <command>
```

其他实现也可用，但优先级次于 Python：

```bash
./bin/kg [--repo /path/to/content-repo] <command>
./bin/kg-rs [--repo /path/to/content-repo] <command>
```

如果用户想要最稳妥的运行路径，默认优先推荐 Python，除非他明确要求 Go 或 Rust。

## 常见任务

### 创建 note

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create note --title "Test Note"
```

### 创建 daily

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create daily --date 2026-03-12
```

### 向 daily 追加内容

```bash
printf 'Captured for today\n' | python3 -m implementations.python.kg append daily
python3 -m implementations.python.kg --repo /path/to/content-repo append daily --date 2026-03-12 < capture.txt
```

### 从 stdin 创建 note

```bash
printf 'Captured from stdin\n' | python3 -m implementations.python.kg create note --title "Streamed Note" --stdin
```

### 从剪贴板导入 note

```bash
python3 -m implementations.python.kg import clipboard note --title "Clipboard Note"
```

### 导入资源文件

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo import asset --file ~/Downloads/diagram.png
python3 -m implementations.python.kg --repo /path/to/content-repo import asset --file ~/Downloads/cover.png --project atlas --name hero.png
```

### 创建 decision

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create decision --title "Choose SQLite"
```

### 创建 review

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create review --title "Weekly Review" --date 2026-03-12
```

### 创建 project 条目

`create project` 需要一个已经存在的本地 git worktree。

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create project --title "Atlas" --git-worktree ~/src/atlas
```

### 校验仓库

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo validate
```

成功时的预期输出：

```text
OK
```

当前 `validate` 会检查：

- frontmatter 必填字段
- 路径与 slug 规则
- 重复 ID
- project 的 `git_worktree`
- 正文中指向 `assets/` 与 `references/` 的相对 Markdown 链接是否存在

### 列出文档

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo list
python3 -m implementations.python.kg --repo /path/to/content-repo list --type note
python3 -m implementations.python.kg --repo /path/to/content-repo list --status active --project atlas
python3 -m implementations.python.kg --repo /path/to/content-repo list --theme knowledge --tag mvp
```

### 搜索文档

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo search idea
python3 -m implementations.python.kg --repo /path/to/content-repo search review --date 2026-03-12
python3 -m implementations.python.kg --repo /path/to/content-repo search idea --source field-notes
```

当前 `list` / `search` 已支持：

- `--status`
- `--project`
- `--date`
- `--theme`
- `--tag`
- `--source`
- `list` 额外支持 `--type`

当前 `stats` 还会输出：

- `theme:<slug>` 主题分布
- `tag:<slug>` 标签频率
- `source:<slug>` 来源分布

### 查看统计

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo stats
```

### 导出当前快照

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo export document-list
python3 -m implementations.python.kg --repo /path/to/content-repo export manifest
python3 -m implementations.python.kg --repo /path/to/content-repo export change-list
python3 -m implementations.python.kg --repo /path/to/content-repo export asset-list
```

### 管理项目远端

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo project add-remote --project atlas --name origin --url git@github.com:org/atlas.git
python3 -m implementations.python.kg --repo /path/to/content-repo project fetch --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project push --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project sync --project atlas --remote origin
```

## 输出约定

- `create ...` 会输出创建后的相对路径
- `import asset` 会输出导入后的相对资源路径
- `validate` 成功时输出 `OK`，失败时逐行输出错误
- `list` 输出以 tab 分隔的 `type`、`title`、`path`
- `search` 输出与 `list` 相同格式的匹配结果
- `stats` 先输出 `total`，再输出分组统计
- `export ...` 输出 JSON 快照
- `project ...` 输出以 tab 分隔的项目操作结果

## 常见误用

- 误以为 `--repo` 是必填的
  处理方式：可以省略，默认使用 `~/.knowledge-galax`；如果要操作别的仓库，再显式传入

- 把 `--repo` 指到这个工具仓库，而不是内容仓库
  处理方式：应传入外部知识仓库路径，而不是工具源码仓库

- 用非 git 目录执行 `create project`
  处理方式：传入一个已经存在的本地 git worktree

- 误以为外部模板是必需的
  处理方式：当前外部模板是可选的；缺失时会回退到内置模板

- 误以为 `import asset --name` 可以携带目录
  处理方式：`--name` 只能是文件名；项目级目录应通过 `--project` 指定

## 参考文档

- 仓库总览：`README.md`
- 当前源码布局：`docs/specs/repository-layout.md`
- Go 实现说明：`implementations/go/kg/README.md`
- Rust 实现说明：`implementations/rust/kg/README.md`
