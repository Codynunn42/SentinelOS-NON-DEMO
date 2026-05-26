# Repository Classification Register - 2026-05-23

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** repository governance classification  
**Posture:** review-only register  
**Authority Created:** false  
**Execution State:** non-mutating

## Artifact Decision

`[KEEP:REPOSITORY-CLASSIFICATION-REGISTER-2026-05-23]`

This register starts the Sentinel-managed repository classification process.

It does not change repository settings.

## Classification Rules

| Status | Meaning |
| --- | --- |
| `MANAGED_CONFIRMED` | repository is already in active Sentinel-managed operating context |
| `MANAGED_REVIEW_ONLY` | repository is referenced as part of Sentinel-managed architecture but needs current-state verification before operational claims |
| `CANDIDATE_NEEDS_VERIFICATION` | repository may belong in the managed set, but classification cannot be finalized from current evidence |
| `ARCHIVE_OR_DEGRADED_REVIEW` | repository or artifact set requires preservation and review before cleanup, mutation, or enforcement |

## Initial Managed Repository Register

| Repository / Lane | Classification | Governance Class | Current State | Boundary |
| --- | --- | --- | --- | --- |
| `SentinelOS-NON-DEMO` | `MANAGED_CONFIRMED` | core governance and live proof implementation repository | active executive operating blueprint, proof/governance docs, Microsoft Sentinel integration boundary | no deployment or runtime mutation from this register |
| `nunncorp-global-mono` | `MANAGED_CONFIRMED` | global mono/control-surface repository | Phase 1 stabilization process started as review-scoped operating model work | cleanup and protection changes require separate approval |
| `Contract Reclamation` sibling repo | `MANAGED_REVIEW_ONLY` | sibling governed domain faceplane repository | local sibling repo path verified; prototype/review lane for evidence ingest and evidence timeline | review artifacts only; no legal advice, recovery claim, or execution authority |
| `Operational Upgrade` lane | `MANAGED_REVIEW_ONLY` | modernization/drift assessment lane | retained as distinct from Contract Reclamation | do not rename or collapse into Contract Reclamation |
| historical backup, cleanup, or degraded repository artifacts | `ARCHIVE_OR_DEGRADED_REVIEW` | preservation and integrity review | cleanup boundary evidence exists for nunncorp-global-mono context | no deletion, quarantine, reset, or rewrite without explicit cleanup authority |

## Required Repository Fields

Each managed repository should eventually carry:

| Field | Purpose |
| --- | --- |
| repository name | stable managed identity |
| governance class | core, global mono, faceplane, operational upgrade, archive/degraded |
| owner | accountable operator or organization |
| managed by | Sentinel AI / Nunn Cloud governance context |
| inherited doctrine | governance doctrine applied to repository |
| proof surface | current verified proof path, if any |
| runtime surface | runtime dependency, if any |
| security baseline posture | branch protection, secret scanning, dependency review, workflow protection status |
| publication state | internal, held, approved, or published |
| deployment state | held, review-only, active, or blocked |
| mutation state | allowed, blocked, or requires approval |
| last verification | most recent evidence source |
| next action | current non-mutating lane or approved operation |
| blockers | unresolved conditions |

## Governance Inheritance

All managed repositories inherit the following doctrine unless a narrower approved packet overrides it:

- governance before execution
- evidence before claims
- proof refresh before external use
- no faceplane authority merge
- no repository mutation from review artifacts
- no deployment, publication, or runtime mutation without explicit approval
- no legal advice, recovery, or legal certainty claims from Contract Reclamation lanes
- no billing, funnel, or custom-domain readiness claims until verified

## Operational State Visibility

Current organization-level posture:

```yaml
repository_governance_state:
  alignment_packet: COMPLETE_CURRENT_PASS
  classification_register: SEEDED
  security_baseline_enforcement: NOT_ENABLED_BY_THIS_REGISTER
  protected_repository_operations: REQUIRE_SEPARATE_APPROVAL
  standing_gate: ACTIVE
  movement_condition: external_trigger_or_operator_direction
  authority_created: false
```

## Open Sub-Issues

| Issue | Status | Required Action |
| --- | --- | --- |
| current live repo inventory | open | verify actual managed repository list before making org-wide claims |
| baseline status for each repository | open | create security baseline matrix |
| branch protection / secret scanning reality | open | inspect only after approved read access path is selected |
| cleanup-boundary reconciliation | open | keep cleanup review separate from governance classification |
| faceplane sibling verification | open | verify Contract Reclamation repo state before elevating classification |

## Initial Read-Only Inventory Evidence

| Repository / Lane | Evidence | Result |
| --- | --- | --- |
| `SentinelOS-NON-DEMO` | current workspace has `.git` | local repo present |
| `nunncorp-global-mono` | local `.git` and `STATUS_REPORT.md` found at `/Users/codynunn/Documents/GitHub/nunncorp-global-mono` | local repo present |
| `Contract Reclamation` sibling repo | local `.git`, docs, public evidence timeline, package file, and check scripts found at `/Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/contract-reclamation` | local sibling repo present |

## Next Action

```yaml
selected_action: repository_security_baseline_matrix
deliverable: docs/REPOSITORY_SECURITY_BASELINE_MATRIX_2026-05-23.md
authority_created: false
operation_type: baseline_visibility_only
```
