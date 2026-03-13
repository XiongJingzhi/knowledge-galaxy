# Knowledge Galaxy 模板规则

本文补充说明当前模板层的占位符、字段默认值和覆盖范围。

## 1. 占位符

当前模板使用纯文本占位符：

- `<id>`：全局唯一文档标识
- `<title>`：人类可读标题
- `<slug>`：小写 kebab-case 标识
- `<created_at>`：ISO 8601 创建时间
- `<updated_at>`：ISO 8601 更新时间
- `<date>`：时间型文档使用的 ISO 日期

## 2. 可选字段默认值

列表型字段默认使用空列表：

- `theme: []`
- `project: []`
- `tags: []`
- `source: []`

自由文本字段默认使用空字符串：

- `summary: ""`

这样可以保持模板在手工编辑和 CLI 替换场景下都足够稳定。

## 3. 当前模板覆盖范围

仓库当前提供以下模板：

- `daily`
- `note`
- `decision`
- `review`
- `reference`
- `theme`
- `project`

其中：

- `daily`、`note`、`decision`、`review`、`project` 已经被当前 CLI 创建命令使用
- `reference`、`theme` 模板当前存在，但 CLI 尚未暴露对应创建命令

## 4. CLI 使用规则

当前实现的模板加载顺序为：

1. 优先读取目标知识仓库中的 `templates/<name>.md`
2. 如果外部模板不存在，则回退到程序内置模板

当前 `kg create` 的实现遵循以下规则：

1. 选择匹配模板
2. 用运行时生成值替换占位符
3. 按类型写入规范路径
4. 保留最小正文结构供后续编辑

Knowledge Galaxy 1.0 当前不要求引入专门的模板引擎。
