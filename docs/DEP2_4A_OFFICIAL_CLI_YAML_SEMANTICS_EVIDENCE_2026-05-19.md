# DEP2.4A Official CLI/YAML Semantics Evidence - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP2.4A-OFFICIAL-CLI-YAML-SEMANTICS-EVIDENCE]
```

## Approval Scope

`DEP2.4A` captures official Microsoft documentation evidence for Azure Container Apps CLI/YAML semantics.

This is source-review only. It does not authorize Azure CLI execution, deployment, runtime mutation, live Azure query execution, direct env value restoration, secret access, secret disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Official source evidence may reduce command ambiguity. Official source evidence does not authorize command execution or runtime mutation.
```

## Official Sources Reviewed

| Source | Evidence Captured | Link |
| --- | --- | --- |
| Azure CLI `az containerapp update` reference | `--yaml` is a supported parameter; docs state it is a path to a YAML file and all other parameters are ignored when supplied. | https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest |
| Azure CLI `az containerapp update` reference | `--set-env-vars` adds or updates env vars and states existing env vars are not modified. Secret references use `secretref:`. | https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest |
| Azure CLI `az containerapp update` reference | `--replace-env-vars` replaces env vars and states other existing env vars are removed. | https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest |
| Azure Container Apps environment variables documentation | Updating environment variables after creation is done by creating a new revision; examples use `--set-env-vars` with explicit values or `secretref:`. | https://learn.microsoft.com/en-us/azure/container-apps/environment-variables |
| Azure Container Apps revisions documentation | `az containerapp update` can modify env vars, compute resources, scale, and image; revision-scope changes create a new revision. | https://learn.microsoft.com/en-us/azure/container-apps/revisions-manage |

## Source Findings

### Finding 1 - YAML Is A Configuration Payload

The Azure CLI reference describes `--yaml` as a path to a YAML file containing Container App configuration. It also states that other parameters are ignored when `--yaml` is used.

Governance interpretation:

```txt
The candidate command should be treated as a configuration-payload mutation, not as a narrow env-var patch.
```

Impact:

```txt
Command execution remains blocked until YAML payload semantics and value handling are explicitly proven.
```

### Finding 2 - Env-Specific Flags Have Clearer Preservation Semantics

The Azure CLI reference states that `--set-env-vars` adds or updates env vars and existing env vars are not modified.

Governance interpretation:

```txt
Env-specific flags provide clearer preservation semantics than the current YAML evidence.
```

Impact:

```txt
If future mutation is considered, the command envelope should compare YAML update against explicit env-var update strategies before selecting a mutation path.
```

### Finding 3 - Replace Env Vars Is Explicitly Destructive To Other Env Vars

The Azure CLI reference states that `--replace-env-vars` replaces env vars and removes other existing env vars.

Governance interpretation:

```txt
Any command path with replacement semantics is unsafe unless every required value is explicitly and safely supplied.
```

Impact:

```txt
Direct env value handling remains a deployment blocker.
```

### Finding 4 - Updating Env Vars Creates A New Revision

Azure Container Apps environment-variable documentation states that updating env vars after creation is done by creating a new revision. Revision documentation also states revision-scope changes create a new revision.

Governance interpretation:

```txt
Even a successful env/config update is a runtime state transition and must be treated as mutation.
```

Impact:

```txt
Deployment and command execution remain prohibited without execution-scoped authority, rollback, verification, and audit boundaries.
```

## Unresolved Question

Official source review did not find a definitive statement answering:

```txt
If a YAML payload contains env entries with only name and no value/secretRef, does az containerapp update --yaml preserve existing direct values, clear them, reject the payload, or replace them with empty/null values?
```

Current status:

```yaml
cli_yaml_semantics:
  yaml_supported: true
  yaml_ignores_other_parameters: true
  set_env_vars_preserves_existing: true
  replace_env_vars_removes_other_existing: true
  name_only_yaml_env_behavior: unresolved
  command_execution_safe: false
```

## Semantics Decision

DEP2.4A reduces ambiguity but does not close the command semantics gate.

Result:

```txt
official_source_review_partial_command_semantics_unresolved
```

Command execution remains blocked because:

- YAML behavior for direct env name-only entries remains unresolved
- the repo-local manifest intentionally omits direct env values
- `--yaml` appears to be a broader configuration payload than an env-only patch
- any revision-scope update would mutate runtime state

## Safe Advancement Outcome

| Outcome | Result |
| --- | --- |
| Official source evidence captured | complete |
| Command semantics fully closed | no |
| Command execution authority | absent |
| Runtime mutation authority | absent |
| Next safest lane | `DEP2.3` read-only managed environment verification approval packet |

## Recommended Next Scope

```txt
DEP2.3 - explicit read-only managed environment verification approval, sanitized and non-mutating.
```

Reason:

```txt
DEP2.4A leaves YAML name-only env behavior unresolved. The safest remaining deployment prerequisite is the narrowly scoped read-only managed environment verification approval packet.
```

## Still Not Authorized

```yaml
still_not_authorized:
  - deployment
  - runtime_mutation
  - command_execution
  - live_azure_query
  - local_azure_cli_execution
  - direct_env_restoration
  - secret_access
  - secret_disclosure
  - rollback_execution
  - live_post_deploy_checks
  - endpoint_publication
  - pilot_activation
  - tenant_activation
  - held_standard_promotion
  - push
  - tool_grants
  - autonomous_execution
```

## Non-Authorization Clause

This official CLI/YAML semantics evidence artifact is source-review only. It does not authorize deployment, runtime mutation, command execution, local Azure CLI command execution, live Azure query execution, direct env value restoration, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
