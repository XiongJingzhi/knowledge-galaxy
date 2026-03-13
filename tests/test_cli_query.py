import io
import json
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
                status="active",
                extra_fields='theme: ["knowledge"]\nproject: ["atlas"]\nsource: ["field-notes"]\n',
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
                extra_fields='theme: ["systems"]\nproject: []\n',
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
        self.repo.write_file(
            "reviews/weekly-review.md",
            self.document(
                document_type="review",
                title="Weekly Review",
                slug="weekly-review",
                document_id="review-1",
                summary="Weekly status",
                body="Review body.",
                extra_fields='date: 2026-03-12\ntheme: []\nproject: ["atlas"]\n',
            ),
        )

    def tearDown(self) -> None:
        self.repo.cleanup()

    def test_list_returns_repository_documents(self) -> None:
        output = self.run_cli("list")

        self.assertIn("note\tIdea Note\tnotes/idea-note.md", output)
        self.assertIn("decision\tChoose SQLite\tdecisions/choose-sqlite.md", output)
        self.assertIn("project\tAtlas\tprojects/atlas/README.md", output)
        self.assertIn("review\tWeekly Review\treviews/weekly-review.md", output)

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

        self.assertIn("total\t4", output)
        self.assertIn("type:decision\t1", output)
        self.assertIn("type:note\t1", output)
        self.assertIn("type:project\t1", output)
        self.assertIn("type:review\t1", output)
        self.assertIn("status:active\t1", output)
        self.assertIn("status:inbox\t3", output)

    def test_list_supports_status_project_and_date_filters(self) -> None:
        output = self.run_cli("list", "--status", "active", "--project", "atlas")
        self.assertIn("note\tIdea Note\tnotes/idea-note.md", output)
        self.assertNotIn("Weekly Review", output)

        output = self.run_cli("list", "--date", "2026-03-12")
        self.assertIn("review\tWeekly Review\treviews/weekly-review.md", output)
        self.assertNotIn("Idea Note", output)

    def test_search_supports_status_project_and_date_filters(self) -> None:
        output = self.run_cli("search", "review", "--project", "atlas", "--date", "2026-03-12")
        self.assertIn("Weekly Review", output)
        self.assertNotIn("Idea Note", output)

        output = self.run_cli("search", "idea", "--status", "active")
        self.assertIn("Idea Note", output)

    def test_list_and_search_support_theme_tag_and_source_filters(self) -> None:
        output = self.run_cli("list", "--theme", "knowledge", "--tag", "mvp")
        self.assertIn("note\tIdea Note\tnotes/idea-note.md", output)
        self.assertNotIn("Choose SQLite", output)

        output = self.run_cli("search", "idea", "--source", "field-notes", "--theme", "knowledge")
        self.assertIn("Idea Note", output)
        self.assertNotIn("Weekly Review", output)

    def test_export_document_list_returns_json_rows(self) -> None:
        output = self.run_cli("export", "document-list")

        payload = json.loads(output)
        self.assertEqual(len(payload), 4)
        self.assertEqual(payload[0]["path"], "decisions/choose-sqlite.md")
        self.assertEqual(payload[1]["path"], "notes/idea-note.md")
        self.assertEqual(payload[2]["path"], "projects/atlas/README.md")
        self.assertEqual(payload[3]["path"], "reviews/weekly-review.md")

    def test_export_manifest_returns_snapshot_metadata(self) -> None:
        output = self.run_cli("export", "manifest")

        payload = json.loads(output)
        self.assertEqual(payload["total"], 4)
        self.assertIn("generated_at", payload)
        self.assertEqual(len(payload["documents"]), 4)

    def test_export_change_list_sorts_by_updated_at_desc(self) -> None:
        self.repo.write_file(
            "reviews/fresh-review.md",
            self.document(
                document_type="review",
                title="Fresh Review",
                slug="fresh-review",
                document_id="review-1",
                summary="Newest doc",
                body="Freshest update.",
                created_at="2026-03-12T00:00:00Z",
                updated_at="2026-03-12T12:00:00Z",
                extra_fields="date: 2026-03-12\ntheme: []\nproject: []\n",
            ),
        )

        output = self.run_cli("export", "change-list")

        payload = json.loads(output)
        self.assertEqual(payload[0]["path"], "reviews/fresh-review.md")
        self.assertEqual(payload[0]["updated_at"], "2026-03-12T12:00:00Z")

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
        status: str = "inbox",
        extra_fields: str = "",
        created_at: str = "2026-03-11T00:00:00Z",
        updated_at: str = "2026-03-11T00:00:00Z",
    ) -> str:
        return textwrap.dedent(
            f"""\
---
id: {document_id}
type: {document_type}
title: {title}
slug: {slug}
created_at: {created_at}
updated_at: {updated_at}
status: {status}
{extra_fields}tags: ["idea", "mvp"]
summary: {summary}
---

{body}
"""
        )
