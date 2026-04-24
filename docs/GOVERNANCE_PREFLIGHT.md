# Governance Preflight

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Definition
Governance preflight is the required control layer that evaluates every command before a surface-plane handler can execute.

## Command Flow
`request -> governance preflight -> handler -> audit`

## Current Rules
- `tenant` is required.
- `command` is required.
- `metadata.actor` is required.
- `metadata.role` is required.
- `deal.execute` requires `metadata.role` to be `approver`.

## Audit Behavior
Blocked commands are audited with:
- `result.governance = "preflight"`
- `result.success = false`
- `result.error`
- `result.details`

## Principle
SentinelOS does not only log what happened. It controls what is allowed to happen before execution, then audits the result.
