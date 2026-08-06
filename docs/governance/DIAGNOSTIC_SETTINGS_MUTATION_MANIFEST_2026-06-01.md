# Diagnostic Settings Mutation Manifest - 2026-06-01

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** concise mutation manifest, review-held  
**State:** Not Executed  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:DIAGNOSTIC-SETTINGS-MUTATION-MANIFEST-2026-06-01]
```

## Manifest

```yaml
mutation_manifest:
  target_resource:
    type: Microsoft.App/managedEnvironments
    id: /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel
  destination_workspace:
    id: /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.OperationalInsights/workspaces/log-nc-dev-sentinel
    sentinel_enabled: recorded_true
  diagnostic_setting:
    name: ds-sentinelos-containerapps-observability
    logs_enabled:
      - ContainerAppConsoleLogs
      - ContainerAppSystemLogs
    metrics_enabled:
      - AllMetrics
  exact_create_command_if_later_approved: >-
    az monitor diagnostic-settings create --name ds-sentinelos-containerapps-observability --resource /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel --workspace /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.OperationalInsights/workspaces/log-nc-dev-sentinel --logs '[{"category":"ContainerAppConsoleLogs","enabled":true},{"category":"ContainerAppSystemLogs","enabled":true}]' --metrics '[{"category":"AllMetrics","enabled":true}]' -o json
  exact_read_back_command_if_later_approved: >-
    az monitor diagnostic-settings show --name ds-sentinelos-containerapps-observability --resource /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel -o json
  exact_rollback_or_disable_command_if_later_approved: >-
    az monitor diagnostic-settings delete --name ds-sentinelos-containerapps-observability --resource /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel
  current_turn_execution:
    Azure_mutation: false
    KQL_execution: false
    staging: false
    commit: false
    push: false
  authority_created: false
```

## Boundaries

This manifest excludes Log Analytics KQL, Microsoft Sentinel analytics rules, runtime updates, code changes, secret access, deployment, staging, committing, pushing, publication, cleanup, and branch changes.
