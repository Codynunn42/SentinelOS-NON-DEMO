# DEP3.6 Value-Material Exclusion And Placeholder Policy Packet - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP3.6-VALUE-MATERIAL-EXCLUSION-PLACEHOLDER-POLICY-PACKET]
```

## Approval Scope

`DEP3.6` defines how future deployment command-envelope drafts may reference approved field names without including value material.

This is review-only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Placeholders may preserve field structure. Placeholders do not authorize values, secrets, execution, or mutation.
```

## Executive Decision Header

```yaml
executive_decision:
  id: DEP3.6
  title: Value-Material Exclusion And Placeholder Policy Packet
  lane: runtime_deployment
  requested_operator_decision: accept_review_only_placeholder_policy
  recommended_action: approve_placeholder_policy_for_review_only_and_keep_all_values_execution_and_runtime_holds
  authority_state: Review-Scoped
  governance_class: Prepared Review-Only
  risk_posture: high_review_only
  decision_ready: true
```

## Source Inputs

| Source | Status | Use |
| --- | --- | --- |
| `docs/DEP3_5_EXACT_FIELD_LIST_APPROVAL_PACKET_2026-05-19.md` | complete | exact direct env, secretRef, and metadata field names |
| `docs/DEP3_FULL_REDACTED_VALUE_PLAN_2026-05-19.md` | complete | value-free field and source-class plan |
| `docs/DEP3_4_SELECTED_STRATEGY_FIELD_BOUNDARY_PACKET_2026-05-19.md` | complete | selected env-specific review strategy boundary |
| `docs/DEP2_9_COMMAND_OUTPUT_BOUNDARY_PACKET_2026-05-19.md` | complete | output containment and prohibited material boundary |

## Executive Result

```yaml
dep3_6_result:
  status: completed_review_only
  placeholder_policy_defined: true
  value_material_exclusion_defined: true
  values_authorized: false
  secret_values_authorized: false
  command_execution_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  recommended_next_lane: DEP3.7
```

DEP3.6 allows future documents to preserve field structure through controlled placeholder labels. It does not approve real values, fake values, executable command payloads, secret access, command execution, deployment, or mutation.

## Completed Artifact Risk Scan

Sentinel AI reviewed the completed DEP3 field-list and value-plan artifacts for value-material and exposure risk.

| Scan Area | Result | Risk Reduction |
| --- | --- | --- |
| Direct env names | names present, values absent | preserve field names only |
| Sensitive direct env names | names present, values absent | require `<APPROVAL_REQUIRED:FIELD_NAME>` or `<REDACTED_BY_POLICY>` |
| SecretRef names | reference names present, values absent | preserve secretRef names only |
| Runtime metadata | resource identity evidence exists; image/revision still snapshot-bound | require `<SNAPSHOT_REQUIRED:FIELD_NAME>` unless separately approved |
| Command examples | no approved executable command material | prohibit shell-ready assignment form in review-only docs |
| Public exposure | no external publication approved | prohibit external use of DEP3 placeholders without publication review |

Risk posture after this pass:

```yaml
risk_reduction_result:
  actual_value_material_detected: false
  secret_value_material_detected: false
  executable_command_material_detected: false
  public_exposure_authorized: false
  residual_risk:
    - placeholder_copy_paste_into_command_context
    - placeholder_interpreted_as_value_approval
    - sensitive_field_names_used_in_public_material
  mitigation:
    - non_shell_ready_structure_only
    - publication_hold_preserved
    - command_envelope_hold_preserved
    - value_and_secret_governance_stop_conditions
```

## Allowed Placeholder Classes

| Placeholder Class | Allowed Form | Meaning | Boundary |
| --- | --- | --- | --- |
| Held direct value | `<VALUE_HELD:FIELD_NAME>` | field exists, value not approved for inclusion | not a value |
| Held sensitive direct value | `<APPROVAL_REQUIRED:FIELD_NAME>` | sensitive field requires separate approval before any value handling | not a value |
| Secret reference | `<SECRET_REF:secret-name>` | references approved secretRef name only | not a secret value |
| Metadata held | `<METADATA_HELD:FIELD_NAME>` | metadata field requires separate evidence or snapshot | not live metadata unless already approved |
| Snapshot required | `<SNAPSHOT_REQUIRED:FIELD_NAME>` | field depends on a future approved snapshot | not snapshot approval |
| Redacted by policy | `<REDACTED_BY_POLICY>` | value material intentionally excluded | not a substitute value |

Allowed placeholders are labels only. They must not be treated as shell-ready values, deploy-ready values, runtime defaults, secret substitutes, or approval shortcuts.

## Exposure Reduction Rules

DEP3.6 adds the following exposure controls:

- Placeholder labels are internal review markers only.
- Placeholder labels must not appear in buyer-facing, public, pilot, or endpoint-release materials without a separate publication review.
- Sensitive field names may remain in internal deployment-governance packets, but must not be moved into public-facing materials by default.
- Future command-envelope drafts must use structured YAML blocks, not copy/paste-ready shell command strings.
- Any future packet that includes field names must also include `value_material_included: false`.
- Any future packet that references secretRefs must also include `secret_value_included: false` and `secret_access_authorized: false`.
- Any accidental value material must be removed before the artifact is treated as review-complete.

## Prohibited Placeholder Patterns

DEP3.6 prohibits:

- real-looking values
- dummy secrets, tokens, API keys, passwords, or signing keys
- fake connection strings
- fake registry credentials
- default passwords
- placeholder URLs that could be mistaken for real endpoint values
- command-ready strings with unresolved values
- `<INSERT_SECRET_HERE>` or similar prompts that invite secret pasting
- placeholders embedded into executable command syntax as if ready to run
- any placeholder that weakens the distinction between field structure and value material

## Placeholder Policy By Field Class

| Field Class | Approved Placeholder Treatment | Prohibited Treatment |
| --- | --- | --- |
| `direct_env` | field name plus `<VALUE_HELD:FIELD_NAME>` | real value, dummy value, shell-ready assignment |
| `sensitive_direct_env` | field name plus `<APPROVAL_REQUIRED:FIELD_NAME>` or `<REDACTED_BY_POLICY>` | connection string, webhook URL, token, or fake sensitive value |
| `secret_ref` | field name plus `<SECRET_REF:secret-name>` | secret value, secret preview, direct secret material |
| `registry_metadata` | field name plus `<METADATA_HELD:FIELD_NAME>` unless already sanitized | registry password, credential output, command-ready registry block |
| `resource_id_metadata` | sanitized approved resource ID only if already evidenced | broader live export, unrelated resource data |
| `runtime_metadata` | `<SNAPSHOT_REQUIRED:FIELD_NAME>` until a snapshot is separately approved | active revision/image claim without approved snapshot |

## Approved Envelope Reference Pattern

Future review-only envelopes may use:

```yaml
field_reference:
  name: FIELD_NAME
  class: direct_env
  placeholder: "<VALUE_HELD:FIELD_NAME>"
  value_material_included: false
  approval_required_before_value_handling: true
```

SecretRef fields may use:

```yaml
secret_reference:
  env_name: FIELD_NAME
  secret_ref: "<SECRET_REF:secret-name>"
  secret_value_included: false
  secret_access_authorized: false
```

## Prohibited Envelope Reference Pattern

Future review-only envelopes must not include shell-ready assignments such as:

```txt
FIELD_NAME=<VALUE_HELD:FIELD_NAME>
```

This syntax is prohibited in review-only packets because it can be mistaken for an executable command fragment. If a command skeleton is later required, it must be marked non-executable, split into non-shell-ready structured fields, and approved through a separate command-envelope lane.

## Review Completion Checklist

Any DEP3.7 or later artifact that inherits DEP3.6 must pass this checklist before it is treated as review-complete:

```yaml
dep3_6_inherited_checklist:
  contains_real_direct_env_values: false
  contains_sensitive_direct_env_values: false
  contains_secret_values: false
  contains_dummy_secret_values: false
  contains_connection_strings: false
  contains_tokens_or_api_keys: false
  contains_shell_ready_assignments: false
  contains_executable_command_line: false
  contains_public_endpoint_release_language: false
  value_material_included_flag_present: true
  secret_value_included_flag_present: true
  command_execution_authorized_flag_present: true
  deployment_authorized_flag_present: true
  runtime_mutation_authorized_flag_present: true
```

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| Placeholder resembles a real value | stop and replace with approved placeholder class |
| Placeholder invites secret insertion | stop and replace with `<SECRET_REF:secret-name>` or `<REDACTED_BY_POLICY>` |
| Command text becomes shell-ready | stop and route through command-envelope approval |
| Sensitive direct env value appears | stop, redact, and route through value governance |
| Secret value appears | stop, redact, and route through secret governance |
| Runtime metadata is treated as current without approved snapshot | stop and mark `<SNAPSHOT_REQUIRED:FIELD_NAME>` |
| Placeholder is interpreted as execution readiness | correct to review-only |

## Recommended Next Scope

```txt
DEP3.7 - command-envelope placeholder assembly packet, review-only.
```

Purpose:

```txt
Assemble a non-executable command-envelope shape using only approved field names and placeholder labels, with execution flags disabled and all mutation holds preserved.
```

DEP3.7 must not execute commands, query Azure, restore values, access secrets, deploy, rollback, verify live endpoints, publish, activate, push, or mutate runtime.

## Still Not Authorized

```yaml
still_not_authorized:
  - deployment
  - runtime_mutation
  - az_containerapp_update
  - command_execution
  - live_azure_query
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

This value-material exclusion and placeholder policy packet approves placeholder structure for review only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
