# Desktop Knowledge Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为桌面端增加知识迁移能力，支持导入本地 `md/zip`，通过本地 `Ollama` 分类后写入知识星系标准文档目录。

**Architecture:** 在现有 `Assets` 页内增加知识迁移工作台，前端负责文件选择、预览和确认导入，Tauri Rust 后端负责读取源文件、调用本地 `Ollama`、生成迁移草稿并落库。导入后的文档继续复用现有文档列表、统计和活动回流链路。

**Tech Stack:** React 18, TypeScript, Vitest, Tauri 2, Rust, `reqwest`, `zip`, `serde_json`

---

### Task 1: Add failing UI tests for the migration workbench

**Files:**
- Modify: `apps/desktop/src/App.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- `Assets` page shows a `知识迁移` panel
- clicking `选择知识源` calls a new `chooseKnowledgeSourceFile`
- clicking `生成迁移预览` renders analyzed drafts
- clicking `导入知识` calls the import API and records activity

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: FAIL because the new API and UI do not exist yet.

**Step 3: Commit**

```bash
git add apps/desktop/src/App.test.tsx
git commit -m "test: cover desktop knowledge migration flow"
```

### Task 2: Add frontend types and API wrappers

**Files:**
- Modify: `apps/desktop/src/lib/types.ts`
- Modify: `apps/desktop/src/lib/api.ts`

**Step 1: Write minimal types**

Add:

- `KnowledgeMigrationDraft`
- `KnowledgeMigrationPreview`
- `KnowledgeMigrationImportResult`

Add API wrappers:

- `chooseKnowledgeSourceFile()`
- `analyzeKnowledgeMigration()`
- `importKnowledgeMigration()`

**Step 2: Run targeted tests**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: still FAIL, but now on missing UI wiring instead of missing types.

**Step 3: Commit**

```bash
git add apps/desktop/src/lib/types.ts apps/desktop/src/lib/api.ts
git commit -m "feat: add desktop knowledge migration api types"
```

### Task 3: Build the migration workbench UI

**Files:**
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/pages/AssetsPage.tsx`
- Modify: `apps/desktop/src/styles.css`

**Step 1: Add migration state to the app shell**

Track:

- selected migration file path
- selected model
- migration preview drafts
- migration warnings

**Step 2: Add workbench actions**

Wire:

- choose source file
- analyze preview
- import drafts
- refresh documents and stats after import
- record activity entries

**Step 3: Render the new panel**

In `AssetsPage.tsx`, add a `知识迁移` panel with:

- source file path
- model input
- preview button
- preview table/list
- import button

**Step 4: Run targeted tests**

Run: `cd apps/desktop && npm test -- src/App.test.tsx`

Expected: PASS for the new UI flow.

**Step 5: Commit**

```bash
git add apps/desktop/src/App.tsx apps/desktop/src/pages/AssetsPage.tsx apps/desktop/src/styles.css
git commit -m "feat: add desktop knowledge migration workbench"
```

### Task 4: Add failing Rust tests for migration parsing and persistence

**Files:**
- Modify: `apps/desktop/src-tauri/src/lib.rs`

**Step 1: Write failing unit tests**

Add tests for:

- detecting source kind from extension
- extracting `.md/.markdown/.txt` from zip bytes
- generating unique target paths on collision
- parsing model JSON into migration drafts

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && cargo test --manifest-path src-tauri/Cargo.toml migration`

Expected: FAIL because helpers are not implemented yet.

**Step 3: Commit**

```bash
git add apps/desktop/src-tauri/src/lib.rs
git commit -m "test: cover desktop migration backend helpers"
```

### Task 5: Implement Rust migration backend and Ollama bridge

**Files:**
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Modify: `apps/desktop/src-tauri/src/lib.rs`

**Step 1: Add dependencies**

Add minimal crates:

- `reqwest` with blocking/json/rustls features
- `zip`

**Step 2: Implement analysis helpers**

Add helper functions to:

- detect source kind
- read markdown source
- open zip and collect text entries
- build Ollama prompt
- call `http://127.0.0.1:11434/api/generate`
- parse structured JSON drafts

**Step 3: Implement import helpers**

Add helper functions to:

- slugify titles
- map types to repo directories
- generate unique target file path
- render migrated Markdown document
- write files into the repo

**Step 4: Expose Tauri commands**

Add:

- `analyze_knowledge_migration`
- `import_knowledge_migration`

Register both in the command handler.

**Step 5: Run Rust tests**

Run: `cd apps/desktop && cargo test --manifest-path src-tauri/Cargo.toml migration`

Expected: PASS.

**Step 6: Commit**

```bash
git add apps/desktop/src-tauri/Cargo.toml apps/desktop/src-tauri/src/lib.rs
git commit -m "feat: add desktop knowledge migration backend"
```

### Task 6: Update docs and verify end-to-end

**Files:**
- Modify: `README.md`
- Modify: `apps/desktop/README.md`
- Create: `docs/plans/2026-03-14-desktop-knowledge-migration-design.md`
- Create: `docs/plans/2026-03-14-desktop-knowledge-migration-implementation.md`

**Step 1: Update documentation**

Document:

- migration workbench location
- supported sources (`md/zip`)
- local `Ollama` requirement

**Step 2: Run verification**

Run:

```bash
cd apps/desktop && npm test
cd apps/desktop && npm run build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
git diff --check
```

Expected: all commands pass.

**Step 3: Commit**

```bash
git add README.md apps/desktop/README.md docs/plans/2026-03-14-desktop-knowledge-migration-design.md docs/plans/2026-03-14-desktop-knowledge-migration-implementation.md
git commit -m "docs: describe desktop knowledge migration"
```

### Task 7: Push the branch

**Files:**
- No file changes

**Step 1: Push**

Run:

```bash
git push origin main
```

Expected: push succeeds.
