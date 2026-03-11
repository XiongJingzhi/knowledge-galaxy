import io
import unittest
from contextlib import redirect_stdout


class KGSmokeTests(unittest.TestCase):
    def test_help_returns_zero(self) -> None:
        from scripts.kg.app import main

        stdout = io.StringIO()
        with redirect_stdout(stdout):
            exit_code = main(["--help"])

        self.assertEqual(exit_code, 0)
        self.assertIn("usage:", stdout.getvalue())
