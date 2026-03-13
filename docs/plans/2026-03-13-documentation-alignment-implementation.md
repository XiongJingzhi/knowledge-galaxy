# 文档对齐实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让当前文档和历史文档都能正确反映当前代码，并补充未来文档治理规范。

**Architecture:** 先把当前权威文档更新到与代码一致，再给历史 plan 文档加状态头和关键旧路径校正，最后补一份长期文档治理规范。

**Tech Stack:** Markdown, repository search, CLI/runtime inspection

---

### Task 1: Update current authority docs

**Files:**
- Modify: `README.md`
- Modify: `docs/requirements/knowledge-galaxy-1.0.md`
- Modify: `docs/specs/knowledge-galaxy-1.0-spec.md`
- Modify: `docs/specs/repository-layout.md`
- Modify: `implementations/go/kg/README.md`
- Modify: `implementations/rust/kg/README.md`
- Modify: `skills/knowledge-galaxy-cli/SKILL.md`
- Modify: `skills/knowledge-galaxy-cli/INSTALL.md`

**Steps:**
1. Remove stale claims about `--repo` being required.
2. Document the current capture workflows and default repository behavior.
3. Document current Go/Rust behavior as runtime implementations with dedicated tests.
4. Mark still-missing 1.0 areas as planned rather than implemented.
5. Link to the future documentation governance spec.

### Task 2: Normalize tasks and specs against current code

**Files:**
- Modify: `docs/tasks/knowledge-galaxy-1.0-tasks.md`
- Modify: `docs/specs/knowledge-galaxy-1.0-spec.md`
- Modify: `docs/requirements/knowledge-galaxy-1.0.md`

**Steps:**
1. Keep completed items marked complete.
2. Keep unfinished items such as assets, exports, and reference/asset validation explicitly pending.
3. Add a short “implemented now vs planned later” note where needed.

### Task 3: Normalize historical plan documents

**Files:**
- Modify: `docs/plans/*.md`

**Steps:**
1. Add a standard historical status header to each plan/design document.
2. For files with the most misleading old paths, add direct current-path mapping notes.
3. Preserve historical content while preventing operational misuse.

### Task 4: Add future documentation governance

**Files:**
- Create: `docs/specs/documentation-governance.md`

**Steps:**
1. Define document classes: current authority vs historical records.
2. Define update rules when code changes.
3. Define minimum sync requirements for README/spec/task/skill docs after behavior changes.
4. Define historical-doc header requirements.

### Task 5: Verify consistency

**Files:**
- Verify only

**Steps:**
1. Search for stale claims in current docs.
2. Search for historical files missing the standard status header.
3. Review rendered Markdown for the new governance spec and updated current docs.
4. Commit and push after verification.
