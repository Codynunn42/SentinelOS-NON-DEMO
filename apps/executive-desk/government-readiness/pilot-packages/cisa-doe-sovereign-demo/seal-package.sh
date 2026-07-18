#!/usr/bin/env zsh
set -euo pipefail

package_dir="${0:A:h}"
dist_dir="$package_dir/dist"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
bundle_name="cisa-doe-sovereign-demo-$stamp"
bundle_path="$dist_dir/$bundle_name.tgz"
manifest_path="$dist_dir/$bundle_name.sha256"

mkdir -p "$dist_dir"

node "$package_dir/generate-ledger.mjs"

tar -czf "$bundle_path" -C "$package_dir" \
  README.md \
  index.html \
  executive-view.html \
  operator-view.html \
  styles.css \
  app.js \
  ledger-demo.json \
  ledger-data.js \
  scenario-report.json \
  scenario-report.js \
  overlays

shasum -a 256 "$bundle_path" > "$manifest_path"

echo "Bundle: $bundle_path"
echo "Manifest: $manifest_path"