# Older SentinelOS Repo Separated Resolution Requirements - 2026-06-11

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Processed Gate:** `PREPARE_OLDER_REPO_SEPARATED_RESOLUTION_REQUIREMENTS`  
**Mode:** docs-only requirements preparation  
**State:** separated requirements prepared; all mutation and persistence held  
**Authority Created:** false

## Governing Inputs

This packet processes:

- `docs/OLDER_REPO_DIFF_REVIEW_RESULT_2026-06-11.md`;
- `docs/SENTINELOS_OLDER_REPO_AZURE_CLI_QUARANTINE_REVIEW_2026-06-01.md`;
- `docs/OLDER_REPO_AZURE_CLI_SESSION_QUARANTINE_MANIFEST_2026-06-01.md`;
- `docs/SENTINEL_AI_CHANGE_HOLD_DECLARATION_2026-06-11.md`.

Target repository:

```yaml
target_repository:
  path: /Users/codynunn/SentinelOS/SentinelOS
  branch: main
  reviewed_head: 7a6ab089c6a05937c742d048f74e691d24e0ead7
  reviewed_status:
    staged_entries: 11
    unstaged_tracked_entries: 0
    untracked_entries: 1
  current_staged_set_acceptable_as_one_unit: false
```

## Global Requirements

Every lane below must remain independent.

```yaml
global_requirements:
  prohibited_combined_action:
    - approve_or_persist_the_current_11_entry_staged_set_as_one_unit
    - treat_one_lane_approval_as_authority_for_another_lane
  required_before_any_execution:
    - refresh_exact_target_repo_status
    - verify_target_repo_head_and_branch
    - verify_exact_allowed_paths
    - verify_prohibited_paths_unchanged
    - define_expected_post_action_status
    - define_rollback_or_restore_path
    - obtain_the_exact_lane_execution_phrase
  active_holds:
    - cleanup
    - unstaging
    - staging
    - editing
    - build_execution
    - commit
    - push
    - repository_movement
    - Azure_mutation
    - deployment
    - external_sharing
```

## Lane 1 - Azure CLI Generated-State Quarantine

### Exact Candidate Scope

```yaml
azure_cli_generated_state:
  candidate_paths:
    - .azure/cli/az.json
    - .azure/cli/az.sess
    - .azure/cli/azureProfile.json
    - .azure/cli/commandIndex.json
    - .azure/cli/config
    - .azure/cli/versionCheck.json
  classification: generated_local_Azure_CLI_state_and_cache
  confirmed_secret_exposure: false
  existing_manifest: docs/OLDER_REPO_AZURE_CLI_SESSION_QUARANTINE_MANIFEST_2026-06-01.md
```

### Requirements

- confirm the six paths remain the complete staged Azure CLI generated-state set;
- verify no infrastructure, dashboard, gitlink, editor-state, or other paths are
  included in the quarantine action;
- define whether files should remain local and untracked, become ignored, or be
  removed only under a separately approved deletion decision;
- record the expected index and worktree state after any later action;
- preserve the no-confirmed-secret-exposure qualification unless a separate
  sensitive-content review is authorized.

### Lane Gate

```yaml
lane_1_gate:
  preparation_review: REVIEW_OLDER_REPO_AZURE_CLI_QUARANTINE_REQUIREMENTS
  later_execution_gate: APPROVE_EXECUTE_OLDER_REPO_AZURE_CLI_SESSION_QUARANTINE
  execution_authorized_now: false
```

## Lane 2 - Infrastructure And Dashboard Validation

### Exact Candidate Scope

```yaml
infrastructure_and_dashboard_candidate:
  paths:
    - .azure/deployment-plan.md
    - azure.yaml
    - infra/main.bicep
    - apps/sentinel-dashboard/next.config.js
  classification: intentional_looking_Azure_App_Service_demo_candidate_unvalidated
```

### Validation Requirements

- inspect the infrastructure candidate against the older repository's actual
  package, workspace, application, and build contracts;
- verify `azure.yaml` service definitions and project roots;
- validate Bicep syntax and resource contract without provisioning or Azure
  mutation;
- verify the API build produces `apps/sentinel-api/dist/index.js`;
- verify the dashboard build produces the expected standalone entry used by the
  proposed App Service command;
- verify environment-variable names and public/protected route assumptions;
- record expected cost, target environment, deployment boundary, and rollback
  requirements before any deployment approval;
- prepare a later exact persistence manifest containing only validated
  infrastructure and dashboard paths.

### AI Change Hold Requirement

No validation or later persistence may change AI identity, behavior, command
routing, schemas, policies, model/provider routing, prompts, agent definitions,
memory behavior, tool permissions, AI credentials, or AI integrations without
the separate gate `REQUEST_EXACT_AI_CHANGE_REVIEW`.

### Lane Gate

```yaml
lane_2_gate:
  validation_plan_gate: PREPARE_OLDER_REPO_INFRASTRUCTURE_NON_DEPLOYMENT_VALIDATION_PLAN
  build_or_validation_execution_requires_separate_approval: true
  persistence_gate_after_successful_validation: REVIEW_OLDER_REPO_INFRASTRUCTURE_PERSISTENCE_MANIFEST
  Azure_or_deployment_authority_created: false
  execution_authorized_now: false
```

## Lane 3 - Broken Nested Repository Gitlink

### Exact Candidate Scope

```yaml
nested_repository_boundary:
  path: SentinelOS-NON-DEMO
  staged_mode: "160000"
  staged_object: a6376d33ae9c4c6d84c178c0cf8c0a95b8285273
  object_available_in_older_repo: false
  gitmodules_entry_present: false
  classification: broken_non_portable_gitlink
```

### Required Disposition Decision

Select exactly one future disposition:

```yaml
disposition_options:
  define_as_submodule:
    requirements:
      - authoritative_remote_URL
      - valid_commit_reachable_from_remote
      - matching_.gitmodules_entry
      - ownership_and_update_policy
      - exact_submodule_manifest
  preserve_as_local_nested_checkout_only:
    requirements:
      - exact_index_removal_manifest
      - parent_ignore_or_local_handling_decision
      - confirmation_that_nested_repo_files_are_not_deleted_or_moved
  vendor_or_import_files:
    requirements:
      - exact_source_and_destination_manifests
      - duplicate_and_history_review
      - import_and_repository_movement_authority
  remove_or_archive:
    requirements:
      - explicit_data_disposition_and_deletion_authority
      - backup_or_restore_evidence
```

No disposition is selected by this packet.

### Lane Gate

```yaml
lane_3_gate:
  decision_gate: SELECT_OLDER_REPO_SENTINELOS_NON_DEMO_GITLINK_DISPOSITION
  exact_manifest_required_after_selection: true
  execution_authorized_now: false
```

## Lane 4 - Editor-State Classification

### Exact Candidate Scope

```yaml
editor_state:
  paths:
    - .vscode/java-formatter.xml
    - .vscode/settings.json
  current_state: untracked
  classification: local_editor_state_pending_repository_policy_decision
```

### Required Decision

Determine whether the files are:

- intended shared repository policy;
- local-only editor preferences;
- unrelated Java tooling not required by the older SentinelOS repository.

If shared policy is proposed, require an exact review of relevance, supported
tooling, team impact, and a separate persistence manifest. If local-only state is
selected, require a separate ignore-policy or local-handling decision.

### Lane Gate

```yaml
lane_4_gate:
  decision_gate: SELECT_OLDER_REPO_EDITOR_STATE_CLASSIFICATION
  execution_authorized_now: false
```

## Prohibited Paths And Cross-Lane Protections

```yaml
prohibited_without_separate_exact_approval:
  - any_path_outside_the_selected_lane
  - .git
  - branch_or_remote_configuration
  - package_or_lock_files
  - source_code_outside_apps/sentinel-dashboard/next.config.js
  - AI_runtime_or_AI_configuration_paths
  - active_SentinelOS_NON_DEMO_repository
  - adjacent_managed_or_observed_repositories
  - Azure_resources_or_external_systems
```

## Rollback And Evidence Requirements

Every future execution manifest must include:

- pre-action `git status --short --branch`;
- pre-action staged and unstaged path lists;
- a status signature or equivalent exact-state receipt;
- exact commands and exact paths;
- expected post-action staged and worktree state;
- confirmation that prohibited paths are unchanged;
- rollback commands or a restore procedure appropriate to the selected lane;
- post-action diff and status verification;
- separate authority for staging, commit, push, Azure mutation, deployment, or
  external sharing.

## Processing Result

```yaml
processing_result:
  gate: PREPARE_OLDER_REPO_SEPARATED_RESOLUTION_REQUIREMENTS
  result: separated_resolution_requirements_prepared
  lanes:
    - Azure_CLI_generated_state_quarantine
    - infrastructure_and_dashboard_validation
    - broken_nested_repository_gitlink
    - editor_state_classification
  current_staged_set_acceptable_as_one_unit: false
  AI_change_hold_preserved: true
  cleanup: held
  unstaging: held
  staging: held
  editing: held
  build_execution: held
  commit: held
  push: held
  Azure_mutation: held
  deployment: held
  next_gate: REVIEW_OLDER_REPO_SEPARATED_RESOLUTION_REQUIREMENTS
  authority_created: false
```

## Non-Authorization

This packet does not authorize changing the AI, changing staged state, editing
files, running builds or validation commands, removing or untracking Azure CLI
files, fixing the gitlink, changing editor state, moving files or repositories,
staging, committing, pushing, refreshing remotes, Azure mutation, deployment,
external actions, or external sharing.
