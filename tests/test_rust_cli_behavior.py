import os
import json
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

    def test_export_manifest_returns_json(self) -> None:
        self.repo_root.mkdir(parents=True, exist_ok=True)
        (self.repo_root / "notes").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "notes" / "rust-note.md").write_text(
            """---
id: note-1
type: note
title: Rust Note
slug: rust-note
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: inbox
theme: []
project: []
tags: []
summary: ""
---

Body
""",
            encoding="utf-8",
        )

        result = self.run_rust(["export", "manifest"])
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["documents"][0]["path"], "notes/rust-note.md")

    def test_stats_include_theme_and_tag_counts(self) -> None:
        self.repo_root.mkdir(parents=True, exist_ok=True)
        (self.repo_root / "notes").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "notes" / "idea.md").write_text(
            """---
id: note-1
type: note
title: Idea
slug: idea
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: active
theme: ["knowledge"]
project: ["atlas"]
tags: ["idea", "mvp"]
source: ["field-notes"]
summary: ""
---

Body
""",
            encoding="utf-8",
        )

        result = self.run_rust(["stats"])
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertIn("theme:knowledge\t1", result.stdout)
        self.assertIn("tag:idea\t1", result.stdout)
        self.assertIn("tag:mvp\t1", result.stdout)
        self.assertIn("source:field-notes\t1", result.stdout)

    def test_import_asset_supports_repo_and_project_assets(self) -> None:
        source_file = self.home.root / "rust-asset.png"
        source_file.write_bytes(b"rust-asset")

        repo_result = self.run_rust(["import", "asset", "--file", str(source_file)])
        self.assertEqual(repo_result.returncode, 0, msg=repo_result.stderr)
        self.assertTrue((self.repo_root / "assets" / "rust-asset.png").exists())

        project_result = self.run_rust(
            [
                "import",
                "asset",
                "--file",
                str(source_file),
                "--project",
                "atlas",
                "--name",
                "cover.png",
            ]
        )
        self.assertEqual(project_result.returncode, 0, msg=project_result.stderr)
        self.assertTrue((self.repo_root / "projects" / "atlas" / "assets" / "cover.png").exists())

    def test_list_and_search_support_filters(self) -> None:
        self.repo_root.mkdir(parents=True, exist_ok=True)
        (self.repo_root / "notes").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "reviews").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "notes" / "idea.md").write_text(
            """---
id: note-1
type: note
title: Idea
slug: idea
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: active
theme: ["knowledge"]
project: ["atlas"]
tags: ["idea", "mvp"]
source: ["field-notes"]
summary: ""
---

Idea body
""",
            encoding="utf-8",
        )
        (self.repo_root / "reviews" / "weekly.md").write_text(
            """---
id: review-1
type: review
title: Weekly
slug: weekly
created_at: 2026-03-12T00:00:00Z
updated_at: 2026-03-12T00:00:00Z
status: inbox
date: 2026-03-12
theme: []
project: ["atlas"]
tags: []
summary: ""
---

Review body
""",
            encoding="utf-8",
        )
        (self.repo_root / "reviews" / "weekly-archive.md").write_text(
            """---
id: review-2
type: review
title: Weekly Archive
slug: weekly-archive
created_at: 2026-03-11T00:00:00Z
updated_at: 2026-03-11T00:00:00Z
status: inbox
date: 2026-03-11
theme: []
project: ["atlas"]
tags: []
summary: ""
---

Review archive body
""",
            encoding="utf-8",
        )

        list_result = self.run_rust(["list", "--status", "active", "--project", "atlas"])
        self.assertEqual(list_result.returncode, 0, msg=list_result.stderr)
        self.assertIn("note\tIdea\tnotes/idea.md", list_result.stdout)
        self.assertNotIn("Weekly", list_result.stdout)

        search_result = self.run_rust(["search", "review", "--date", "2026-03-12"])
        self.assertEqual(search_result.returncode, 0, msg=search_result.stderr)
        self.assertIn("review\tWeekly\treviews/weekly.md", search_result.stdout)
        self.assertNotIn("Weekly Archive", search_result.stdout)

        themed_result = self.run_rust(["list", "--theme", "knowledge", "--tag", "mvp"])
        self.assertEqual(themed_result.returncode, 0, msg=themed_result.stderr)
        self.assertIn("note\tIdea\tnotes/idea.md", themed_result.stdout)
        self.assertNotIn("Weekly", themed_result.stdout)

        source_result = self.run_rust(["search", "idea", "--source", "field-notes"])
        self.assertEqual(source_result.returncode, 0, msg=source_result.stderr)
        self.assertIn("note\tIdea\tnotes/idea.md", source_result.stdout)
