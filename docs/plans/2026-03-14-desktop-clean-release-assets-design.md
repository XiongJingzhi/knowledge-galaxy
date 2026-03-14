# Desktop Clean Release Assets Design

## Goal

让 GitHub `nightly` release 里的桌面端产物只保留安装包级文件，不再把 Linux bundle 内部的动态链接库和辅助文件直接暴露为 release 资产。

## Problem

当前发布流程有两个问题：

1. `build-desktop` job 上传的是整个 `apps/desktop/src-tauri/target/release/bundle` 目录。
2. `nightly` job 对下载后的所有 artifact 使用 `find ... -type f` 直接拍平发布。

这样会把桌面 bundle 内部的 `.so`、解包目录文件和其他不面向终端用户的文件全部挂到 GitHub release 页面。

## Decision

发布策略收敛为“只发布安装包级产物”：

- 保留桌面端 Tauri 构建流程不变。
- 构建完成后，只从 bundle 目录中筛选安装包文件进入发布 artifact。
- GitHub release 只发布这些筛选后的安装包文件。

## Installer Allowlist

桌面端 release 只保留以下扩展名：

- `.dmg`
- `.deb`
- `.rpm`
- `.AppImage`
- `.msi`
- `.exe`

不再直接发布：

- `.so`
- `.dll`
- `.dylib`
- `.app`
- 解包目录
- updater 清单
- 其他 bundle 内部文件

## Workflow Changes

- `build-desktop` 新增筛选步骤，将安装包级产物复制到独立目录。
- `upload-artifact` 只上传这个独立目录。
- `nightly` 不再拍平 bundle 内所有文件，只发布筛选后的 artifact 文件。

## Verification

- 增加一个 workflow 配置测试，锁定 release workflow 不再上传整个 bundle 目录，也不再使用 `find ... -type f` 全量拍平。
- 更新 README，明确 nightly 只包含桌面端安装包，不包含 bundle 内部动态库。
