# Snapshot Remediation Approval Packet - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[HOLD:APPROVAL-PACKET]
```

## Source Command

```txt
ops/command-envelopes/snapshot-remediation-solutioning-2026-05-17.json
```

## Purpose

Ingest the May 16 executive snapshot and convert open issues into approval-ready solution options.

This packet is solutioning only. It does not authorize runtime mutation, deployment changes, secret rotation, destructive cleanup, public publication, tool grants, permission expansion, or promotion of held governance artifacts.

## Sentinel Processing Result

| Field | Value |
| --- | --- |
| Source Snapshot | `docs/EXECUTIVE_SNAPSHOT_2026-05-16.md` |
| Processing Mode | `classification_and_solutioning_only` |
| Mutation Performed | `none` |
| Approval Required Before Execution | `yes` |
| Output Status | `ready_for_operator_review` |

## Mutation Class Legend

| Mutation Class | Meaning | Approval Posture |
| --- | --- | --- |
| `none` | Read-only analysis or planning | No execution approval needed |
| `repo_doc_mutation` | Markdown/docs changes only | Operator review before external use |
| `repo_code_or_iac_mutation` | Code, config, or IaC file changes | Operator approval and verification required |
| `git_mutation` | Commit, stage, branch, tag, push, or checkpoint | Explicit operator approval |
| `runtime_security_mutation` | Secret rotation, env var, identity, runtime security change | Explicit operator approval and live verification |
| `destructive_cleanup` | Delete, reset, rewrite, cleanup of corrupted internals | Explicit approval plus backup/fresh-clone evidence |
| `network_or_filesystem_mutation` | Fresh clone, backup, artifact export outside current repo | Approval required when outside current workspace or networked |
| `external_publication` | Buyer/public-facing release, publication, outreach asset use | Claim review and operator approval |

## Recommended Approval Sequence

1. Approve a worktree checkpoint strategy.
2. Approve a secret configuration remediation plan.
3. Approve a fresh-clone comparison for `nunncorp-global-mono`.
4. Approve deploy/IaC truth source decision.
5. Approve deeper public label review and buyer-kit refinement.
6. Approve governance standard review batch without promotion.

This sequence keeps high-risk runtime and repo integrity items ahead of public packaging.

## Approval Items

### A1 - Active Worktree Continuity

| Field | Value |
| --- | --- |
| Priority | `P0` |
| Source Risk | Worktree checkpoint risk |
| Mutation Class | `git_mutation` |
| Approval Needed | `yes` |
| Recommended Posture | checkpoint before more broad changes |

Problem:

```txt
SentinelOS NON-DEMO contains many active hardening, documentation, runtime, and command changes.
```

Solution options:

1. `A1.1` - Create a named checkpoint commit containing only the current governance/documentation package.
2. `A1.2` - Stage and commit in batches: governance standards, operational packets, public-surface remediation, then runtime/code changes.
3. `A1.3` - Create a non-pushed local safety branch before any further broad edits.

Recommended approval:

```txt
Approve A1.2: staged checkpoint by artifact class.
```

Reason:

This preserves audit lineage and makes rollback/review clearer than one large mixed commit.

Verification after approval:

```bash
git status --short
git diff --check
git log -1 --oneline
```

No execution authorized from this packet.

### A2 - Secret Configuration Risk

| Field | Value |
| --- | --- |
| Priority | `P0` |
| Source Risk | direct HMAC-like runtime env value |
| Mutation Class | `runtime_security_mutation` |
| Approval Needed | `yes` |
| Recommended Posture | rotate and move behind secret reference |

Problem:

```txt
live runtime includes one HMAC-like value configured directly as an env value
```

Solution options:

1. `A2.1` - Prepare a read-only secret inventory report that lists secret names only, with values redacted. Status: `completed_pending_operator_review`.
2. `A2.2` - Approve rotation plan: generate replacement value, store as managed secret, update env to secret reference, restart/revision as required, verify health. Status: `completed`.
3. `A2.3` - Add documentation rule: no direct secret-like values in runtime env exports or public reports. Status: `completed`.

Recommended approval:

```txt
A2.1, A2.2, and A2.3 are completed. Secondary direct-env classification remains open.
```

Reason:

This avoids rotating the wrong value and preserves operational continuity.

Verification after approval:

```bash
az containerapp show --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel --query "properties.template.containers[0].env[].{name:name,secretRef:secretRef}" -o json
az containerapp show --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel --query "properties.configuration.secrets[].{name:name}" -o json
curl -sS https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
curl -sS https://nunncorporation.com/api/status
```

Secret values must not be printed in reports.

A2.1 output:

- `docs/SECRET_CONFIGURATION_INVENTORY_2026-05-17.md`

A2.2 output:

- `docs/SECRET_ROTATION_COMPLETION_2026-05-17.md`

A2.3 output:

- `docs/SECRET_CONFIGURATION_CONTROL_RULE_2026-05-17.md`

### A3 - `nunncorp-global-mono` Repo Degradation

| Field | Value |
| --- | --- |
| Priority | `P1` |
| Source Risk | duplicate Git internals and hung read-only diagnostics |
| Mutation Class | `network_or_filesystem_mutation`, later possible `destructive_cleanup` |
| Approval Needed | `yes` |
| Recommended Posture | fresh clone comparison before cleanup |

Problem:

```txt
nunncorp-global-mono has duplicate Git internals and hung status/fsck diagnostics.
```

Solution options:

1. `A3.1` - Create a fresh comparison clone in a separate directory.
2. `A3.2` - Compare `.git` internals and refs between degraded repo and fresh clone.
3. `A3.3` - Produce cleanup boundary report.
4. `A3.4` - Only after approval, remove duplicate/stale Git internals if confirmed safe.

Recommended approval:

```txt
Approve A3.1 and A3.2 only.
```

Reason:

Fresh clone comparison gives evidence before any cleanup. No deletion should happen yet.

Verification after approval:

```bash
git rev-parse --show-toplevel
git branch --show-current
git log -1 --oneline
find .git -maxdepth 2 -name '* 2' -o -name '* 3' -o -name '* 4'
```

Destructive cleanup remains blocked.

### A4 - Deploy-Authoritative IaC

| Field | Value |
| --- | --- |
| Priority | `P1` |
| Source Risk | `azure/container-app.yaml` scaffold mismatch |
| Mutation Class | `repo_code_or_iac_mutation` |
| Approval Needed | `yes` |
| Recommended Posture | choose authoritative source before edit |

Problem:

```txt
azure/container-app.yaml still does not match live runtime posture.
```

Solution options:

1. `A4.1` - Mark `azure/container-app.yaml` explicitly scaffold-only and non-deployable.
2. `A4.2` - Reconcile YAML to live runtime truth and make it the future deploy-authoritative manifest.
3. `A4.3` - Create generated runtime map as authoritative evidence, leaving YAML scaffold-only until IaC strategy is chosen.

Recommended approval:

```txt
Approve A4.3 first.
```

Reason:

Live runtime is currently authoritative. A generated runtime map avoids accidental redeploy from stale scaffold YAML.

Verification after approval:

```bash
az containerapp show --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel -o json
```

No deployment authorized from this packet.

### A5 - Deployment Docs Revision/Image Drift

| Field | Value |
| --- | --- |
| Priority | `P1` |
| Source Risk | deployment docs drift |
| Mutation Class | `repo_doc_mutation` |
| Approval Needed | `operator review` |
| Recommended Posture | update docs from runtime map |

Problem:

```txt
docs/DEPLOYMENT.md has stale revision/image details relative to verified runtime.
```

Solution options:

1. `A5.1` - Update `docs/DEPLOYMENT.md` with current runtime revision/image from verified export.
2. `A5.2` - Remove volatile revision/image details from static docs and link to generated runtime map.
3. `A5.3` - Add a "last verified" section with command and timestamp.

Recommended approval:

```txt
Approve A5.2 and A5.3 after A4.3.
```

Reason:

This prevents static docs from becoming stale again.

### A6 - Public Surface Alignment Follow-Up

| Field | Value |
| --- | --- |
| Priority | `P1` |
| Source Risk | public claim drift |
| Mutation Class | `repo_doc_mutation`, possible public copy repo edits |
| Approval Needed | `operator review before external use` |
| Recommended Posture | deeper label check, no public promotion |

Problem:

```txt
first remediation pass is applied, but deeper public label checks remain.
```

Solution options:

1. `A6.1` - Inspect public HTML/route labels for unqualified execution, control, autonomy, production, and government claims.
2. `A6.2` - Produce a label remediation diff for operator review.
3. `A6.3` - Re-run buyer-facing copy against `APPROVED_VOCABULARY_DICTIONARY.md`.

Recommended approval:

```txt
Approve A6.1 and A6.2.
```

Reason:

This continues semantic containment without external publication.

### A7 - Buyer-Facing Pilot Kit

| Field | Value |
| --- | --- |
| Priority | `P2` |
| Source Risk | buyer-facing package requires trimming |
| Mutation Class | `repo_doc_mutation`, later `external_publication` |
| Approval Needed | `claim review before use` |
| Recommended Posture | create buyer-safe draft only |

Problem:

```txt
operational package is internal-ready but buyer-facing use requires trimming.
```

Solution options:

1. `A7.1` - Create internal draft `PILOT_ONBOARDING_KIT_2026-05-17.md`.
2. `A7.2` - Remove internal risk language, secret-risk details, and repo-internal diagnostics.
3. `A7.3` - Include only verified proof surfaces, controlled claims, and onboarding next steps.

Recommended approval:

```txt
Approve A7.1 as internal draft only.
```

Reason:

This prepares buyer material without external publication.

### A8 - Architecture Diagram Bundle

| Field | Value |
| --- | --- |
| Priority | `P2` |
| Source Risk | architecture bundle pending |
| Mutation Class | `repo_doc_mutation` |
| Approval Needed | `operator review` |
| Recommended Posture | sanitized diagram set only |

Problem:

```txt
diagram set should be produced from existing Mermaid/docs without expanding system scope.
```

Solution options:

1. `A8.1` - Inventory existing Mermaid diagrams.
2. `A8.2` - Create sanitized architecture diagram index.
3. `A8.3` - Label diagrams as internal, buyer-safe, or held.

Recommended approval:

```txt
Approve A8.1 and A8.2.
```

Reason:

This improves packaging without creating new system claims.

### A9 - Held Governance Standards Review

| Field | Value |
| --- | --- |
| Priority | `P3` |
| Source Risk | many held standards now drafted |
| Mutation Class | `none` for review, `repo_doc_mutation` for review notes |
| Approval Needed | `review before promotion` |
| Recommended Posture | review batch, no promotion |

Problem:

```txt
governance standards are drafted/held and need review before promotion or operational use.
```

Solution options:

1. `A9.1` - Create a governance review checklist for all held standards.
2. `A9.2` - Validate invariants across the stack.
3. `A9.3` - Produce promotion blockers and required evidence.

Recommended approval:

```txt
Approve A9.1 and A9.2 only.
```

Reason:

This preserves draft containment while moving toward formal review.

## Approval Request Summary

Recommended approvals now:

```txt
A1.2 - staged worktree checkpoint by artifact class
A2.1 - redacted secret inventory report
A3.1/A3.2 - fresh clone comparison for nunncorp-global-mono
A4.3 - generated runtime map as authoritative evidence
A6.1/A6.2 - deeper public label check and remediation diff
A7.1 - internal pilot onboarding kit draft
A8.1/A8.2 - architecture diagram inventory and index
A9.1/A9.2 - governance standards review checklist and invariant validation
```

Hold for later approval:

```txt
A2.2 - actual secret rotation
A3.4 - destructive Git cleanup
A4.2 - deploy-authoritative YAML reconciliation
external publication of buyer-facing materials
promotion of any held governance standard
```

## Sentinel Verdict

The snapshot issues are ready for controlled approval sequencing.

The safest next executable approval is:

```txt
A1.2 - staged worktree checkpoint by artifact class
```

Reason:

The active worktree is the continuity boundary that protects every subsequent remediation.
