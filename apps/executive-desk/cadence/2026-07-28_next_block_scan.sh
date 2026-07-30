#!/usr/bin/env bash
# shellcheck disable=SC1091
set -euo pipefail

ROOT="/Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO"

cd "$ROOT"

echo "=== Next Block Scan ==="
echo "timestamp_utc: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo

echo "--- Sentinel Health ---"
curl -sS http://127.0.0.1:3000/health | jq '{status,service,mode,timestamp}'
echo

echo "--- Sentinel Bridge Query ---"
set -a
source "$ROOT/.env"
set +a
curl -sS -H "x-api-key: ${SENTINEL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId":"sentinelos",
    "workflowId":"wf_execdesk_revision_builder_id_check_script",
    "prompt":"Confirm whether EV-RUN-002-001 includes a revision builder ID and request next artifact blocks if absent.",
    "metadata":{"objective":"metadata_evidence_bridge","evidenceId":"EV-RUN-002-001"}
  }' \
  http://127.0.0.1:3000/faceplane/openai/execute \
| jq '{status,workflowId,tenantId,metadataEvidence,auditEntry:{workflowId,timestamp,hash}}'
echo

echo "--- Nearby Artifact Scan ---"
rg -n "revision_builder_id|builder_id|gpt_revision_id|agent_id|evidence_id: EV-RUN-002-001" \
  apps/executive-desk/evidence apps/executive-desk/cadence \
  -g '*.{yaml,yml,json,md}' || true
echo

echo "--- Config Sweep ---"
rg -n "revision_builder_id|builder_id|gpt_revision_id|agent_id|revision_id|version_label|revision_timestamp" \
  apps/executive-desk config configs docs runtime services \
  -g '*.{yaml,yml,json,md,js,ts,env}' || true
echo

echo "=== End Next Block Scan ==="