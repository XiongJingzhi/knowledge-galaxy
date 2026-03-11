import io
import textwrap
import unittest
from contextlib import redirect_stdout

from tests.helpers import TemporaryRepo


class KGQueryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = TemporaryRepo()
        self.repo.create_standard_layout()
        git_worktree = self.repo.create_git_worktree("external/atlas")
        self.repo.write_file(
            "notes/idea-note.md",
            self.document(
                document_type="note",
                title="Idea Note",
                slug="idea-note",
                document_id="note-1",
                summary="Useful summary",
                body="This idea should be searchable.",
            ),
        )
        self.repo.write_file(
            "decisions/choose-sqlite.md",
            self.document(
                document_type="decision",
                title="Choose SQLite",
                slug="choose-sqlite",
                document_id="decision-1",
                summary="Database choice",
                body="SQLite keeps the MVP simple.",
                extra_fields="theme: []\nproject: []\n",
            ),
        )
        self.repo.write_file(
            "projects/atlas/README.md",
            self.document(
                document_type="project",
                title="Atlas",
                slug="atlas",
                document_id="project-1",
                summary="Project workspace",
                body="Atlas uses a local git worktree.",
                extra_fields=f"git_worktree: {git_worktree.resolve()}\ntheme: []\n",
            ),
        )

    def tearDown(self) -> None:
        self.repo.cleanup()

    def test_list_returns_repository_documents(self) -> None:
        output = self.run_cli("list")

        self.assertIn("note\tIdea Note\tnotes/idea-note.md", output)
        self.assertIn("decision\tChoose SQLite\tdecisions/choose-sqlite.md", output)
        self.assertIn("project\tAtlas\tprojects/atlas/README.md", output)

    def test_list_type_filters_results(self) -> None:
        output = self.run_cli("list", "--type", "note")

        self.assertIn("note\tIdea Note\tnotes/idea-note.md", output)
        self.assertNotIn("decision\tChoose SQLite\tdecisions/choose-sqlite.md", output)

    def test_search_finds_matching_title_or_body(self) -> None:
        output = self.run_cli("search", "idea")

        self.assertIn("Idea Note", output)
        self.assertNotIn("Choose SQLite", output)

    def test_stats_returns_total_and_grouped_counts(self) -> None:
        output = self.run_cli("stats")

        self.assertIn("total\t3", output)
        self.assertIn("type:decision\t1", output)
        self.assertIn("type:note\t1", output)
        self.assertIn("type:project\t1", output)
        self.assertIn("status:inbox\t3", output)

    def run_cli(self, *args: str) -> str:
        from implementations.python.kg.app import main

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--repo", str(self.repo.root), *args])

        self.assertEqual(exit_code, 0)
        return stdout.getvalue()

    def document(
        self,
        document_type: str,
        title: str,
        slug: str,
        document_id: str,
        summary: str,
        body: str,
        extra_fields: str = "",
    ) -> str:
        return textwrap.dedent(
            f"""\
---
id: {document_id}
type: {document_type}
title: {title}
slug: {slug}
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: inbox
{extra_fields}tags: []
summary: {summary}
---

{body}
"""
        )
