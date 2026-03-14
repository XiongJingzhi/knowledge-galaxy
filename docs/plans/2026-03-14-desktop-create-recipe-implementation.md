# Desktop Create Recipe Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为桌面端创建中心增加模板配方卡片和按类型变化的上下文提示。

**Architecture:** 在 `App.tsx` 内部根据 `createForm.type` 渲染 recipe cards 和 type-specific hint，不改动后端协议。

**Tech Stack:** React 18、TypeScript、Vitest、CSS

---

### Task 1: 先写失败测试

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1:**
- 新增创建配方卡片渲染测试
- 新增点击 `project` 配方后的切换测试

**Step 2:**
Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: FAIL

### Task 2: 实现创建配方台与样式

**Files:**
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1:**
- 渲染五种配方卡片
- 点击卡片切换 `createForm.type`
- 渲染当前类型上下文说明

**Step 2:**
- 增加配方卡片和当前选中态样式

**Step 3:**
Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: PASS

### Task 3: 更新文档并完成验证

**Files:**
- Modify: `apps/desktop/README.md`
- Modify: `README.md`

**Step 1:**
- 说明创建中心已经提供模板配方卡片与类型提示

**Step 2:**
Run:

```bash
make test-desktop
make build-desktop
git diff --check
```

Expected: PASS
