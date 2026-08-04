# A4 Remediation Governance Pass - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:A4-REMEDIATION-GOVERNANCE-PASS]
```

## Approval Basis

Operator approved the A4 remediation packet and directed Sentinel AI to choose the best option for each A4 problem while preserving governance boundaries.

Approved remediations:

```txt
R-A4-1 - A4.3R fresh sanitized Azure export completed on 2026-05-18
R-A4-2 - A4.1 mark azure/container-app.yaml scaffold-only/non-deployable
R-A4-3 - A5.2/A5.3 move volatile revision/image truth out of static docs
R-A4-4 - A4.2 completed repo-local YAML reconciliation after fresh export evidence
```

## Governance Rules

- No runtime mutation.
- No deployment mutation.
- No secret mutation.
- No YAML reconciliation.
- No public/buyer-facing publication.
- No promotion of scaffold YAML to deploy-authoritative status.
- Fresh sanitized Azure export is now recorded in `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md`.
- A4.2 is now completed as repo-local YAML reconciliation. Deployment still requires separate approval.

## Sub-Issue Governance Pass

| ID | Problem | Approved Handling | Status |
| --- | --- | --- | --- |
| `A4-S1` | Fresh Azure runtime export could not be captured in the May 17 tool session | Preserve approval as read-only sanitized export and retry when access exists | `completed_2026-05-18` |
| `A4-S2` | `azure/container-app.yaml` looked deploy-like despite scaffold drift | Add explicit scaffold-only / non-deployable governance warning | `completed` |
| `A4-S3` | `docs/DEPLOYMENT.md` carried stale volatile revision/image values | Move volatile truth to runtime-map evidence and add last-verified evidence pointers | `completed` |
| `A4-S4` | A4.2 YAML reconciliation could encode drift without fresh export | Reconcile repo-local YAML only after A4.3R evidence and A4.2 approval | `completed_repo_local_reconciliation` |

## Completed Actions

### A4.1

`azure/container-app.yaml` now includes:

```txt
[HOLD:SCAFFOLD-ONLY-NON-DEPLOYABLE]
```

The file is explicitly marked as scaffold/reference only and not safe for deployment.

### A5.2/A5.3

`docs/DEPLOYMENT.md` no longer presents stale static revision/image values as current live authority. Revision and image truth now point to:

```txt
docs/GENERATED_RUNTIME_MAP_2026-05-17.md
docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md
```

The guide now records that A4.3R is complete and that A4.2 remains unexecuted until explicit approval.

### A4.3R

`docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md` now records fresh read-only runtime evidence without secret values.

## Remaining Issues For Next Pass

### GI-A4-1 - Fresh Export Completed

Problem:

```txt
A4.3R was previously blocked by tool access, but the fresh sanitized export was completed on 2026-05-18.
```

Governance suggestion:

```txt
Preserve the sanitized export as runtime evidence. Do not proceed to A4.2 without explicit operator approval.
```

### GI-A4-2 - Static Docs Now Depend On Runtime Map Evidence

Problem:

```txt
docs/DEPLOYMENT.md now relies on runtime-map evidence for revision/image truth.
```

Governance suggestion:

```txt
Keep runtime map refresh cadence explicit in future executive snapshots so deployment docs do not silently become stale again.
```

### GI-A4-3 - Scaffold YAML Still Contains Placeholder Values

Problem:

```txt
azure/container-app.yaml still contains placeholder values and targetPort drift.
```

Governance suggestion:

```txt
Do not edit runtime shape in the scaffold until A4.2 is approved. The scaffold warning is sufficient containment for the current pass.
```

## Next Approval Candidate

```txt
deployment value/binding review for reconciled container-app.yaml, no runtime mutation without separate approval.
```

## Non-Authorization Clause

This governance pass records approved documentation and containment remediations. It does not authorize runtime mutation, deployment mutation, secret mutation, deploy-authoritative YAML reconciliation, public publication, or cleanup beyond the listed approved actions.
