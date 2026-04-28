# OwnerFi Proof-Case Blueprint

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose

Define OwnerFi, or a similar vehicle-financing company, as the first repeatable SentinelOS proof case.

The goal is not to create a one-off OwnerFi build. The goal is to prove a reusable SentinelOS operating model for financing workflows with multi-party coordination, command-driven execution, audit receipts, and platform-ready integration boundaries.

## Company Type

OwnerFi is treated as:

Financing platform with multi-party workflows across buyer, seller, approval, funding, and deal execution.

## Proof-Case Objective

Use OwnerFi to prove that SentinelOS can:

- accept structured business requests
- route those requests through governed decisions
- execute or advance approved deals
- preserve audit trails and receipts
- expose the same pattern for future financing or operations companies

## Scope Discipline

The first proof case is limited to 3 workflows:

- application intake
- approval and decision flow
- deal execution and tracking

Anything outside those workflows is deferred unless it directly supports the first proof case.

## Workflow 1: Application Intake

### Workflow 1: Business Purpose

Capture a financing request, normalize the submitted data, validate required fields, and create the initial application record.

### Workflow 1: Sentinel Command

`ownerfi.application.submit`

### Workflow 1: Sample Payload

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

### Workflow 1: Primary Actors

- buyer
- seller or dealer
- operator
- SentinelOS API

### Workflow 1: Minimum Inputs

- applicant identity reference
- vehicle or asset reference
- requested financing amount
- seller or dealer reference
- contact information
- submission source

### Workflow 1: Expected Output

- application ID
- initial status
- validation result
- receipt ID
- audit event

### Workflow 1: Initial State Transition

`draft` -> `submitted`

## Workflow 2: Approval And Decision Flow

### Workflow 2: Business Purpose

Evaluate a submitted application, route the decision workflow, update status, and produce an auditable decision event.

### Workflow 2: Sentinel Command

`ownerfi.application.evaluate`

### Workflow 2: Sample Payload

```json
{
  "command": "ownerfi.application.evaluate",
  "payload": {
    "applicationId": "app_123"
  }
}
```

### Workflow 2: Primary Actors

- operator
- approval reviewer
- policy engine
- SentinelOS API

### Workflow 2: Minimum Inputs

- application ID
- evaluation context
- reviewer or service actor
- decision criteria reference

### Workflow 2: Expected Output

- decision status
- decision reason
- policy result
- receipt ID
- audit event

### Workflow 2: Initial State Transitions

`submitted` -> `under_review`

`under_review` -> `approved`

`under_review` -> `declined`

`under_review` -> `needs_more_info`

## Workflow 3: Deal Execution And Tracking

### Workflow 3: Business Purpose

Advance an approved application into a deal, track execution state, and preserve a complete command and audit trail.

### Workflow 3: Sentinel Command

`ownerfi.deal.execute`

### Workflow 3: Sample Payload

```json
{
  "command": "ownerfi.deal.execute",
  "payload": {
    "applicationId": "app_123"
  }
}
```

### Workflow 3: Primary Actors

- operator
- buyer
- seller or dealer
- funding or settlement party
- SentinelOS API

### Workflow 3: Minimum Inputs

- application ID
- deal ID when already created
- execution action
- approved terms reference
- operator or service actor

### Workflow 3: Expected Output

- deal ID
- deal status
- execution checkpoint
- receipt ID
- audit event

### Workflow 3: Initial State Transitions

`approved` -> `deal_opened`

`deal_opened` -> `execution_in_progress`

`execution_in_progress` -> `completed`

`execution_in_progress` -> `blocked`

## Systems To Integrate First

Keep the first proof case realistic and deliberately narrow:

- auth and user roles
- database for applications and deals
- basic API layer
- notification and logging only when needed for workflow proof

Do not over-integrate early.

## Platform Blueprint

The repeatable model is:

SentinelOS -> OwnerFi Instance

Command layer drives actions.

Workflow engine processes logic.

Database stores state.

Operator UI reflects state and receipts.

Audit layer preserves proof.

## Platform Extraction Targets

The OwnerFi proof case should produce reusable platform assets:

- command envelope
- workflow definition format
- receipt schema
- application and deal state model
- tenant and actor context
- integration readiness checklist

## Today Rule

If it does not support the first 3 workflows, it does not get built today.

## Initial Execution Status

The first executable proof path is:

`ownerfi.application.submit` -> `ownerfi.application.evaluate` -> `ownerfi.deal.execute`

The first implementation uses the existing Sentinel API, a protected `POST /v1/command` route, and an in-memory store. This is intentionally minimal so the proof case demonstrates execution capability before adding a database, integrations, or a polished UI.

## Visible Proof Surface

The repo now includes a lightweight proof page at:

`GET /proof`

The proof page runs the full OwnerFi command chain, then reads back the filtered audit trail for the resulting application.

## Governance Rule

The first live governance rule is intentionally small and visible:

- `ownerfi.deal.execute` requires `metadata.role = approver`

This keeps the proof case honest by showing that execution can be controlled, not just triggered.

## Near-Term Deliverables

- command payload structures for the 3 workflows
- application and deal schema draft
- tenant and role model draft
- receipt and audit persistence plan
- first operator view requirements
