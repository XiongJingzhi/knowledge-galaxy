import io
import textwrap
import unittest
from contextlib import redirect_stdout

from tests.helpers import TemporaryRepo


class KGValidateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = TemporaryRepo()
        self.repo.create_standard_layout()

    def tearDown(self) -> None:
        self.repo.cleanup()

    def test_validate_returns_zero_for_valid_repository(self) -> None:
        from implementations.python.kg.app import main

        self.repo.write_file(
            "notes/valid-note.md",
            self.note_document(title="Valid Note", slug="valid-note", document_id="note-1"),
        )

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--repo", str(self.repo.root), "validate"])

        self.assertEqual(exit_code, 0)
        self.assertEqual(stdout.getvalue().strip(), "OK")

    def test_validate_accepts_repo_argument_after_subcommand(self) -> None:
        from implementations.python.kg.app import main

        self.repo.write_file(
            "notes/valid-note.md",
            self.note_document(title="Valid Note", slug="valid-note", document_id="note-1"),
        )

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["validate", "--repo", str(self.repo.root)])

        self.assertEqual(exit_code, 0)
        self.assertEqual(stdout.getvalue().strip(), "OK")

    def test_validate_returns_non_zero_for_missing_required_field(self) -> None:
        from implementations.python.kg.app import main

        self.repo.write_file(
            "notes/missing-title.md",
            self.note_document(title=None, slug="missing-title", document_id="note-1"),
        )

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--repo", str(self.repo.root), "validate"])

        self.assertEqual(exit_code, 1)
        self.assertIn("missing required field: title", stdout.getvalue())

    def test_validate_returns_non_zero_for_duplicate_ids(self) -> None:
        from implementations.python.kg.app import main

        shared_id = "duplicate-id"
        self.repo.write_file(
            "notes/first-note.md",
            self.note_document(title="First Note", slug="first-note", document_id=shared_id),
        )
        self.repo.write_file(
            "decisions/second-note.md",
            self.decision_document(title="Second Note", slug="second-note", document_id=shared_id),
        )

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--repo", str(self.repo.root), "validate"])

        self.assertEqual(exit_code, 1)
        self.assertIn("duplicate id: duplicate-id", stdout.getvalue())

    def test_validate_returns_non_zero_for_invalid_daily_path_or_slug(self) -> None:
        from implementations.python.kg.app import main

        self.repo.write_file(
            "dailies/2026/03/not-a-day.md",
            self.daily_document(
                title="2026-03-11",
                slug="wrong-slug",
                document_id="daily-1",
                date_value="2026-03-11",
            ),
        )

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--repo", str(self.repo.root), "validate"])

        self.assertEqual(exit_code, 1)
        output = stdout.getvalue()
        self.assertIn("invalid daily path", output)
        self.assertIn("daily slug must match date", output)

    def test_validate_accepts_project_document_with_git_worktree(self) -> None:
        from implementations.python.kg.app import main

        git_worktree = self.repo.create_git_worktree("external/alpha")
        self.repo.write_file(
            "projects/alpha/README.md",
            self.project_document(
                title="Alpha",
                slug="alpha",
                document_id="project-1",
                git_worktree=str(git_worktree.resolve()),
            ),
        )

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--repo", str(self.repo.root), "validate"])

        self.assertEqual(exit_code, 0)
        self.assertEqual(stdout.getvalue().strip(), "OK")

    def test_validate_rejects_project_document_with_non_git_worktree(self) -> None:
        from implementations.python.kg.app import main

        non_git_worktree = self.repo.root / "external" / "not-a-repo"
        non_git_worktree.mkdir(parents=True, exist_ok=True)
        self.repo.write_file(
            "projects/alpha/README.md",
            self.project_document(
                title="Alpha",
                slug="alpha",
                document_id="project-1",
                git_worktree=str(non_git_worktree.resolve()),
            ),
        )

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--repo", str(self.repo.root), "validate"])

        self.assertEqual(exit_code, 1)
        self.assertIn("git_worktree is not a git working tree", stdout.getvalue())

    def note_document(self, title: str | None, slug: str, document_id: str) -> str:
        title_line = f"title: {title}\n" if title is not None else ""
        return textwrap.dedent(
            f"""\
---
id: {document_id}
type: note
{title_line}slug: {slug}
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: inbox
theme: []
project: []
tags: []
summary: ""
---

Body
"""
        )

    def decision_document(self, title: str, slug: str, document_id: str) -> str:
        return textwrap.dedent(
            f"""\
---
id: {document_id}
type: decision
title: {title}
slug: {slug}
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: inbox
theme: []
project: []
tags: []
summary: ""
---

Body
"""
        )

    def daily_document(
        self, title: str, slug: str, document_id: str, date_value: str
    ) -> str:
        return textwrap.dedent(
            f"""\
---
id: {document_id}
type: daily
title: {title}
slug: {slug}
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: inbox
date: {date_value}
tags: []
summary: ""
---

Body
"""
        )

    def project_document(
        self, title: str, slug: str, document_id: str, git_worktree: str
    ) -> str:
        return textwrap.dedent(
            f"""\
---
id: {document_id}
type: project
title: {title}
slug: {slug}
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: inbox
git_worktree: {git_worktree}
theme: []
tags: []
summary: ""
---

Body
"""
        )
