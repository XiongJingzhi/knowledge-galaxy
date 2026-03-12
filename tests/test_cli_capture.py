import io
import os
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

from tests.helpers import TemporaryRepo, default_repo_path, install_fake_clipboard_tools


class KGCaptureTests(unittest.TestCase):
    def setUp(self) -> None:
        self.home = TemporaryRepo()
        self.repo_root = default_repo_path(self.home.root)

    def tearDown(self) -> None:
        self.home.cleanup()

    def test_create_note_uses_default_repo_when_repo_is_omitted(self) -> None:
        from implementations.python.kg.app import main

        stdout = io.StringIO()
        with patch.dict(os.environ, {"HOME": str(self.home.root)}, clear=False):
            with redirect_stdout(stdout):
                exit_code = main(["create", "note", "--title", "Inbox Note"])

        self.assertEqual(exit_code, 0)
        note_path = self.repo_root / "notes" / "inbox-note.md"
        self.assertTrue(note_path.exists())
        self.assertIn("notes/inbox-note.md", stdout.getvalue().strip())

    def test_create_note_from_stdin_appends_body(self) -> None:
        from implementations.python.kg.app import main

        stdout = io.StringIO()
        stdin = io.StringIO("Captured body from stdin.\n")
        with patch.dict(os.environ, {"HOME": str(self.home.root)}, clear=False):
            with patch("sys.stdin", stdin):
                with redirect_stdout(stdout):
                    exit_code = main(
                        ["create", "note", "--title", "Streamed Note", "--stdin"]
                    )

        self.assertEqual(exit_code, 0)
        note_path = self.repo_root / "notes" / "streamed-note.md"
        self.assertIn("Captured body from stdin.", note_path.read_text(encoding="utf-8"))

    def test_append_daily_creates_file_and_appends_timestamp_block(self) -> None:
        from implementations.python.kg.app import main

        stdout = io.StringIO()
        stdin = io.StringIO("Daily capture entry.\n")
        with patch.dict(os.environ, {"HOME": str(self.home.root)}, clear=False):
            with patch("sys.stdin", stdin):
                with redirect_stdout(stdout):
                    exit_code = main(["append", "daily", "--date", "2026-03-12"])

        self.assertEqual(exit_code, 0)
        daily_path = self.repo_root / "dailies" / "2026" / "03" / "12.md"
        content = daily_path.read_text(encoding="utf-8")
        self.assertIn("## Capture ", content)
        self.assertIn("Daily capture entry.", content)
        self.assertIn("dailies/2026/03/12.md", stdout.getvalue().strip())

    def test_import_clipboard_note_reads_text_from_clipboard_command(self) -> None:
        from implementations.python.kg.app import main

        bin_dir = self.home.root / "bin"
        install_fake_clipboard_tools(bin_dir, "Clipboard note body.")
        stdout = io.StringIO()
        env = {
            "HOME": str(self.home.root),
            "PATH": f"{bin_dir}{os.pathsep}{os.environ.get('PATH', '')}",
        }
        with patch.dict(os.environ, env, clear=False):
            with redirect_stdout(stdout):
                exit_code = main(
                    ["import", "clipboard", "note", "--title", "Clipboard Note"]
                )

        self.assertEqual(exit_code, 0)
        note_path = self.repo_root / "notes" / "clipboard-note.md"
        self.assertIn("Clipboard note body.", note_path.read_text(encoding="utf-8"))

    def test_import_clipboard_note_rejects_empty_clipboard(self) -> None:
        from implementations.python.kg.app import main

        bin_dir = self.home.root / "bin"
        install_fake_clipboard_tools(bin_dir, "")
        stderr = io.StringIO()
        env = {
            "HOME": str(self.home.root),
            "PATH": f"{bin_dir}{os.pathsep}{os.environ.get('PATH', '')}",
        }
        with patch.dict(os.environ, env, clear=False):
            with redirect_stderr(stderr):
                exit_code = main(
                    ["import", "clipboard", "note", "--title", "Clipboard Note"]
                )

        self.assertEqual(exit_code, 1)
        self.assertIn("clipboard is empty", stderr.getvalue())

    def test_validate_and_stats_work_without_repo_argument(self) -> None:
        from implementations.python.kg.app import main

        stdout = io.StringIO()
        with patch.dict(os.environ, {"HOME": str(self.home.root)}, clear=False):
            with redirect_stdout(stdout):
                validate_exit = main(["validate"])
                stats_exit = main(["stats"])

        self.assertEqual(validate_exit, 0)
        self.assertEqual(stats_exit, 0)
        output = stdout.getvalue()
        self.assertIn("OK", output)
        self.assertIn("total\t0", output)
