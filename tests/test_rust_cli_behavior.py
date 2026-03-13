import os
import subprocess
import unittest

from tests.helpers import TemporaryRepo, default_repo_path, install_fake_clipboard_tools


class RustCLIBehaviorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        subprocess.run(
            [
                "cargo",
                "+stable",
                "build",
                "--quiet",
                "--manifest-path",
                "implementations/rust/kg/Cargo.toml",
            ],
            cwd=".",
            check=True,
            capture_output=True,
            text=True,
        )
        cls.binary = "implementations/rust/kg/target/debug/kg"

    def setUp(self) -> None:
        self.home = TemporaryRepo()
        self.repo_root = default_repo_path(self.home.root)
        self.bin_dir = self.home.root / "bin"
        install_fake_clipboard_tools(self.bin_dir, "Rust clipboard body.")
        self.env = {
            **os.environ,
            "HOME": str(self.home.root),
            "PATH": f"{self.bin_dir}{os.pathsep}{os.environ.get('PATH', '')}",
        }

    def tearDown(self) -> None:
        self.home.cleanup()

    def run_rust(
        self, args: list[str], stdin_text: str | None = None
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [self.binary, *args],
            cwd=".",
            env=self.env,
            input=stdin_text,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_default_repo_create_note(self) -> None:
        result = self.run_rust(["create", "note", "--title", "Rust Default"])
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertTrue((self.repo_root / "notes" / "rust-default.md").exists())

    def test_note_from_stdin(self) -> None:
        result = self.run_rust(
            ["create", "note", "--title", "Rust Stream", "--stdin"],
            stdin_text="Rust stdin body.\n",
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertIn(
            "Rust stdin body.",
            (self.repo_root / "notes" / "rust-stream.md").read_text(encoding="utf-8"),
        )

    def test_append_daily(self) -> None:
        result = self.run_rust(
            ["append", "daily", "--date", "2026-03-12"],
            stdin_text="Rust append body.\n",
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        content = (self.repo_root / "dailies" / "2026" / "03" / "12.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("## Capture ", content)
        self.assertIn("Rust append body.", content)

    def test_import_clipboard_note(self) -> None:
        result = self.run_rust(
            ["import", "clipboard", "note", "--title", "Rust Clipboard"]
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertIn(
            "Rust clipboard body.",
            (self.repo_root / "notes" / "rust-clipboard.md").read_text(encoding="utf-8"),
        )

    def test_validate_reports_missing_asset_and_reference_links(self) -> None:
        self.repo_root.mkdir(parents=True, exist_ok=True)
        (self.repo_root / "notes").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "notes" / "broken.md").write_text(
            """---
id: note-1
type: note
title: Broken
slug: broken
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: inbox
theme: []
project: []
tags: []
summary: ""
---

![Diagram](../assets/missing.png)

[Source](../references/missing.md)
""",
            encoding="utf-8",
        )

        result = self.run_rust(["validate"])
        self.assertEqual(result.returncode, 1)
        self.assertIn("missing asset path", result.stdout)
        self.assertIn("missing reference path", result.stdout)
