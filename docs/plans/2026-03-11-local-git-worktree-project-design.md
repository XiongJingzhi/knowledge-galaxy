# Local Git Worktree Project Support Design

**Date:** 2026-03-11

## Goal

Add project-level support for an already existing local git working directory without adding any remote management behavior.

## Decision

Use a new CLI flow:

- `kg create project --title <title> --git-worktree <path>`

This command creates `projects/<slug>/README.md` from `templates/project.md` and records the local git working directory path in frontmatter.

The CLI only accepts paths that already exist locally and resolve to a git working tree. It does not clone repositories, configure remotes, or run sync operations.

## Why This Approach

This fits the current repository model because `project` is already a first-class document type in the specification and template set, but the CLI MVP does not yet create or validate it.

It also keeps the operational boundary narrow:

- Knowledge Galaxy stores metadata about a project workspace
- the user owns the remote workflow
- nested repository management stays out of scope

## Data Model

Add one optional project-specific frontmatter field:

- `git_worktree`: absolute or resolved local filesystem path

Rules:

- only meaningful for `project` documents
- must point to an existing directory
- directory must be recognized by `git rev-parse --is-inside-work-tree`

## Validation

Repository validation should now:

- include `project` in supported types
- scan `projects/**/README.md`
- require project documents to live at `projects/<slug>/README.md`
- verify `git_worktree` when present

## Indexing

The SQLite index should include project documents the same way it includes other document types so `list`, `search`, and `stats` can see them.

## Out Of Scope

- cloning repositories
- creating or updating remotes
- fetch, pull, push, branch, or status automation
- symlink management
