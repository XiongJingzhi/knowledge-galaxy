# Knowledge Galaxy Desktop

`apps/desktop` 是当前仓库中的 Tauri 桌面应用，用于手动管理 Knowledge Galaxy 知识库。

首版桌面端不重写核心业务逻辑，而是复用当前最完整的 Python CLI：

- Tauri 后端通过 `python3 -m implementations.python.kg` 调用现有命令
- 文档正文读取与保存由桌面端直接操作 Markdown 文件
- 默认知识仓库路径仍然是 `~/.knowledge-galax`

## 当前能力

桌面端当前已经覆盖以下工作台：

- 概览带：总文档数、资源数、最近仓库数量，以及主要 type / status / theme 或 source 分布
- 最近操作：展示当前会话中的创建、保存、导入、校验、导出与项目命令结果
- 文档浏览：列表、搜索、按 `type/status/project/date/theme/tag/source` 过滤
- 文档编辑：frontmatter 字段编辑、Markdown 正文编辑与预览
- 创建中心：`daily / note / decision / review / project`
- 资源中心：查看 `asset-list`，按仓库级/项目级切换浏览，并导入仓库级或项目级资源
- 校验与导出：`validate`、`document-list`、`manifest`、`change-list`、`asset-list`
- 项目操作：`add-remote`、`fetch`、`push`、`sync`

桌面端当前也已经补上了更完整的反馈层：

- 文档、资源和编辑区都提供空状态引导
- 文档工作台会显示当前搜索或筛选组成的“当前视图”说明
- 创建、保存、导入、校验、导出与项目命令完成后，会进入“最近操作”反馈层
- 概览与列表共享同一套档案工作台视觉语言，而不是普通后台风格

## 运行依赖

- Node.js / npm
- Rust / Cargo
- Python 3

桌面端当前假定你是在本仓库内开发和运行，因此 Python CLI 模块路径依赖当前仓库源码。

## 本地开发

先安装前端依赖：

```bash
cd apps/desktop
npm install
```

运行组件测试：

```bash
npm test
cargo test --manifest-path src-tauri/Cargo.toml
```

启动桌面开发环境：

```bash
npm run tauri dev
```

构建前端与 Tauri 后端：

```bash
npm run build
cargo build --manifest-path src-tauri/Cargo.toml
```

## 设计约束

- 首版只支持一个活动知识仓库，但会记录最近打开仓库
- Go / Rust CLI 当前不作为桌面端运行时后端
- 资源面板展示 `sha256`，但当前不自动做去重处理
- 文档保存时会按当前 frontmatter 规范重写文件
- 当前视觉方向是“研究台 / 档案台”，后续继续增强时应保持这种高密度但可读的工作台风格

## 后续方向

- 补充端到端桌面验收测试
- 将最近仓库与界面偏好设置进一步结构化
- 在第二阶段评估将核心逻辑逐步迁入 Rust 后端，减少对 Python 运行时的依赖
