import argparse
from typing import Sequence


def build_parser() -> argparse.ArgumentParser:
    return argparse.ArgumentParser(prog="kg")


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    try:
        parser.parse_args(argv)
        return 0
    except SystemExit as exc:
        return int(exc.code)
