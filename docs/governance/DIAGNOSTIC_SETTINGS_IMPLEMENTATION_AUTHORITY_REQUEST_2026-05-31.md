# Diagnostic Settings Implementation Authority Request - 2026-05-31

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** diagnostic settings implementation authority request  
**Selected Action:** `REQUEST_DIAGNOSTIC_SETTINGS_IMPLEMENTATION_AUTHORITY`  
**State:** Executed Under Approved Manifest  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:DIAGNOSTIC-SETTINGS-IMPLEMENTATION-AUTHORITY-REQUEST-2026-05-31]
```

## Purpose

Convert the primary bottleneck into a controlled authority request for routing Azure Container Apps logs into the confirmed Microsoft Sentinel-backed Log Analytics workspace.

This request does not create, update, or delete diagnostic settings. It does not authorize Azure mutation by itself.

## Current Bottleneck

```yaml
current_bottleneck:
  name: diagnostic_settings_implementation_requires_separate_mutation_authority
  status: implemented_and_read_back_verified
  workspace_confirmed: true
  microsoft_sentinel_enabled: true
  existing_diagnostic_settings: none_found
  implementation_executed: true
  execution_result: docs/governance/DIAGNOSTIC_SETTINGS_IMPLEMENTATION_EXECUTION_RESULT_2026-05-31.md
  authority_created: false
```

## Confirmed Facts

```yaml
confirmed_facts:
  workspace:
    name: log-nc-dev-sentinel
    resource_group: rg-nc-dev-sentinel
    location: eastus2
    resource_id: /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.OperationalInsights/workspaces/log-nc-dev-sentinel
    customer_id: 6e8cd51e-c8fe-4382-86de-359f0e3c547b
  microsoft_sentinel:
    enabled: true
    evidence_resource: SecurityInsights(log-nc-dev-sentinel)
  diagnostic_settings:
    container_app_environment_scope: none_found
    container_app_scope_cross_check: none_found
  source_artifacts:
    - docs/governance/MICROSOFT_SENTINEL_READ_ONLY_AZURE_DISCOVERY_RESULT_2026-05-30.md
    - docs/governance/MICROSOFT_SENTINEL_APPROVED_SCOPE_AND_RECOMMENDATION_REVIEW_2026-05-31.md
    - docs/governance/DIAGNOSTIC_SETTINGS_IMPLEMENTATION_PLAN_ONLY_REQUEST_2026-05-30.md
```

## Requested Authority

```yaml
requested_authority:
  authority_type: bounded_Azure_diagnostic_settings_mutation
  requested_actions_if_later_approved:
    - create_or_update_one_diagnostic_setting_at_the_confirmed_Container_App_environment_scope
    - route_ContainerAppConsoleLogs_to_confirmed_Log_Analytics_workspace
    - route_ContainerAppSystemLogs_to_confirmed_Log_Analytics_workspace
    - include_AllMetrics_only_if_supported_at_the_selected_scope
    - record_exact_command_and_result_after_execution
  prohibited_without_separate_approval:
    - Log_Analytics_KQL_execution
    - Microsoft_Sentinel_analytics_rule_creation
    - secret_reading_or_rotation
    - container_app_runtime_update
    - code_changes
    - deployment
    - staging
    - committing
    - pushing
    - publication_or_external_share
  execution_status: not_executed
  authority_created: false
```

## Required Next Approval Before Mutation

```yaml
required_next_approval_before_mutation:
  explicit_operator_phrase: APPROVE_DIAGNOSTIC_SETTINGS_IMPLEMENTATION_EXECUTION
  required_manifest:
    - exact_Azure_scope
    - exact_Log_Analytics_workspace_resource_id
    - exact_diagnostic_setting_name
    - exact_log_categories
    - exact_metric_categories
    - rollback_or_disable_command
  authority_created: false
```

## Execution Closeout

```yaml
execution_closeout:
  approved_phrase: APPROVE_DIAGNOSTIC_SETTINGS_IMPLEMENTATION_EXECUTION
  execution_result: docs/governance/DIAGNOSTIC_SETTINGS_IMPLEMENTATION_EXECUTION_RESULT_2026-05-31.md
  diagnostic_setting_name: ds-sentinelos-containerapps-observability
  read_back_verified: true
  Log_Analytics_KQL_executed: false
  Microsoft_Sentinel_analytics_rules_created: false
  runtime_mutation: false
  staging_or_commit: false
  authority_created: false
```

## Non-Authorization

This request does not authorize Azure CLI mutation, Azure Portal mutation, Log Analytics queries, Microsoft Sentinel analytics-rule creation, secret access, runtime mutation, command changes, event schema changes, deployment, staging, committing, pushing, publication expansion, external sharing, cleanup, memory activation, or branch settings changes.
