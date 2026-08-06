# Public Surface PR And Scope Split - 2026-05-28

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** GitHub public surface PR and worktree scope split  
**Selected Action:** `operator_public_surface_pr_review_or_hold`  
**Posture:** public PR opened; internal worktree scope separated and held

## Artifact Decision

```txt
[KEEP:PUBLIC-SURFACE-PR-AND-SCOPE-SPLIT-2026-05-28]
```

## Public Surface PR

```yaml
public_surface_pr:
  repository: Codynunn42/SentinelOS-NON-DEMO
  pull_request_number: 5
  pull_request_url: https://github.com/Codynunn42/SentinelOS-NON-DEMO/pull/5
  title: Publish curated SentinelOS proof surface
  draft: true
  base: hardening/telemetry-signature-correlation
  base_sha: 3c9c958e50f958b29337956632c5a1e8d17ce204
  head: github-proof-surface-20260527
  head_sha: 49868a055641bc93a699ffd88d4036ba03cf61a7
  commits: 1
  changed_files: 8
  merged: false
```

## Scope Split

```yaml
scope_split:
  public_surface_branch: github-proof-surface-20260527
  public_surface_pr_opened: true
  public_files_removed_from_internal_worktree_after_pr_open: true
  internal_docs_remain_untracked_for_separate_commit_scope_review: true
  active_branch_not_used_for_public_publication: true
  active_branch_ahead_commits_preserved_as: internal-held-ahead-20260528
  active_branch_ahead_commits_still_not_pushed_to_public_surface: true
```

## Active Branch Ahead State

```yaml
active_branch_ahead_state:
  branch: hardening/telemetry-signature-correlation
  ahead_of_origin_by: 2
  ahead_commit_subjects:
    - "570f1fc commit"
    - "84eaddb commit"
  safety_branch: internal-held-ahead-20260528
  direct_push_for_public_publication: blocked
  publication_risk_mitigation: public_pr_created_from_isolated_branch
```

## Remaining Worktree Scope

The current worktree is no longer carrying the public README/proof-surface file set as the publication vehicle. The remaining dirty state is internal governance/reporting scope and should be handled through a separate commit-scope review.

```yaml
remaining_scope:
  internal_governance_docs: present
  executive_reports: present
  public_surface_pr_files: isolated_to_pr_branch
  next_internal_action: reconcile_internal_docs_commit_scope
```

## Next Required Decision

```yaml
next_required_decision:
  selected_action: operator_public_surface_pr_review_or_hold
  valid_decisions:
    - REVIEW_PUBLIC_SURFACE_PR
    - MARK_PUBLIC_SURFACE_PR_READY
    - HOLD_PUBLIC_SURFACE_PR_DRAFT
    - REVISE_PUBLIC_SURFACE_PR
    - CLOSE_PUBLIC_SURFACE_PR_WITHOUT_MERGE
    - RECONCILE_INTERNAL_DOCS_COMMIT_SCOPE
  default_safe_posture: HOLD_PUBLIC_SURFACE_PR_DRAFT
  authority_created: false
```

## Non-Authorization

This scope split does not authorize merge, default-branch update, repository visibility change, GitHub settings change, branch protection change, workflow edit, broad announcement, staging all internal files, pushing the active branch, deployment, runtime mutation, billing, funnel activation, memory runtime activation, or expanded proof claims.
