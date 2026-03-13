# Desktop Activity Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为桌面端增加固定的最近操作反馈层，让关键动作完成后能在全局界面中留下可见回声。

**Architecture:** 在 `App.tsx` 内增加轻量活动状态数组和统一记录函数，各成功 handler 只追加最近操作，不改后端接口。通过前端 JSX 与 CSS 渲染固定反馈面板，并保留原有局部结果面板。

**Tech Stack:** React 18、TypeScript、Vitest、CSS、Tauri v2

---

### Task 1: 为最近操作写失败测试

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

- 在已有创建、导入资源、项目命令测试中追加断言：
  - 创建后出现“已创建文档”
  - 导入资源后出现“已导入资源”
  - 项目命令后出现“已执行项目命令”

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: FAIL，找不到最近操作文案。

**Step 3: Write minimal implementation**

- 在 `App.tsx` 增加活动状态与记录函数
- 在成功 handler 中调用记录函数
- 渲染最近操作区域

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/App.tsx apps/desktop/src/App.test.tsx
git commit -m "feat: add desktop activity feedback"
```

### Task 2: 统一最近操作的视觉样式

**Files:**
- Modify: `apps/desktop/src/styles.css`

**Step 1: Style the feedback section**

- 为最近操作面板增加标题、时间线式卡片、主次文字和强调色
- 保持与当前“研究台 / 档案台”视觉一致

**Step 2: Run tests and build**

Run:

```bash
cd apps/desktop && npm test
make build-desktop
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/desktop/src/styles.css
git commit -m "feat: style desktop activity feed"
```

### Task 3: 更新文档并完成最终验证

**Files:**
- Modify: `apps/desktop/README.md`
- Modify: `README.md`

**Step 1: Update docs**

- 说明桌面端现在具备最近操作反馈层
- 明确它用于展示当前会话内的关键成功动作

**Step 2: Final verification**

Run:

```bash
make test-desktop
git diff --check
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/desktop/README.md README.md
git commit -m "docs: document desktop activity feedback"
```
