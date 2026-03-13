# GitHub Actions CI Design

> 历史文档状态：本文记录 2026-03-11 的设计阶段，不直接代表当前仓库状态。
> 当前权威文档：`README.md`、`.github/workflows/ci.yml`、`docs/specs/repository-layout.md`
> 当前实现根目录：`implementations/python/kg`、`implementations/go/kg`、`implementations/rust/kg`
> 如果正文与当前 workflow 不一致，请以当前 workflow 和 README 为准。

**Date:** 2026-03-11

## Goal

Add a GitHub Actions workflow that runs repository tests and builds multi-platform Go and Rust artifacts for pushes to `main` and pull requests.

## Decision

Use a single workflow with three jobs:

1. `test`: run repository verification on Ubuntu using the root `Makefile`
2. `build-go`: build Go artifacts for a small OS/architecture matrix and upload artifacts
3. `build-rust`: build Rust artifacts for a small target matrix and upload artifacts

## Why

This keeps CI behavior easy to understand:

- tests are centralized in one job
- build failures are isolated by language/platform
- artifact upload is straightforward

## Scope

This change includes:

- `.github/workflows/ci.yml`
- CI triggers on `push` to `main` and `pull_request`
- artifact upload for Go and Rust build outputs

This change does not include:

- GitHub Releases automation
- signing, notarization, or packaging installers
- replacing local `Makefile` workflows
