from __future__ import annotations

import json
from pathlib import Path
import sqlite3

from .frontmatter import parse_frontmatter_file
from .validation import iter_documents


def rebuild_index(repo_root: Path) -> Path:
    index_path = repo_root / "indexes" / "knowledge-galaxy.db"
    index_path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(index_path)
    try:
        connection.execute("DROP TABLE IF EXISTS documents")
        connection.execute(
            """
            CREATE TABLE documents (
                path TEXT PRIMARY KEY,
                id TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                slug TEXT NOT NULL,
                status TEXT NOT NULL,
                date TEXT,
                theme TEXT NOT NULL,
                project TEXT NOT NULL,
                tags TEXT NOT NULL,
                source TEXT NOT NULL,
                summary TEXT NOT NULL,
                body TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        for document_path in iter_documents(repo_root):
            metadata, body = parse_frontmatter_file(document_path)
            connection.execute(
                """
                INSERT INTO documents (
                    path, id, type, title, slug, status, date, theme, project,
                    tags, source, summary, body, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    document_path.relative_to(repo_root).as_posix(),
                    stringify(metadata.get("id")),
                    stringify(metadata.get("type")),
                    stringify(metadata.get("title")),
                    stringify(metadata.get("slug")),
                    stringify(metadata.get("status")),
                    stringify(metadata.get("date")),
                    encode_json_list(metadata.get("theme")),
                    encode_json_list(metadata.get("project")),
                    encode_json_list(metadata.get("tags")),
                    encode_json_list(metadata.get("source")),
                    stringify(metadata.get("summary")),
                    body.strip(),
                    stringify(metadata.get("created_at")),
                    stringify(metadata.get("updated_at")),
                ),
            )

        connection.commit()
    finally:
        connection.close()

    return index_path


def encode_json_list(value: object | None) -> str:
    if isinstance(value, list):
        return json.dumps(value)
    if value in (None, ""):
        return "[]"
    return json.dumps([str(value)])


def stringify(value: object | None) -> str:
    if value is None:
        return ""
    return str(value)
