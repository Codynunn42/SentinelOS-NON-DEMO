# SentinelOS Execution Architecture

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose

This document defines how SentinelOS moves from governed decisions into governed action.

Mission Control and future clients do not decide or execute directly. They request action from Sentinel Core. Sentinel Core verifies the decision, approval state, policy posture, and audit context before execution.

## Product Boundary

Current SentinelOS already has:

- security event ingestion
- trust scoring
- learning state
- Sentinel Analysis
- signed decisions
- persistent approvals
- Mission Control visibility

The next product boundary is:

```txt
POST /execute
```

`/execute` is where Sentinel becomes a governed action system instead of only a governed decision system.

## Canonical Runtime Flow

```txt
Client app
-> POST /execute
-> authenticate request
-> normalize execution request
-> fetch or receive signed decision
-> verifyDecision()
-> check approval state
-> run policy enforcement
-> execute only if allowed
-> persist audit event
-> return receipt
```

## Execution Rule

```txt
No valid signed decision -> no execution.
```

This rule is not optional. It is the kernel boundary for SentinelOS.

## `/execute` Contract

Proposed request:

```json
{
  "tenant": "ownerfi",
  "action": "deployment.rollout",
  "target": "ca-nc-dev-sentinel",
  "decision": {
    "decision": "allow",
    "executionMode": "auto",
    "approvalRequired": false,
    "trustScore": 0.91,
    "signature": "...",
    "signedAt": "...",
    "signatureVersion": "hmac-sha256:v1"
  },
  "approvalId": "approval_...",
  "metadata": {
    "actor": "operator@example.com",
    "role": "operator"
  }
}
```

Proposed responses:

```json
{
  "status": "executed",
  "receipt": {
    "receiptId": "rcpt_...",
    "tenant": "ownerfi",
    "action": "deployment.rollout",
    "verifiedDecision": true,
    "approvalSatisfied": true,
    "timestamp": "..."
  }
}
```

Blocked response:

```json
{
  "status": "blocked",
  "error": "Invalid decision signature",
  "required": ["valid_signed_decision"]
}
```

## Enforcement Checks

### 1. Authentication

The request must pass the API authentication layer.

### 2. Decision Integrity

`verifyDecision(decision, key)` must return true.

If false:

```txt
block
audit
return 403
```

### 3. Decision Posture

Execution is allowed only when:

```txt
decision.decision = allow
executionMode = auto
approvalRequired = false
```

Or when an approval is required:

```txt
approvalRequired = true
approvalId exists
approval.status = approved
```

### 4. Policy Enforcement

Policy still has final say. A signed decision is necessary but not sufficient.

Policy can still block:

- disallowed role
- disallowed tenant
- unsafe action
- missing approval
- stale decision

### 5. Audit

Every execution attempt must be recorded:

- successful execution
- blocked execution
- invalid signature
- missing approval
- policy rejection

## Client Model

Mission Control is the first client.

It can:

- display state
- display signed decision integrity
- approve or reject approvals
- request execution later

It cannot:

- decide
- sign decisions
- bypass approvals
- execute directly

Future clients:

- CLI
- SDK
- external automation apps
- Azure Marketplace app

All clients must use the same system boundary:

```txt
request -> signed decision -> policy -> execution
```

## Implementation Plan

### Phase 1: Minimal `/execute`

- Add route `POST /execute`.
- Require API key.
- Require `decision`.
- Verify decision signature.
- Block all unsigned or invalid decisions.
- Return dry-run receipt for allowed decisions.
- Audit every attempt.

### Phase 2: Approval-Aware Execution

- Accept `approvalId`.
- Fetch approval.
- Require approved status when `approvalRequired = true`.
- Block pending/rejected approvals.

### Phase 3: Policy-Aware Execution

- Route action through governance preflight.
- Enforce tenant, role, command, and action policies.
- Keep policy as final authority.

### Phase 4: Real Action Adapters

- Add Azure action adapter.
- Add deployment adapter.
- Add read-only Microsoft Graph adapter first.
- Add write actions only after approval and policy enforcement are proven.

## Near-Term Demo

Demo story:

```txt
1. Security event enters `/events/security`.
2. Sentinel creates signed `block` decision.
3. Mission Control shows Trust Score and Decision Integrity.
4. Operator resolves approval.
5. `/execute` refuses unsigned/tampered decisions.
```

This proves SentinelOS is not just an app. It is the system layer that clients must pass through before action.
