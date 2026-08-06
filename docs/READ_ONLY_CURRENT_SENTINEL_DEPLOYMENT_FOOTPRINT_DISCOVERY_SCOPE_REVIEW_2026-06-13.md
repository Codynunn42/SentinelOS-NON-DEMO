# Read-Only Current Sentinel Deployment Footprint Discovery Scope Review - 2026-06-13

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Processed Gate:** `REVIEW_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE`  
**Result:** exact metadata-only scope approved for execution-authorization review  
**Authority Created:** review approval only; discovery execution remains held

## Evidence First

Repository and prior discovery evidence support a recorded Sentinel deployment
path involving Azure Container Apps, Azure Container Registry, a managed
environment, Log Analytics, Microsoft Sentinel, Azure Key Vault references, and
optional PostgreSQL persistence.

Current-live Azure resource metadata, deployed image and revision identity,
complete resource-group inventory, Foundry presence, and Azure PostgreSQL
resource association remain unresolved.

The local PostgreSQL verification completed on June 13 is separate from Azure
deployment-footprint discovery. It verifies a healthy local compose PostgreSQL
container and bounded database counts; it does not establish that the current
Azure Sentinel deployment uses that database.

## Interpretation Second

The proposed discovery direction is supported after narrowing it to Azure
control-plane metadata and repository evidence.

The scope must not include:

- public or protected health-endpoint probes;
- KQL, Log Analytics queries, or telemetry-content access;
- Key Vault secret, key, certificate, or value listing;
- PostgreSQL connection strings, firewall changes, or database queries;
- Foundry project, model, deployment, prompt, agent, or data-plane inspection;
- HashiCorp Vault endpoint probing;
- IBM, vendor, customer, partner, or government outreach;
- any mutation, repair, deployment, or AI operating-setup change.

## Reviewed Scope Decision

```yaml
scope_review:
  gate: REVIEW_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE
  result: approved_for_separate_execution_authorization
  allowed_classification: Infrastructure_Records
  allowed_mode: Azure_control_plane_metadata_and_local_repository_evidence_only
  KQL_or_telemetry_content: prohibited
  network_health_probes: prohibited
  secret_or_sensitive_value_access: prohibited
  data_plane_access: prohibited
  mutation: prohibited
  execution_authorized_now: false
  authority_created: false
```

## Scope Findings

| Proposed Question | Review Disposition |
| --- | --- |
| Active Azure subscription and tenant | allow metadata-only |
| Sentinel-associated resource groups and resources | allow bounded listing by known group, tags, names, and resource types |
| Container App, revisions, managed environment, ingress metadata, image reference, and traffic weights | allow control-plane metadata; do not call application endpoints |
| Container Registry identity and metadata | allow registry resource metadata; do not list credentials or authenticate/pull images |
| Azure AI Foundry or related AI resources | allow resource-provider metadata only; no project/model/deployment data plane |
| Azure PostgreSQL resources | allow resource metadata only; no connection strings, firewall mutation, or SQL |
| Azure Key Vault resources | allow vault resource metadata only; no secret/key/certificate/value list or show |
| Log Analytics and Microsoft Sentinel | allow workspace/solution/diagnostic-setting metadata; no KQL or logs |
| HashiCorp Vault | repository evidence only; no endpoint discovery or probe |
| IBM server evidence | repository evidence only; no external search, vendor contact, or infrastructure probe |
| Deployment authority repositories and workflows | allow local read-only classification |

## Stop Conditions

Stop the discovery immediately if:

- the active subscription or tenant differs from the expected recorded context;
- a command requests or returns secret values, credentials, connection strings,
  tokens, customer data, logs, or telemetry content;
- the required command would mutate resources or install/upgrade extensions;
- access requires broadening identity permissions;
- an unexpected environment, production-like resource, or unrelated record
  category is encountered;
- the query cannot be expressed as bounded control-plane metadata inspection.

## Conclusion Last

The exact scope is suitable for a separately authorized read-only discovery
execution. Review approval does not authorize running Azure CLI commands.

## Next Gate

`AUTHORIZE_EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY`

That gate would authorize only the commands and output fields in
`docs/governance/EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_MANIFEST_2026-06-13.md`.
It would not authorize mutation, KQL, health probes, data-plane access, secret
access, staging, commit, push, deployment, or external contact.
