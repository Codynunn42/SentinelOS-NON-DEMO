# Governed Telemetry Harmonizer

Approval Badge: `[APPROVED:GTH]`

Status: Implemented as a governed observability layer.

Date: 2026-05-04

## Purpose

The Governed Telemetry Harmonizer controls visibility when telemetry is `OFF` or `LIMITED`.

It does not auto-send sensitive data. It classifies internal activity into:

- `SAFE_TO_SEND`
- `APPROVAL_REQUIRED`
- `BLOCKED`

## Runtime Mapping

| Capability | Location | Governance reason |
| --- | --- | --- |
| Harmonizer core | `apps/sentinel/src/telemetry/telemetryHarmonizer.js` | Classifies telemetry activity through policy. |
| Standard response schema | `apps/sentinel/src/telemetry/telemetrySchema.js` | Keeps API, UI, audit, and command output aligned. |
| Telemetry controller | `handleTelemetryState()` | Runs harmonization when telemetry is `OFF` or `LIMITED`; returns `NORMAL` when telemetry is `ON`. |
| Command integration | `telemetry.harmonize` | Routes harmonization as a governed command with `telemetry:write`. |
| Workflow integration | `apps/sentinel/src/orchestration/taskTemplates.js` | Adds `telemetryReview` to each execution session. |
| API route | `POST /telemetry/harmonize` | Lets operators review visibility state without bypassing policy. |
| Route policy | `apps/sentinel/src/governance/policyEngine.js` | Requires `telemetry:write` for harmonization and blocks ungranted export scopes. |
| Principal scopes | `apps/sentinel/src/security/keyRegistry.js` | Allows telemetry write by default; does not grant `telemetry:export` by default. |
| Proof UI | `apps/api/public/proof.html` | Shows Safe / Approval / Blocked visibility lanes. |
| Verification | `scripts/check-telemetry-harmonizer.js` | Proves OFF/LIMITED behavior, blocked export, approval-required financial visibility, and workflow integration. |

## Policy Behavior

| Activity | Classification | Reason |
| --- | --- | --- |
| `workflow.metrics` | `SAFE_TO_SEND` | Scoped operational metrics are allowed when policy allows `telemetry:write`. |
| `audit.summary` | `SAFE_TO_SEND` | Scoped summaries are allowed without exporting sensitive payloads. |
| `deal.execution` | `APPROVAL_REQUIRED` | Financial execution visibility requires human approval. |
| `external.export` | `BLOCKED` | External telemetry export is blocked while telemetry is off or limited. |
| `sensitive.payload` | `BLOCKED` | Sensitive payload telemetry cannot be sent without explicit export approval. |

## API Contract

```json
{
  "telemetryState": "LIMITED",
  "tenant": "ownerfi",
  "activities": [
    { "type": "workflow.metrics" },
    { "type": "deal.execution" },
    { "type": "external.export" }
  ]
}
```

Returns:

```json
{
  "status": "HARMONIZED",
  "mode": "GUARDED_VISIBILITY",
  "summary": {
    "safe": 1,
    "requiresApproval": 1,
    "blocked": 1
  },
  "details": [
    {
      "action": "telemetry.metric.write",
      "status": "SAFE_TO_SEND",
      "reason": "Operational metrics can be sent when tenant and scope policy allow.",
      "timestamp": "2026-05-04T00:00:00.000Z"
    }
  ],
  "auditArtifact": {
    "artifactType": "governed_telemetry_harmonization"
  }
}
```

## Command Contract

Telemetry harmonization is also available as the governed command:

```json
{
  "tenant": "ownerfi",
  "command": "telemetry.harmonize",
  "payload": {
    "telemetryState": "LIMITED",
    "activities": [
      { "type": "workflow.metrics" },
      { "type": "external.export" }
    ]
  }
}
```

The command returns the same harmonizer schema under `telemetry`.

## Approval Boundary

The harmonizer never bypasses approval.

`APPROVAL_REQUIRED` means the signal is not safe to send until the relevant approval exists.

`BLOCKED` means the signal must not be sent from the harmonizer.

External export requires a separate explicit approval path and a principal with export scope.

At the policy layer, `telemetry.export.external` and `telemetry.payload.sensitive` return `approvalRequired: true`; the harmonizer still blocks them while telemetry is off or limited.

## Verification

Run:

```bash
npm run check:telemetry-harmonizer
```

Expected result:

```text
Telemetry harmonizer check passed
```
