# Desktop Document Index And Scroll Design

## Context

桌面端文档索引页已经具备搜索、筛选和表格结构，但仍有两个明显问题：

- 文档列表的 `更新时间` 还是占位文本，索引页没有真正反映文档状态。
- 文档编辑页的滚动责任不清，外层工作区和内容区会一起参与滚动，导致桌面端壳层不稳定。

此外，编辑页标题目前延续了偏展示型的 serif 大标题，不够适合作为高频编辑工作区的主标题。

## Goal

让文档索引页变成真实可用的文档台，并让文档编辑页拥有更稳定的桌面工作区布局。

## Options

### Option 1: Minimal Functional Refinement

- 给文档列表补真实 `updatedAt`
- 统一前端短时间格式
- 收敛编辑页标题层级
- 把滚动限制在主内容区

优点：
- 直接解决最明显的桌面端粗糙点
- 不改路由和核心工作流

缺点：
- 不会引入更大的信息架构变化

### Option 2: Redesign Documents Into Split View

- 文档索引和编辑页重新合成左右分栏
- 同页完成列表与编辑切换

优点：
- 信息密度更高

缺点：
- 与当前“二级工作区”原则冲突
- 需要大范围重写导航与状态

### Option 3: Focus Only On Styling

- 只改标题和滚动
- 暂不补真实更新时间

优点：
- 改动最小

缺点：
- 保留假数据，文档台仍不可信

## Decision

采用 Option 1。

## Design

### Documents Index

- `DocumentListItem` 新增 `updatedAt`。
- Tauri 后端的 `list_documents` 和 `search_documents` 直接返回真实更新时间。
- 前端文档表格中的 `更新时间` 列显示格式化后的真实时间。
- 路径列保持次级视觉，标题仍然是主入口。

### Document Workspace

- 标题从当前的展示型 serif 大标题收敛为编辑型标题层级，强调“工作状态”而不是“海报效果”。
- 顶部 `eyebrow` 保留路径语义，但标题字号和字重收紧，避免压过正文编辑面。

### Scroll Behavior

- `app-shell` 保持固定高度。
- `workspace` 自身不再承担整体滚动。
- `workspace__content` 成为主滚动容器。
- 文档编辑主区与右侧预览面板保持各自布局，但滚动优先由主内容区接管，避免整页滚动造成壳层漂移。

## Testing

- 在 `App.test.tsx` 增加文档列表显示真实更新时间的断言。
- 在 `DocumentEditor.test.tsx` 增加编辑工作区结构断言，确保标题使用新的编辑头部结构，并暴露主滚动内容容器。
- 保留现有保存、搜索、筛选与预览测试，避免回归。
