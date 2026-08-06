# Proxy Command Handler (apps/executive-desk/proxy)

Read-only `/proxy/command` endpoint handler for Executive Desk v1.

## Files

- `command-handler.ts` — Main orchestrator (Authority Check → Risk Gate → Receipt → Response)

## v1 Scope

**Supported command:** `repo.control.workflow.diagnose` (read-only)

**Execution flow:**

1. Validate schema (tenant, command, payload)
2. Authority Check → verify principal is authenticated
3. Risk Gate → evaluate risk (always pass for read-only)
4. Execute → run diagnosis
5. Record Receipt → append to immutable ledger
6. Return → governance metadata + diagnosis result

**No mutations:** All read-only. No infrastructure, identity, governance, or repository changes.

## Example Request

```json
{
  "tenant": "nunncloud",
  "command": "repo.control.workflow.diagnose",
  "payload": {
    "principalId": "user@example.com",
    "repository": "Codynunn42/SentinelOS-NON-DEMO",
    "workflowName": "Sentinel Actions Diagnostic"
  }
}
```

## Example Response

```json
{
  "status": "executed",
  "command": "repo.control.workflow.diagnose",
  "executionMode": "read_only_diagnosis",
  "bypassPrevented": false,
  "authorityCheckResult": {
    "allowed": true,
    "principalId": "user@example.com",
    "command": "repo.control.workflow.diagnose",
    "reasons": ["Principal is authenticated and authorized for read-only command"],
    "requiredApprovers": [],
    "scope": "global"
  },
  "riskGateOutcome": {
    "decision": "pass",
    "score": 0.05,
    "command": "repo.control.workflow.diagnose",
    "infraStatus": "ok",
    "issues": [],
    "mitigations": [],
    "timestamp": "2026-07-02T15:30:00Z"
  },
  "trustScore": 0.95,
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "command": "repo.control.workflow.diagnose",
    "executor": "user@example.com",
    "timestamp": "2026-07-02T15:30:00Z",
    "status": "executed",
    "signature": "7c6f7c5c8f9e1a2b3c4d5e6f7c8d9e0f1a2b3c4d5e6f7c8d9e0f1a2b"
  },
  "auditReference": "550e8400-e29b-41d4-a716-446655440000",
  "reasons": [
    "Principal is authenticated and authorized for read-only command"
  ],
  "diagnosis": {
    "state": "diagnosed",
    "repository": "Codynunn42/SentinelOS-NON-DEMO",
    "workflowName": "Sentinel Actions Diagnostic",
    "runId": "N/A",
    "timestamp": "2026-07-02T15:30:00Z",
    "findings": [
      "Workflow diagnostics retrieved (read-only)",
      "No mutations performed",
      "Governance compliance verified"
    ]
  }
}
```

## Next Steps

1. Deploy handler with Express/Fastify route handler
2. Import `openapi.yaml` into Custom GPT Actions
3. Test end-to-end with sample GPT query
4. Add authentication (Bearer token or OIDC)

## SentinelOS Command Invocation

The proxy v1 command scope above remains unchanged. For Sentinel tenant command routing, use the same envelope format with `tenant: "sentinelos"` and a Sentinel command id.

### Bridge Gaps Report (Read-Only)

```json
{
  "tenant": "sentinelos",
  "command": "governance.bridgegaps.report",
  "payload": {
    "principalId": "user@example.com",
    "mode": "doctor",
    "source": "docs/executive-desk/evidence/2026-07-18-gbp-gate-traceability-report.md"
  }
}
```

### Expected Result Shape

- `result.command` is `governance.bridgegaps.report`
- `result.northStarAssessment.status` is one of `aligned | partial | not_aligned`
- `result.doctrineAssessment.coverage` and `result.doctrineAssessment.unmappedRequirements` are always present
- `result.bridgeGapSummary` includes `critical`, `high`, `medium`, and `low`
- `result.doctorMode` includes `diagnosis`, `blockingConditions`, and `recommendedFixes`
- `result.lightMode` includes ordered `nextSteps`, `dependencies`, and `expectedOutcomes`
- `result.fixAndSet` includes `eligible` and `blockedBy`
- `result.receipt` includes `id`, `timestamp`, and `audit`

### Notes

- This command is read-only and does not mutate runtime, deployment, or Azure state.
- Policy scope requirement is `platform:admin`.
