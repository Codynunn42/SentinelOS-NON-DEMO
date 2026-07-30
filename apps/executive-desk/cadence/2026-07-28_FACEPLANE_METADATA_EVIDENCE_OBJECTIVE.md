# Faceplane Objective: Metadata Evidence Bridge

Date: 2026-07-28
Owner: Cody Nunn (Interim, role: Executive Desk)
Mode: Local Sentinel AI faceplane orchestration

## Objective

Have Sentinel act as the in-between control layer that:

- Exposes revision metadata evidence when due in the governance sequence.
- Explicitly asks for operator response when metadata is unavailable or unexposed.
- Preserves Unverified posture without inference until source values are supplied.

## Runtime Objective Contract

Sentinel must return a structured response that includes:

1. Metadata evidence status

- revision_id: Captured | Unverified
- version_label: Captured | Unverified
- revision_timestamp: Captured | Unverified

1. Source visibility status

- builder_visibility: exposed | not_exposed
- boundary_reason: plain-language explanation when not exposed

1. Required operator response block

- required_response: yes | no
- response_prompt: exact question for operator
- required_fields: list of fields operator must provide

1. Governance output

- posture: ready | conditional | blocked
- next_action: concrete next step with owner and due date

## Faceplane Execute Payload (Template)

Use this payload with POST /faceplane/openai/execute:

```json
{
  "tenantId": "sentinelos",
  "workflowId": "wf_execdesk_metadata_bridge_v2",
  "prompt": "You are Sentinel Executive Desk. Expose revision metadata evidence status for EV-RUN-002-001 V2 now. If revision_id is not exposed, explicitly mark it Unverified, explain the boundary, and ask the operator for the exact response values needed to close the gap.",
  "metadata": {
    "confidenceScore": 0.81,
    "impactRating": 3,
    "domainTier": 3,
    "verifiabilityScore": 0.66,
    "domainSensitivity": "high",
    "objective": "metadata_evidence_bridge",
    "evidenceId": "EV-RUN-002-001-V2"
  }
}
```

## Expected Sentinel Response Shape

```json
{
  "status": "ok|pending_review",
  "workflowId": "wf_execdesk_metadata_bridge_v2",
  "tenantId": "sentinelos",
  "risk": {
    "state": 1,
    "escalationRequired": false
  },
  "response": {
    "content": "..."
  },
  "metadataEvidence": {
    "revision_id": "Unverified|<value>",
    "version_label": "Unverified|<value>",
    "revision_timestamp": "Unverified|<value>",
    "builder_visibility": "not_exposed|exposed",
    "required_response": true,
    "response_prompt": "Please provide ..."
  }
}
```

## Gate Pass Conditions

1. /health returns 200.
2. /ready returns 200 and ready=true.
3. /faceplane/openai/status returns tenant active.
4. /faceplane/openai/execute returns 200 or 202 with workflowId and auditEntry.
5. Response includes explicit operator response request when revision metadata remains unavailable.

## Publication Note

Publish this objective with the V2 update set and log outcome in:

- cadence/2026-07-27_FINAL_PLACEHOLDER_VALIDATION_RECORD.md
- cadence/2026-07-27_EVIDENCE_REQUEST_LOG_CURRENT_TASK.md
