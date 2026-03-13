# 文档治理规范

本文定义 Knowledge Galaxy 仓库中文档如何跟随代码演进。

## 1. 文档分类

### 1.1 当前权威文档

以下文档描述“现在的仓库”和“现在的运行行为”：

- `README.md`
- `docs/requirements/*.md`
- `docs/specs/*.md`
- `docs/tasks/*.md`
- `implementations/*/README.md`
- `skills/*/SKILL.md`
- `skills/*/INSTALL.md`

这些文档必须与当前代码保持一致。

### 1.2 历史记录文档

以下文档保留历史设计、实施计划和迁移过程：

- `docs/plans/*.md`

这些文档可以保留旧背景，但不能继续误导读者把旧路径、旧命令当成当前事实。

## 2. 同步更新规则

当代码行为发生变化时，至少要同步更新对应文档：

- CLI 行为变化：
  同步更新 `README.md`、相关实现 README、相关 spec / requirements 文档、以及受影响的 skill 文档
- 仓库结构变化：
  同步更新 `README.md`、`docs/specs/repository-layout.md`，并检查相关历史 plan 文档的状态头是否仍然准确
- 任务完成状态变化：
  同步更新 `docs/tasks/*.md`
- CI 或 release 流程变化：
  同步更新 `README.md` 和相关发布说明

## 3. 历史文档规则

每个 `docs/plans/` 下的历史文档都必须包含：

- 明显可见的“历史文档”说明
- 指向当前权威文档的入口
- 当正文出现旧路径或旧命令时的提醒说明

历史文档可以保留旧决策和旧迁移背景，但不能在没有校正说明的情况下，把已经过时的路径写成当前操作步骤。

## 4. 当前与计划中的边界

当前权威文档必须明确区分：

- 已实现行为
- 计划中但尚未实现的行为

不能把计划中的功能写成“已经可用”。

## 5. 合并前检查清单

在合并任何会影响行为的改动前，至少检查：

1. `README.md` 是否反映了当前行为
2. 相关 spec / requirements / tasks 文档是否同步
3. 各实现目录下的 README 是否仍然准确
4. 受影响的 skill 文档是否仍指向有效命令
5. 被触及的历史 plan 文档是否仍带有正确的历史状态头
