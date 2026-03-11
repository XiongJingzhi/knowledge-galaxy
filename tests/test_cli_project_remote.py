import io
import subprocess
import unittest
from contextlib import redirect_stdout

from tests.helpers import TemporaryRepo


class KGProjectRemoteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = TemporaryRepo()
        self.repo.create_standard_layout()
        self.git_worktree = self.repo.create_git_worktree("external/atlas", with_commit=True)
        self.repo.write_file(
            "projects/atlas/README.md",
            self.project_document(
                title="Atlas",
                slug="atlas",
                document_id="project-1",
                git_worktree=str(self.git_worktree.resolve()),
            ),
        )

    def tearDown(self) -> None:
        self.repo.cleanup()

    def test_project_add_remote_configures_git_remote(self) -> None:
        remote = self.repo.create_bare_remote("remotes/atlas.git")

        output = self.run_cli(
            "project",
            "add-remote",
            "--project",
            "atlas",
            "--name",
            "origin",
            "--url",
            str(remote),
        )

        self.assertIn("origin", output)
        configured_url = self.git("remote", "get-url", "origin")
        self.assertEqual(configured_url, str(remote))

    def test_project_fetch_downloads_remote_refs(self) -> None:
        remote = self.repo.create_bare_remote("remotes/atlas.git")
        self.git("remote", "add", "origin", str(remote))
        self.git("push", "-u", "origin", self.current_branch())

        clone = self.repo.clone_remote("remotes/atlas.git", "clones/atlas")
        self.commit_in_repo(clone, "remote.txt", "remote change\n", "Add remote change")
        subprocess.run(
            ["git", "push", "origin", "HEAD"],
            cwd=clone,
            check=True,
            capture_output=True,
            text=True,
        )

        output = self.run_cli("project", "fetch", "--project", "atlas", "--remote", "origin")

        self.assertIn("fetched", output.lower())
        remote_head = self.git("rev-parse", f"refs/remotes/origin/{self.current_branch()}")
        local_head = self.git("rev-parse", "HEAD")
        self.assertNotEqual(remote_head, local_head)

    def test_project_push_updates_remote_branch(self) -> None:
        remote = self.repo.create_bare_remote("remotes/atlas.git")
        self.git("remote", "add", "origin", str(remote))

        self.commit_in_repo(
            self.git_worktree,
            "local.txt",
            "local change\n",
            "Add local change",
        )

        output = self.run_cli("project", "push", "--project", "atlas", "--remote", "origin")

        self.assertIn("pushed", output.lower())
        remote_branch_head = self.rev_parse_in_bare_remote(remote, self.current_branch())
        self.assertEqual(remote_branch_head, self.git("rev-parse", "HEAD"))

    def test_project_sync_fetches_and_pushes(self) -> None:
        remote = self.repo.create_bare_remote("remotes/atlas.git")
        self.git("remote", "add", "origin", str(remote))
        self.git("push", "-u", "origin", self.current_branch())

        clone = self.repo.clone_remote("remotes/atlas.git", "clones/atlas")
        self.commit_in_repo(clone, "remote.txt", "remote sync\n", "Remote sync change")
        subprocess.run(
            ["git", "push", "origin", "HEAD"],
            cwd=clone,
            check=True,
            capture_output=True,
            text=True,
        )
        self.git("fetch", "origin")
        self.git("merge", "--ff-only", f"origin/{self.current_branch()}")
        self.commit_in_repo(
            self.git_worktree,
            "local-sync.txt",
            "local sync\n",
            "Local sync change",
        )

        output = self.run_cli("project", "sync", "--project", "atlas", "--remote", "origin")

        self.assertIn("fetched", output.lower())
        self.assertIn("pushed", output.lower())
        remote_branch_head = self.rev_parse_in_bare_remote(remote, self.current_branch())
        self.assertEqual(remote_branch_head, self.git("rev-parse", "HEAD"))

    def run_cli(self, *args: str) -> str:
        from implementations.python.kg.app import main

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--repo", str(self.repo.root), *args])

        self.assertEqual(exit_code, 0)
        return stdout.getvalue()

    def git(self, *args: str) -> str:
        result = subprocess.run(
            ["git", *args],
            cwd=self.git_worktree,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()

    def current_branch(self) -> str:
        return self.git("branch", "--show-current")

    def commit_in_repo(
        self, repo_path, file_name: str, content: str, message: str
    ) -> None:
        target = repo_path / file_name
        target.write_text(content, encoding="utf-8")
        subprocess.run(
            ["git", "add", file_name],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )
        subprocess.run(
            ["git", "commit", "-m", message],
            cwd=repo_path,
            check=True,
            capture_output=True,
            text=True,
        )

    def rev_parse_in_bare_remote(self, remote_path, branch: str) -> str:
        result = subprocess.run(
            ["git", "rev-parse", f"refs/heads/{branch}"],
            cwd=remote_path,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()

    def project_document(
        self, title: str, slug: str, document_id: str, git_worktree: str
    ) -> str:
        return f"""---
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
