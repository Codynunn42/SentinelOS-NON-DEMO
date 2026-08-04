# Drift Detection Reference - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DRIFT-DETECTION-REFERENCE]
```

## Purpose

Define current drift categories, signals, severity, and controlled response paths.

## Drift Categories

| Category | Definition | Example |
| --- | --- | --- |
| runtime_documentation_drift | docs disagree with live runtime | stale revision/image in `docs/DEPLOYMENT.md` |
| deployment_manifest_drift | manifest disagrees with live runtime | `azure/container-app.yaml` target port `3000` vs live `80` |
| scaffold_only_configuration | file exists but is not deploy-authoritative | placeholder Azure YAML |
| secret_configuration_risk | sensitive value configured outside secret boundary | direct HMAC-like env value |
| repository_integrity_degraded | Git operations or metadata are unreliable | hung `status`/`fsck`, duplicate Git internals |
| active_worktree_continuity | worktree has large active changes requiring preservation | May 15 NON-DEMO hardening worktree |
| public_surface_confidence | public surface copy/state does not match backend truth | bridge/public route parity drift |
| governance_execution_drift | command path bypasses policy/audit | any handler outside `/v1/command` without preflight |

## Severity Guide

| Severity | Meaning | Response |
| --- | --- | --- |
| low | documentation or cosmetic drift with no runtime risk | document and batch into cleanup |
| medium | could cause confusion or failed deploy if followed | reconcile before next deploy |
| elevated | threatens operator continuity if ignored | checkpoint and create remediation plan |
| high | threatens security, repo integrity, or runtime trust | require approval and preserve evidence before action |
| critical | active execution risk or exposed control path | stop, block, escalate, and do not proceed without approval |

## Current Drift Register

| Drift | Severity | Current Decision |
| --- | --- | --- |
| `azure/container-app.yaml` target port mismatch | medium | live runtime authoritative; YAML scaffold until reconciled |
| stale `docs/DEPLOYMENT.md` revision/image | low_to_medium | update from runtime map or move revision details to generated map |
| direct HMAC-like env value | high | rotate and move behind secret reference |
| `nunncorp-global-mono` duplicate Git internals | high | fresh-clone comparison before cleanup |
| large SentinelOS NON-DEMO worktree | elevated | preserve and checkpoint intentionally |

## Detection Commands

Runtime:

```bash
az containerapp show --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel -o json
curl -sS https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
curl -sS https://nunncorporation.com/api/status
```

Repo:

```bash
git status --short
git branch --show-current
git log -1 --oneline
git fsck --no-progress
find .git -maxdepth 2 -name '*.lock' -o -name '* 2' -o -name '* 3' -o -name '* 4'
```

Governance:

```bash
pnpm run check:execution-integrity
pnpm run check:policy
pnpm run check:approval-bottleneck
pnpm run check:faceplane-fork-continuity
```

## Response Pattern

```txt
detect
-> classify
-> preserve evidence
-> determine authority
-> plan remediation
-> require approval when mutation is involved
-> verify after action
```

## Control Rule

Drift detection is not permission to mutate.

It is permission to classify, preserve, and plan the next governed action.

## Source Documents

- `docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md`
- `docs/REPO_INTEGRITY_STABILIZATION_2026-05-15.md`
- `docs/GOVERNANCE_PREFLIGHT.md`
- `docs/SENTINELOS_REPO_LIVE_HEALTH_SWEEP_2026-05-15.md`
