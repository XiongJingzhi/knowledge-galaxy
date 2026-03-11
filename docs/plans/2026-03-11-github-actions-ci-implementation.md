# GitHub Actions CI Implementation Plan

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
