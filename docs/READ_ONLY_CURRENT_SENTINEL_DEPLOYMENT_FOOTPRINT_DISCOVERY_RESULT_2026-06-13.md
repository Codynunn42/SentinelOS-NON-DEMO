# Read-Only Current Sentinel Deployment Footprint Discovery Result - 2026-06-13

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Processed Gate:** `AUTHORIZE_EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY`  
**Mode:** Azure control-plane metadata and local repository evidence only  
**Authority Created:** false

## Evidence First

```yaml
execution_window:
  observed_at_PHX: 2026-06-13 22:47:00 MST
  observed_at_UTC: 2026-06-14 05:47:00 UTC
  active_subscription_id: 82bd72d4-00ef-400d-839b-e168e980c510
  active_subscription_name: Azure subscription 1
  active_subscription_state: Enabled
  active_tenant_id: 762ce366-c9c0-449a-adec-1b7608b4ce2a
  active_user_type: user
  expected_context_matched: true
  stop_condition_triggered: false
```

The active Azure account context matched the approved manifest before resource
metadata was queried. No broad subscription search was performed.

## Executed Read-Only Commands

The following read-only commands were executed with sensitive values excluded
from the selected output:

```text
az account show --query '{subscriptionId:id,subscriptionName:name,state:state,tenantId:tenantId,userType:user.type}' -o json
az group show --name rg-nc-dev-sentinel --query '{name:name,location:location,provisioningState:properties.provisioningState,tags:tags}' -o json
az resource list --resource-group rg-nc-dev-sentinel --query '[].{name:name,type:type,location:location,id:id,kind:kind,sku:sku.name,provisioningState:properties.provisioningState,tags:tags}' -o json
az containerapp show --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel --query '{name:name,id:id,location:location,provisioningState:properties.provisioningState,runningStatus:properties.runningStatus,managedEnvironmentId:properties.managedEnvironmentId,ingress:{fqdn:properties.configuration.ingress.fqdn,targetPort:properties.configuration.ingress.targetPort,external:properties.configuration.ingress.external},image:properties.template.containers[0].image,revisionMode:properties.configuration.activeRevisionsMode,latestRevisionName:properties.latestRevisionName,latestReadyRevisionName:properties.latestReadyRevisionName,traffic:properties.configuration.ingress.traffic,identityType:identity.type}' -o json
az containerapp revision list --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel --query '[].{name:name,active:properties.active,healthState:properties.healthState,provisioningState:properties.provisioningState,trafficWeight:properties.trafficWeight,image:properties.template.containers[0].image,createdTime:properties.createdTime}' -o json
az containerapp env show --name cae-nc-dev-sentinel --resource-group rg-nc-dev-sentinel --query '{name:name,id:id,location:location,provisioningState:properties.provisioningState,appLogsDestination:properties.appLogsConfiguration.destination,logAnalyticsWorkspaceCustomerId:properties.appLogsConfiguration.logAnalyticsConfiguration.customerId,zoneRedundant:properties.zoneRedundant,staticIp:properties.staticIp}' -o json
az acr show --name acrncdevsentinel --resource-group rg-nc-dev-sentinel --query '{name:name,id:id,location:location,provisioningState:provisioningState,loginServer:loginServer,sku:sku.name,publicNetworkAccess:publicNetworkAccess,adminUserEnabled:adminUserEnabled,networkRuleBypassOptions:networkRuleBypassOptions}' -o json
az postgres flexible-server show --name psql-nc-dev-sentinel --resource-group rg-nc-dev-sentinel --query '{name:name,id:id,location:location,state:state,version:version,sku:sku.name,tier:sku.tier,publicNetworkAccess:network.publicNetworkAccess,highAvailabilityMode:highAvailability.mode,backupRetentionDays:backup.backupRetentionDays,geoRedundantBackup:backup.geoRedundantBackup}' -o json
az keyvault show --name kv-nc-dev-sentinel --resource-group rg-nc-dev-sentinel --query '{name:name,id:id,location:location,sku:properties.sku.name,tenantId:properties.tenantId,enableRbacAuthorization:properties.enableRbacAuthorization,publicNetworkAccess:properties.publicNetworkAccess,enableSoftDelete:properties.enableSoftDelete,softDeleteRetentionInDays:properties.softDeleteRetentionInDays,enablePurgeProtection:properties.enablePurgeProtection,provisioningState:properties.provisioningState}' -o json
az monitor log-analytics workspace show --resource-group rg-nc-dev-sentinel --workspace-name log-nc-dev-sentinel --query '{name:name,id:id,location:location,provisioningState:provisioningState,retentionInDays:retentionInDays,sku:sku.name,publicNetworkAccessForIngestion:publicNetworkAccessForIngestion,publicNetworkAccessForQuery:publicNetworkAccessForQuery}' -o json
az resource show --ids '/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.OperationsManagement/solutions/SecurityInsights(log-nc-dev-sentinel)' --query '{name:name,id:id,type:type,location:location,provisioningState:properties.provisioningState,plan:plan}' -o json
az monitor diagnostic-settings list --resource /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/containerApps/ca-nc-dev-sentinel --query '[].{name:name,workspaceId:workspaceId,logs:logs[].{category:category,categoryGroup:categoryGroup,enabled:enabled},metrics:metrics[].{category:category,enabled:enabled}}' -o json
az monitor diagnostic-settings list --resource /subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel --query '[].{name:name,workspaceId:workspaceId,logs:logs[].{category:category,categoryGroup:categoryGroup,enabled:enabled},metrics:metrics[].{category:category,enabled:enabled}}' -o json
```

No HTTP, HTTPS, TCP, readiness, health, application endpoint, KQL, SQL,
secret, key, certificate, registry credential, image pull, Foundry data-plane,
Vault endpoint, mutation, deployment, role assignment, staging, commit, push,
or external-contact operation was performed.

## Resource Group Inventory

```yaml
resource_group:
  name: rg-nc-dev-sentinel
  location: eastus2
  provisioning_state: Succeeded
  tags:
    azd-env-name: dev
    nunncorp-phase: sentinel-first
    nunncorp-scope: monorepo-foundation
    nunncorp-workload: sentinel-core

resources_observed_by_control_plane:
  count: 13
  resources:
    - kv-nc-dev-sentinel: Microsoft.KeyVault/vaults
    - log-nc-dev-sentinel: Microsoft.OperationalInsights/workspaces
    - appi-nc-dev-sentinel: Microsoft.Insights/components
    - cae-nc-dev-sentinel: Microsoft.App/managedEnvironments
    - id-nc-dev-sentinel: Microsoft.ManagedIdentity/userAssignedIdentities
    - acrncdevsentinel: Microsoft.ContainerRegistry/registries
    - appcs-nc-dev-sentinel: Microsoft.AppConfiguration/configurationStores
    - Application Insights Smart Detection: microsoft.insights/actiongroups
    - psql-nc-dev-sentinel: Microsoft.DBforPostgreSQL/flexibleServers
    - ca-nc-dev-sentinel: Microsoft.App/containerApps
    - SecurityInsights(log-nc-dev-sentinel): Microsoft.OperationsManagement/solutions
    - ca-sentinelos-proof: Microsoft.App/containerApps
    - SecurityCenterFree(log-nc-dev-sentinel): Microsoft.OperationsManagement/solutions
```

## Current Sentinel Container App

```yaml
container_app:
  name: ca-nc-dev-sentinel
  location: East US 2
  provisioning_state: Succeeded
  running_status: Running
  identity_type: UserAssigned
  managed_environment: cae-nc-dev-sentinel
  ingress:
    external: true
    fqdn: ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io
    target_port: 80
  image: acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645
  revision_mode: Single
  latest_revision: ca-nc-dev-sentinel--0000030
  latest_ready_revision: ca-nc-dev-sentinel--0000030
  traffic:
    latest_revision: true
    weight: 100
```

```yaml
active_revision:
  name: ca-nc-dev-sentinel--0000030
  active: true
  health_state: Healthy
  provisioning_state: Provisioned
  traffic_weight: 100
  image: acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645
  created_time_UTC: 2026-05-17T10:17:32+00:00
```

This is control-plane health metadata for the revision. It is not an
application endpoint probe.

## Supporting Azure Resources

```yaml
managed_environment:
  name: cae-nc-dev-sentinel
  location: East US 2
  provisioning_state: Succeeded
  app_logs_destination: log-analytics
  log_analytics_workspace_customer_id: 6e8cd51e-c8fe-4382-86de-359f0e3c547b
  static_ip: 20.7.247.186
  zone_redundant: false

container_registry:
  name: acrncdevsentinel
  location: eastus2
  provisioning_state: Succeeded
  login_server: acrncdevsentinel.azurecr.io
  sku: Basic
  public_network_access: Enabled
  admin_user_enabled: true
  network_rule_bypass_options: AzureServices

azure_postgresql:
  name: psql-nc-dev-sentinel
  type: Microsoft.DBforPostgreSQL/flexibleServers
  location: East US 2
  state: Ready
  version: 16
  sku: Standard_B1ms
  tier: Burstable
  public_network_access: Enabled
  high_availability_mode: Disabled
  backup_retention_days: 7
  geo_redundant_backup: Disabled

key_vault:
  name: kv-nc-dev-sentinel
  location: eastus2
  provisioning_state: Succeeded
  sku: standard
  tenant_id: 762ce366-c9c0-449a-adec-1b7608b4ce2a
  rbac_authorization: true
  public_network_access: Enabled
  soft_delete: true
  soft_delete_retention_days: 90
  purge_protection: null
```

## Log Analytics And Sentinel Metadata

```yaml
log_analytics_workspace:
  name: log-nc-dev-sentinel
  location: eastus2
  provisioning_state: Succeeded
  retention_days: 30
  sku: PerGB2018
  public_network_access_for_ingestion: Enabled
  public_network_access_for_query: Enabled

microsoft_sentinel_solution:
  name: SecurityInsights(log-nc-dev-sentinel)
  type: Microsoft.OperationsManagement/solutions
  location: eastus2
  provisioning_state: Succeeded
  plan_product: OMSGallery/SecurityInsights
  plan_publisher: Microsoft

diagnostic_settings:
  container_app_ca_nc_dev_sentinel: []
  managed_environment_cae_nc_dev_sentinel:
    name: ds-sentinelos-containerapps-observability
    destination_workspace: log-nc-dev-sentinel
    logs:
      ContainerAppConsoleLogs: true
      ContainerAppSystemLogs: true
      ContainerAppHTTPLogs: false
      AppEnvSpringAppConsoleLogs: false
      AppEnvSessionConsoleLogs: false
      AppEnvSessionPoolEventLogs: false
      AppEnvSessionLifeCycleLogs: false
    metrics:
      AllMetrics: true
```

No KQL query or log-content access was performed.

## Foundry, HashiCorp Vault, IBM, And Local Repository Evidence

```yaml
foundry_or_ai_resource_provider_presence:
  observed_in_known_resource_group_inventory: false
  classification: no_Azure_Foundry_or_AI_resource_observed_in_known_group_metadata

hashicorp_vault:
  Azure_control_plane_resource_observed: false
  local_repository_evidence: fixture_or_reference_only
  production_service_verified: false

IBM_server:
  Azure_control_plane_resource_observed: false
  local_repository_evidence: record_classification_directive_tracks_IBM_server_investigation_scope
  external_or_vendor_evidence_checked: false
```

Local deployment-authority evidence shows drift between older repository
deployment records and the current Azure control-plane state:

```yaml
local_deployment_evidence:
  docs_DEPLOYMENT_md:
    recorded_date: 2026-04-29
    recorded_image_family: acrncdevsentinel.azurecr.io/sentinelos
    recorded_active_revision: ca-nc-dev-sentinel--approval-access-682b4cb
    classification: older_deployment_record_not_current_control_plane_state
  github_workflow_deploy_yml:
    image_name: sentinel-api
    deploys_to_container_app_from_GitHub_secrets: true
    includes_az_containerapp_update: true
    includes_health_and_protected_route_smoke_tests: true
    classification: deployment_authority_pattern_but_not_executed_in_this_review
  azure_container_app_yaml:
    resource_name: sentinel-api
    target_port: 3000
    classification: template_manifest_not_current_live_metadata
  azure_container_app_healthfix_yaml:
    resource_name: ca-nc-dev-sentinel
    target_port: 80
    image: acrncdevsentinel.azurecr.io/sentinelos:latest
    key_vault_references_present: true
    classification: historical_or_repair_manifest_not_current_live_image
```

## Interpretation Second

The current Sentinel deployment footprint is a dev-tagged Azure resource group
centered on `ca-nc-dev-sentinel`, `cae-nc-dev-sentinel`,
`acrncdevsentinel`, `log-nc-dev-sentinel`, `kv-nc-dev-sentinel`, and
`psql-nc-dev-sentinel`.

The currently observed Container App image is:

```text
acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645
```

That image does not match the older `docs/DEPLOYMENT.md` April 29 active image
family and revision record. The live control-plane state should therefore
supersede the older deployment guide for current-footprint reporting.

The control-plane inventory verifies the presence of Azure PostgreSQL and Key
Vault resources. It does not verify database contents, connection strings,
secret contents, application runtime wiring, Foundry runtime, HashiCorp Vault
service operation, IBM server evidence, or historical production usage.

## Conclusion Last

```yaml
discovery_result:
  gate: AUTHORIZE_EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY
  result: completed_bounded_read_only_control_plane_metadata_discovery
  current_subscription_and_tenant_confirmed: true
  current_Sentinel_resource_group_inventory_captured: true
  current_Container_App_revision_image_and_traffic_metadata_captured: true
  current_managed_environment_and_ACR_metadata_captured: true
  Azure_PostgreSQL_Key_Vault_Foundry_presence_classified: true
  Log_Analytics_and_Sentinel_metadata_refreshed: true
  deployment_authority_sources_classified: true
  prohibited_operations_performed: false
  mutation_performed: false
  authority_created: false
```

## Next Gate

`REVIEW_TILDA_SENTINELOS_SUPPORT_CONTRACT`

This discovery result does not authorize mutation, redeployment, source
promotion, endpoint probing, KQL, SQL, secret retrieval, Foundry data-plane
inspection, Vault probing, repository movement, staging, commit, push,
deployment, external contact, or external sharing.
