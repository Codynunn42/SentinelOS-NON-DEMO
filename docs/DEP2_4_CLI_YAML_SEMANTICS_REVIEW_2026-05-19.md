# DEP2.4 CLI/YAML Semantics Review - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP2.4-CLI-YAML-SEMANTICS-REVIEW]
```

## Approval Scope

`DEP2.4` processes the safe lane selected after `DEP2.2`: CLI/YAML semantics review from non-mutating evidence.

This artifact reviews repo-local command risk and defines the evidence needed to determine Azure CLI YAML behavior before any command envelope can be considered. It does not run `az`, query Azure, deploy, mutate runtime, restore direct env values, access secrets, disclose secrets, execute rollback, run live post-deploy checks, publish endpoints, activate pilots, promote standards, push, grant tools, certify claims, authorize autonomous execution, or perform destructive cleanup.

## Core Invariant

```txt
CLI/YAML semantics review reduces command ambiguity. CLI/YAML semantics review does not authorize command execution or runtime mutation.
```

## Source Scan

| Source | Status | Use |
| --- | --- | --- |
| `docs/DEP2_2_DEPLOYMENT_AUTHORITY_PREREQUISITE_EVIDENCE_PACKET_2026-05-19.md` | complete | DEP2.4 safe-lane recommendation |
| `docs/DEP1_4_DEPLOYMENT_COMMAND_REVIEW_2026-05-19.md` | complete | candidate command and command-risk gates |
| `docs/DEP1_4_COMMAND_GUARDRAIL_PROCESSING_OUTCOME_2026-05-19.md` | complete | command guardrail processing |
| `azure/container-app.yaml` | repo-local evidence | manifest shape and missing direct values |
| `docs/REDACTED_VALUE_SOURCE_VERIFICATION_2026-05-18.md` | complete | value-free env and secretRef traceability |

## Executive Result

```yaml
dep2_4_result:
  status: prepared_review_only
  command_semantics_closed: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  live_query_authorized: false
  safe_advancement_result: command_semantics_evidence_requirements_bounded
```

## Candidate Command Under Review

The candidate command family remains review-only:

```bash
az containerapp update \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --yaml azure/container-app.yaml
```

This command is not approved for execution by DEP2.4.

## Repo-Local Semantics Finding

The repo-local manifest contains env entries that intentionally omit direct values:

```yaml
env:
  - name: NODE_ENV
  - name: PORT
  - name: SENTINEL_VERSION
```

It also contains secret-bound entries with `secretRef`:

```yaml
  - name: DATABASE_URL
    secretRef: database-url
```

This creates the core unresolved command question:

```txt
Would applying this YAML preserve existing direct env values, clear them, replace them with empty values, or fail validation?
```

DEP2.4 cannot answer that from repo-local evidence alone.

## Semantics Review Matrix

| Question | Current Evidence | Result | Required Before Execution Envelope |
| --- | --- | --- | --- |
| Does `az containerapp update --yaml` replace the full app configuration or patch only declared fields? | none in repo-local evidence | unresolved | official docs, approved local help output, or non-mutating sandbox evidence |
| How are env entries without `value` or `secretRef` treated? | YAML has names only | unresolved/high risk | explicit behavior evidence |
| Are existing direct env values preserved if omitted from YAML? | no evidence | unresolved/high risk | explicit behavior evidence |
| Are secretRefs preserved by name only? | V1.1 supports name traceability | partial | command behavior evidence still needed |
| Does the command output print sensitive values? | no evidence | unresolved | output-shape review before live command |
| Is there a dry-run or validation mode that avoids mutation? | no evidence collected | unresolved | approved non-mutating help/docs review |

## Safe Evidence Sources

The following evidence sources can reduce ambiguity without deployment mutation:

| Evidence Source | Needs Separate Approval? | Boundary |
| --- | --- | --- |
| Official Azure CLI / Container Apps documentation review | no live runtime access, but source review should be recorded | must cite source and avoid assuming behavior beyond docs |
| Local `az containerapp update --help` capture | yes, if treated as command/tool execution in this lane | must not contact Azure or include credentials |
| Local `az containerapp update --help` plus `az version` capture | yes | command help only; no live target |
| Throwaway sandbox manifest test | yes, separate environment required | must not use production Container App |
| Live production command with `--yaml` | not safe under DEP2.4 | requires later execution-scoped authority if ever considered |

## Stop Condition Processing

| Stop Condition | DEP2.4 Result | Required Response |
| --- | --- | --- |
| CLI semantics remain ambiguous | triggered | keep command execution held |
| Env values may be cleared or replaced | unresolved risk | keep deployment and command execution held |
| Review requires live command execution | not pursued | route through separate authority if requested later |
| Review requires secret or direct value access | not pursued | route through secret governance |
| Official evidence is unavailable | possible | do not infer behavior; keep hold |

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
      "CLOSE_CLI_SEMANTICS": [
        "official_behavior_evidence",
        "env_without_value_behavior_evidence",
        "output_shape_review",
        "value_preservation_or_replacement_determination"
      ],
      "EXECUTE": [
        "CLI_SEMANTICS_CLOSED",
        "DEP2.3_complete_if_live_environment_confirmation_required",
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
| North Star Alignment | pass | safest lane avoids live access and mutation |
| Governance Alignment | pass | all holds preserved |
| Operational Progress | pass | command ambiguity is bounded and evidence needs are explicit |
| Command Confidence | partial/fail | semantics remain unresolved |
| Execution Legitimacy | fail | execution remains prohibited |

## Recommended Next Scope

Recommended:

```txt
DEP2.4A - official CLI/YAML semantics evidence capture, non-mutating source review.
```

Alternative:

```txt
DEP2.3 - explicit read-only managed environment verification approval, sanitized and non-mutating.
```

## Still Not Authorized

```yaml
still_not_authorized:
  - deployment
  - runtime_mutation
  - command_execution
  - live_azure_query
  - az_command_execution
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

This CLI/YAML semantics review is review-only and non-executing. It does not authorize deployment, runtime mutation, command execution, live Azure query execution, local Azure CLI command execution, direct env value restoration, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
