# Governance Preflight

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Definition
Governance preflight is the required control layer that evaluates every command before a surface-plane handler can execute.

## Command Flow
`request -> authenticate key -> resolve tenant / actor / role / scopes -> policy preflight -> handler -> audit receipt`

The preflight layer uses `evaluatePolicy` in `apps/sentinel/src/governance/policyEngine.js` so policy outcomes are shaped consistently before handler execution.

## Role-Scoped Key Rule

No protected request runs from only a secret value.

The key must resolve to:

```txt
tenant + actor + role + scopes
```

If the key cannot resolve all of those fields, SentinelOS blocks the request before execution.

Current role vocabulary:

```txt
viewer
operator
approver
admin
platform
```

Current scope vocabulary:

```txt
application:submit
application:evaluate
application:read
deal:execute
audit:read
receipt:read
approval:read
approval:review
tenant:admin
platform:admin
learning:read
learning:write
security:write
policy:evaluate
```

## Current Rules
- `tenant` is required.
- `command` is required.
- `metadata.actor` is required.
- `metadata.role` is required.
- `deal.execute` requires `metadata.role` to be `approver`.
- high-risk identity signals, such as impossible travel, block execution and require human review.
- protected routes require the matching scope before reading, writing, approving, or executing.
- caller-supplied metadata cannot elevate the actor or role resolved from the API key.
- approval reads require `approval:read`.
- approval resolution requires `approval:review`.
- approval list and lookup routes are tenant-filtered.

## Audit Behavior
Blocked commands are audited with:
- `result.governance = "preflight"`
- `result.success = false`
- `result.error`
- `result.details`

Allowed policy preflight is also audited before handler execution.

Approval reads are audited with `command = approval.viewed` and `result.event = policy.decision`.

Each audit entry receives:

- `prevHash`
- `auditHash`

This creates a lightweight tamper-evident chain for the in-process audit stream and persisted audit result payloads.

## Idempotency

`/v1/command` supports idempotency through:

- `commandId`
- `metadata.idempotencyKey`

The idempotency cache key is:

```txt
tenant + command + keyId + idempotency key
```

Same key and same payload returns the original result as an idempotent replay.

Same key and different payload returns `IDEMPOTENCY_CONFLICT`.

## Rate Limits

Protected write routes are rate-limited by:

```txt
route + tenant + keyId
```

Unauthenticated traffic falls back to IP-based limiting.

## Principle
SentinelOS does not only log what happened. It controls what is allowed to happen before execution, then audits the result.

## Protection Statement

SentinelOS is protected by governed execution, tenant isolation, role-scoped access, policy preflight, audit receipts, and platform ownership terms.
