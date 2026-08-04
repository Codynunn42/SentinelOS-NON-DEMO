#!/usr/bin/env bash
REPO_ROOT="$(cd "$(dirname "$0")/../../../../../.." && pwd)"
NEXUS="$REPO_ROOT/apps/executive-desk/evidence/EV-RUN-002-001/nexus"
REPORT="$NEXUS/C2.4_CHECKPOINT_REPORT.md"
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
P=0; F=0; OUT=""
ok() { P=$((P+1)); OUT="$OUT\n| PASS | $1 | $2 |"; }
fail() { F=$((F+1)); OUT="$OUT\n| FAIL | $1 | $2 |"; }

H=$(curl -sS --max-time 5 http://127.0.0.1:3000/health 2>/dev/null || true)
echo "$H" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"' && ok "API /health" "status:ok" || fail "API /health" "no response"

source "$REPO_ROOT/.env" 2>/dev/null || true
B=$(curl -sS --max-time 10 -H "x-api-key: ${SENTINEL_API_KEY:-}" -H "Content-Type: application/json" \
  -d '{"tenantId":"sentinelos","workflowId":"wf_execdesk_revision_builder_id_check_script","prompt":"C2.4 probe","metadata":{"objective":"c2_4"}}' \
  http://127.0.0.1:3000/faceplane/openai/execute 2>/dev/null || true)
echo "$B" | grep -q '"workflowId"' && ok "Bridge workflowId" "present" || fail "Bridge workflowId" "missing"
echo "$B" | grep -Eq '"auditEntry"[[:space:]]*:[[:space:]]*\{[^}]*"hash"[[:space:]]*:' && ok "Audit hash" "present" || fail "Audit hash" "missing"
echo "$B" | grep -Eq '"driftTrackingEnabled"[[:space:]]*:[[:space:]]*true' && ok "driftTracking" "true" || fail "driftTracking" "false"

SPEC="$NEXUS/bridge-specs/SERVICE_BRIDGE_SPEC_v1.yaml"
test -f "$SPEC" && grep -q "status: Active" "$SPEC" && ok "BridgeSpec Active" "Active" || fail "BridgeSpec Active" "missing/not Active"
test -f "$NEXUS/api-catalog/API_CATALOG_v1.yaml" && ok "API_CATALOG" "present" || fail "API_CATALOG" "missing"
test -f "$NEXUS/capability-registry/CAPABILITY_REGISTRY_v1.yaml" && ok "CAPABILITY_REGISTRY" "present" || fail "CAPABILITY_REGISTRY" "missing"
test -f "$NEXUS/C2.1_DECISION_RECORD.md" && grep -q "PASS" "$NEXUS/C2.1_DECISION_RECORD.md" && ok "C2.1 PASS" "confirmed" || fail "C2.1 PASS" "missing"
test -f "$NEXUS/C2.2_DECISION_RECORD.md" && grep -q "PASS" "$NEXUS/C2.2_DECISION_RECORD.md" && ok "C2.2 PASS" "confirmed" || fail "C2.2 PASS" "missing"
test -f "$NEXUS/C_GATE_CONSTITUTION_MAPPING.md" && ok "ConstitutionMap" "present" || fail "ConstitutionMap" "missing"

GATE="PASS"; test "$F" -gt 0 && GATE="FAIL"
printf "# C2.4 Checkpoint Report\n**Timestamp:** %s\n**Pass:** %s | **Fail:** %s\n\n| Result | Control | Note |\n|--------|---------|------|\n%b\n\n## Gate Decision: %s\n\n## Constitutional Attestation\nThis verification strengthens institutional capability, preserves existing investment value, improves governance clarity, and maintains auditable evidence continuity.\n" "$TS" "$P" "$F" "$OUT" "$GATE" > "$REPORT"
echo "=== C2.4 $GATE === Pass:$P Fail:$F === $REPORT"
