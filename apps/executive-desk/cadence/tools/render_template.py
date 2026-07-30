#!/usr/bin/env python3
"""
Render a Jinja2 template with YAML/JSON input.

Usage:
  python3 render_template.py --template path/to/template.md --data path/to/input.yaml --out out.md
  python3 render_template.py --template template.md --data input.yaml
"""
import argparse
import sys
from pathlib import Path

try:
    import yaml
    import jinja2
except ImportError:
    print("Requires: pip3 install pyyaml jinja2")
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True, help="Path to template file")
    ap.add_argument("--data", required=True, help="Path to YAML/JSON input file")
    ap.add_argument("--out", default=None, help="Output file path (default: stdout)")
    args = ap.parse_args()

    tpl_text = Path(args.template).read_text()
    data = yaml.safe_load(Path(args.data).read_text()) or {}
    
    env = jinja2.Environment(loader=jinja2.BaseLoader(), autoescape=False)
    tpl = env.from_string(tpl_text)
    rendered = tpl.render(data)
    
    if args.out:
        Path(args.out).write_text(rendered)
        print(f"[✓] Rendered {args.template} -> {args.out}")
    else:
        print(rendered)


if __name__ == '__main__':
    main()