#!/usr/bin/env python3
"""
Merge evidence metadata files into evidence_record.yaml and write MANIFEST.sha256.

Usage:
  python3 update_evrun_evidence.py [--dry-run]
"""
import argparse
import hashlib
import os
import sys
import yaml
from pathlib import Path

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            b = f.read(8192)
            if not b:
                break
            h.update(b)
    return h.hexdigest()

def load_yaml(path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}

def write_yaml(path, data):
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, default_flow_style=False, sort_keys=False)

def main(dry_run=False):
    base = os.getcwd()
    # Determine repository root by searching upward for the evidence directory.
    script_path = Path(__file__).resolve()
    target_rel = Path("apps") / "executive-desk" / "evidence" / "EV-RUN-002-001"
    repo_root = None
    cur = script_path
    # Walk up parents up to a reasonable limit to find the target path
    for _ in range(12):
        candidate = cur
        if (candidate / target_rel).exists():
            repo_root = candidate
            break
        if cur.parent == cur:
            break
        cur = cur.parent
    if repo_root is None:
        # Fallback heuristics: try the 5th parent or cwd
        if len(script_path.parents) >= 5:
            repo_root = script_path.parents[4]
        else:
            repo_root = Path(os.getcwd())
    evidence_dir = str(repo_root / target_rel)
    if not os.path.isdir(evidence_dir):
        print(f"evidence dir not found: {evidence_dir}")
        return 1
    record_path = os.path.join(evidence_dir, "evidence_record.yaml")
    sources = []
    for name in ("gpt_revision_metadata.yaml", "runtime_metadata.yaml", "reviewer_attestation.yaml"):
        p = os.path.join(evidence_dir, name)
        if os.path.isfile(p):
            sources.append(p)
    merged = {}
    for src in sources:
        data = load_yaml(src)
        if isinstance(data, dict):
            merged.update(data)
    if dry_run:
        print("[evidence] Dry-run: merged keys ->", ", ".join(sorted(merged.keys())))
    else:
        write_yaml(record_path, merged)
        # Write manifest
        manifest = {}
        for fname in os.listdir(evidence_dir):
            path = os.path.join(evidence_dir, fname)
            if os.path.isfile(path):
                manifest[fname] = sha256_file(path)
        manifest_path = os.path.join(evidence_dir, "MANIFEST.sha256")
        with open(manifest_path, "w", encoding="utf-8") as mf:
            for fname, digest in sorted(manifest.items()):
                mf.write(f"{digest}  {fname}\n")
        print(f"[evidence] Wrote {record_path} and MANIFEST.sha256")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    sys.exit(main(dry_run=args.dry_run))
