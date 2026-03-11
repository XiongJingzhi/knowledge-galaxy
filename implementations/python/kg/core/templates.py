from __future__ import annotations

from pathlib import Path


def load_template(repo_root: Path, template_name: str) -> str:
    template_path = repo_root / "templates" / f"{template_name}.md"
    return template_path.read_text(encoding="utf-8")


def render_template(template: str, replacements: dict[str, str]) -> str:
    rendered = template
    for key, value in replacements.items():
        rendered = rendered.replace(f"<{key}>", value)
    return rendered


def render_document(
    repo_root: Path, template_name: str, replacements: dict[str, str]
) -> str:
    template = load_template(repo_root, template_name)
    return render_template(template, replacements)
