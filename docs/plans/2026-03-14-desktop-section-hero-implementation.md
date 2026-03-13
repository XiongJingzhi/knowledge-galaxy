# Desktop Section Hero Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为桌面端增加按 section 切换的引导 hero，让用户在每个工作区都能看到推荐动作并可直接触发。

**Architecture:** 在 `App.tsx` 中根据当前 `section` 计算 hero 配置，渲染统一 hero 组件结构。hero 按钮只修改当前前端状态或调用现有 handler，不新增 Tauri / CLI 协议。

**Tech Stack:** React 18、TypeScript、Vitest、CSS

---

### Task 1: 写 hero 动作的失败测试

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

- 为文档工作台增加两个测试：
  - 点击“新建 Note”后切换到创建页，且类型为 `note`
  - 先输入搜索与状态筛选，再点击“重置视图”，查询与筛选被清空

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: FAIL，找不到 hero 动作按钮。

**Step 3: Write minimal implementation**

- 在 `App.tsx` 中新增 section hero
- 补文档工作台的两个 hero 动作

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: PASS

### Task 2: 设计 hero 样式

**Files:**
- Modify: `apps/desktop/src/styles.css`

**Step 1: Implement styles**

- 为 hero 增加标题、说明、动作按钮组、强调色块
- 与当前“研究台 / 档案台”视觉保持一致

**Step 2: Verify**

Run:

```bash
cd apps/desktop && npm test
make build-desktop
```

Expected: PASS

### Task 3: 更新文档并完成收尾验证

**Files:**
- Modify: `apps/desktop/README.md`
- Modify: `README.md`

**Step 1: Update docs**

- 说明桌面端新增工作区引导层与快捷动作

**Step 2: Final verification**

Run:

```bash
make test-desktop
git diff --check
```

Expected: PASS
