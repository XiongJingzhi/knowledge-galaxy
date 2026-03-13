# Knowledge Galaxy 1.0 需求说明

## 1. 产品愿景

### 1.1 AI 时代的个人知识磁盘

Knowledge Galaxy 的目标，是成为 AI 时代的个人知识磁盘。

它要长期保存一个人持续积累的知识，包括：

- 想法
- 决策
- 项目经验
- 研究材料
- 复盘
- 日常记录
- 外部资料整理

它要解决的核心问题不是“如何生成知识”，而是“如何让知识长期保存、可演进、可被程序稳定读取”。

### 1.2 长期目标

Knowledge Galaxy 的长期目标，是成为个人 AI 系统的长期记忆层。

未来外部系统可能包括：

- RAG 系统
- agent 系统
- 自动化研究系统
- 个人决策系统

这些系统应当把 Knowledge Galaxy 当成稳定知识源来读取，而不是反过来要求 Knowledge Galaxy 内置这些能力。

### 1.3 产品定位

Knowledge Galaxy 不是：

- 笔记应用
- RAG 工具
- AI 聊天系统
- 向量数据库
- 知识图谱平台

Knowledge Galaxy 的定位是：个人知识存储层。

## 2. 系统边界

### 2.1 范围内

Knowledge Galaxy 负责：

1. 知识存储
   把知识保存为长期可维护的文档。
2. 知识结构
   使用目录和元数据表达关系。
3. 知识索引
   生成可查询的结构化索引。
4. CLI 操作
   通过命令行管理知识仓库。
5. 面向 AI 的稳定输出
   让外部系统容易读取已存储知识。

### 2.2 范围外

Knowledge Galaxy 当前不负责：

- 向量化
- embeddings
- chunking
- RAG 检索
- AI 推理
- agent 编排
- 语义搜索增强

这些能力属于上层 AI 应用。

## 3. 系统架构

Knowledge Galaxy 采用三层结构：

1. 知识存储层
2. 知识索引层
3. AI 应用层

### 3.1 知识存储层

存储层是系统核心，负责：

- 文档存储
- 目录结构
- 元数据表达
- 资源目录保留

当前实现基础：

- Git 仓库
- Markdown 文档
- YAML frontmatter

### 3.2 知识索引层

索引层是从存储层派生出来的查询层。

它负责提供：

- 文档列表
- 基本文本搜索
- 统计输出
- 面向程序消费的结构化读取能力

当前实现说明：

- Python：使用 SQLite 维护本地索引
- Go / Rust：当前通过扫描文档即时完成查询

索引层是派生数据，不是事实来源。

### 3.3 AI 应用层

AI 应用层由外部系统实现，例如：

- Milvus
- RAGFlow
- LangChain
- LlamaIndex
- 各类 agent 系统

这些系统消费 Knowledge Galaxy 输出的数据，而不是要求 Knowledge Galaxy 内置它们的运行逻辑。

## 4. 核心设计原则

### 4.1 Git 是事实来源

所有知识最终都应保存在 Git 仓库中。

这样可以获得：

- 可追踪版本
- 可比较历史
- 可审计变更
- 可迁移数据

### 4.2 文件优先

知识的基本单元是文档文件，而不是：

- block
- chunk
- 数据库行

### 4.3 CLI 优先

CLI 是当前产品的主入口。

截至 2026-03-13，当前已实现的 CLI 能力包括：

- 文档创建
- 内容捕获
- 查询
- 核心校验
- 项目远端操作

当前尚未实现的能力包括：

- 资源导入

GUI 如果存在，也应当只是 CLI 之上的展示层。

### 4.4 稳定结构

系统应长期围绕少量稳定概念组织：

- Daily
- Note
- Decision
- Review
- Project

`Theme` 和 `Reference` 保留为结构层概念，但当前还不属于已经完整实现的命令面。

### 4.5 人类可读

知识系统必须保持：

- 可读
- 可维护
- 可理解

不应为了自动化而引入过于复杂的数据结构。

### 4.6 对 AI 友好

结构需要提供：

- 清晰边界
- 显式元数据
- 稳定语义
- 统一路径规则

这样外部 AI 系统才可以稳定解析。

## 5. 核心概念

### 5.1 Note

Note 是最基本的知识对象，用于表达可以独立成文的内容，例如：

- 想法
- 解释
- 研究记录
- 总结

### 5.2 Daily

Daily 是时间维度入口，用于记录每天的：

- 事件
- 输入
- 想法
- 决策
- 行动

当前实现支持向 daily 直接追加带时间戳的捕获块。

### 5.3 Decision

Decision 用于保存重要决策及其背景，避免未来失去上下文。

### 5.4 Review

Review 用于保存周期性复盘和阶段总结。

### 5.5 Project

Project 表示行动空间。Knowledge Galaxy 中的项目文档可以绑定一个外部 git 工作目录，并执行：

- `add-remote`
- `fetch`
- `push`
- `sync`

## 6. 当前 1.0 需求落地状态

截至 2026-03-13，当前代码已经满足的 1.0 需求包括：

- 支持 Python / Go / Rust 三种 CLI 并行实现
- 未传 `--repo` 时默认使用 `~/.knowledge-galax`
- 默认仓库不存在时自动创建基础目录
- 支持 `create daily/note/decision/review/project`
- 支持 `append daily`
- 支持 `create note --stdin`
- 支持 `import clipboard note`
- 支持 `validate / list / search / stats`
- 支持 `export document-list / manifest / change-list`
- `validate` 已包含 `assets/` 与 `references/` 相对链接存在性检查
- 支持项目远端操作

尚未完成的 1.0 需求：

- 资源导入

## 7. 文档要求

需求文档必须始终区分两类内容：

- 当前代码已经实现的行为
- 仍在计划中但尚未实现的行为

不能把规划能力写成当前能力。
