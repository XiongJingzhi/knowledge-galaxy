# Desktop Document Dossier Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为桌面端文档编辑区增加档案条、标签摘要与复制路径动作。

**Architecture:** 在 `DocumentEditor.tsx` 内增加只依赖当前 `DocumentDetail` 的展示层与轻量交互，不改动 App 的数据流。

**Tech Stack:** React 18、TypeScript、Vitest、CSS

---

### Task 1: 先写失败测试

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.test.tsx`

**Step 1:**
- 新增元信息渲染测试
- 新增复制路径测试

**Step 2:**
Run: `cd apps/desktop && npm test -- src/components/DocumentEditor.test.tsx`

Expected: FAIL

### Task 2: 实现档案条与样式

**Files:**
- Modify: `apps/desktop/src/components/DocumentEditor.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1:**
- 增加档案条与标签带
- 实现复制路径动作与状态回写

**Step 2:**
- 为档案条增加与当前工作台一致的视觉样式

**Step 3:**
Run: `cd apps/desktop && npm test -- src/components/DocumentEditor.test.tsx`

Expected: PASS

### Task 3: 更新文档并完成验证

**Files:**
- Modify: `apps/desktop/README.md`
- Modify: `README.md`

**Step 1:**
- 说明桌面端编辑区已支持文档档案条与复制路径

**Step 2:**
Run:

```bash
make test-desktop
make build-desktop
git diff --check
```

Expected: PASS
