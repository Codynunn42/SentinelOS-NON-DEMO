# Sentinel Managed Repository Organization Control Packet - 2026-06-01

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** managed repository organization control packet  
**Selected Action:** `CLASSIFY_SENTINEL_MANAGED_REPOSITORIES_WITHOUT_DATA_LOSS`  
**State:** Classified, Movement Held Pending Exact Approval  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:SENTINEL-MANAGED-REPOSITORY-ORGANIZATION-CONTROL-PACKET-2026-06-01]
```

## Purpose

Classify the Sentinel-managed repositories and identify where files belong before any move, cleanup, archive, staging, commit, or push.

This pass preserves data. It does not delete, move, archive, stage, commit, push, mutate Azure, run KQL, or rewrite repository history.

## Managed Repository Inventory

```yaml
managed_repositories:
  active_implementation_governance_repo:
    path: /Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO
    branch: main
    head: dae761e commit
    remote: https://github.com/Codynunn42/SentinelOS-NON-DEMO.git
    role: real SentinelOS implementation, governance docs, proof, observability, approvals, and current decision state
    status: dirty_docs_review_artifacts_present
    organization_scan:
      report: docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-06-01.md
      log: docs/sentinel-repo-organization-log-2026-06-01.jsonl
      files_scanned: 359
      keep_use: 323
      needs_decision: 36
      exact_streamline_candidates: 0
  older_sentinelos_repo:
    path: /Users/codynunn/SentinelOS/SentinelOS
    branch: main
    head: 7a6ab08 Polish SentinelOS enterprise demo experience
    remote: https://github.com/Codynunn42/SentinelOS.git
    role: older SentinelOS product/UI/infrastructure repo
    status: staged_or_added_infra_and_azure_files_present
    data_loss_risk: high_if_cleaned_blindly
  contract_reclamation_repo:
    path: /Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/contract-reclamation
    branch: main
    head: no_commits_yet
    remote: none
    role: standalone contract reclamation faceplane/incubator candidate
    status: all_project_files_untracked
    data_loss_risk: high_if_moved_or_merged_without_import_plan
  sentinel_agent_repo:
    path: /Users/codynunn/sentinel-agent
    branch: main
    head: 61c4b2e Update Sentinel Core YAML to version 47 with enhanced operating principles and refined descriptions
    remote: https://github.com/Codynunn42/sentinel-agent.git
    role: Sentinel agent/core configuration repo
    status: clean
  legacy_global_mono:
    path: /Users/codynunn/nunncorp-global-mono
    branch: main
    head: 034ae4f Update docs/architecture/diagrams/D1-platform-stack.md
    remote: https://github.com/codynunn42/nunncorp-global-mono.git
    role: legacy monorepo and historical Sentinel discovery/reference surface
    status: clean
  authority_created: false
```

## Correct Placement Rules

```yaml
placement_rules:
  active_non_demo_repo:
    docs: governance, approvals, decision packets, proof, observability, product framing, current control state
    apps_sentinel_src: governed runtime modules, command handlers, policy, telemetry, drift, faceplanes, surfaces
    apps_api_public: served proof/operator/demo pages and static public assets
    scripts: explicit checks, proof rehearsals, smoke tests, generators
    fixtures: mock payloads, faceplane examples, docking manifests
    azure: deployment manifests only, not local CLI session state
    ops: command envelopes, scan evidence, operational review artifacts
    runtime: generated run evidence only when intentionally retained
  older_sentinelos_repo:
    apps: older dashboard/API product surfaces
    infra: deployable infrastructure definitions
    .azure_cli_session_files: should_not_be_committed_without_explicit_review
    nested_non_demo_checkout: requires explicit submodule/vendor/archive decision
  contract_reclamation_repo:
    src: standalone faceplane runtime and command implementation
    docs: contract reclamation doctrine and faceplane design
    public: standalone visualization/demo assets
    scripts: standalone checks
    import_to_active_repo: requires explicit import plan and duplicate-boundary review
  sentinel_agent_repo:
    agent_core: keep separate from SentinelOS governance docs unless an integration packet is approved
  legacy_global_mono:
    sentinel_content: reference only unless a migration/import manifest is approved
  authority_created: false
```

## Organization Actions Completed

```yaml
completed_actions:
  active_non_demo_repo:
    - ran_existing_report_only_repository_organization_scanner
    - created_current_scan_report
    - created_current_scan_jsonl_log
    - classified_current_changed_and_untracked_docs_without_moving_them
  cross_repo:
    - identified_managed_repositories
    - recorded_repo_roles
    - recorded_current_git_status_risk
    - separated_active_implementation_repo_from_legacy_and_incubator_repos
  authority_created: false
```

## Movement Held

```yaml
movement_held:
  reason:
    - active_repo_has_review_held_docs_not_yet_approved_for_persistence
    - older_sentinelos_repo_contains_added_azure_cli_session_state
    - contract_reclamation_repo_has_no_commits_and_all_files_untracked
    - legacy_global_mono_and_sentinel_agent_are_clean_and_should_not_be_disturbed
    - no_exact_duplicate_streamline_candidate_was_detected_in_active_repo
  prohibited_until_approval:
    - move_files_between_repos
    - delete_or_archive_docs
    - remove_staged_files_from_older_repo
    - convert_contract_reclamation_to_submodule_or_vendor_drop
    - stage_commit_push_any_repo
  authority_created: false
```

## Recommended Safe Organization Decisions

```yaml
recommended_decisions:
  1_classification_acceptance:
    phrase: APPROVE_SENTINEL_MANAGED_REPOSITORY_CLASSIFICATION
    effect: accepts_the_roles_and_placement_rules_without_moving_files
  2_active_repo_persistence:
    phrase: APPROVE_STAGE_AND_COMMIT_CURRENT_CONTROL_PACKET
    effect: persists_current_active_repo_review_docs_only_if_operator_approves_exact_manifest
  3_older_repo_quarantine_review:
    phrase: REQUEST_SENTINELOS_OLDER_REPO_AZURE_CLI_QUARANTINE_REVIEW
    effect: reviews_added_dot_azure_cli_session_files_before_any_stage_or_remove_decision
  4_contract_reclamation_import_plan:
    phrase: REQUEST_CONTRACT_RECLAMATION_IMPORT_OR_STANDALONE_DECISION
    effect: decides_whether_contract_reclamation_stays_standalone_or_imports_into_active_non_demo
  5_hold:
    phrase: HOLD_REPOSITORY_MOVEMENT
    effect: preserves_current_files_in_place
  authority_created: false
```

## Non-Authorization

This packet does not authorize file movement, deletion, archival, staging, committing, pushing, Azure mutation, Log Analytics KQL, deployment, runtime mutation, command changes, branch changes, cleanup, or history rewrite.
