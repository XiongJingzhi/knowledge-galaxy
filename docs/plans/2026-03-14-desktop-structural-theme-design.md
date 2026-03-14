# Knowledge Galaxy 桌面端结构宇宙主题设计

## 目标

把 `apps/desktop` 从当前偏暖的“档案后台”推进到与 `docs/constitution.md`、`docs/design.md` 一致的“结构宇宙工作台”。

本轮重点不是新增后端能力，而是统一桌面端的视觉母题、顶层结构和各工作区气质，让桌面端看起来像一个长期使用的知识控制台，而不是一组浅色表单卡片。

## 当前问题

1. 视觉基底偏离设计规范
当前主工作区是暖纸色与浅面板，和设计规范要求的深蓝黑结构空间不一致。

2. 结构母题不完整
虽然已有 overview、activity、hero、signal rail、dossier strip，但这些模块仍像独立卡片，没有被统一进同一套 grid / orbit / core 语言。

3. 桌面端缺少总控感
仓库信息、当前 section、统计摘要和最近操作没有形成明显的“桌面控制层”，用户进入界面后第一眼仍像普通后台。

## 方案比较

### 方案 A：只替换配色

优点：
- 改动最小
- 风险低

缺点：
- 只是换肤
- 无法建立桌面端控制台感

### 方案 B：结构宇宙主题重构

优点：
- 与设计规范一致
- 可以统一 overview、activity、hero、panel 的语言
- 不需要改后端协议

缺点：
- 会改 `App.tsx`、`Sidebar.tsx`、`styles.css` 和测试

### 方案 C：继续增加新业务模块

优点：
- 看起来“内容更多”

缺点：
- 主要矛盾不是功能缺失，而是整体设计语言不统一

## 采用方案

采用方案 B。

## 设计方向

桌面端采用“深色结构宇宙 / 桌面控制台”方向：

- 整体切换到深蓝黑背景和低对比网格
- 用橙色作为唯一行动信号色
- 在主区域顶部建立一个新的 desk masthead，集中展示：
  - 当前仓库
  - 当前 section
  - 核心统计摘要
  - 当前工作语义
- 用轨道线、结构边框、核心光晕作为氛围元素，但保持克制，不做情绪化动效
- 所有 panel、列表、表单、空状态统一为低对比深色卡片体系

## 信息结构调整

### 1. 顶部控制层

在仓库切换区之下、overview 之上增加桌面端 masthead：

- 左侧为当前 section 的标题与说明
- 右侧为 repo / total / assets / projects 等关键指标
- 中间加入结构线与核心标记，强化“control desk”感

### 2. Overview 与 Activity 视觉重组

- overview 卡片改为深色数据模块
- activity feed 改为更接近日志条带和任务回流面板
- 数值、标签、说明文字的层级拉开

### 3. 各 section 工作区统一

- documents / create / assets / ops / projects 使用同一套 panel 和 field 基底
- hero、signal rail、dossier strip 都改到统一设计语言下
- 空状态改为“系统暂未返回内容”的冷静表达

## 样式原则

- 默认深色主题，不提供浅色模式
- 不使用夸张渐变、玻璃拟态泛滥、彩色噪声
- 保留微弱结构动效和光晕，但避免娱乐化
- 使用明确的标题层级和编号感，强化工作台秩序

## 测试策略

本轮依旧以结构和文案测试为主，不做 CSS 快照：

- `App.test.tsx`
  - 新 masthead 出现并展示当前 section 文案
  - 仓库摘要指标出现
  - 现有 overview / signal / create 流程回归通过

## 不做的内容

- 不改 Tauri / Python CLI / Go / Rust 协议
- 不新增业务命令
- 不引入复杂动画库
- 不重写现有组件拆分结构
