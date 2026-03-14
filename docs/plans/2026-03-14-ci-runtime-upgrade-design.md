# CI Runtime Upgrade Design

## Goal

升级 GitHub Actions workflow 里使用的 action 版本，消除 Node 20 runtime 弃用告警，并修正 Go setup 缓存配置导致的 `go.sum` 缺失警告。

## Problem

当前工作流存在两类问题：

- `actions/checkout@v4`、`actions/setup-node@v4` 等旧版 action 仍运行在旧 runtime 上，GitHub 已开始提示 Node 20 runtime 弃用。
- `actions/setup-go@v5` 默认尝试做 Go module 缓存，但仓库根目录没有 `go.sum`，导致 CI 出现 `Dependencies file is not found ... go.sum` 警告。

## Decision

统一升级 workflow action 版本，并显式关闭当前不需要的 Go 缓存。

### Action Versions

- `actions/checkout@v5`
- `actions/setup-node@v5`
- `actions/setup-go@v6`
- `actions/setup-python@v6`

保留：

- `actions/upload-artifact@v4`
- `actions/download-artifact@v4`
- `softprops/action-gh-release@v2`

## Cache Strategy

当前 Go job 只是交叉编译单个命令，不需要依赖仓库根目录的 module cache 自动发现。

因此：

- 在所有 `setup-go` 步骤中显式设置 `cache: false`
- 避免 GitHub Action 自动寻找不存在的 `go.sum`

## Scope

修改以下 workflow：

- `.github/workflows/ci.yml`
- `.github/workflows/integration.yml`
- `.github/workflows/release.yml`

同时更新 README 中对 CI/release 的说明，确保文档和当前实现一致。

## Verification

- 增加一个 workflow 配置测试，锁定 action 版本和 `setup-go` 的 `cache: false`
- 全量运行桌面端测试、Rust 检查、Tauri 构建与 `git diff --check`
