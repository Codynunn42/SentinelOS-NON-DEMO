#!/usr/bin/env python3
"""
Merge Builder-captured metadata into evidence_record.yaml and refresh MANIFEST.sha256

Usage:
  python3 update_evrun_evidence.py --evidence-dir apps/executive-desk/evidence/EV-RUN-002-001
"""
import argparse
import hashlib
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Requires: pip3 install pyyaml")
    sys.exit(1)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def merge_yaml(target_path: Path, sources: list):
    if not target_path.exists():
        target = {}
    else:
        target = yaml.safe_load(target_path.read_text()) or {}

    merged_count = 0
    for src in sources:
        if not src.exists():
            continue
        data = yaml.safe_load(src.read_text()) or {}
        for k, v in data.items():
            target[k] = v
        merged_count += 1
    target_path.write_text(yaml.safe_dump(target, sort_keys=False))
    print(f"[✓] Merged {merged_count} sources into {target_path}")


def write_manifest(dir_path: Path, manifest_name: str = "MANIFEST.sha256"):
    files = sorted([p for p in dir_path.iterdir() if p.is_file() and p.name != manifest_name])
    lines = []
    for p in files:
        digest = sha256_file(p)
        lines.append(f"{digest}  {p.name}")
    manifest_path = dir_path / manifest_name
    manifest_path.write_text("\n".join(lines) + "\n")
    print(f"[✓] Wrote manifest with {len(lines)} entries to {manifest_path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--evidence-dir", required=True, help="Path to EV-RUN evidence directory")
    ap.add_argument("--sources", nargs="*", default=["gpt_revision_metadata.yaml", "runtime_metadata.yaml"], help="Metadata source files to merge")
    ap.add_argument("--manifest", default="MANIFEST.sha256")
    args = ap.parse_args()

    evidence_dir = Path(args.evidence_dir)
    if not evidence_dir.exists() or not evidence_dir.is_dir():
        print(f"[✗] Evidence directory not found: {evidence_dir}")
        sys.exit(2)

    target = evidence_dir / "evidence_record.yaml"
    sources = [evidence_dir / s for s in args.sources]

    merge_yaml(target, sources)
    write_manifest(evidence_dir, args.manifest)
    print("[✓] Evidence merge and manifest refresh complete")


if __name__ == '__main__':
    main()