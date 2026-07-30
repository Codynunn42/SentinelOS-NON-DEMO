#!/usr/bin/env python3
"""
Render Jinja2 templates found under apps/executive-desk/cadence/templates.

Usage:
  render_template.py --dir <repo-root> [--dry-run]
"""

import argparse
import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

def render_all(repo_root: Path, out_dir: Path, dry_run: bool):
    # Templates are usually at <repo_root>/apps/executive-desk/cadence/templates.
    # If the provided repo_root already points to the 'apps/executive-desk' folder
    # then prefer <repo_root>/cadence/templates to avoid duplicated paths.
    repo_root_resolved = repo_root.resolve()
    candidate_direct = repo_root_resolved / "apps" / "executive-desk" / "cadence" / "templates"
    candidate_shallow = repo_root_resolved / "cadence" / "templates"

    # Decide which candidate to use
    if (repo_root_resolved.name == "executive-desk") and (candidate_shallow.exists()):
        tmpl_dir = candidate_shallow
    elif candidate_direct.exists():
        tmpl_dir = candidate_direct
    else:
        # fallback: prefer shallow path if it exists, otherwise direct path
        tmpl_dir = candidate_shallow if candidate_shallow.exists() else candidate_direct

    print(f"[render] repo_root: {repo_root_resolved}")
    print(f"[render] looking for templates in: {tmpl_dir}")
    tmpl_dir = repo_root / "apps" / "executive-desk" / "cadence" / "templates"
    print(f"[render] repo_root: {repo_root}")
    print(f"[render] looking for templates in: {tmpl_dir}")
    if not tmpl_dir.is_dir():
        print(f"[render] No templates directory found: {tmpl_dir}")
        return 1

    env = Environment(
        loader=FileSystemLoader(str(tmpl_dir)),
        autoescape=select_autoescape()
    )

    # Load optional context file
    context_path = tmpl_dir / "context.yaml"
    ctx = {}
    if context_path.exists():
        try:
            import yaml
            with open(context_path, "r", encoding="utf-8") as f:
                ctx = yaml.safe_load(f) or {}
        except Exception as e:
            print(f"[render] Warning: failed to load context.yaml: {e}")

    for tpl in tmpl_dir.glob("*.j2"):
        name = tpl.name
        out_name = tpl.stem  # remove .j2
        if dry_run:
            print(f"[render] Dry-run: would render {name} -> {out_dir / out_name} (template size: {tpl.stat().st_size} bytes)")
        else:
            template = env.get_template(name)
            rendered = template.render(**ctx)
            out_path = out_dir / out_name
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_text(rendered, encoding="utf-8")
            print(f"[render] Rendered {name} -> {out_path}")
    return 0

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="Repository root directory")
    ap.add_argument("--out", default=None, help="Output directory (defaults to repo root/cadence)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    repo_root = Path(args.dir).resolve()
    out_dir = Path(args.out).resolve() if args.out else repo_root / "apps" / "executive-desk" / "cadence"
    return_code = render_all(repo_root, out_dir, args.dry_run)
    raise SystemExit(return_code)

if __name__ == "__main__":
    main()
