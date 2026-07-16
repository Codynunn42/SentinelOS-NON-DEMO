# SentinelOS Older Repo Azure CLI Quarantine Review - 2026-06-01

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** quarantine review request  
**Selected Action:** `REQUEST_SENTINELOS_OLDER_REPO_AZURE_CLI_QUARANTINE_REVIEW`  
**State:** Review Open, No Mutation  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:SENTINELOS-OLDER-REPO-AZURE-CLI-QUARANTINE-REVIEW-2026-06-01]
```

## Purpose

Review the older SentinelOS repository state before any cleanup, restore, stage adjustment, or archival decision.

Target repository:

```yaml
repo:
  path: /Users/codynunn/SentinelOS/SentinelOS
  branch: main
  head: 7a6ab08 Polish SentinelOS enterprise demo experience
  remote: https://github.com/Codynunn42/SentinelOS.git
  authority_created: false
```

## Current Risk Snapshot

```yaml
current_risk_snapshot:
  added_azure_cli_session_files:
    - .azure/cli/az.json
    - .azure/cli/az.sess
    - .azure/cli/azureProfile.json
    - .azure/cli/commandIndex.json
    - .azure/cli/config
    - .azure/cli/versionCheck.json
  added_infra_or_deploy_files:
    - .azure/deployment-plan.md
    - azure.yaml
    - infra/main.bicep
  added_nested_entry:
    - SentinelOS-NON-DEMO
  modified_existing_file:
    - apps/sentinel-dashboard/next.config.js
  untracked_local_editor_state:
    - .vscode/
  authority_created: false
```

## Classification

```yaml
classification:
  dot_azure_cli_session_files:
    recommended_bucket: quarantine_review_before_persistence
    reason: local Azure CLI session/cache files may contain environment/account state and should not be committed blindly
  deployment_plan_and_infra:
    recommended_bucket: review_for_intended_deployable_infra
    reason: may be legitimate older-repo deployment work but must be separated from CLI session state
  nested_sentinelos_non_demo:
    recommended_bucket: submodule_vendor_or_accidental_nested_checkout_decision
    reason: nested repo entry can create repo-boundary confusion
  dashboard_next_config:
    recommended_bucket: inspect_diff_before_persistence
    reason: modified tracked file may be intended product config or local drift
  authority_created: false
```

## Next Legal Decisions

```yaml
next_legal_decisions:
  safest_default:
    phrase: HOLD_OLDER_REPO_CLEANUP
    effect: no file movement or staged-state changes
  inspect_only:
    phrase: REQUEST_OLDER_REPO_DIFF_REVIEW
    effect: review exact diffs and staged entries without mutation
  later_cleanup_if_approved:
    phrase: APPROVE_OLDER_REPO_AZURE_CLI_SESSION_QUARANTINE
    effect: would authorize a separate exact command manifest for removing or untracking only approved local CLI session files
    creates_cleanup_authority_now: false
  later_persistence_if_approved:
    phrase: APPROVE_OLDER_REPO_INFRA_PERSISTENCE_MANIFEST
    effect: would authorize exact staging/commit review for intended infra only
    creates_commit_authority_now: false
  authority_created: false
```

## Non-Authorization

This review does not authorize removing, moving, archiving, unstaging, staging, committing, pushing, editing, or rewriting anything in `/Users/codynunn/SentinelOS/SentinelOS`.
