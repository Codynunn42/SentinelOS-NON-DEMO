# DEP3.9 Pre-Mutation Snapshot Authority Packet - 2026-05-20

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP3.9-PRE-MUTATION-SNAPSHOT-AUTHORITY-PACKET]
```

## Approval Scope

`DEP3.9` frames the operator decision for a narrow sanitized pre-mutation snapshot needed to close active image, active revision, and rollback baseline gaps identified by DEP3.8.

This packet does not execute the snapshot. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Snapshot authority may permit bounded observation if separately approved. Snapshot authority does not authorize deployment, mutation, or execution.
```

## Executive Decision Header

```yaml
executive_decision:
  id: DEP3.9
  title: Pre-Mutation Snapshot Authority Packet
  lane: runtime_deployment
  requested_operator_decision: approve_or_hold_narrow_sanitized_pre_mutation_snapshot
  recommended_action: approve_snapshot_authority_only_if_operator_accepts_live_observation_boundary
  authority_state: Approval-Scoped
  governance_class: Candidate
  risk_posture: high_read_only
  decision_ready: true
```

## Source Inputs

| Source | Status | Use |
| --- | --- | --- |
| `docs/DEP3_8_COMMAND_ENVELOPE_VALIDATION_AUTHORITY_GAP_REVIEW_PACKET_2026-05-19.md` | complete | identifies snapshot authority as next gap |
| `docs/DEP3_7_COMMAND_ENVELOPE_PLACEHOLDER_ASSEMBLY_PACKET_2026-05-19.md` | complete | placeholder envelope requiring snapshot-bound runtime metadata |
| `docs/DEP2_10_PRE_MUTATION_SNAPSHOT_APPROVAL_PACKET_2026-05-19.md` | prepared review-only | prior snapshot approval boundary |
| `docs/DEP2_11_ROLLBACK_POST_DEPLOY_AUTHORITY_PACKET_2026-05-19.md` | complete review-only | rollback baseline requirements |
| `docs/DEP2_3R_SANITIZED_MANAGED_ENVIRONMENT_VERIFICATION_RESULT_2026-05-19.md` | complete | target identity already verified by narrow observation |

## Executive Result

```yaml
dep3_9_result:
  status: prepared_for_operator_decision
  snapshot_authority_packet_defined: true
  snapshot_executed: false
  live_query_executed: false
  value_material_authorized: false
  secret_value_authorized: false
  command_execution_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  recommended_next_lane_if_approved: DEP3.9R
  recommended_next_lane_if_held: DEP3.9H
```

DEP3.9 prepares a bounded operator decision only. If approved later, the permitted action must be a narrow read-only observation with sanitized output. If held, the deployment lane remains blocked with the snapshot gap open.

## Requested Operator Decision

```yaml
requested_operator_decision:
  approve:
    meaning: approve one narrow sanitized pre-mutation snapshot observation
    resulting_authority_state: Approval-Scoped for named read-only snapshot only
    next_artifact: DEP3.9R sanitized pre-mutation snapshot result
  hold:
    meaning: keep snapshot authority blocked
    resulting_authority_state: Review-Scoped / Held
    next_artifact: DEP3.9H snapshot hold note
```

## Allowed If Explicitly Approved

If, and only if, the operator explicitly approves DEP3.9 snapshot observation, the allowed action is limited to collecting a sanitized snapshot containing only:

```yaml
allowed_snapshot_fields:
  target_identity:
    - resource_group_name
    - container_app_name
    - managed_environment_id
  revision_posture:
    - active_revision_name
    - active_revision_mode
    - active_revision_traffic_weight
  image_posture:
    - active_image_reference
  env_posture:
    - env_var_names_only
    - secret_ref_names_only
  registry_posture:
    - registry_server_name
    - registry_identity_or_secret_ref_name_only
  scale_posture:
    - min_replicas
    - max_replicas
  ingress_posture:
    - ingress_enabled
    - target_port
    - fqdn_presence_boolean
```

Approved output must exclude all value material and secret material.

## Prohibited Snapshot Fields

DEP3.9 prohibits capture or display of:

- direct env values
- sensitive direct env values
- secret values
- API keys
- tokens
- connection strings
- registry passwords
- deployment credentials
- full runtime export
- logs
- request payloads
- response bodies beyond approved fields
- revision payloads beyond active revision name, mode, and traffic weight
- public endpoint publication language
- command-ready syntax

## Output Boundary

If later approved and executed, the resulting DEP3.9R artifact must be sanitized and structured as:

```yaml
snapshot_output_boundary:
  value_material_included: false
  secret_value_included: false
  command_execution_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  output_allowed:
    - target identity fields
    - active revision name/mode/traffic weight
    - active image reference
    - env var names only
    - secretRef names only
    - registry server/ref names only
    - scale min/max
    - ingress enabled/target port/fqdn presence boolean
```

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| Snapshot would return direct env values | stop and request narrower observation |
| Snapshot would return secret values | stop, redact, and route through secret governance |
| Snapshot would return logs or payloads | stop and request narrower observation |
| Azure account/subscription context is unclear | stop and verify context separately before observation |
| Output includes more than approved fields | stop, redact, and route through governance review |
| Snapshot output is interpreted as deployment authority | correct to read-only evidence only |
| Snapshot fails or access is unavailable | preserve evidence gap; do not broaden scope |

## Decision Output Template

```yaml
decision_output:
  operator_choice:
  resulting_authority_state:
  approved_action_if_approved:
    - collect one narrow sanitized pre-mutation snapshot
  evidence_to_create_if_approved:
    - DEP3.9R sanitized pre-mutation snapshot result
  held_actions:
    - deployment
    - runtime mutation
    - command execution
    - direct env value disclosure
    - secret access
    - rollback execution
    - live post-deploy checks
  audit_note: DEP3.9 approval would authorize only a narrow sanitized read-only pre-mutation snapshot, not deployment or mutation.
```

## Decision Legitimacy Impact

| If Approved | If Held |
| --- | --- |
| active image/revision evidence gap may be closed by DEP3.9R | active image/revision evidence gap remains open |
| rollback baseline may become reviewable | rollback baseline remains incomplete |
| deployment remains blocked until later authority gates | deployment remains blocked |
| command execution remains blocked | command execution remains blocked |

## Recommended Next Scope

```txt
DEP3.9R - sanitized pre-mutation snapshot result, only if DEP3.9 is explicitly approved and executed within the approved output boundary.
```

If DEP3.9 is held:

```txt
DEP3.9H - snapshot authority hold note, review-only.
```

## Still Not Authorized

```yaml
still_not_authorized:
  - deployment
  - runtime_mutation
  - az_containerapp_update
  - command_execution
  - executable_command_line
  - live_azure_query_beyond_named_snapshot_if_later_approved
  - direct_env_restoration
  - direct_env_value_disclosure
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

This pre-mutation snapshot authority packet frames an operator decision only. It does not execute the snapshot and does not authorize deployment, runtime mutation, Azure CLI command execution beyond the named read-only snapshot if later approved, live Azure query execution beyond the named snapshot if later approved, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
