---
name: knowledge-galaxy-cli
description: Use when managing a Knowledge Galaxy content repository through the kg CLI, especially for creating notes, capturing content, validating a repo, searching documents, viewing stats, or running project git operations against a target repository path.
---

# Knowledge Galaxy CLI

## Overview

Use this skill when the user wants to operate a Knowledge Galaxy content repository with `kg`.

`kg` is a CLI for knowledge repositories. It creates Markdown documents from templates, captures content into notes and dailies, validates repository structure, lists and searches documents, shows stats, and runs limited git operations for project entries.

The safest documented runtime path is the Python entrypoint:

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo ...
```

## When to Use

Use this skill when the user wants to:

- create a note, daily, decision, review, or project document
- validate a Knowledge Galaxy repository
- list, search, or inspect repository stats
- add/fetch/push/sync a project remote via a project document
- understand which `kg` command to run for a content-repository task

Do not use this skill for:

- developing the `kg` software itself
- changing CLI implementation details
- general git help unrelated to Knowledge Galaxy project documents

## Repository Assumptions

`kg` targets a content repository. If `--repo` is omitted, it uses `~/.knowledge-galax` and creates the base layout on demand.

The target repository should contain Knowledge Galaxy content directories such as:

- `notes/`
- `dailies/`
- `decisions/`
- `reviews/`
- `projects/`

Template behavior:

- If `<repo>/templates/<name>.md` exists, `kg` uses that external template.
- If the external template is missing, `kg` falls back to built-in templates.

## Primary Entry Points

Preferred:

```bash
python3 -m implementations.python.kg [--repo /path/to/content-repo] <command>
```

Other implementations exist but are secondary:

```bash
./bin/kg [--repo /path/to/content-repo] <command>
./bin/kg-rs [--repo /path/to/content-repo] <command>
```

When the user asks for the most reliable operational path, prefer Python unless they explicitly want Go or Rust.

## Common Tasks

### Create a note

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create note --title "Test Note"
```

### Create a daily note

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create daily --date 2026-03-12
```

### Append to a daily note

```bash
printf 'Captured for today\n' | python3 -m implementations.python.kg append daily
python3 -m implementations.python.kg --repo /path/to/content-repo append daily --date 2026-03-12 < capture.txt
```

### Create a note from stdin

```bash
printf 'Captured from stdin\n' | python3 -m implementations.python.kg create note --title "Streamed Note" --stdin
```

### Import a note from the clipboard

```bash
python3 -m implementations.python.kg import clipboard note --title "Clipboard Note"
```

### Create a decision record

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create decision --title "Choose SQLite"
```

### Create a review

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create review --title "Weekly Review" --date 2026-03-12
```

### Create a project entry

`create project` requires an existing local git worktree.

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo create project --title "Atlas" --git-worktree ~/src/atlas
```

### Validate a repository

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo validate
```

Expected success output:

```text
OK
```

### List documents

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo list
python3 -m implementations.python.kg --repo /path/to/content-repo list --type note
```

### Search documents

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo search idea
```

### Show stats

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo stats
```

### Manage project remotes

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo project add-remote --project atlas --name origin --url git@github.com:org/atlas.git
python3 -m implementations.python.kg --repo /path/to/content-repo project fetch --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project push --project atlas --remote origin
python3 -m implementations.python.kg --repo /path/to/content-repo project sync --project atlas --remote origin
```

## Output Expectations

- `create ...` prints the created relative path
- `validate` prints `OK` on success or one error per line on failure
- `list` prints tab-separated `type`, `title`, and `path`
- `search` prints matching rows in the same tab-separated format
- `stats` prints `total`, then grouped counts
- `project ...` prints tab-separated project operation results

## Common Mistakes

- Assuming `--repo` is mandatory
  Fix: omit it to use `~/.knowledge-galax`, or pass it explicitly when targeting another repository.

- Pointing `--repo` at this software repository instead of the content repository
  Fix: use the external knowledge repo, not the tooling repo.

- Using `create project` with a non-git directory
  Fix: pass an existing local git worktree.

- Assuming external templates are required
  Fix: they are optional now; missing templates fall back to built-in ones.

## References

- Repository overview: `README.md`
- Current source layout: `docs/specs/repository-layout.md`
- Go implementation notes: `implementations/go/kg/README.md`
- Rust implementation notes: `implementations/rust/kg/README.md`
