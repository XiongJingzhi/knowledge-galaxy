# GitHub Actions CI Design

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
