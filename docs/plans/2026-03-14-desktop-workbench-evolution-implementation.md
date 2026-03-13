# Desktop Workbench Evolution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 升级桌面端的概览层、空状态反馈和整体视觉语言，让工作台更适合长期管理知识库。

**Architecture:** 保持现有 Tauri + React + Python CLI bridge 架构不变，只改前端状态组合、展示层 JSX 和样式。通过 `stats`、`documents`、`assets`、`projects` 现有数据源拼出概览视图，不新增后端协议。

**Tech Stack:** React 18、TypeScript、Vitest、CSS、Tauri v2

---

### Task 1: 为概览层和空状态写失败测试

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`
- Test: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

- 添加测试，覆盖：
  - 顶部概览区展示总文档数、资源数、最近仓库数
  - `stats.groups` 中的 `type/status/theme/source` 示例会被渲染
  - 当文档列表为空时显示空状态文案
  - 当存在搜索词或过滤条件时显示当前视图说明

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: FAIL，提示找不到概览文案或空状态文案。

**Step 3: Write minimal implementation**

- 在 `App.tsx` 中新增概览区、视图说明和文档空状态 JSX。

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/App.tsx apps/desktop/src/App.test.tsx
git commit -m "feat: add desktop overview layer"
```

### Task 2: 重构桌面端视觉系统

**Files:**
- Modify: `apps/desktop/src/styles.css`
- Modify: `apps/desktop/src/components/Sidebar.tsx`
- Modify: `apps/desktop/src/components/DocumentEditor.tsx`
- Modify: `apps/desktop/src/components/AssetTable.tsx`

**Step 1: Keep tests green before styling**

Run: `cd apps/desktop && npm test`

Expected: PASS

**Step 2: Write minimal implementation**

- 改造样式变量、布局层级、卡片视觉、概览卡片、空状态、按钮和列表反馈。
- 让 `Sidebar` 增加更强品牌和导航层级。
- 让 `DocumentEditor` 空状态、标题区和预览区更完整。
- 让 `AssetTable` 的空状态和记录卡片更易读。

**Step 3: Run tests**

Run: `cd apps/desktop && npm test`

Expected: PASS

**Step 4: Build desktop frontend**

Run: `make build-desktop`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/styles.css apps/desktop/src/components/Sidebar.tsx apps/desktop/src/components/DocumentEditor.tsx apps/desktop/src/components/AssetTable.tsx
git commit -m "feat: redesign desktop workbench visuals"
```

### Task 3: 更新桌面端文档并做最终验证

**Files:**
- Modify: `apps/desktop/README.md`
- Modify: `README.md`

**Step 1: Update docs**

- 在桌面端 README 中补充：
  - 当前已具备概览层
  - 当前工作台视觉方向
  - 现有空状态和过滤反馈说明
- 在根 README 里同步桌面端当前状态。

**Step 2: Run full verification**

Run:

```bash
make test-desktop
git diff --check
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/desktop/README.md README.md
git commit -m "docs: update desktop workbench docs"
```
