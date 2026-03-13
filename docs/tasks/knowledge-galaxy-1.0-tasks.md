# Knowledge Galaxy 1.0 任务清单

## 执行说明

这份任务清单已经同步到 2026-03-12 之后的当前仓库状态。

目前只有仍未完成的 1.0 项目保持未勾选。

## 阶段 1：基础文档与仓库骨架

- [x] 在 `docs/requirements/knowledge-galaxy-1.0.md` 中创建正式需求文档
- [x] 在 `docs/specs/knowledge-galaxy-1.0-spec.md` 中创建技术规格文档
- [x] 在 `docs/tasks/knowledge-galaxy-1.0-tasks.md` 中创建实施任务清单
- [x] 创建知识内容、资源、索引和脚本的顶层仓库骨架
- [x] 为可能为空的目录添加占位文件，使其在 Git 中可见

## 阶段 2：文档模板

- [x] 创建顶层 `templates/` 目录用于复用模板（`templates/` 与 `.gitkeep`）
- [x] 为每种类型提供一个 Markdown 模板：`daily`、`note`、`decision`、`review`、`reference`、`theme`、`project`
- [x] 在每个模板中写入必填/可选 frontmatter 字段，并保持字段顺序一致
- [x] 统一使用纯文本占位符：`<id>`、`<title>`、`<slug>`、`<created_at>`、`<updated_at>`、`<date>`

## 阶段 3：CLI 基础能力

- [x] 确定 CLI 运行时与打包方式
- [x] 搭建 `kg` 命令入口
- [x] 实现 `daily`、`note`、`decision`、`review` 的创建命令
- [x] 实现 append、`stdin`、clipboard 捕获工作流

## 阶段 4：资源管理

- [x] 定义共享资源导入规则，包括复制、重命名与引用生成
- [x] 实现项目级资源约定
- [x] 在 spec 中补充资源引用示例

## 阶段 5：索引与查询

- [x] 定义文档元数据与全文搜索的 SQLite 结构
- [x] 实现仓库到索引的同步
- [x] 实现 `kg list`、`kg search`、`kg stats`
- [x] 定义索引重建与导出行为

## 阶段 6：校验

- [x] 实现 frontmatter 校验
- [x] 实现路径与命名校验
- [x] 实现唯一 ID 校验
- [x] 实现 reference 与 asset 校验

## 阶段 7：测试与发布就绪

- [x] 补充文档创建规则测试
- [x] 补充查询与校验流程测试
- [x] 补充仓库初始化与引导文档
- [x] 复查命名一致性并清理未使用结构
