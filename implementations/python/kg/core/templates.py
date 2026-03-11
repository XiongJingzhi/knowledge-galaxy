from __future__ import annotations

from pathlib import Path

BUILTIN_TEMPLATES = {
    "daily": """---
id: <id>
type: daily
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
date: <date>
tags: []
summary: ""
---

## Notes

## Decisions

## Next
""",
    "decision": """---
id: <id>
type: decision
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
theme: []
project: []
tags: []
summary: ""
---

## Context

## Decision

## Consequences
""",
    "note": """---
id: <id>
type: note
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
theme: []
project: []
tags: []
summary: ""
---

## Summary

## Details
""",
    "project": """---
id: <id>
type: project
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
git_worktree: <git_worktree>
theme: []
tags: []
summary: ""
---

## Goal

## Status

## Notes
""",
    "reference": """---
id: <id>
type: reference
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
source: []
theme: []
project: []
tags: []
summary: ""
---

## Source

## Notes
""",
    "review": """---
id: <id>
type: review
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
date: <date>
theme: []
project: []
tags: []
summary: ""
---

## What Happened

## What Worked

## What To Change
""",
    "theme": """---
id: <id>
type: theme
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
tags: []
summary: ""
---

## Scope

## Key Questions
""",
}


def load_template(repo_root: Path, template_name: str) -> str:
    template_path = repo_root / "templates" / f"{template_name}.md"
    if template_path.exists():
        return template_path.read_text(encoding="utf-8")
    try:
        return BUILTIN_TEMPLATES[template_name]
    except KeyError as exc:
        raise FileNotFoundError(template_path) from exc


def render_template(template: str, replacements: dict[str, str]) -> str:
    rendered = template
    for key, value in replacements.items():
        rendered = rendered.replace(f"<{key}>", value)
    return rendered


def render_document(
    repo_root: Path, template_name: str, replacements: dict[str, str]
) -> str:
    template = load_template(repo_root, template_name)
    return render_template(template, replacements)
