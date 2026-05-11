# SentinelOS Pilot API - OwnerFi

**METADATA:** `[PILOT] [API-SPEC] [CONTROLLED-RELEASE]`

**DISCLAIMER:** This is a pilot-phase API specification for validation purposes only. The API is subject to change and should not be considered production-ready.

Status: Pilot validation spec

Audience: OwnerFi technical validation

## Overview

This pilot API allows OwnerFi to initialize and execute workflows through SentinelOS using governed commands. All actions are policy-enforced, auditable, tenant-scoped, and approval-gated where applicable.

## Base URL

```text
https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/v1
```

## Authentication

```http
Authorization: Bearer <OWNERFI_PILOT_KEY>
```

Compatibility header:

```http
x-api-key: <OWNERFI_PILOT_KEY>
```

Pilot key scope:

- tenant: `ownerfi`
- execution: sandbox validation
- rate limited
- approval and audit scoped

## 1. Initialize Workflow

```http
POST /workflow/init
```

Creates a governed execution session from submitted workflow tasks.

### Request

```json
{
  "runId": "ownerfi-pilot-run-001",
  "tasks": [
    { "type": "application.submit" },
    { "type": "deal.execute", "amount": 15000 }
  ]
}
```

### Response

```json
{
  "runId": "ownerfi-pilot-run-001",
  "timeline": [],
  "requiresApproval": [
    {
      "step": "deal.execute",
      "reason": "Conditional items need evidence, verification, and a final human decision.",
      "status": "PENDING_APPROVAL"
    }
  ],
  "xeActions": [
    {
      "step": "application.submit",
      "status": "READY_FOR_XE"
    }
  ],
  "blockedActions": ["deal.execute"],
  "telemetry": {
    "status": "HARMONIZED",
    "summary": {
      "safe": 0,
      "requiresApproval": 0,
      "blocked": 0
    }
  }
}
```

## 2. Execute Step

```http
POST /workflow/execute
```

Attempts to execute a workflow step.

### Request

```json
{
  "runId": "ownerfi-pilot-run-001",
  "step": "deal.execute"
}
```

### Blocked Response

```json
{
  "status": "BLOCKED",
  "reason": "Approval required",
  "requiredRole": "approver",
  "command": "task.template.execute"
}
```

### Success Response

```json
{
  "status": "SUCCESS",
  "step": "deal.execute",
  "command": "task.template.execute",
  "timestamp": "2026-05-04T14:00:00.000Z"
}
```

## 3. Resolve Approval

```http
POST /approvals/resolve
```

Approves or rejects a pending workflow action.

### Request

```json
{
  "runId": "ownerfi-pilot-run-001",
  "step": "deal.execute",
  "approved": true,
  "reason": "Pilot validation approval"
}
```

## 4. Audit Trail

```http
GET /audit/:runId
```

Returns:

- execution history
- approval records
- telemetry review
- audit entries

## 5. Telemetry Harmonizer

```http
POST /telemetry/harmonize
```

Evaluates what system activity can be observed or exported under policy.

### Request

```json
{
  "telemetryState": "LIMITED",
  "activities": [
    { "type": "workflow.metrics" },
    { "type": "deal.execution" },
    { "type": "external.export" }
  ]
}
```

### Response

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
      "status": "SAFE_TO_SEND"
    },
    {
      "action": "deal.execute",
      "status": "APPROVAL_REQUIRED",
      "reason": "Financial execution visibility requires human approval."
    },
    {
      "action": "telemetry.export.external",
      "status": "BLOCKED",
      "reason": "External export is blocked when telemetry is off or limited."
    }
  ]
}
```

## Existing Internal Route Mapping

| Pilot API | SentinelOS runtime |
| --- | --- |
| `POST /v1/workflow/init` | `POST /task-templates/ingest` |
| `POST /v1/workflow/execute` | `task.template.execute` |
| `POST /v1/approvals/resolve` | approval store + approval resolution |
| `GET /v1/audit/:runId` | audit stream + execution session lookup |
| `POST /v1/telemetry/harmonize` | Governed Telemetry Harmonizer |

## Key Principle

All actions are executed through governed commands.

Nothing executes, and nothing sensitive is exposed, without policy alignment.
