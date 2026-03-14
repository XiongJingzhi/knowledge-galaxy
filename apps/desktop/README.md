# Knowledge Galaxy Desktop

`apps/desktop` 是当前仓库中的 Tauri 桌面应用，用于手动管理 Knowledge Galaxy 知识库。

首版桌面端不重写核心业务逻辑，而是复用当前最完整的 Python CLI：

- Tauri 后端通过 `python3 -m implementations.python.kg` 调用现有命令
- 文档正文读取与保存由桌面端直接操作 Markdown 文件
- 默认知识仓库路径仍然是 `~/.knowledge-galax`

## 当前能力

桌面端当前采用“首页总览 + 文档中心 + 二级工作区”的信息架构：

- 首页：一屏承载全局搜索、概览卡和最近动态
- 文档页：表格化索引、搜索，以及通过筛选弹层按 `type/status/project/date/theme/tag/source` 过滤
- 文档工作区：创建或编辑文档时进入独立页面，左侧 Markdown 编辑，右侧实时预览，`createdAt/updatedAt/date` 自动生成并作为只读信息展示
- 资源页：查看 `asset-list`，按仓库级 / 项目级切换浏览，使用系统文件选择器导入资源，并查看当前选中资源的路径、作用域、项目、大小和 `sha256`
- 校验与导出页：`validate`、`document-list`、`manifest`、`change-list`、`asset-list`
- 项目页：`add-remote`、`fetch`、`push`、`sync`

桌面端当前也已经补上了更完整的视觉资产：

- 左侧品牌区加入桌面端专用的几何星系 logo
- 首页只做概览和搜索，不再默认把所有工作台直接展开
- 文档、资源和编辑区都提供空状态引导
- 文档编辑优先展示标题与 Markdown 正文，元数据退到次级信息区，避免占据主要工作面
- 整体视觉方向保持“结构星系控制台”，而不是普通后台风格

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

构建桌面端产物：

```bash
npm run build
```

这里的正式产物来自 `tauri build`，输出位于 `src-tauri/target/release/bundle/`。`vite build` 只是构建过程中的前端编译步骤，不是桌面端交付物。

## 设计约束

- 首页必须控制在一屏内，只负责概览、搜索和导航分发
- 具体编辑、导入、校验和项目操作应进入二级工作区，而不是继续堆回首页
- 首版只支持一个活动知识仓库，但会记录最近打开仓库
- Go / Rust CLI 当前不作为桌面端运行时后端
- 资源面板展示 `sha256` 与基础元数据，但当前不自动做去重处理，也不生成二进制缩略图预览
- 文档保存时会按当前 frontmatter 规范重写文件
- 当前视觉方向是“结构星系控制台”，后续继续增强时应保持这种高密度但可读的桌面工作台风格

## CI 与发布

桌面端已经接入仓库级 GitHub Actions：

- `ci.yml` 会执行桌面端组件测试、Tauri Rust 后端 `cargo check` 和桌面 bundle 构建
- `integration.yml` 会构建桌面端 Tauri bundle 并上传 artifact
- `release.yml` 会把桌面端 Tauri bundle 一并纳入 nightly 发布物

## 后续方向

- 补充端到端桌面验收测试
- 将最近仓库与界面偏好设置进一步结构化
- 在第二阶段评估将核心逻辑逐步迁入 Rust 后端，减少对 Python 运行时的依赖
