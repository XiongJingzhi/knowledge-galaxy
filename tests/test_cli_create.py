import io
import unittest
from contextlib import redirect_stdout

from tests.helpers import TemporaryRepo


class KGCreateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = TemporaryRepo()
        self.repo.create_standard_layout()

    def tearDown(self) -> None:
        self.repo.cleanup()

    def test_create_note_writes_file(self) -> None:
        from scripts.kg.app import main

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(
                [
                    "--repo",
                    str(self.repo.root),
                    "create",
                    "note",
                    "--title",
                    "Test Note",
                ]
            )

        self.assertEqual(exit_code, 0)

        note_path = self.repo.root / "notes" / "test-note.md"
        self.assertTrue(note_path.exists())

        content = note_path.read_text(encoding="utf-8")
        self.assertIn("title: Test Note", content)
        self.assertIn("slug: test-note", content)
        self.assertNotIn("<id>", content)
        self.assertNotIn("<created_at>", content)
        self.assertNotIn("<updated_at>", content)
        self.assertIn("notes/test-note.md", stdout.getvalue().strip())

    def test_create_daily_uses_date_path(self) -> None:
        from scripts.kg.app import main

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(
                [
                    "--repo",
                    str(self.repo.root),
                    "create",
                    "daily",
                    "--date",
                    "2026-03-11",
                ]
            )

        self.assertEqual(exit_code, 0)

        daily_path = self.repo.root / "dailies" / "2026" / "03" / "11.md"
        self.assertTrue(daily_path.exists())
        content = daily_path.read_text(encoding="utf-8")
        self.assertIn("date: 2026-03-11", content)
        self.assertIn("slug: 2026-03-11", content)
        self.assertIn("dailies/2026/03/11.md", stdout.getvalue().strip())

    def test_create_decision_uses_slug_path(self) -> None:
        from scripts.kg.app import main

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(
                [
                    "--repo",
                    str(self.repo.root),
                    "create",
                    "decision",
                    "--title",
                    "Pick SQLite",
                ]
            )

        self.assertEqual(exit_code, 0)

        decision_path = self.repo.root / "decisions" / "pick-sqlite.md"
        self.assertTrue(decision_path.exists())
        self.assertIn("decisions/pick-sqlite.md", stdout.getvalue().strip())

    def test_create_review_uses_slug_path(self) -> None:
        from scripts.kg.app import main

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(
                [
                    "--repo",
                    str(self.repo.root),
                    "create",
                    "review",
                    "--title",
                    "Weekly Review",
                    "--date",
                    "2026-03-11",
                ]
            )

        self.assertEqual(exit_code, 0)

        review_path = self.repo.root / "reviews" / "weekly-review.md"
        self.assertTrue(review_path.exists())
        content = review_path.read_text(encoding="utf-8")
        self.assertIn("date: 2026-03-11", content)
        self.assertIn("reviews/weekly-review.md", stdout.getvalue().strip())

    def test_create_project_uses_project_directory_and_git_worktree(self) -> None:
        from scripts.kg.app import main

        git_worktree = self.repo.create_git_worktree("external/alpha")

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(
                [
                    "--repo",
                    str(self.repo.root),
                    "create",
                    "project",
                    "--title",
                    "Alpha",
                    "--git-worktree",
                    str(git_worktree),
                ]
            )

        self.assertEqual(exit_code, 0)

        project_path = self.repo.root / "projects" / "alpha" / "README.md"
        self.assertTrue(project_path.exists())
        content = project_path.read_text(encoding="utf-8")
        self.assertIn("type: project", content)
        self.assertIn(f"git_worktree: {git_worktree.resolve()}", content)
        self.assertIn("projects/alpha/README.md", stdout.getvalue().strip())
