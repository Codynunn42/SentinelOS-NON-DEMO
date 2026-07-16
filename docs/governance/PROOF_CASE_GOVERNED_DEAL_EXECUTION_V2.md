# Proof Case v2 - Governed Deal Execution

Status: current single proof case / reference implementation

## Purpose

Demonstrate the core SentinelOS promise:

```txt
A governed command can be attempted, blocked until approval, and preserved in audit.
```

This proof case is intentionally narrow. It is not a full customer implementation.

External name:

```txt
Governed Deal Execution - Reference Implementation
```

Do not tie this proof case to a specific prospect in external materials.

## Why This Proof Case

`deal.execute` is the cleanest proof because it shows:

- command envelope behavior
- policy preflight
- approval enforcement
- blocked execution
- audit visibility

## System Flow

```txt
User Action
-> Face Plane
-> /v1/command
-> Governance Preflight
-> BLOCKED
-> Approval Required
-> /v1/audit
-> Verified Outcome
```

## Demo Narrative

Say:

```txt
We do not replace your system. We control what your system is allowed to do.

This action looks like a normal workflow step, but SentinelOS treats it as a governed command.
```

Then show:

```txt
application.submit = ready
deal.execute = BLOCKED until approval
```

Close with:

```txt
Most systems log after execution. SentinelOS decides before execution.
```

## API Shape

Initialize workflow:

```http
POST /v1/workflow/init
```

Example payload:

```json
{
  "runId": "sentinel-proof-run-001",
  "tasks": [
    { "type": "application.submit" },
    { "type": "deal.execute", "amount": 15000 }
  ]
}
```

Expected result:

```json
{
  "requiresApproval": [
    {
      "step": "deal.execute",
      "status": "PENDING_APPROVAL"
    }
  ],
  "blockedActions": ["deal.execute"]
}
```

Attempt execution:

```http
POST /v1/workflow/execute
```

Example payload:

```json
{
  "runId": "sentinel-proof-run-001",
  "step": "deal.execute"
}
```

Expected result:

```json
{
  "status": "BLOCKED",
  "reason": "Approval required",
  "requiredRole": "approver"
}
```

Audit proof:

```http
GET /v1/audit/sentinel-proof-run-001
```

## Local Verification

Run:

```bash
npm run check:ownerfi-pilot-api
npm run check:task-templates
npm run check:faceplane-sdk
npm run check:docking
```

## Proof Boundary

This proof case proves the operating model:

- governed command execution
- approval boundary
- audit trail
- face plane compatibility
- docking policy alignment

It does not claim:

- full regulated finance coverage
- government deployment readiness
- customer-specific compliance certification

Those are future GaaS policy pack and face plane packages.
