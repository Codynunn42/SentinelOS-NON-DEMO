# Exact Read-Only Current Sentinel Deployment Footprint Discovery Manifest - 2026-06-13

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**State:** exact discovery manifest prepared; execution held  
**Required Execution Gate:** `AUTHORIZE_EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY`  
**Authority Created:** false

## Purpose

Refresh the current Sentinel deployment footprint using bounded Azure
control-plane metadata and local repository evidence only.

## Expected Recorded Context

```yaml
expected_context:
  subscription_id: 82bd72d4-00ef-400d-839b-e168e980c510
  tenant_id: 762ce366-c9c0-449a-adec-1b7608b4ce2a
  primary_resource_group: rg-nc-dev-sentinel
  container_app: ca-nc-dev-sentinel
  managed_environment: cae-nc-dev-sentinel
  container_registry: acrncdevsentinel
  log_analytics_workspace: log-nc-dev-sentinel
```

Any context mismatch is a stop condition, not permission to search broadly.

## Exact Allowed Azure Metadata Operations

| Order | Operation | Allowed Output |
| ---: | --- | --- |
| 1 | Show active account context | subscription ID/name/state, tenant ID, user type only |
| 2 | Show known resource group | name, location, provisioning state, tags |
| 3 | List resources in known resource group | name, type, location, resource ID, tags, provisioning metadata |
| 4 | Show known Container App | name, resource ID, location, provisioning/running state, managed environment ID, ingress FQDN/target port, image reference, revision mode, traffic weights, identity type |
| 5 | List known Container App revisions | revision name, active state, health state, provisioning state, traffic weight, image reference, created time |
| 6 | Show known managed environment | name, resource ID, location, provisioning state, Log Analytics configuration metadata with keys excluded |
| 7 | Show known ACR resource | name, resource ID, location, provisioning state, login server, SKU, public-network metadata; credentials excluded |
| 8 | Show/list Azure PostgreSQL resources in known group | name, type, resource ID, location, state, version, SKU, network mode; connection strings and credentials excluded |
| 9 | Show/list Key Vault resources in known group | vault name, resource ID, location, SKU, tenant ID, RBAC/public-network/soft-delete metadata; secret/key/certificate/value operations prohibited |
| 10 | Show/list AI/Foundry-related Azure resource-provider metadata in known group | resource name, type, ID, location, provisioning state, SKU; data-plane/project/model/deployment operations prohibited |
| 11 | Show known Log Analytics workspace and Microsoft Sentinel solution metadata | workspace and solution resource metadata, retention, SKU, provisioning state |
| 12 | List diagnostic-setting metadata for known Container App and managed environment | setting names, enabled categories, destination resource IDs; no KQL or log content |

## Exact Local Read-Only Operations

- inspect deployment workflow, deployment guide, Dockerfile, and Azure
  manifests;
- classify which repository/workflow is deployment authority versus historical
  or conceptual evidence;
- search repository text for IBM server, HashiCorp Vault, Foundry, PostgreSQL,
  and deployment references;
- preserve unrelated records under the record-classification policy.

## Explicitly Prohibited

- `az containerapp update`, revision activation/deactivation, or traffic change;
- `az acr login`, credential show, image pull, image manifest/content listing;
- any `az keyvault secret`, `az keyvault key`, or `az keyvault certificate`
  list/show/value operation;
- PostgreSQL SQL, connection-string retrieval, firewall changes, or database
  data-plane access;
- Azure AI Foundry project, model, deployment, prompt, agent, evaluation, or
  data-plane calls;
- `az monitor log-analytics query`, KQL, logs, telemetry, or customer data;
- HTTP, HTTPS, TCP, readiness, health, or application endpoint probes;
- HashiCorp Vault endpoint discovery or probe;
- IBM or vendor outreach;
- extension install or upgrade;
- role assignment or permission changes;
- mutation, deployment, runtime changes, repair, staging, commit, push, or
  external sharing.

## Evidence Output Requirements

Every executed operation must record:

- timestamp in America/Phoenix and UTC;
- exact command with sensitive values absent;
- subscription and tenant context;
- sanitized metadata result;
- observed versus inferred classification;
- whether the expected context matched;
- stop-condition status;
- explicit confirmation that prohibited operations were not performed.

## Success Criteria

```yaml
success_criteria:
  current_subscription_and_tenant_confirmed: true
  current_Sentinel_resource_group_inventory_captured: true
  current_Container_App_revision_image_and_traffic_metadata_captured: true
  current_managed_environment_and_ACR_metadata_captured: true
  Azure_PostgreSQL_Key_Vault_Foundry_presence_classified: true
  Log_Analytics_and_Sentinel_metadata_refreshed: true
  deployment_authority_sources_classified: true
  prohibited_operations_performed: false
```

## Non-Authorization

This manifest does not authorize execution. The required gate is:

`AUTHORIZE_EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY`

That gate would not authorize any operation outside this manifest.
