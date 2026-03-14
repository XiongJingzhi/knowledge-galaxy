# Desktop Shell And Panel System Design

## Goal

继续推进桌面端，把顶部仓库切换区升级成真正的 command bar，并把文档页、创建页、资源页等二级工作区统一成更清晰的 dashboard/panel 系统。

## Context

当前首页已经进入 dashboard 方向，Markdown 编辑器也已经强化。但桌面端仍有两个明显割裂：

- 顶部 `RepoSwitcher` 还是旧式“说明文案 + 输入框 + 按钮”的表单结构，不像桌面命令条
- 二级页仍然保留上一阶段的 panel 组合方式，和首页的新 dashboard 语言不完全统一

这会导致首页和功能页之间的视觉跳变偏大，桌面感不够完整。

## Design Direction

### 1. 顶部改成 Command Bar

仓库切换区从“表单头部”改成“命令台”：

- 左侧是简短的命令语义标题和仓库状态
- 中间是主输入区
- 右侧是动作按钮
- 下方是最近仓库 chips

目标是像桌面应用的全局 command bar，而不是后台表单。

### 2. 二级页统一成 Panel Desk

文档、创建、资源三类页面都进入统一桌面 panel 体系：

- 顶部保留较轻的 section hero
- 主体通过 `panel-cluster`/`panel-stack` 控制组合方式
- 标题、副说明、辅助统计位置统一

这样首页和功能页会共享同一种“桌面控制台”语法。

### 3. 文档页强化探索面板

文档页除了编辑器外，还需要一个更清晰的“探索面板”：

- 搜索、当前视图、信号条和筛选收纳成统一的 explorer shell
- 列表区更像“文档队列”而不是普通按钮列表
- 编辑器仍然保持上一轮的 Markdown 主工作区

### 4. 创建页和资源页提升模块秩序

创建页和资源页要减少“表单直接铺开”的感觉：

- 创建页：模板选择、配方上下文、字段输入、正文输入各自成为明确模块
- 资源页：过滤、资源清单、导入区三者层次更稳定

## Styling Changes

- 新增 `command-bar` 相关样式
- 新增 `panel-cluster`、`panel-shell`、`desk-panel` 类型样式
- 统一 section hero 和 panel header 的密度
- 让二级页的留白和首页更接近，但不复制首页布局

## Testing Strategy

- 新增桌面壳层测试，确认 command bar 语义和最近仓库 chips 仍可用
- 新增文档页布局测试，确认探索面板标题和过滤区块存在
- 回归运行现有桌面端组件测试、构建和 Tauri 校验

## Success Criteria

- 顶部仓库切换区更像桌面命令条
- 首页和二级页视觉语言更连续
- 文档页探索区、创建页和资源页模块层次更清晰
- 现有行为测试不回退
