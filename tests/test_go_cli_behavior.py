import os
import subprocess
import unittest

from tests.helpers import TemporaryRepo, default_repo_path, install_fake_clipboard_tools


class GoCLIBehaviorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.home = TemporaryRepo()
        self.repo_root = default_repo_path(self.home.root)
        self.bin_dir = self.home.root / "bin"
        install_fake_clipboard_tools(self.bin_dir, "Go clipboard body.")
        self.env = {
            **os.environ,
            "HOME": str(self.home.root),
            "PATH": f"{self.bin_dir}{os.pathsep}{os.environ.get('PATH', '')}",
        }

    def tearDown(self) -> None:
        self.home.cleanup()

    def run_go(self, args: list[str], stdin_text: str | None = None) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["go", "run", "./cmd/kg", *args],
            cwd="implementations/go/kg",
            env=self.env,
            input=stdin_text,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_default_repo_create_note(self) -> None:
        result = self.run_go(["create", "note", "--title", "Go Default"])
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertTrue((self.repo_root / "notes" / "go-default.md").exists())

    def test_note_from_stdin(self) -> None:
        result = self.run_go(
            ["create", "note", "--title", "Go Stream", "--stdin"],
            stdin_text="Go stdin body.\n",
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertIn(
            "Go stdin body.",
            (self.repo_root / "notes" / "go-stream.md").read_text(encoding="utf-8"),
        )

    def test_append_daily(self) -> None:
        result = self.run_go(
            ["append", "daily", "--date", "2026-03-12"],
            stdin_text="Go append body.\n",
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        content = (self.repo_root / "dailies" / "2026" / "03" / "12.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("## Capture ", content)
        self.assertIn("Go append body.", content)

    def test_import_clipboard_note(self) -> None:
        result = self.run_go(["import", "clipboard", "note", "--title", "Go Clipboard"])
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertIn(
            "Go clipboard body.",
            (self.repo_root / "notes" / "go-clipboard.md").read_text(encoding="utf-8"),
        )

