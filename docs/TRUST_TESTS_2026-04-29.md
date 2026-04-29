# SentinelOS Trust Tests 2026-04-29

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose

Capture the small set of trust tests that prove SentinelOS is enforcing identity, policy, execution, audit, and receipts.

## Test 1: Spoof Attempt Fails

Setup:

```txt
keyId: key_ownerfi_operator_001
tenant: ownerfi
actor: gregg@ownerfi.com
role: operator
scopes: application:submit, application:read, audit:read, receipt:read
```

Request attempted:

```txt
command: deal.execute
metadata.role: approver
```

Result:

```txt
status: blocked
error: SCOPE_REQUIRED
requiredScope: deal:execute
actor: gregg@ownerfi.com
role: operator
```

Conclusion:

Caller-supplied metadata cannot elevate the resolved key identity.

## Test 2: Scoped Operator Can Submit

Request:

```txt
command: application.submit
```

Result:

```txt
status: executed
receipt: rcpt_214d5606-d63e-4a18-b630-34844b24e372
```

Conclusion:

Normal workflow execution remains available when identity, role, scope, and policy allow it.

## Test 3: Policy Route Requires Policy Scope

Request:

```txt
POST /policy/evaluate
key role: operator
scopes: application:submit, application:read, audit:read, receipt:read
```

Result:

```txt
status: blocked
error: SCOPE_REQUIRED
requiredScope: policy:evaluate
```

Conclusion:

Policy introspection is itself protected by policy.

## Test 4: Idempotency Prevents Duplicate Execution

Check:

```txt
node scripts/check-idempotency.js
```

Result:

```txt
first request: executed
same commandId + same payload: idempotentReplay true
same commandId + changed payload: IDEMPOTENCY_CONFLICT
```

Conclusion:

Duplicate command execution is blocked without weakening normal workflow execution.

## Test 5: Receipt And Audit Hash Chain

Check:

```txt
node scripts/check-receipt-lookup.js
```

Result:

```txt
receipt lookup passed
audit entry includes auditHash
audit entry includes prevHash
```

Conclusion:

Receipts are queryable, and the audit stream is tamper-evident at the application layer.

## Test 6: Approval Read Versus Review Access

Check:

```txt
node scripts/check-approval-access.js
```

Result:

```txt
operator key + approval:read: GET /approvals returns 200
operator key without approval:review: POST /approvals/:id/approve returns SCOPE_REQUIRED
approver key + approval:review: POST /approvals/:id/approve returns 200 in local non-demo smoke
approval reads emit approval.viewed audit entries
```

Conclusion:

Operators can review the approval queue without gaining authority to resolve protected decisions.
