# Repository Operational State Visibility Matrix - 2026-05-23

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** repository operational state visibility  
**Posture:** review-only state modeling  
**Authority Created:** false  
**Execution State:** non-mutating

## Artifact Decision

`[KEEP:REPOSITORY-OPERATIONAL-STATE-VISIBILITY-MATRIX-2026-05-23]`

This matrix defines the operational state fields needed to track Sentinel-managed repositories.

It does not inspect or change remote repository settings.

## Purpose

Give the operator a complete state model before any protected repository action is considered.

The model separates:

- classification
- baseline definition
- current verification state
- protected action readiness
- decision requirements
- blocked actions

## State Vocabulary

| State | Meaning |
| --- | --- |
| `DEFINED` | the governance expectation exists |
| `SEEDED` | the repository is in the initial register |
| `UNKNOWN_PENDING_READ_ONLY_VERIFICATION` | current live state has not been inspected |
| `READY_FOR_READ_ONLY_VERIFICATION` | next step can collect evidence without changing settings |
| `BLOCKED_FOR_ENFORCEMENT` | setting changes are not authorized |
| `HELD` | requires operator or external trigger before movement |

## Repository State Matrix

| Repository / Lane | Classification | Baseline Model | Current Live Setting Evidence | Enforcement Readiness | Next Allowed Movement |
| --- | --- | --- | --- | --- | --- |
| `SentinelOS-NON-DEMO` | `MANAGED_CONFIRMED` | `DEFINED_AND_PARTIALLY_VERIFIED` | local and GitHub metadata verified; security gaps found | `BLOCKED_FOR_ENFORCEMENT` | gap review |
| `nunncorp-global-mono` | `MANAGED_CONFIRMED` | `DEFINED_AND_PARTIALLY_VERIFIED` | local and GitHub metadata verified; some GitHub security states unresolved | `BLOCKED_FOR_ENFORCEMENT` | gap review; cleanup remains separately blocked |
| `Contract Reclamation` sibling repo | `MANAGED_REVIEW_ONLY` | `DEFINED_LOCAL_ONLY` | local repo verified; no remote verified | `BLOCKED_FOR_ENFORCEMENT` | decide local-only vs governed remote path |
| `Operational Upgrade` lane | `MANAGED_REVIEW_ONLY` | `DEFINED` | `UNKNOWN_PENDING_READ_ONLY_VERIFICATION` | `BLOCKED_FOR_ENFORCEMENT` | preserve as distinct modernization lane |
| archive, backup, cleanup, or degraded artifacts | `ARCHIVE_OR_DEGRADED_REVIEW` | `PARTIAL` | `UNKNOWN_PENDING_READ_ONLY_VERIFICATION` | `BLOCKED_FOR_ENFORCEMENT` | preservation review only |

## Protected Action State

| Action | Current State | Gate Required |
| --- | --- | --- |
| read-only repository inventory | `COMPLETE_CURRENT_PASS` | no enforcement authority created |
| read-only security baseline verification | `COMPLETE_CURRENT_PASS_WITH_GAPS` | gap review required |
| branch protection enablement | `BLOCKED_FOR_ENFORCEMENT` | separate protected repository operation |
| secret scanning enablement | `BLOCKED_FOR_ENFORCEMENT` | separate protected repository operation |
| dependency review enablement | `BLOCKED_FOR_ENFORCEMENT` | separate protected repository operation |
| workflow permission changes | `BLOCKED_FOR_ENFORCEMENT` | separate protected repository operation |
| cleanup, quarantine, deletion, reset, or archive | `BLOCKED_FOR_ENFORCEMENT` | separate cleanup authority packet |
| deployment or runtime mutation | `BLOCKED` | not in repository governance scope |

## Gate 1 Assessment

Gate 1 asks:

```txt
Are the doctrine, classification register, and security baseline defined well enough to proceed into read-only operational verification?
```

Assessment:

```yaml
gate_1:
  doctrine_defined: true
  classification_register_seeded: true
  security_baseline_defined: true
  operational_state_model_defined: true
  enforcement_authority_created: false
  protected_setting_changes_authorized: false
  result: PASSED_TO_READ_ONLY_VERIFICATION_GATE_AND_COMPLETED_CURRENT_PASS
```

Gate 1 passed only into read-only verification.

It did not pass into enforcement.

## Remaining Blockers

| Blocker | Why It Matters | Resolution Path |
| --- | --- | --- |
| SentinelOS-NON-DEMO main branch not protected | prevents enforcement posture claim | gap review and later protected-operation approval |
| nunncorp-global-mono branch protection unresolved | prevents enforcement posture claim | verify through alternate read-only admin/UI path |
| nunncorp-global-mono security settings unresolved | prevents security posture claim | verify through alternate read-only admin/UI path |
| Contract Reclamation remote not verified | prevents managed remote claims | decide local-only vs governed remote path |
| cleanup boundary still active | prevents cleanup mutation | separate cleanup authority packet only |

## Next Action

```yaml
selected_action: phase1_repository_security_gap_review
deliverable: docs/PHASE1_REPOSITORY_SECURITY_GAP_REVIEW_2026-05-23.md
authority_created: false
gate_2_ready: false
gate_2_destination: held_pending_gap_review
```
