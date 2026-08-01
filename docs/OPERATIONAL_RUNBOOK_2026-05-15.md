# SentinelOS Operational Runbook - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:OPERATIONAL-RUNBOOK]
```

## Purpose

Provide the daily operating routine for SentinelOS NON-DEMO while the system is in hardening and infrastructure-consolidation posture.

This runbook does not authorize expansion. It preserves governed execution continuity.

## Operating Position

```txt
SentinelOS Deal Execution Engine
No drift.
No governed action outside the command/control path.
```

## Daily Operator Sequence

1. Confirm repository continuity.
2. Confirm runtime truth.
3. Confirm health and readiness.
4. Confirm governance checks.
5. Confirm approval continuity.
6. Confirm audit and signal visibility.
7. Record drift, blockers, and next controlled action.

## 1. Repository Continuity

Primary repo:

```txt
/Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO
```

Current known posture:

```txt
branch: hardening/telemetry-signature-correlation
latest commit: 4f19f43 Normalize archive intelligence component names
status: responsive with large active hardening worktree
```

Commands:

```bash
git status --short
git branch --show-current
git log -1 --oneline
git fsck --no-progress
```

Rule:

```txt
Do not reset, clean, or delete worktree state during routine checks.
```

Monorepo reference repo:

```txt
/Users/codynunn/Documents/GitHub/nunncorp-global-mono
```

Known posture:

```txt
status: degraded
reason: duplicate Git internals and hung status/fsck diagnostics
```

Do not use the degraded monorepo as a release-continuity dependency until it has been compared against a fresh clone and remediated under approval.

## 2. Runtime Truth

Authoritative live runtime:

```txt
Container App: ca-nc-dev-sentinel
Resource Group: rg-nc-dev-sentinel
Region: East US 2
Revision: ca-nc-dev-sentinel--phase1-approve-0645
Image: acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645
Ingress port: 80
Health route: /health
```

Runtime check:

```bash
curl -sS https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
curl -sS https://nunncorporation.com/api/status
```

Expected:

```txt
status: ok / connected
service: sentinel-api
mode: non-demo
tier: PUBLIC
database: enabled
```

Rule:

```txt
Treat live runtime as authoritative unless proven otherwise.
Treat azure/container-app.yaml as scaffold-only until reconciled.
```

## 3. Governance Verification

Core checks:

```bash
pnpm run check:execution-integrity
pnpm run check:policy
pnpm run check:approval-bottleneck
pnpm run check:faceplane-fork-continuity
```

Expected:

```txt
execution integrity: passed
policy engine: passed
approval bottleneck analysis: passed
faceplane fork continuity: passed
```

Policy rule:

```txt
request -> authenticate key -> resolve tenant / actor / role / scopes -> policy preflight -> handler -> audit receipt
```

No protected request runs from only a secret value. The key must resolve tenant, actor, role, and scopes.

## 4. Approval Continuity

Approval-required paths must remain visible as governed stops.

Expected behavior:

```txt
blocked -> approval required -> approved -> rerun -> execute
```

Do not convert approval-required outcomes into silent success. A blocked command is a valid platform outcome when governance requires it.

## 5. Audit, Signals, And Evidence

Audit behavior:

- blocked commands are audited
- allowed preflight is audited before handler execution
- approval reads are audited as `approval.viewed`
- audit entries carry chain fields where supported
- Governance Signals summarize risk, block, approval, and persistence conditions

Evidence locations:

```txt
docs/PHASE1_LIVE_VERIFICATION_2026-05-15.md
runtime/mock-results/
docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md
docs/REPO_INTEGRITY_STABILIZATION_2026-05-15.md
```

## 6. Recovery Boundary

Allowed during routine operation:

- read-only health checks
- read-only Azure runtime export
- local governance checks
- report generation
- fresh clone comparison planning

Requires explicit approval:

- deleting Git duplicate internals
- running destructive Git cleanup
- modifying Container App runtime
- rotating live secrets
- changing deploy-authoritative manifests
- redeploying public surfaces

## Daily Closure Record

Each day should close with:

```txt
runtime truth:
repo truth:
governance checks:
approval continuity:
audit/signal posture:
drift found:
next controlled envelope:
```

## Source Documents

- `docs/EXECUTIVE_SNAPSHOT_2026-05-15.md`
- `docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md`
- `docs/REPO_INTEGRITY_STABILIZATION_2026-05-15.md`
- `docs/DEPLOYMENT.md`
- `docs/DAILY_OPERATING_GOAL.md`
- `docs/GOVERNANCE_PREFLIGHT.md`
- `docs/PHASE1_LIVE_VERIFICATION_2026-05-15.md`
