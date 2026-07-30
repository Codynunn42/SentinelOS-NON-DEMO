#!/usr/bin/env bash
set -euo pipefail

# 2026-07-28_next_block_scan.sh
# Light-mode friendly scan pipeline for Executive Desk cadence
# Usage: ./2026-07-28_next_block_scan.sh [--dry-run]

# Compute repo root from the script file location so invocation CWD doesn't matter.
# Use BASH_SOURCE[0] which yields the script path even when the script is invoked via a relative path.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd -P)"

# Support both expected and nested layouts where the tools directory may be duplicated
# e.g. <repo>/apps/executive-desk/cadence/tools or <repo>/apps/executive-desk/apps/executive-desk/cadence/tools
CANDIDATE1="${REPO_ROOT}/apps/executive-desk/cadence/tools"
CANDIDATE2="${REPO_ROOT}/apps/executive-desk/apps/executive-desk/cadence/tools"
if [ -d "${CANDIDATE1}" ]; then
  TOOLS_DIR="${CANDIDATE1}"
elif [ -d "${CANDIDATE2}" ]; then
  TOOLS_DIR="${CANDIDATE2}"
else
  TOOLS_DIR="${CANDIDATE1}"
fi

DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -n) DRY_RUN=true ;;
    --help) echo "Usage: $0 [--dry-run]"; exit 0 ;;
  esac
done

echo "[scan] Starting next-block scan (dry-run=$DRY_RUN)"

# Ensure python exists
if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not found" >&2
  exit 2
fi

# Health check: local faceplane bridge
BRIDGE_URL="http://127.0.0.1:3000/faceplane/openai/execute"
echo "[scan] Checking Faceplane bridge at ${BRIDGE_URL}"
if curl --silent --max-time 5 "${BRIDGE_URL}" >/dev/null 2>&1; then
  echo "[scan] Bridge reachable"
else
  echo "[scan] Warning: Bridge not reachable (continuing in light mode)"
fi

# Artifact scan: look for recent changes or interesting files
echo "[scan] Running local artifact scan (rg -> grep fallback)"
SCANS=$(mktemp)
if command -v rg >/dev/null 2>&1; then
  rg --hidden --glob '!.git' -n "TODO|FIXME|evidence_record.yaml|gpt_revision_metadata.yaml|runtime_metadata.yaml" || true >"${SCANS}"
else
  grep -RIn --exclude-dir=.git -e "TODO\|FIXME\|evidence_record.yaml\|gpt_revision_metadata.yaml\|runtime_metadata.yaml" . || true >"${SCANS}"
fi

if [ -s "${SCANS}" ]; then
  echo "[scan] Artifact scan found items:" && sed -n '1,20p' "${SCANS}"
else
  echo "[scan] No interesting artifacts found"
fi

# Evidence merge: ensure tools exist
if [ -x "${TOOLS_DIR}/update_evrun_evidence.py" ] || [ -f "${TOOLS_DIR}/update_evrun_evidence.py" ]; then
  echo "[scan] Running evidence merge"
  if [ "$DRY_RUN" = true ]; then
    echo "[scan] Dry-run: invoking evidence merge in dry mode"
    python3 "${TOOLS_DIR}/update_evrun_evidence.py" --dry-run || echo "[scan] evidence merge reported non-fatal status"
  else
    python3 "${TOOLS_DIR}/update_evrun_evidence.py" || echo "[scan] evidence merge reported non-fatal status"
  fi
else
  echo "[scan] evidence merge tool missing at ${TOOLS_DIR}/update_evrun_evidence.py"
fi

# Template rendering (if templates exist)
if [ -f "${TOOLS_DIR}/render_template.py" ]; then
  echo "[scan] Rendering templates (if present)"
  # Pass the repository root so render_template can find templates under apps/executive-desk/cadence/templates
  if [ "$DRY_RUN" = true ]; then
    python3 "${TOOLS_DIR}/render_template.py" --dir "${REPO_ROOT}" --dry-run || echo "[scan] template render reported non-fatal status"
  else
    python3 "${TOOLS_DIR}/render_template.py" --dir "${REPO_ROOT}" || echo "[scan] template render reported non-fatal status"
  fi
fi

# Optional ingestion: skip in dry-run
if [ "$DRY_RUN" = true ]; then
  echo "[scan] Dry-run mode - skipping production ingestion to Log Analytics"
else
  if [ -f "${TOOLS_DIR}/send_to_log_analytics.py" ]; then
    if [ -n "${LOG_ANALYTICS_WORKSPACE_ID:-}" ] && [ -n "${LOG_ANALYTICS_SHARED_KEY:-}" ]; then
      echo "[scan] Sending summary to Log Analytics"
      python3 "${TOOLS_DIR}/send_to_log_analytics.py" --workspace "$LOG_ANALYTICS_WORKSPACE_ID" --key "$LOG_ANALYTICS_SHARED_KEY" --dry-run false || echo "[scan] send_to_log_analytics reported non-fatal status"
    else
      echo "[scan] LOG_ANALYTICS_* not configured - skipping ingestion"
    fi
  else
    echo "[scan] send_to_log_analytics tool missing - skipping ingestion"
  fi
fi

echo "[scan] Light-mode scan complete"
exit 0
