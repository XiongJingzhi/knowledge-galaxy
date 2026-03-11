# Knowledge Galaxy CLI MVP

Knowledge Galaxy includes a small Python CLI for creating Markdown documents from templates, validating repository content, and running simple repository queries through a derived SQLite index.

## Requirements

- Python 3
- No third-party dependencies

## Run The CLI

```bash
python3 -m scripts.kg --help
```

Use `--repo <path>` to point the CLI at a different repository root during testing or automation.

## Create Documents

```bash
python3 -m scripts.kg create note --title "Test Note"
python3 -m scripts.kg create daily --date 2026-03-11
python3 -m scripts.kg create decision --title "Choose SQLite"
python3 -m scripts.kg create review --title "Weekly Review" --date 2026-03-11
python3 -m scripts.kg create project --title "Atlas" --git-worktree ~/src/atlas
```

Each command prints the created relative path.

`create project` only accepts an already existing local git working directory. The CLI does not clone repositories or manage remotes, fetch, pull, or push.

## Validate Repository Content

```bash
python3 -m scripts.kg validate
```

The command prints `OK` when the repository is valid. Validation errors are printed one per line and the command exits non-zero.

## Query The Repository

```bash
python3 -m scripts.kg list
python3 -m scripts.kg list --type note
python3 -m scripts.kg search idea
python3 -m scripts.kg stats
```

`list`, `search`, and `stats` rebuild `indexes/knowledge-galaxy.db` before reading query results.
