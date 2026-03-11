# Embedded Template Fallback Design

**Date:** 2026-03-11

## Goal

Unify template loading across the Python, Go, and Rust `kg` implementations so each implementation prefers repository-local templates under `<repo>/templates/` but falls back to built-in templates when those files are missing.

## Decision

All three implementations will follow the same runtime rule:

1. Look for `templates/<name>.md` inside the external repository passed by `--repo`.
2. If the file exists, read and use it.
3. If the file does not exist, use a built-in template embedded in the implementation.
4. If the template name is unknown to the implementation, return the current failure behavior.

## Why

The current Rust binary fails when pointed at a repository that does not carry a `templates/` directory because it treats external templates as mandatory. The same dependency exists conceptually in Python and Go. Embedded fallback fixes standalone binary usability without removing template override flexibility for custom repositories.

## Scope

This change includes:

- Python built-in template fallback
- Go built-in template fallback
- Rust built-in template fallback
- Tests proving fallback behavior at least on the Python path
- Local implementation README updates if needed

This change does not include:

- Removing the root `templates/` directory
- Changing template placeholder syntax
- Rewriting CLI command behavior outside template loading

## Notes

- External repository templates stay supported and remain the first choice.
- Built-in templates should mirror the current root templates exactly so output stays consistent.
