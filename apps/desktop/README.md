# Knowledge Galaxy Desktop

`apps/desktop` 是当前仓库中的 Tauri 桌面应用，用于手动管理 Knowledge Galaxy 知识库。

首版桌面端不重写核心业务逻辑，而是复用当前最完整的 Python CLI：

- Tauri 后端通过 `python3 -m implementations.python.kg` 调用现有命令
- 文档正文读取与保存由桌面端直接操作 Markdown 文件
- 默认知识仓库路径仍然是 `~/.knowledge-galax`

## 当前能力

桌面端当前采用“首页总览 + 二级工作页”的桌面信息架构：

- 首页：一屏承载仓库切换、本地目录选择、全局搜索、结构总览、功能入口和最近操作
- 文档页：列表、搜索、按 `type/status/project/date/theme/tag/source` 过滤，配合文档信号条进入聚焦视图
- 文档编辑：frontmatter 字段编辑、Markdown 正文编辑与预览、文档档案条与路径复制
- 创建页：`daily / note / decision / review / project` 配方台
- 资源页：查看 `asset-list`，按仓库级 / 项目级切换浏览，并导入仓库级或项目级资源
- 校验与导出页：`validate`、`document-list`、`manifest`、`change-list`、`asset-list`
- 项目页：`add-remote`、`fetch`、`push`、`sync`

桌面端当前也已经补上了更完整的反馈层和视觉资产：

- 左侧品牌区加入桌面端专用的几何星系 logo
- 首页只做概览和分发，不再默认把所有工作台直接展开
- 文档、资源和编辑区都提供空状态引导
- 创建、保存、导入、校验、导出与项目命令完成后，结果会进入“最近操作”反馈层，并在首页和二级页都可见
- 各二级工作页都保留 section hero，用来解释当前区域职责，并提供快捷动作，例如新建 Note、重置文档视图、快速校验
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

构建前端与 Tauri 后端：

```bash
npm run build
cargo build --manifest-path src-tauri/Cargo.toml
```

## 设计约束

- 首页必须控制在一屏内，只负责概览、搜索和导航分发
- 具体编辑、导入、校验和项目操作应进入二级工作页，而不是继续堆回首页
- 首版只支持一个活动知识仓库，但会记录最近打开仓库
- Go / Rust CLI 当前不作为桌面端运行时后端
- 资源面板展示 `sha256`，但当前不自动做去重处理
- 文档保存时会按当前 frontmatter 规范重写文件
- 当前视觉方向是“结构星系控制台”，后续继续增强时应保持这种高密度但可读的桌面工作台风格

## CI 与发布

桌面端已经接入仓库级 GitHub Actions：

- `ci.yml` 会执行桌面端组件测试、前端构建和 Tauri Rust 后端 `cargo check`
- `integration.yml` 会构建桌面端前端产物并上传 artifact
- `release.yml` 会把桌面端前端产物一并纳入 nightly 发布物

## 后续方向

- 补充端到端桌面验收测试
- 将最近仓库与界面偏好设置进一步结构化
- 在第二阶段评估将核心逻辑逐步迁入 Rust 后端，减少对 Python 运行时的依赖
