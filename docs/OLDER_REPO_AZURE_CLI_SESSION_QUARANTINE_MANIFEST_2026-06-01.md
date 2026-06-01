# Older SentinelOS Repo Azure CLI Session Quarantine Manifest - 2026-06-01

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** exact quarantine manifest  
**Selected Action:** `APPROVE_OLDER_REPO_AZURE_CLI_SESSION_QUARANTINE_MANIFEST`  
**State:** Manifest Approved, Cleanup Held  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:OLDER-REPO-AZURE-CLI-SESSION-QUARANTINE-MANIFEST-2026-06-01]
```

## Purpose

Define the exact older-repo Azure CLI session/cache files that may be quarantined by a later execution approval.

This manifest does not execute cleanup. `HOLD_OLDER_REPO_CLEANUP` remains active.

## Target Repository

```yaml
target_repository:
  path: /Users/codynunn/SentinelOS/SentinelOS
  branch: main
  current_review_state: staged_session_cache_plus_separate_infra_dashboard_changes
  authority_created: false
```

## Approved Quarantine Scope

```yaml
approved_quarantine_scope:
  azure_cli_session_files_only:
    - .azure/cli/az.json
    - .azure/cli/az.sess
    - .azure/cli/azureProfile.json
    - .azure/cli/commandIndex.json
    - .azure/cli/config
    - .azure/cli/versionCheck.json
  observed_metadata:
    az_json_size_bytes: 5
    az_sess_size_bytes: 5
    azureProfile_json_size_bytes: 61
    commandIndex_json_size_bytes: 14604
    config_size_bytes: 27
    versionCheck_json_size_bytes: 158
  quarantine_reason:
    - local_Azure_CLI_session_or_cache_state
    - should_not_be_committed_blindly
    - must_remain_separated_from_deployable_infra
  authority_created: false
```

## Explicit Exclusions

```yaml
excluded_from_this_manifest:
  deployable_or_reviewable_infra:
    - .azure/deployment-plan.md
    - azure.yaml
    - infra/main.bicep
  dashboard_config:
    - apps/sentinel-dashboard/next.config.js
  nested_repo_boundary:
    - SentinelOS-NON-DEMO
  local_editor_state:
    - .vscode/
  prohibited_actions:
    - modify_dashboard_config
    - remove_or_unstage_deployable_infra
    - touch_nested_repo_entry
    - delete_any_file
    - archive_or_move_any_file
    - commit_or_push_older_repo
  authority_created: false
```

## Later Execution Manifest If Approved Separately

```yaml
later_execution_manifest:
  required_phrase_before_execution: APPROVE_EXECUTE_OLDER_REPO_AZURE_CLI_SESSION_QUARANTINE
  allowed_commands_if_later_approved:
    unstage_session_files_only: >-
      git restore --staged .azure/cli/az.json .azure/cli/az.sess .azure/cli/azureProfile.json .azure/cli/commandIndex.json .azure/cli/config .azure/cli/versionCheck.json
  expected_result_if_later_executed:
    - six_.azure_cli_files_removed_from_index_only
    - files_remain_in_worktree_untracked_or_ignored_pending_separate_decision
    - deployable_infra_staging_unchanged
    - dashboard_config_unchanged
    - nested_repo_entry_unchanged
  cleanup_authorized_now: false
  authority_created: false
```

## Current Decision Result

```yaml
current_decision_result:
  HOLD_OLDER_REPO_CLEANUP: active
  APPROVE_OLDER_REPO_AZURE_CLI_SESSION_QUARANTINE_MANIFEST: accepted
  execution_performed: false
  files_moved_deleted_or_unstaged: false
  authority_created: false
```

## Non-Authorization

This manifest does not authorize cleanup execution, unstaging, deletion, movement, archival, editing, staging, committing, pushing, history rewrite, Azure mutation, deployment, or changes to deployable infra/dashboard files.
