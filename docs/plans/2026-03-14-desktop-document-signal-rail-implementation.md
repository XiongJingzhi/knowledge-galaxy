# Desktop Document Signal Rail Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为桌面端文档工作台增加可点击的信号条，让统计分布可以直接转成聚焦视图。

**Architecture:** 在 `App.tsx` 中从 `stats.groups` 计算文档信号卡片，仅在 `documents` section 渲染。点击动作只更新前端 `filters/query` 状态。

**Tech Stack:** React 18、TypeScript、Vitest、CSS

---

### Task 1: 先写失败测试

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1:**
- 新增“渲染文档信号卡片”测试
- 新增“点击聚焦状态 active 后应用过滤并清空搜索”测试

**Step 2:**
Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: FAIL

### Task 2: 实现信号条与样式

**Files:**
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1:**
- 计算 `type/status/theme` 三张信号卡片
- 在文档工作台中渲染
- 点击动作更新 `filters` 和 `query`

**Step 2:**
- 增加信号条样式，视觉上与 hero 和概览带保持一致

**Step 3:**
Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: PASS

### Task 3: 更新文档并完成验证

**Files:**
- Modify: `apps/desktop/README.md`
- Modify: `README.md`

**Step 1:**
- 补充“文档信号条”的说明

**Step 2:**
Run:

```bash
make test-desktop
make build-desktop
git diff --check
```

Expected: PASS
