# GitHub Actions CI Implementation Plan

> 历史文档状态：本文记录 2026-03-11 的实施计划，不直接代表当前仓库状态。
> 当前权威文档：`README.md`、`.github/workflows/ci.yml`、`docs/specs/repository-layout.md`
> 当前实现根目录：`implementations/python/kg`、`implementations/go/kg`、`implementations/rust/kg`
> 如果正文与当前 workflow 不一致，请以当前 workflow 和 README 为准。

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add GitHub Actions CI that runs repository tests and builds multi-platform Go and Rust artifacts on pushes to `main` and pull requests.

**Architecture:** Use one workflow with a Linux test job plus separate Go and Rust matrix build jobs. Reuse the current source layout and root commands where practical, and upload build outputs as workflow artifacts.

**Tech Stack:** GitHub Actions, Python 3, Go, Rust, YAML

---

### Task 1: Add workflow structure

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Define triggers**

Add `push` on `main` and `pull_request`.

**Step 2: Add a repository test job**

Run checkout, Python setup, Go setup, Rust toolchain setup, and `make test`.

### Task 2: Add Go matrix builds

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Define Go matrix**

Build a matrix for `darwin/amd64`, `darwin/arm64`, `linux/amd64`, `linux/arm64`, and `windows/amd64`.

**Step 2: Build and upload artifacts**

Run module-root Go builds and upload each artifact.

### Task 3: Add Rust matrix builds

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Define Rust target matrix**

Use the matching Rust targets for macOS, Linux, and Windows.

**Step 2: Install targets, build, and upload artifacts**

Set up the Rust toolchain, add the requested target, build release binaries, and upload each artifact.
