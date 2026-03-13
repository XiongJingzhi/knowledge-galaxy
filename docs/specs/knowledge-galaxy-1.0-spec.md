# Knowledge Galaxy 1.0 技术规格

## 1. 范围

本文定义 Knowledge Galaxy 1.0 所管理的知识仓库结构、文档规则、元数据字段、以及当前 CLI 的 1.0 行为边界。

Knowledge Galaxy 1.0 是一个存储优先系统：

- Markdown 文件是事实来源
- Git 负责版本与变更历史
- 查询、索引、AI 消费都建立在这套存储模型之上

本文描述的是 `kg` 管理的目标知识仓库，不是当前工具仓库本身的源码布局。工具仓库结构请参考 `docs/specs/repository-layout.md`。

## 2. 知识仓库布局

一个由 `kg` 管理的知识仓库，当前基础目录应包含：

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

### 2.1 目录规则

- `templates/`：外部模板目录。CLI 会优先读取这里的模板；缺失时回退到程序内置模板
- `notes/`：独立知识笔记
- `dailies/`：日记，路径规则为 `dailies/YYYY/MM/DD.md`
- `decisions/`：决策记录
- `reviews/`：复盘与回顾
- `references/`：外部资料与参考内容的保留目录
- `themes/`：主题锚点文档目录
- `projects/`：项目目录，每个项目一个子目录
- `assets/`：共享资源目录，当前支持通过 `import asset` 导入
- `inbox/`：待归类内容目录，当前实现尚未提供专门命令
- `indexes/`：派生索引目录，例如 SQLite 数据库

### 2.2 占位规则

如果某些目录在 Git 仓库中需要保留结构但暂时为空，可以使用 `.gitkeep`。

## 3. 文档模型

### 3.1 文件格式

知识文档统一使用：

- UTF-8 Markdown 正文
- 文件头部 YAML frontmatter

### 3.2 当前已实现的文档类型

截至 2026-03-13，当前三种 CLI 实现已经支持的文档类型是：

- `daily`
- `note`
- `decision`
- `review`
- `project`

`reference`、`theme`、`thought` 目前仍属于目录或规划层概念，不属于当前已实现的创建与校验命令面。

### 3.3 类型到路径映射

- `daily` -> `dailies/YYYY/MM/DD.md`
- `note` -> `notes/<slug>.md`
- `decision` -> `decisions/<slug>.md`
- `review` -> `reviews/<slug>.md`
- `project` -> `projects/<slug>/README.md`

## 4. Frontmatter 规格

### 4.1 当前必填字段

当前实现中的文档校验要求以下字段存在：

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `id` | string | 全局唯一稳定标识 |
| `type` | string | 必须属于当前支持的文档类型 |
| `title` | string | 人类可读标题 |
| `slug` | string | 小写 kebab-case |
| `created_at` | string | ISO 8601 时间戳 |
| `updated_at` | string | ISO 8601 时间戳 |
| `status` | string | 必须属于受支持状态集 |

### 4.2 常见可选字段

当前模板和索引会处理以下可选字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `date` | string | ISO 日期，主要用于 `daily` 和 `review` |
| `theme` | string 或 list | 主题 slug 或主题列表 |
| `project` | string 或 list | 项目 slug 或项目列表 |
| `tags` | list | 标签列表 |
| `source` | string 或 list | 外部来源 |
| `summary` | string | 简短摘要 |
| `git_worktree` | string | 仅项目文档使用，指向外部 git 工作目录 |

### 4.3 受控状态值

当前实现支持以下 `status`：

- `inbox`
- `active`
- `evergreen`
- `archived`

### 4.4 命名规则

- `slug` 必须为小写 kebab-case
- `tags` 应为小写 kebab-case
- `project` 值应与 `projects/` 下的项目 slug 对应
- `daily` 的 `slug` 必须与日期一致

## 5. 结构规则

### 5.1 Project

项目表示行动空间。每个项目使用独立目录：

```text
projects/<project-slug>/
```

项目主文档固定为：

```text
projects/<project-slug>/README.md
```

如果项目文档要参与远端操作，必须提供有效的 `git_worktree` 字段。

### 5.2 Daily

Daily 是时间维度的入口，必须使用日期推导出的路径：

```text
dailies/YYYY/MM/DD.md
```

### 5.3 Note

Note 是最通用的长期知识单元，用于承载独立笔记内容。

### 5.4 Decision 与 Review

- `decision` 用于记录决策及其背景
- `review` 用于记录复盘与回顾

### 5.5 Asset

当前资源导入规则如下：

- `import asset --file /path/to/file`：
  复制到 `assets/<filename>`
- `import asset --file /path/to/file --name hero.png`：
  复制到 `assets/hero.png`
- `import asset --file /path/to/file --project atlas`：
  复制到 `projects/atlas/assets/<filename>`
- `import asset --file /path/to/file --project atlas --name hero.png`：
  复制到 `projects/atlas/assets/hero.png`

当前约束：

- `--file` 必填，且必须指向已存在文件
- `--name` 只能是文件名，不能包含目录穿越
- 如果目标文件已存在，命令会失败
- 成功时输出相对仓库根目录的目标路径

Markdown 引用示例：

```md
![架构图](../assets/diagram.png)
![项目封面](assets/hero.png)
```

## 6. 索引边界

Knowledge Galaxy 1.0 定义索引层，但索引层不是事实来源。

### 6.1 数据来源

索引层来自 Git 跟踪的 Markdown 文档。

### 6.2 当前实现

- Python 实现会在 `indexes/knowledge-galaxy.db` 下维护 SQLite 索引
- Go 与 Rust 当前通过扫描文档即时完成 `list`、`search`、`stats`，不依赖 SQLite 运行时

### 6.3 查询能力

当前已实现：

- 按类型列出文档
- 基于正文和元数据做简单搜索
- `list` 支持 `--type`、`--status`、`--project`、`--date`、`--theme`、`--tag`、`--source`
- `search` 支持 `--status`、`--project`、`--date`、`--theme`、`--tag`、`--source`
- 输出文档数量统计

规划中但尚未实现：

- 更丰富的主题分布与标签频率统计

## 7. 模板规则

Knowledge Galaxy 1.0 使用 Markdown 模板作为文档创建基线。

### 7.1 模板来源

运行时遵循以下顺序：

1. 优先读取目标知识仓库下的 `templates/<name>.md`
2. 如果外部模板不存在，则回退到程序内置模板

### 7.2 当前模板集合

当前实现已内置并支持的模板包括：

- `daily`
- `note`
- `decision`
- `review`
- `project`
- `reference`
- `theme`

其中 `reference` 与 `theme` 模板虽然存在，但当前 CLI 还没有对外暴露对应的创建命令。

### 7.3 模板格式

每个模板应：

- 以 YAML frontmatter 开头
- 使用共享字段顺序
- 使用纯文本占位符
- 仅包含最少量正文标题

## 8. CLI 1.0 行为边界

CLI 可执行名为 `kg`。

### 8.1 当前已实现

截至 2026-03-13，Python、Go、Rust 三种实现已经统一支持：

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
- `validate` 中的 `reference` / `asset` 相对链接存在性检查
- `export` 中的 JSON 快照导出

### 8.2 默认仓库行为

如果省略 `--repo`，CLI 默认使用：

```text
~/.knowledge-galax
```

写入类操作会在需要时自动创建基础目录结构。
当前 Python 实现在省略 `--repo` 时会直接确保默认仓库存在；Go 与 Rust 也会在默认路径上工作，不再要求显式传入 `--repo`。

### 8.3 输出约束

- 成功时输出尽量短且可脚本化
- 创建类命令输出相对于仓库根目录的目标路径
- 失败时在 stderr 输出单行错误，并以非零状态码退出
- `export` 输出 JSON，其中 `document-list` 返回路径排序结果，`manifest` 返回整体快照，`change-list` 返回按 `updated_at` 倒序排列的当前变更视图

### 8.4 当前仍未实现

以下能力仍在 1.0 计划中，但截至 2026-03-13 尚未落地：

- 更完整的资源生命周期工作流，例如资源清单和去重策略

## 9. 文档与实现对齐原则

当前技术规格必须反映已实现行为，而不是理想化终态。

如果代码行为发生变化，需要同步更新：

- `README.md`
- `docs/requirements/knowledge-galaxy-1.0.md`
- `docs/tasks/knowledge-galaxy-1.0-tasks.md`
- 受影响的实现 README
- 相关 skill 文档
