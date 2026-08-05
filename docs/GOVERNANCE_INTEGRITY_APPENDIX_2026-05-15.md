# Governance Integrity Appendix - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:GOVERNANCE-INTEGRITY-APPENDIX]
```

## Purpose

Document the controls that preserve SentinelOS execution integrity.

## Non-Negotiable Rule

```txt
No governed action outside the command/control path.
```

## Preflight Integrity

Every protected command must pass:

```txt
tenant present
command present
metadata.actor present
metadata.role present
key resolves to tenant + actor + role + scopes
required scope present
tenant isolation enforced
policy decision recorded
```

## Execution Integrity

Execution is allowed only after:

- request authentication
- identity and scope resolution
- governance preflight
- signed execution context or decision integrity where required
- approval state check where required
- policy final authority
- audit receipt

## Approval Integrity

Approval rules:

- read access requires `approval:read`
- review access requires `approval:review`
- read-only operators cannot approve
- blocked operations return visible approval-required state
- approval resolution appends audit/timeline evidence

## Audit Integrity

Audit expectations:

- blocked commands are audited
- allowed preflight is audited
- approval reads are audited
- successful execution is audited
- policy rejection is audited
- audit chain fields are preserved where supported

## Telemetry And Signal Integrity

Phase 1.1 evidence confirms:

- mock FacePlane operations produce per-iteration metrics
- telemetry artifacts persist under `runtime/mock-results/`
- cross-run analytics can compute aggregate metrics
- correlation IDs are preserved through execution path

Governance Signals should remain a control-loop layer:

```txt
execution -> audit -> signals -> metrics -> escalation posture
```

## State Anchoring Integrity

Anchors represent decisions, not ordinary events.

Current anchor labels:

```txt
SYSTEM_RELEASE
PILOT_START
EXECUTION_APPROVED
BILLING_ACTIVATED
```

Validation:

```bash
npm run release:anchor
npm run check:state-anchors
```

## Current Integrity Gaps

| Gap | Severity | Boundary |
| --- | --- | --- |
| Direct HMAC-like env value in live runtime | high | rotate and move to secret reference before production-grade claim |
| `azure/container-app.yaml` scaffold drift | medium | do not use for redeploy until reconciled |
| `nunncorp-global-mono` Git degradation | high | fresh-clone comparison before cleanup |
| Large active NON-DEMO worktree | elevated | checkpoint intentionally; do not clean opportunistically |

## Verification Commands

```bash
pnpm run check:execution-integrity
pnpm run check:policy
pnpm run check:approval-bottleneck
pnpm run check:faceplane-fork-continuity
pnpm run check:state-anchors
```

## Source Documents

- `docs/GOVERNANCE_PREFLIGHT.md`
- `docs/EXECUTION_ARCHITECTURE.md`
- `docs/PHASE1_LIVE_VERIFICATION_2026-05-15.md`
- `docs/STATE_ANCHORING_RUNBOOK.md`
- `docs/SECURITY_HARDENING_PASS_2026-05-11.md`
