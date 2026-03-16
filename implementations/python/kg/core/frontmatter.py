from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from uuid import uuid4


def generate_document_id() -> str:
    return str(uuid4())


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_frontmatter(text: str) -> tuple[dict[str, object], str]:
    if not text.startswith("---\n"):
        raise ValueError("missing frontmatter")

    end_marker = text.find("\n---\n", 4)
    if end_marker == -1:
        raise ValueError("unterminated frontmatter")

    frontmatter_block = text[4:end_marker]
    body = text[end_marker + 5 :]
    data: dict[str, object] = {}

    for line in frontmatter_block.splitlines():
        if not line.strip():
            continue
        key, separator, raw_value = line.partition(":")
        if not separator:
            raise ValueError(f"invalid frontmatter line: {line}")
        data[key.strip()] = parse_frontmatter_value(raw_value.strip())

    return data, body


def parse_frontmatter_file(path: Path) -> tuple[dict[str, object], str]:
    return parse_frontmatter(path.read_text(encoding="utf-8"))


def parse_frontmatter_value(value: str) -> object:
    if value.startswith("[") and value.endswith("]"):
        return json.loads(value)
    if value == '""':
        return ""
    return value
