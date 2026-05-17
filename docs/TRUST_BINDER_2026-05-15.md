# SentinelOS Trust Binder - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:TRUST-BINDER]
```

## Purpose

Define what SentinelOS is trusted to do, what it is not trusted to do, and where execution is blocked.

## Product Boundary

SentinelOS is a governed execution control layer.

It evaluates intent, policy, approval state, audit context, and runtime posture before action.

Core rule:

```txt
AI can learn freely.
AI can suggest cautiously.
AI can act only through policy.
```

## Trust Claims

SentinelOS can currently claim:

- governed command execution through `/v1/command`
- role-scoped key resolution into tenant, actor, role, and scopes
- governance preflight before handler execution
- approval-required stops
- audit records for allowed and blocked paths
- receipt and audit visibility
- runtime health verification
- Governance Signals and metrics posture
- local proof of Phase 1.1 telemetry, analytics, and approval continuity

SentinelOS should not currently claim:

- unrestricted production readiness
- government deployment as active
- replacement of customer systems
- runtime mutation without approval
- deploy-authoritative IaC parity until `azure/container-app.yaml` is reconciled
- clean monorepo release continuity until `nunncorp-global-mono` is stabilized

## Execution Boundary

Canonical command boundary:

```txt
request
-> authenticate key
-> resolve tenant / actor / role / scopes
-> policy preflight
-> signed context / decision integrity
-> approval check
-> handler
-> audit receipt
```

No valid policy posture means no execution.

No valid approval for approval-required action means no execution.

No trusted runtime truth means no deployment modification.

## Approval Boundary

Approvals are not paperwork. They are execution controls.

Valid behavior:

```txt
attempt -> block -> explain why -> approval -> rerun -> execute -> audit
```

Invalid behavior:

```txt
attempt -> silently execute
attempt -> bypass policy
attempt -> approve without approval:review
attempt -> mutate runtime from documentation alone
```

## Infrastructure Trust Boundary

Live Azure runtime is currently authoritative for operational truth:

```txt
ca-nc-dev-sentinel
revision: ca-nc-dev-sentinel--phase1-approve-0645
port: 80
health: /health
database: enabled
```

`azure/container-app.yaml` is scaffold-only until reconciled with live export.

## Repository Trust Boundary

`SentinelOS-NON-DEMO` is responsive but has a large active hardening worktree.

`nunncorp-global-mono` is degraded and should not be used as a release-continuity dependency until compared against a fresh clone and remediated under approval.

## Security Trust Boundary

Key rules:

- no protected request runs from only a secret value
- caller metadata cannot elevate the resolved API-key principal
- approval resolution requires `approval:review`
- approval reads require `approval:read`
- direct secret values in runtime env should be rotated into secret references

Known security signal:

```txt
live runtime contains one HMAC-like direct env value
severity: high
decision: rotate and move behind secret reference before production-grade trust claim
```

The value is intentionally not recorded here.

## Documentation Trust Boundary

Canonical documents are sufficient for institutional packaging. Current work is consolidation, not broad new writing.

Priority packages:

- Operational Runbook
- Governance Integrity Appendix
- Demo Reliability Packet
- Deployment Recovery Procedures
- Drift Detection Reference

## Source Documents

- `docs/PRODUCT.md`
- `docs/EXECUTION_ARCHITECTURE.md`
- `docs/GOVERNANCE_PREFLIGHT.md`
- `docs/SYSTEM_DESIGN.md`
- `docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md`
- `docs/REPO_INTEGRITY_STABILIZATION_2026-05-15.md`
