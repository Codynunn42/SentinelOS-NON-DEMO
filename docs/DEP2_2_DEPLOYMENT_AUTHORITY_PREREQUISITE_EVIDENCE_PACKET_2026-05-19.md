# DEP2.2 Deployment Authority Prerequisite Evidence Packet - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP2.2-DEPLOYMENT-AUTHORITY-PREREQUISITE-EVIDENCE-PACKET]
```

## Approval Scope

`DEP2.2` prepares non-executing evidence required before any future deployment authority decision can progress.

This packet prepares approval requests and review plans only. It does not authorize deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, secret access, secret disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Prerequisite evidence packets prepare authority decisions. Prerequisite evidence packets do not authorize live access, execution, or mutation.
```

## Source Scan

| Source | Status | Use |
| --- | --- | --- |
| `docs/SAFE_ADVANCEMENT_SCOPE_SEQUENCE_2026-05-19.md` | complete | scope ordering and guardrail pattern |
| `docs/DEP2_1_DEPLOYMENT_AUTHORITY_TRANSITION_DECISION_PACKET_2026-05-19.md` | complete | DEP2.2 recommendation and remaining authority gates |
| `docs/DEP1_2_MANAGED_ENVIRONMENT_ID_VERIFICATION_2026-05-19.md` | prepared review-only | managed environment verification boundary |
| `docs/DEP1_4_DEPLOYMENT_COMMAND_REVIEW_2026-05-19.md` | prepared review-only | CLI/YAML command risk boundary |
| `docs/DEP1_4_COMMAND_GUARDRAIL_PROCESSING_OUTCOME_2026-05-19.md` | complete review-only | stop-condition processing outcome |
| `azure/container-app.yaml` | repo-local evidence | candidate manifest shape; not mutation authority |

## Executive Decision Header

```yaml
executive_decision:
  id: DEP2.2
  title: Deployment Authority Prerequisite Evidence Packet
  lane: runtime_deployment
  requested_operator_decision: prepare_non_executing_prerequisite_evidence
  recommended_action: approve_review_only_prerequisite_packet
  authority_state: Review-Scoped
  governance_class: Prepared Review-Only
  risk_posture: high_review_only
  decision_ready: true
```

## Executive Result

```yaml
dep2_2_result:
  status: prepared_review_only
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  live_query_authorized: false
  secret_access_authorized: false
  safe_advancement_result: authority_prerequisite_evidence_prepared_without_mutation
```

## Prerequisite Evidence Packet

DEP2.2 prepares two sub-lanes:

| Sub-Lane | Purpose | Current Output | Still Held |
| --- | --- | --- | --- |
| `DEP2.2A` managed environment live-verification approval request | frame a future read-only Azure query approval to confirm `managedEnvironmentId` | approval request prepared below | live Azure query, deployment |
| `DEP2.2B` CLI/YAML semantics review plan | determine how `az containerapp update --yaml` treats direct env values and manifest fields before any command envelope | review plan prepared below | command execution, deployment |

## DEP2.2A - Managed Environment Live-Verification Approval Request

Purpose:

```txt
Confirm that the live Container App managed environment ID matches repo-local deployment shape evidence before any future deployment authority decision.
```

Candidate read-only command for a future approval:

```bash
az containerapp show \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --query "{managedEnvironmentId:properties.managedEnvironmentId}" \
  -o json
```

This command is not approved for execution by DEP2.2.

Approval request requirements:

- approve read-only live query explicitly
- restrict output to `managedEnvironmentId`
- prohibit env value capture
- prohibit secret value capture
- prohibit token, key, connection string, or credential capture
- store result only as sanitized evidence
- compare result to `azure/container-app.yaml`
- preserve deployment and command holds

Stop conditions:

| Stop Condition | Required Response |
| --- | --- |
| Query scope cannot be restricted to managed environment ID | hold live verification |
| Query output includes values or secrets | stop and route through secret governance |
| Managed environment ID differs from repo-local YAML | hold deployment lane and open reconciliation review |
| Azure access context is unclear | hold live verification |

## DEP2.2B - CLI/YAML Semantics Review Plan

Purpose:

```txt
Determine whether the candidate deployment command would preserve, replace, or clear direct env values before any command envelope can be considered.
```

Candidate command family under review only:

```bash
az containerapp update \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --yaml azure/container-app.yaml
```

This command is not approved for execution by DEP2.2.

Review questions:

| Question | Required Evidence |
| --- | --- |
| Does `--yaml` replace the full app configuration or patch only declared fields? | official CLI behavior or controlled documentation evidence |
| How are env entries without `value` or `secretRef` treated? | documented behavior or safe offline review |
| Does the command preserve existing direct env values if omitted? | documented behavior before any live command |
| Can a dry-run or validation mode exist without mutation? | identify only; do not run without approval |
| Are secretRefs preserved by name only? | verify without values |
| Would command output print sensitive fields? | output-shape review before any live use |

Stop conditions:

| Stop Condition | Required Response |
| --- | --- |
| CLI semantics remain ambiguous | keep command execution held |
| Env values may be cleared or replaced | keep command execution held until value plan is approved |
| Review requires live command execution | route through separate approval |
| Review requires secret or direct value access | route through secret governance |

## Authority State

```json
{
  "authorityState": {
    "current": "REVIEW_ONLY",
    "allowedTransitions": [
      "PREPARE_AUTHORITY",
      "HOLD"
    ],
    "blockedTransitions": [
      "EXECUTE",
      "LIVE_QUERY",
      "RUNTIME_MUTATION"
    ],
    "transitionRequirements": {
      "LIVE_QUERY": [
        "explicit_operator_approval",
        "query_scope_limit",
        "sanitized_output_boundary"
      ],
      "EXECUTE": [
        "DEP2.2A_complete",
        "DEP2.2B_complete",
        "direct_env_value_handling_approved",
        "fresh_pre_mutation_snapshot",
        "rollback_authority",
        "post_deploy_verification_authority",
        "ephemeral_execution_window"
      ]
    }
  }
}
```

## Decision Legitimacy

| Dimension | Result | Notes |
| --- | --- | --- |
| North Star Alignment | pass | preserves trust by refusing to run live query or command from evidence prep |
| Governance Alignment | pass | holds remain intact |
| Operational Progress | pass | next authority prerequisites are clearer |
| Environment Confidence | partial | live managed environment evidence still requires future approval |
| Command Confidence | partial | CLI/YAML semantics still require review |
| Execution Legitimacy | fail | execution remains prohibited |

## Recommended Next Scope

```txt
DEP2.3 - explicit live managed environment verification approval, read-only and sanitized.
```

Alternative:

```txt
DEP2.4 - CLI/YAML semantics review from non-mutating documentation or offline evidence.
```

## Still Not Authorized

```yaml
still_not_authorized:
  - deployment
  - runtime_mutation
  - command_execution
  - live_azure_query
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

This deployment authority prerequisite evidence packet is review-only and non-executing. It does not authorize deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
