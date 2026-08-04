# Repository Security Baseline Matrix - 2026-05-23

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** repository security baseline visibility  
**Posture:** review-only matrix  
**Authority Created:** false  
**Execution State:** non-mutating  
**Standing Gate:** external trigger or operator direction required for protected movement

## Artifact Decision

`[KEEP:REPOSITORY-SECURITY-BASELINE-MATRIX-2026-05-23]`

This matrix defines the security baseline expected for Sentinel-managed repositories.

It does not enable, change, or enforce repository settings.

## Purpose

Convert repository governance alignment into a visible baseline model for:

- branch protection expectations
- signed-commit preference
- secret scanning expectation
- dependency review expectation
- audit logging expectation
- protected workflow review
- RBAC validation
- security policy presence
- protected action boundaries

## Baseline Status Vocabulary

| Status | Meaning |
| --- | --- |
| `REQUIRED` | baseline is expected for this repository class |
| `PREFERRED` | baseline should be used where practical |
| `NOT_APPLICABLE` | baseline does not currently apply to this repository class |
| `UNKNOWN_NEEDS_READ_ONLY_VERIFICATION` | actual setting has not been verified in this pass |
| `DEFINED_NOT_ENABLED` | requirement is defined, but this packet does not activate it |
| `SEPARATE_APPROVAL_REQUIRED` | enabling or changing the control requires explicit approval |

## Global Baseline Requirements

| Baseline | Core Governance Repo | Global Mono / Control Repo | Domain Faceplane Repo | Archive / Degraded Review |
| --- | --- | --- | --- | --- |
| Branch protection | `REQUIRED` | `REQUIRED` | `REQUIRED` | `PREFERRED` |
| Signed commits | `PREFERRED` | `PREFERRED` | `PREFERRED` | `PREFERRED` |
| Secret scanning | `REQUIRED` | `REQUIRED` | `REQUIRED` | `REQUIRED` |
| Dependency review | `REQUIRED` | `REQUIRED` | `REQUIRED` | `PREFERRED` |
| Audit logging | `REQUIRED` | `REQUIRED` | `REQUIRED` | `REQUIRED` |
| Protected actions | `REQUIRED` | `REQUIRED` | `REQUIRED` | `REQUIRED` |
| RBAC validation | `REQUIRED` | `REQUIRED` | `REQUIRED` | `PREFERRED` |
| Workflow review required | `REQUIRED` | `REQUIRED` | `REQUIRED` | `PREFERRED` |
| Security policy | `REQUIRED` | `REQUIRED` | `REQUIRED` | `PREFERRED` |

## Initial Repository Matrix

| Repository / Lane | Class | Branch Protection | Secret Scanning | Dependency Review | Workflow Review | Security Policy | Current Authority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SentinelOS-NON-DEMO` | core governance repo | `GAP_CONFIRMED_MAIN_NOT_PROTECTED` | `VERIFIED_ENABLED` | `VERIFIED_DEPENDABOT_SECURITY_UPDATES_ENABLED` | `VERIFIED_ACTIONS_ENABLED_ALL_ACTIONS_SHA_PINNING_NOT_REQUIRED` | `SECURITY_MD_PRESENT` | visibility only |
| `nunncorp-global-mono` | global mono / control repo | `UNRESOLVED_GITHUB_PLAN_API_LIMITATION` | `UNRESOLVED_SECURITY_AND_ANALYSIS_NULL` | `LOCAL_DEPENDABOT_PRESENT` | `VERIFIED_ACTIONS_ENABLED_ALL_ACTIONS_SHA_PINNING_NOT_REQUIRED` | `SECURITY_MD_AND_CODEOWNERS_PRESENT` | visibility only; cleanup mutation separately blocked |
| `Contract Reclamation` sibling repo | domain faceplane repo | `UNRESOLVED_NO_REMOTE_VERIFIED` | `NO_LOCAL_EVIDENCE_FOUND` | `NO_LOCAL_EVIDENCE_FOUND` | `NO_LOCAL_GITHUB_DIRECTORY_FOUND` | `NO_LOCAL_EVIDENCE_FOUND` | review-only; no legal or execution authority |
| `Operational Upgrade` lane | domain / modernization lane | `UNKNOWN_NEEDS_READ_ONLY_VERIFICATION` | `UNKNOWN_NEEDS_READ_ONLY_VERIFICATION` | `UNKNOWN_NEEDS_READ_ONLY_VERIFICATION` | `UNKNOWN_NEEDS_READ_ONLY_VERIFICATION` | `UNKNOWN_NEEDS_READ_ONLY_VERIFICATION` | visibility only |
| archive, backup, cleanup, or degraded artifacts | archive / degraded review | `PREFERRED` | `UNKNOWN_NEEDS_READ_ONLY_VERIFICATION` | `PREFERRED` | `PREFERRED` | `PREFERRED` | read-only preservation until cleanup authority exists |

## Protected Action Baseline

The following actions require protected workflow treatment in managed repositories:

| Action Type | Required Control | Current Packet Authority |
| --- | --- | --- |
| deployment | approval gate, audit trail, verified target | none |
| publication | approved narrative, evidence refresh, external-use gate | none |
| runtime mutation | explicit runtime authority, rollback path, audit receipt | none |
| branch protection change | repository admin authority and approval record | none |
| workflow permission change | review, owner approval, audit record | none |
| secret scanning / dependency review activation | repository-security approval and setting verification | none |
| cleanup, quarantine, deletion, or reset | cleanup authority packet and backup evidence | none |

## Read-Only Verification Plan

When operator direction exists, the next read-only verification pass should collect:

1. repository default branch name
2. branch protection state
3. required status checks state
4. signed commit requirement state
5. secret scanning availability and state
6. dependency review or Dependabot state
7. workflow permission state
8. security policy file presence
9. CODEOWNERS presence
10. last successful CI/check evidence

The verification pass must record findings without changing settings.

## Enforcement Boundary

This matrix defines expected posture only.

It does not authorize:

- enabling branch protection
- enabling secret scanning
- enabling dependency review
- editing workflow permissions
- adding required checks
- changing repository visibility
- changing default branches
- pushing CODEOWNERS or security policy changes
- cleanup, quarantine, delete, reset, or archive actions

## Executive Cadence Alert

Daily:

- keep repository security work in `visibility_only` unless a separate approved operation exists
- track unknown baseline fields as blockers, not failures

Weekly:

- reconcile unknown baseline fields against read-only evidence
- package verified baseline status into executive release notes
- preserve separation between baseline definition and baseline enforcement

Before external share:

- do not claim repository security enforcement unless read-only verification and approved enablement both exist

## Current Baseline Assessment

```yaml
repository_security_baseline:
  baseline_model: DEFINED_AND_PARTIALLY_VERIFIED
  setting_changes: NOT_AUTHORIZED
  enforcement_changes: NOT_AUTHORIZED
  read_only_verification: COMPLETE_FOR_CURRENT_PASS
  unknowns_are_blockers_not_failures: true
  authority_created: false
```

## Next Action

```yaml
selected_action: phase1_repository_security_gap_review
deliverable: docs/PHASE1_REPOSITORY_SECURITY_GAP_REVIEW_2026-05-23.md
authority_created: false
operation_type: gap_review_without_enforcement
```
