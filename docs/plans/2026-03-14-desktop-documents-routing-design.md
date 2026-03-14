# Desktop Documents Routing Design

## Goal

把桌面端精简为“首页概览 + 文档中心 + 二级创建页”的结构，删除独立创建模块，引入真实路由，并把桌面端构建与 CI 明确收敛为 Tauri/Rust 产物。

## Approved Scope

### 1. 文档中心化

- 保留 `文档`，删除独立 `创建`
- 首页不再承担文档创建分发职责
- 文档相关操作统一收口到文档路由下

### 2. 路由结构

桌面端使用 `react-router` 管理页面：

- `/` 首页
- `/documents` 文档索引页
- `/documents/new` 文档创建页
- `/assets`
- `/ops`
- `/projects`

这一轮不扩展到文档详情编辑资源路由，避免范围失控。

### 3. 文档索引页职责

`Documents` 页面只负责检索和进入：

- 放大的搜索入口
- 类型、状态、主题等逻辑分类筛选
- 表格化文档列表
- `新建文档` 动作

列表页不再内嵌编辑器。

### 4. 文档创建页职责

`/documents/new` 作为独立二级工作区：

- 左侧为 Markdown 编辑
- 右侧为 Markdown 预览
- 顶部只保留必要动作，例如返回列表和创建保存

旧的“配方台 + 创建中心 + 正文起草”三段式布局删除。

### 5. 桌面端构建原则

桌面端正式构建产物必须来自 Tauri/Rust：

- `vite build` 只是前端编译步骤，不作为桌面交付结果
- `make build-desktop` 与 CI 以 `tauri build` 为主
- 桌面端 release artifact 应为 Tauri 生成的应用产物，而不是 `dist/`

## Component Changes

- `App.tsx` 从本地 `section` 状态切换改为路由壳层与数据编排
- `Sidebar.tsx` 改为基于当前路由高亮导航
- `DocumentsPage.tsx` 重写为搜索、分类和表格列表页
- 新增 `DocumentCreatePage.tsx`
- `DocumentEditor.tsx` 收敛为左右布局的编辑与预览组件
- 删除 `CreatePage.tsx`
- 删除与独立创建页相关的状态、文案和测试

## Testing Strategy

- 更新 `App.test.tsx`，覆盖：
  - 创建导航不存在
  - 文档页显示表格化索引与分类筛选
  - 从文档页进入 `/documents/new`
  - 新建页存在左编辑右预览布局
- 增加构建配置与命令相关测试或校验
- 运行桌面端前端测试、Tauri 检查、桌面构建与 `git diff --check`

## Success Criteria

- 桌面端不再显示独立创建导航
- 文档列表页和创建页职责明确分离
- 桌面端使用真实路由切换页面
- 桌面端 CI 与 release 不再把 web `dist/` 当成最终产物
- 所有相关测试、构建和校验通过
