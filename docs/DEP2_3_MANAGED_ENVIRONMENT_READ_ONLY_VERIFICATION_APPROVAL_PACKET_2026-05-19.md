# DEP2.3 Managed Environment Read-Only Verification Approval Packet - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP2.3-MANAGED-ENVIRONMENT-READ-ONLY-VERIFICATION-APPROVAL-PACKET]
```

## Approval Scope

`DEP2.3` frames the explicit approval decision for a narrowly scoped read-only Azure query to confirm the live Container App managed environment ID.

This packet does not execute the query. It does not authorize deployment, runtime mutation, command execution, direct env value restoration, secret access, secret disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Read-only verification approval packets frame observation authority. They do not authorize mutation or deployment.
```

## Source Scan

| Source | Status | Use |
| --- | --- | --- |
| `docs/DEP1_2_MANAGED_ENVIRONMENT_ID_VERIFICATION_2026-05-19.md` | prepared review-only | repo-local managed environment ID and future verification candidate |
| `docs/DEP2_2_DEPLOYMENT_AUTHORITY_PREREQUISITE_EVIDENCE_PACKET_2026-05-19.md` | prepared review-only | DEP2.3 approval request requirement |
| `docs/DEP2_4A_OFFICIAL_CLI_YAML_SEMANTICS_EVIDENCE_2026-05-19.md` | complete source review | points next safest lane to DEP2.3 |
| `azure/container-app.yaml` | repo-local evidence | managed environment ID comparison target |

## Executive Decision Header

```yaml
executive_decision:
  id: DEP2.3
  title: Managed Environment Read-Only Verification Approval
  lane: runtime_deployment
  requested_operator_decision: approve_narrow_read_only_live_verification
  recommended_action: approve_read_only_managed_environment_id_query_if_operator_accepts_live_observation
  authority_state: Approval-Scoped
  governance_class: Candidate
  risk_posture: high_read_only
  decision_ready: true
```

## Proposed Observation Envelope

Candidate command for explicit approval:

```bash
az containerapp show \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --query "{managedEnvironmentId:properties.managedEnvironmentId}" \
  -o json
```

This command is not executed by this packet.

## Allowed If Explicitly Approved

```yaml
allowed_if_approved:
  - run only the exact read-only query shown in this packet
  - capture only managedEnvironmentId
  - compare result to azure/container-app.yaml
  - create a sanitized evidence artifact with no secret values and no direct env values
```

## Still Not Authorized If DEP2.3 Is Approved

```yaml
still_not_authorized:
  - deployment
  - runtime_mutation
  - az_containerapp_update
  - command_execution_beyond_the_named_read_only_query
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

## Output Boundary

Approved output must be limited to:

```json
{
  "managedEnvironmentId": "<resource-id>"
}
```

Prohibited output:

- environment variable values
- secret values
- API keys
- tokens
- connection strings
- registry credentials
- full Container App export
- logs
- revision payloads beyond this query

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| Command would return more than `managedEnvironmentId` | stop and request narrower query |
| Azure account/subscription context is unclear | stop and verify context separately before observation |
| Query output contains sensitive material | stop, redact, and route through secret governance |
| Managed environment ID mismatches repo-local YAML | hold deployment lane and create reconciliation issue |
| Query fails or access is unavailable | preserve evidence gap; do not broaden scope |

## Decision Output Template

```yaml
decision_output:
  operator_choice:
  resulting_authority_state: Approval-Scoped for named read-only observation only
  approved_action_if_approved:
    - run exact managedEnvironmentId read-only query
  evidence_to_create_if_approved:
    - DEP2.3R sanitized managed environment verification result
  held_actions:
    - deployment
    - runtime mutation
    - command execution beyond named query
    - secret access
  audit_note: DEP2.3 approval would authorize only a narrow read-only observation, not deployment.
```

## Processed Result

The operator approved the exact read-only observation envelope and output boundary.

```yaml
processed_result:
  operator_choice: approved_exact_read_only_observation
  executed_observation: az containerapp show managedEnvironmentId query only
  evidence_created: docs/DEP2_3R_SANITIZED_MANAGED_ENVIRONMENT_VERIFICATION_RESULT_2026-05-19.md
  managed_environment_id_matches_repo_local_yaml: true
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  next_scope: DEP2.5 deployment authority gap review
```

## Non-Authorization Clause

This managed environment read-only verification approval packet frames an operator decision only. It does not execute the query and does not authorize deployment, runtime mutation, command execution beyond the named read-only query if later approved, direct env value restoration, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
