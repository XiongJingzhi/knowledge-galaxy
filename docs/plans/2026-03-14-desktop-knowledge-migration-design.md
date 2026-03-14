# Desktop Knowledge Migration Design

## Context

桌面端当前已经支持文档编辑、资源导入和桌面原生文件选择，但还缺少把外部知识批量迁入知识库的能力。用户希望直接导入本地 `Markdown` 文件或 `zip` 压缩包，通过本地大模型完成分类，再按知识星系的目录模型落库。

当前桌面端没有现成的大模型桥接，也没有迁移专用工作流，因此这轮需要同时补齐：

- 桌面端导入入口
- Tauri 后端迁移命令
- 本地模型调用
- 迁移预览与落库

## Approaches Considered

### 1. 在资源页增加知识迁移工作台

把知识迁移放在现有 `Assets` 页里，作为资源导入旁边的第二个导入流。用户选择 `md/zip` 文件，先生成迁移预览，再确认写入知识库。

优点：

- 复用现有原生文件选择和“导入工作台”心智模型
- 不需要新增一级导航
- 改动范围集中，适合持续推进

缺点：

- `Assets` 页的职责会从纯资源扩展到“外部内容导入”

### 2. 新增独立迁移页

新增一个一级导航“迁移”，完整承载文件导入、模型配置、预览与导入结果。

优点：

- 信息架构最清楚

缺点：

- 会增加导航复杂度
- 当前桌面端刚刚在做功能收敛，不适合再扩一层

### 3. 直接挂到文档页

在文档页顶部增加“导入知识”入口，和文档列表放在一起。

优点：

- 导入结果最终确实是文档

缺点：

- 文档页已经收敛成索引台，再塞入迁移流程会破坏其纯度

## Chosen Approach

选择方案 1：在 `Assets` 页增加知识迁移工作台。

理由很直接：这是“外部内容进入知识星系”的工作流，和现有导入能力最接近，同时不会破坏首页和文档页已经收紧的结构。

## Scope

首版知识迁移只覆盖最小闭环：

- 支持选择一个本地 `md` 文件，或一个 `zip` 压缩包
- `zip` 内只处理文本类知识源：`.md`、`.markdown`、`.txt`
- 使用本地 `Ollama` HTTP API 做结构化分类
- 先生成迁移预览，再确认导入
- 导入结果写入知识库标准目录：`notes/`、`decisions/`、`reviews/`、`references/`

首版暂不做：

- 多文件批量选择
- 后台任务队列
- 二进制附件抽取
- 复杂冲突解决 UI
- 非 `Ollama` 本地模型接入

## UX Design

`Assets` 页右侧工作区扩展成两个相关面板：

1. `资源导入`
现有资源导入能力保留。

2. `知识迁移`
新增迁移工作台，包含：

- 源文件选择：只读路径 + “选择知识源”按钮
- 模型配置：`Ollama model` 文本输入，默认 `llama3.2`
- 迁移预览按钮：触发本地模型分析
- 预览列表：展示每个候选文档的标题、分类、建议路径、摘要
- 确认导入按钮：把预览结果写入知识库

迁移预览是这轮的关键交互。用户可以先看到模型给出的分类结果，再决定是否写入。

## Data Model

前端需要新增三类数据：

1. `KnowledgeMigrationSource`

- `filePath`
- `kind` = `markdown | zip`
- `model`

2. `KnowledgeMigrationDraft`

- `title`
- `type`
- `summary`
- `body`
- `theme`
- `tags`
- `source`
- `status`
- `path`
- `originLabel`

3. `KnowledgeMigrationResult`

- `imported`
- `createdPaths`
- `warnings`

## Backend Flow

### Analyze

`analyze_knowledge_migration` 命令执行以下步骤：

1. 读取用户选择的 `md/zip`
2. 如果是 `zip`，提取其中的 `.md/.markdown/.txt` 条目
3. 为每个文本条目构造提示词
4. 调用本地 `Ollama` `POST /api/generate`
5. 通过 `format` 约束模型输出 JSON
6. 将结果映射为 `KnowledgeMigrationDraft`

分类范围限定为：

- `note`
- `decision`
- `review`
- `reference`

日期类字段统一由系统生成，不让模型决定 `created_at / updated_at`。

### Import

`import_knowledge_migration` 命令执行以下步骤：

1. 接收前端确认后的 `drafts`
2. 为每个草稿生成稳定 slug
3. 根据类型映射到标准路径
4. 如目标文件已存在，自动追加数值后缀避免覆盖
5. 写入 frontmatter + Markdown 正文
6. 返回创建路径列表

导入后前端刷新：

- 文档列表
- 统计摘要
- 最近动态

## Error Handling

需要明确暴露以下失败：

- 未安装或未启动 `Ollama`
- 模型不存在
- `zip` 中没有可处理文本文件
- 模型返回非预期 JSON
- 目标路径写入失败

错误以桌面端现有错误 banner 呈现，不引入额外通知系统。

## Testing Strategy

前端测试覆盖：

- `Assets` 页出现知识迁移工作台
- 选择 `md/zip` 后可生成迁移预览
- 点击导入后刷新列表并记录动态

Rust/后端测试覆盖：

- 识别 `md` 与 `zip`
- `zip` 只提取允许的文本条目
- 目标路径冲突时自动生成唯一文件名
- 模型响应解析失败时返回可读错误

## Documentation

需要同步更新：

- 仓库根 `README.md`
- `apps/desktop/README.md`
- 如有必要，补充桌面端构建与运行对 `Ollama` 的说明
