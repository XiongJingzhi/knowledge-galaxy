# 当前仓库布局

本文描述 2026-03-11 多语言重构之后，Knowledge Galaxy 工具仓库当前实际采用的源码布局。

`kg` 创建或操作的知识仓库，与本工具仓库是两套不同的目录结构。
如果省略 `--repo`，当前三种 CLI 实现都会默认使用 `~/.knowledge-galax` 作为知识仓库路径。

## 顶层结构

```text
apps/
  desktop
implementations/
  go/kg
  python/kg
  rust/kg
docs/
  plans/
  requirements/
  specs/
  tasks/
scripts/
  dev/
templates/
tests/
Makefile
README.md
```

## 各实现根目录

- `implementations/python/kg`：Python `kg` CLI 包，也是 `python3 -m implementations.python.kg` 的标准入口
- `implementations/go/kg`：Go 实现根目录，包含 Go module 与 `cmd/kg`
- `implementations/rust/kg`：Rust crate 根目录
- `apps/desktop`：Tauri 桌面应用根目录，前端为 React + TypeScript，后端通过 Python CLI bridge 调用现有命令

## 仓库级共享资源

- `docs/`：规格、需求、任务与历史计划文档
- `templates/`：仓库级 Markdown 模板
- `tests/`：仓库级验证，包含 Python 单测以及 Go / Rust 行为测试
- `scripts/dev/`：仅保留仓库级开发辅助脚本
- `bin/`：本地构建输出目录，不纳入 Git
- `dist/`：跨平台构建输出目录，不纳入 Git
- `apps/desktop/dist/`：桌面端前端构建产物目录，不纳入 Git
- `apps/desktop/src-tauri/target/`：桌面端 Tauri Rust 构建输出目录，不纳入 Git

## 标准命令入口

### Python

```bash
python3 -m implementations.python.kg --help
```

### Go

```bash
cd implementations/go/kg && go build ./cmd/kg
```

### Rust

```bash
cd implementations/rust/kg && cargo build
```

### 仓库级验证

```bash
make test
```

### 桌面端

```bash
cd apps/desktop
npm install
npm run tauri dev
```

## 默认知识仓库

三种 CLI 实现都支持省略 `--repo`。

省略后会解析到：

```text
~/.knowledge-galax
```

对于写入类操作，如果该目录不存在，CLI 会自动创建基础目录结构。

当前自动创建的基础目录包括：

```text
templates/
notes/
dailies/
decisions/
reviews/
references/
themes/
projects/
assets/
inbox/
indexes/
```

## 历史文档说明

`docs/plans/` 下有一些文档记录了更早期的仓库状态，因此会出现 `scripts/kg`、`cmd/kg`、`internal/kg`、`packages/rust` 等旧路径。

除非文档明确声明“反映当前实现”，否则这些内容都应当视为历史上下文，而不是当前操作入口。

关于当前文档与历史文档的治理规则，请参考 `docs/specs/documentation-governance.md`。
