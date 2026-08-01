# SentinelOS Fork Result - Workflow Retry Reduction - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Fork

`fork/drift-workflow-retry-reduction`

## Objective

Reduce repeated blocked workflow retries by returning explicit retry guidance with blocked command responses.

## Implementation

- Added retry guidance to approval-required command stops.
- Added retry guidance to policy boundary blocks.
- Added retry guidance to execution authority blocks.
- Added retry guidance to signature verification failures.
- Added retry guidance to unknown tenant/command routing failures.
- Included retry guidance in blocked-path telemetry events.

## Controlled Outcome

Blocked workflow responses now tell the operator whether retrying is useful, when retrying is valid, what concept the block belongs to, and what action should happen before retry.

This keeps drift from becoming repeated blind execution attempts.

## Concept Mapping

| Block Type | Concept | Retry Rule | Next Action |
| --- | --- | --- | --- |
| `APPROVAL_REQUIRED` | `approval_continuity` | retry after approval | resubmit with approved `approvalId` |
| `SCOPE_REQUIRED` / policy block | `policy_boundary` | retry only after policy context changes | correct scope, role, tenant, or command |
| `UNAUTHORIZED_EXECUTION` | `execution_authority` | never retry directly | route through signed Sentinel command path |
| `SIGNATURE_VERIFICATION_FAILED` | `execution_integrity` | never retry same payload | regenerate signed decision |
| unknown tenant/command | `surface_registry` | retry only after registration/correction | register or correct mapping |

## Files Changed

- `apps/sentinel/src/commands/dispatch.js`
- `scripts/check-workflow-retry-reduction.js`
- `package.json`

## Verification

```txt
pnpm run check:workflow-retry
pnpm run check:trust-score
pnpm run check:governance-drift-core
pnpm run check:execution-integrity
```

## Result

Status: `implemented`

Workflow drift is now matched to a concept and correction path before the next retry.

## XE Execution Prep

XE should use the retry guidance as the execution-prep gate:

1. If `retry.retryable` is `false`, do not retry.
2. If `retry.retryWhen` is `approval_approved`, wait for approval and resubmit with `approvalId`.
3. If concept is `policy_boundary`, correct operator scope/role/tenant/command first.
4. If concept is `execution_authority`, rebuild the signed Sentinel command envelope.
5. If concept is `execution_integrity`, regenerate the signed decision before execution.
