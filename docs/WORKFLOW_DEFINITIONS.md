# Workflow Definitions

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose
Define the first SentinelOS proof-case workflows as reusable platform patterns.

This document is the system brain for the OwnerFi proof case. It defines commands, inputs, outputs, state transitions, and audit expectations before implementation expands.

## Workflow Definition Standard
Each workflow should define:
- command name
- business purpose
- actors
- required inputs
- optional inputs
- output
- state transitions
- audit events
- integration dependencies

## Shared Command Envelope
Every proof-case command should eventually follow a common shape:

```json
{
  "command": "ownerfi.application.submit",
  "tenantId": "tenant_ownerfi",
  "scope": {
    "companyId": "ownerfi",
    "workflow": "application_intake"
  },
  "actor": {
    "type": "operator",
    "id": "operator_123",
    "role": "ownerfi.operator"
  },
  "payload": {},
  "requestId": "req_123"
}
```

## Command Scope Map

Every command must map to a scope before execution:

```txt
application.submit    -> application:submit
application.evaluate  -> application:evaluate
deal.execute          -> deal:execute
audit.read            -> audit:read
receipt.read          -> receipt:read
approval.review       -> approval:review
```

The resolved API key, not caller-supplied metadata, is the source of truth for actor, role, and scopes.

## Idempotency Standard

Commands that may execute business workflow steps should carry a `commandId` or `metadata.idempotencyKey`.

The platform treats the same tenant, command, key, idempotency key, and payload as a replay.

The platform treats the same tenant, command, key, idempotency key, and changed payload as a conflict.

## Shared Receipt Shape
Every command should return a receipt that can be stored, queried, and presented to operators:

```json
{
  "receiptId": "rcpt_123",
  "auditId": "audit_123",
  "command": "ownerfi.application.submit",
  "tenantId": "tenant_ownerfi",
  "status": "accepted",
  "entity": {
    "type": "application",
    "id": "app_123"
  },
  "timestamp": "2026-04-23T00:00:00.000Z"
}
```

Receipts may include `prevHash` so operators can connect the receipt to the audit chain head at the time of execution.

## Workflow 1: Application Intake

### Command
`ownerfi.application.submit`

### Purpose
Create a financing application from a structured intake request.

### Required Inputs
- applicant name or applicant identity reference
- applicant contact reference
- vehicle or asset reference
- requested financing amount
- seller or dealer reference
- submission source

### Initial Runnable Payload
```json
{
  "command": "ownerfi.application.submit",
  "payload": {
    "name": "John Doe",
    "vehicle": "2019 Honda Civic",
    "amount": 18000,
    "creditScore": 680
  }
}
```

### Optional Inputs
- down payment amount
- trade-in reference
- external lead ID
- notes

### Output
- application ID
- application status
- validation result
- receipt ID
- audit ID

### State Transitions
`draft` -> `submitted`

`submitted` -> `needs_more_info`

### Audit Events
- `ownerfi.application.submitted`
- `ownerfi.application.validation_failed`

### Integration Dependencies
- auth and actor identity
- application database
- audit receipt store

## Workflow 2: Approval And Decision Flow

### Command
`ownerfi.application.evaluate`

### Purpose
Evaluate a submitted financing application and update its decision status.

### Required Inputs
- application ID
- evaluator actor
- decision context
- decision criteria reference

### Initial Runnable Payload
```json
{
  "command": "ownerfi.application.evaluate",
  "payload": {
    "applicationId": "app_123"
  }
}
```

### Initial Decision Rule
If `creditScore` is greater than `650`, the application is approved.

If `creditScore` is `650` or below, the application moves to review.

### Optional Inputs
- manual reviewer notes
- policy override request
- supporting document references

### Output
- application ID
- decision status
- decision reason
- policy result
- receipt ID
- audit ID

### State Transitions
`submitted` -> `under_review`

`under_review` -> `approved`

`under_review` -> `declined`

`under_review` -> `needs_more_info`

### Audit Events
- `ownerfi.application.review_started`
- `ownerfi.application.approved`
- `ownerfi.application.declined`
- `ownerfi.application.needs_more_info`

### Integration Dependencies
- auth and role validation
- application database
- policy or decision logic
- audit receipt store

## Workflow 3: Deal Execution And Tracking

### Command
`ownerfi.deal.execute`

### Purpose
Advance an approved financing application into an executable deal and track operational progress.

### Required Inputs
- application ID
- execution action
- approved terms reference
- operator or service actor

### Initial Runnable Payload
```json
{
  "command": "ownerfi.deal.execute",
  "payload": {
    "applicationId": "app_123"
  }
}
```

### Optional Inputs
- deal ID
- funding reference
- seller confirmation reference
- buyer confirmation reference
- notes

### Output
- deal ID
- deal status
- execution checkpoint
- receipt ID
- audit ID

### State Transitions
`approved` -> `deal_opened`

`deal_opened` -> `execution_in_progress`

`execution_in_progress` -> `completed`

`execution_in_progress` -> `blocked`

### Audit Events
- `ownerfi.deal.opened`
- `ownerfi.deal.execution_started`
- `ownerfi.deal.completed`
- `ownerfi.deal.blocked`

### Integration Dependencies
- auth and role validation
- application database
- deal database
- audit receipt store
- optional notification/logging

## Deferred Workflows
The following are intentionally out of scope until the first 3 workflows are proven:
- payment automation
- lender marketplace routing
- document signing
- full CRM sync
- underwriting automation beyond a first decision model
- advanced notifications
- analytics dashboards

## Implementation Rule
If a proposed feature does not support application intake, approval and decision flow, or deal execution and tracking, defer it.

## Initial API Route
The first proof-case execution route is:

`POST /v1/command`

The route is protected by `x-api-key` using `SENTINEL_API_KEY`.

## Audit Retrieval Routes
The current audit routes are:

- `GET /v1/audit`
- `GET /v1/audit/:applicationId`
- `GET /v1/receipts/:receiptId`

Receipt lookup remains protected by `SENTINEL_API_KEY`.

Both routes are protected by `x-api-key` using `SENTINEL_API_KEY`.

## Current Governance Rule
The first role-aware control is:

- `ownerfi.deal.execute` requires `metadata.role = approver`

This is intentionally narrow so the proof case demonstrates governed execution without overbuilding RBAC on day one.
