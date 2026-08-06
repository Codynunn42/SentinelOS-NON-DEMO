# Microsoft Sentinel Planning War Room Scan - 2026-05-30

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** Microsoft Sentinel planning war room scan  
**State:** Review Complete, Environment Confirmed, Mutation Held  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:MICROSOFT-SENTINEL-PLANNING-WAR-ROOM-SCAN-2026-05-30]
```

## Purpose

Enter the Microsoft Sentinel planning war room, process the current planning artifacts through the SentinelOS operating model, confirm required diagnostic categories, and identify what remains needed or outstanding.

This scan is review-only. It does not execute Azure CLI commands, query Log Analytics, inspect Azure resources, mutate diagnostic settings, create Microsoft Sentinel rules, deploy, or change runtime code.

## Source Artifacts

```yaml
source_artifacts:
  implementation_authority_packet: docs/governance/MICROSOFT_SENTINEL_IMPLEMENTATION_AUTHORITY_PACKET_2026-05-30.md
  diagnostic_settings_plan: docs/governance/DIAGNOSTIC_SETTINGS_IMPLEMENTATION_PLAN_ONLY_REQUEST_2026-05-30.md
  read_only_log_analytics_request: docs/governance/READ_ONLY_LOG_ANALYTICS_VERIFICATION_AUTHORITY_REQUEST_2026-05-30.md
  analytics_rule_design_request: docs/governance/MICROSOFT_SENTINEL_ANALYTICS_RULE_DESIGN_ONLY_REQUEST_2026-05-30.md
  event_name_reconciliation_report: docs/governance/EVENT_NAME_RECONCILIATION_REPORT_2026-05-30.md
  authority_created: false
```

## War Room Board

```yaml
war_room_board:
  phase: OBSERVABILITY_MATURATION
  focus: microsoft_sentinel_planning_preconditions
  direction_check: aligned
  authority_check: held
  trust_review: coherent
  readiness_review: partial
  analysis_complete: true
  environment_confirmation_required: false
  environment_confirmation_complete: true
  mutation_boundary: intact
  authority_created: false
```

## Diagnostic Category Confirmation

Based on current Microsoft Learn documentation for Azure Container Apps logging and Azure Monitor table references:

```yaml
diagnostic_categories:
  environment_scope_log_categories:
    - ContainerAppConsoleLogs
    - ContainerAppSystemLogs
  metric_category:
    - AllMetrics
  container_app_scope_note:
    diagnostic_settings_at_container_app_scope_support_metrics_only: true
  confirmation_result: categories_required_confirmed_for_plan
  authority_created: false
```

Sources:

- <https://learn.microsoft.com/en-us/azure/container-apps/log-options>
- <https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/containerappconsolelogs>
- <https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/containerappsystemlogs>

## Preconditions Processing

| Precondition | Current Status | What Is Needed To Complete |
| --- | --- | --- |
| Container App Environment resource ID | complete from repo-local artifacts | `azure/container-app.yaml` and prior sanitized snapshot evidence identify `/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel` |
| Target Log Analytics workspace ID | complete | read-only discovery confirmed `/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.OperationalInsights/workspaces/log-nc-dev-sentinel` |
| Workspace has Microsoft Sentinel enabled | complete | read-only discovery found `SecurityInsights(log-nc-dev-sentinel)` solution in `Succeeded` state |
| Current diagnostic settings | complete | none found at Container Apps managed environment scope or Container App scope |
| Required categories | complete | `ContainerAppConsoleLogs`, `ContainerAppSystemLogs`; optional metric category `AllMetrics` |
| Rollback or disable plan | drafted | plan now requires exact diagnostic setting name and pre-change state before mutation |
| KQL event verification | approved query list drafted, execution held | read-only Log Analytics authority still required before any query execution |
| Analytics rule design | partial | design-only request exists; final thresholds/severity need later review |

## Findings

```yaml
findings:
  complete:
    - required_log_categories_confirmed
    - container_app_environment_resource_id_confirmed_from_repo_local_artifacts
    - rollback_or_disable_plan_drafted
    - approved_read_only_KQL_query_list_drafted
    - mutation_boundary_preserved
    - event_name_reconciliation_report_available
    - analytics_rule_design_only_request_available
    - read_only_log_analytics_authority_request_available
    - diagnostic_settings_plan_only_request_available
    - target_Log_Analytics_workspace_resource_id_confirmed_by_read_only_discovery
    - Microsoft_Sentinel_enablement_confirmed_by_read_only_discovery
    - current_diagnostic_settings_state_confirmed_none_found
  outstanding:
    - exact_diagnostic_setting_name_if_new_setting_is_later_authorized
    - explicit_operator_authority_for_any_live_query_or_mutation
  operating_conclusion:
    analysis_complete: true
    environment_confirmation_required: false
    environment_confirmation_complete: true
    need_more_reports: false
    next_required_decision: request_diagnostic_settings_implementation_authority_or_hold
  authority_created: false
```

## Environment Discovery Required

```yaml
environment_discovery_required:
  target_log_analytics_workspace:
    status: complete
    resource_id: /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.OperationalInsights/workspaces/log-nc-dev-sentinel
  microsoft_sentinel_enabled:
    status: complete
    evidence: SecurityInsights(log-nc-dev-sentinel)
  current_diagnostic_settings:
    status: complete
    result: none_found_at_container_app_environment_scope_or_container_app_scope
  active_diagnostic_setting_name:
    status: no_existing_setting_found
    completion_path:
      - operator_selects_new_name_after_current_state_is_known
  authority_created: false
```

## Resource Scope Values From Existing Artifacts

```yaml
resource_scope_values:
  container_app:
    name: ca-nc-dev-sentinel
    resource_group: rg-nc-dev-sentinel
    resource_id: /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/containerapps/ca-nc-dev-sentinel
    source:
      - azure/container-app.yaml
      - docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md
  container_app_environment:
    name: cae-nc-dev-sentinel
    resource_id: /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel
    source:
      - azure/container-app.yaml
      - docs/DEP3_9R_SANITIZED_PRE_MUTATION_SNAPSHOT_RESULT_2026-05-20.md
  log_analytics_workspace:
    name_from_older_evidence: log-nc-dev-sentinel
    workspace_resource_id: /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.OperationalInsights/workspaces/log-nc-dev-sentinel
    customer_id: 6e8cd51e-c8fe-4382-86de-359f0e3c547b
    microsoft_sentinel_enabled: confirmed
    sentinel_enablement_evidence: SecurityInsights(log-nc-dev-sentinel)
    source:
      - docs/governance/EXECUTIVE_SNAPSHOT_2026-05-11.md
      - docs/governance/MICROSOFT_SENTINEL_READ_ONLY_AZURE_DISCOVERY_RESULT_2026-05-30.md
  authority_created: false
```

## Approved Read-Only KQL Query List

These queries are approved as a future read-only query list only if separate read-only Log Analytics verification authority is granted. They are not authorized for execution by this scan.

```yaml
approved_read_only_KQL_query_list:
  execution_authorized_now: false
  queries:
    - name: recent_sentinel_api_events
      table: ContainerAppConsoleLogs
      purpose: verify current sentinel-api structured log flow
    - name: command_auth_denied_events
      table: ContainerAppConsoleLogs
      purpose: verify exact event `command.auth.denied`
    - name: command_auth_misconfigured_events
      table: ContainerAppConsoleLogs
      purpose: verify exact event `command.auth.misconfigured`
    - name: blocked_path_events
      table: ContainerAppConsoleLogs
      purpose: verify governed block evidence via `blocked-path`
    - name: legacy_command_executed_events
      table: ContainerAppConsoleLogs
      purpose: verify legacy `/command` `command.executed` records only
    - name: command_rate_limited_events
      table: ContainerAppConsoleLogs
      purpose: inspect adjacent command-boundary event if present
    - name: command_passport_signing_failed_events
      table: ContainerAppConsoleLogs
      purpose: inspect adjacent command-boundary event if present
    - name: container_app_system_logs_recent
      table: ContainerAppSystemLogs
      purpose: verify runtime/system log flow after diagnostic configuration is confirmed
  authority_created: false
```

## Rollback Or Disable Plan

```yaml
rollback_or_disable_plan:
  status: drafted_not_authorized
  required_before_mutation:
    - exact_existing_diagnostic_setting_name
    - exact_current_destination_workspace
    - exact_current_enabled_categories
    - operator_approval_to_apply_or_disable
  rollback_steps_if_later_authorized:
    1: capture_current_diagnostic_settings_read_only
    2: preserve_prior_setting_payload_as_evidence
    3: apply_only_the_approved_diagnostic_setting_change
    4: verify_expected_log_flow_if_read_only_query_authority_exists
    5: if_failure_restore_prior_setting_payload_or_disable_new_setting_with_operator_approval
  mutation_authorized_now: false
  authority_created: false
```

## Recommendations

```yaml
recommendations:
  current_best_path:
    selected_path: REQUEST_DIAGNOSTIC_SETTINGS_IMPLEMENTATION_AUTHORITY
    reason:
      - environment_confirmation_is_complete
      - workspace_scope_is_confirmed
      - Microsoft_Sentinel_enablement_is_confirmed
      - existing_diagnostic_settings_are_absent
      - implementation_remains_held
      - routing_Container_Apps_logs_requires_separate_mutation_authority
    authority:
      read_only: completed_for_Azure_discovery
      mutation: false
      implementation: false
  alternate_paths:
    - REQUEST_READ_ONLY_LOG_ANALYTICS_VERIFICATION_AUTHORITY
    - REQUEST_OBSERVABILITY_PACKET_COMMIT_SCOPE_REVIEW
    - HOLD_IMPLEMENTATION_AUTHORITY
  not_recommended_now:
    - apply_diagnostic_settings
    - run_live_KQL
    - create_Microsoft_Sentinel_analytics_rules
    - change_event_emission_schema
  authority_created: false
```

## Operator Decision Surface

```yaml
operator_decision_surface:
  approvals_needed:
    - read_only_Log_Analytics_query_authority_before_any_live_KQL
    - separate_Azure_mutation_authority_before_any_diagnostic_setting_change
  review_ready:
    - observability_packet_commit_scope_review
    - analytics_rule_design_only
    - diagnostic_settings_plan_only
  implementation_ready:
    - none
  prohibited:
    - apply_diagnostic_settings
    - run_live_KQL
    - create_Microsoft_Sentinel_analytics_rules
    - change_event_emission_schema
  current_best_path:
    - REQUEST_DIAGNOSTIC_SETTINGS_IMPLEMENTATION_AUTHORITY
  authority_created: false
```

## Mutation Boundary

```yaml
mutation_boundary:
  az_monitor_diagnostic_settings_create_or_update_authorized: false
  Azure_portal_diagnostic_setting_change_authorized: false
  container_app_update_authorized: false
  workspace_change_authorized: false
  authority_created: false
```

## Non-Authorization

This war room scan does not authorize Azure CLI execution, Azure Portal mutation, diagnostic-setting mutation, Log Analytics queries, Microsoft Sentinel analytics-rule creation, secret access, runtime mutation, command changes, event schema changes, deployment, staging, committing, pushing, publication expansion, or external sharing.
