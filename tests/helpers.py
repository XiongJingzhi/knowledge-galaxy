from __future__ import annotations

import tempfile
from pathlib import Path


NOTE_TEMPLATE = """---
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
"""

DAILY_TEMPLATE = """---
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
"""

DECISION_TEMPLATE = """---
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

## Decision
"""

REVIEW_TEMPLATE = """---
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

## Review
"""


class TemporaryRepo:
    def __init__(self) -> None:
        self._temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self._temp_dir.name)

    def create_standard_layout(self) -> Path:
        (self.root / "templates").mkdir(parents=True, exist_ok=True)
        (self.root / "notes").mkdir(parents=True, exist_ok=True)
        (self.root / "dailies").mkdir(parents=True, exist_ok=True)
        (self.root / "decisions").mkdir(parents=True, exist_ok=True)
        (self.root / "reviews").mkdir(parents=True, exist_ok=True)
        (self.root / "templates" / "note.md").write_text(NOTE_TEMPLATE, encoding="utf-8")
        (self.root / "templates" / "daily.md").write_text(DAILY_TEMPLATE, encoding="utf-8")
        (self.root / "templates" / "decision.md").write_text(DECISION_TEMPLATE, encoding="utf-8")
        (self.root / "templates" / "review.md").write_text(REVIEW_TEMPLATE, encoding="utf-8")
        return self.root

    def write_file(self, relative_path: str, content: str) -> Path:
        path = self.root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def cleanup(self) -> None:
        self._temp_dir.cleanup()
