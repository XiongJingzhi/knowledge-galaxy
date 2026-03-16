import io
from pathlib import Path
import subprocess
import unittest
from contextlib import redirect_stdout


class KGSmokeTests(unittest.TestCase):
    def test_help_returns_zero(self) -> None:
        from implementations.python.kg.app import main

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--help"])

        self.assertEqual(exit_code, 0)
        self.assertIn("usage:", stdout.getvalue())

    def test_help_returns_zero_with_system_python(self) -> None:
        system_python = Path("/usr/bin/python3")
        if not system_python.exists():
            self.skipTest("system python is unavailable")

        version = subprocess.run(
            [
                str(system_python),
                "-c",
                "import sys; print(f'{sys.version_info[0]}.{sys.version_info[1]}')",
            ],
            check=False,
            capture_output=True,
            text=True,
        )
        if version.returncode != 0:
            self.skipTest("failed to query system python version")
        version_parts = version.stdout.strip().split(".")
        if len(version_parts) != 2:
            self.skipTest("unexpected system python version format")
        major, minor = (int(version_parts[0]), int(version_parts[1]))
        if (major, minor) >= (3, 11):
            self.skipTest("system python already supports datetime.UTC")

        repo_root = Path(__file__).resolve().parents[1]
        result = subprocess.run(
            [str(system_python), "-m", "implementations.python.kg", "--help"],
            cwd=repo_root,
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertIn("usage:", result.stdout)
