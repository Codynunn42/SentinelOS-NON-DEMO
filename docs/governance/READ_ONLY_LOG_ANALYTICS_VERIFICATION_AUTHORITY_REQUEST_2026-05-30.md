# Read-Only Log Analytics Verification Authority Request - 2026-05-30

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** read-only Log Analytics verification authority request  
**Selected Action:** `REQUEST_READ_ONLY_LOG_ANALYTICS_VERIFICATION_AUTHORITY`  
**State:** Authority Requested, Not Executed  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:READ-ONLY-LOG-ANALYTICS-VERIFICATION-AUTHORITY-REQUEST-2026-05-30]
```

## Purpose

Define the authority needed for future read-only Log Analytics verification of Microsoft Sentinel observability events.

This request does not run KQL, inspect Azure resources, read secrets, mutate diagnostics, or create Microsoft Sentinel rules.

## Authority Request

```yaml
authority_request:
  selected_action: REQUEST_READ_ONLY_LOG_ANALYTICS_VERIFICATION_AUTHORITY
  requested_authority_type: read_only_live_verification
  requested_actions_if_later_approved:
    - identify_exact_Log_Analytics_workspace_scope
    - run_read_only_KQL_queries
    - verify_existing_ContainerAppConsoleLogs_records
    - confirm_event_name_presence_against_reconciliation_report
  currently_executed: false
  authority_granted_now: false
  authority_created: false
```

## Required Approval Before Execution

```yaml
required_approval_before_execution:
  - exact_workspace_id_or_name
  - subscription_and_resource_group_scope
  - allowed_KQL_query_list
  - confirmation_no_secret_values_will_be_requested
  - confirmation_no_Azure_mutation_commands_are_allowed
  - operator_explicit_live_verification_approval
```

## Proposed Read-Only Query Set

These queries are proposed only and must not be run until approved.

```yaml
proposed_read_only_queries:
  - recent_sentinel_api_events
  - command_auth_denied_events
  - blocked_path_events
  - legacy_command_executed_events
  - command_rate_limited_events
  - command_passport_signing_failed_events
```

## Prohibited In This Request

```yaml
prohibited:
  - az_monitor_diagnostic_settings_create_or_update
  - microsoft_sentinel_analytics_rule_creation
  - secret_reading_or_rotation
  - container_app_update
  - runtime_mutation
  - code_changes
  - deployment
```

## Non-Authorization

This request does not authorize Log Analytics queries, Azure resource inspection, diagnostic-setting mutation, Microsoft Sentinel analytics-rule creation, secret access, runtime mutation, command changes, event schema changes, deployment, staging, committing, pushing, publication expansion, or external sharing.
