# Diagnostic Settings Implementation Plan Only Request - 2026-05-30

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** diagnostic settings implementation plan-only request  
**Selected Action:** `REQUEST_DIAGNOSTIC_SETTINGS_IMPLEMENTATION_PLAN_ONLY`  
**State:** Plan Only, No Mutation  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:DIAGNOSTIC-SETTINGS-IMPLEMENTATION-PLAN-ONLY-REQUEST-2026-05-30]
```

## Purpose

Define a future implementation plan for routing Azure Container Apps logs to a Microsoft Sentinel-backed Log Analytics workspace.

This is plan-only. It does not inspect, create, update, or delete Azure diagnostic settings.

## Request Classification

```yaml
request_classification:
  selected_action: REQUEST_DIAGNOSTIC_SETTINGS_IMPLEMENTATION_PLAN_ONLY
  classification: implementation_plan_only
  diagnostic_setting_mutation_authorized: false
  Azure_resource_inspection_authorized: false
  log_analytics_live_query_authorized: false
  authority_created: false
```

## Plan Preconditions

```yaml
plan_preconditions:
  container_app_environment_resource_id:
    status: confirmed_from_repo_local_artifacts
    value: /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel
    source:
      - azure/container-app.yaml
      - docs/DEP3_9R_SANITIZED_PRE_MUTATION_SNAPSHOT_RESULT_2026-05-20.md
  target_Log_Analytics_workspace_id:
    status: confirmed_by_read_only_Azure_discovery
    value: /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.OperationalInsights/workspaces/log-nc-dev-sentinel
    workspace_customer_id: 6e8cd51e-c8fe-4382-86de-359f0e3c547b
    authority_now: read_only_discovery_complete
  workspace_has_Microsoft_Sentinel_enabled:
    status: confirmed_by_read_only_Azure_discovery
    evidence_resource: SecurityInsights(log-nc-dev-sentinel)
    evidence_product: OMSGallery/SecurityInsights
    evidence_provisioning_state: Succeeded
    authority_now: read_only_discovery_complete
  current_diagnostic_settings_read_only_review:
    status: complete
    container_app_environment_scope: none_found
    container_app_scope_cross_check: none_found
    authority_now: read_only_discovery_complete
  categories_required:
    status: confirmed_from_current_Microsoft_documentation
    environment_scope_log_categories:
      - ContainerAppConsoleLogs
      - ContainerAppSystemLogs
    metric_category:
      - AllMetrics
    note: container_app_scope_supports_metrics_only_for_diagnostic_settings
  rollback_or_disable_plan:
    status: drafted_in_war_room_scan
    authority_now: not_authorized
```

## Draft Implementation Plan

No command in this section is authorized for execution.

```yaml
draft_implementation_plan:
  1: enter_microsoft_observability_war_room_scan
  2: confirm_required_categories_from_documentation
  3: classify_missing_preconditions_without_live_Azure_access
  4: record_container_app_environment_resource_id_from_repo_local_artifacts
  5: hold_workspace_id_and_Sentinel_enabled_confirmation_until_operator_input_or_read_only_authority
  6: prepare_read_only_diagnostic_settings_review_plan
  7: prepare_exact_diagnostic_setting_change_only_after_workspace_scope_and_current_settings_are_confirmed
  8: present_change_for_operator_approval
  9: apply_only_after_explicit_Azure_mutation_authority
  10: verify_logs_only_after_read_only_Log_Analytics_authority
```

## War Room Scan Inputs

```yaml
war_room_scan_inputs:
  planning_docs:
    - docs/MICROSOFT_SENTINEL_IMPLEMENTATION_AUTHORITY_PACKET_2026-05-30.md
    - docs/READ_ONLY_LOG_ANALYTICS_VERIFICATION_AUTHORITY_REQUEST_2026-05-30.md
    - docs/MICROSOFT_SENTINEL_ANALYTICS_RULE_DESIGN_ONLY_REQUEST_2026-05-30.md
    - docs/EVENT_NAME_RECONCILIATION_REPORT_2026-05-30.md
  current_finding:
    categories_required_confirmed: true
    container_app_environment_resource_id_confirmed: true
    workspace_scope_confirmed: true
    current_diagnostic_settings_confirmed: true
    current_diagnostic_settings_result: none_found
    Azure_mutation_authority: false
    Log_Analytics_query_authority: false
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

This plan-only request does not authorize Azure CLI execution, Azure Portal mutation, diagnostic-setting mutation, Log Analytics queries, Microsoft Sentinel analytics-rule creation, secret access, runtime mutation, command changes, event schema changes, deployment, staging, committing, pushing, publication expansion, or external sharing.
