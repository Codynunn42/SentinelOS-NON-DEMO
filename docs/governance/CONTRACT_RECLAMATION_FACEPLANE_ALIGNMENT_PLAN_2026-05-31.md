# Contract Reclamation Faceplane Alignment Plan - 2026-05-31

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** alignment plan  
**Lane:** Contract Reclamation / Operational Upgrade  
**Selected Action:** `REQUEST_CONTRACT_RECLAMATION_FACEPLANE_ALIGNMENT_PLAN`  
**State:** Plan Ready, Implementation Held  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:CONTRACT-RECLAMATION-FACEPLANE-ALIGNMENT-PLAN-2026-05-31]
```

## Purpose

Define the smallest safe alignment path for the contract reclamation project so it can become an Operational Upgrade Faceplane without changing the way an operator works, breaking SentinelOS routing, or creating accidental implementation authority.

This plan does not authorize code changes, registry changes, handler creation, command changes, policy changes, faceplane activation, deployment, runtime mutation, staging, committing, pushing, publication expansion, external sharing, cleanup, or branch settings changes.

## Source Review

```yaml
source_review:
  before_after_review: docs/governance/CONTRACT_RECLAMATION_FACEPLANE_BEFORE_AFTER_REVIEW_2026-05-31.md
  surface_registry: apps/sentinel/src/surface/registry.js
  dispatch_path: apps/sentinel/src/commands/dispatch.js
  command_envelope: apps/sentinel/src/types/command.js
  faceplane_sdk_spec: docs/governance/FACEPLANE_SDK_SPEC.md
  docking_doctrine: docs/governance/FACEPLANE_GAAS_DOCKING_DOCTRINE.md
  publication_control_index: docs/governance/SENTINELOS_PROJECT_SITUATION_AND_PUBLICATION_CONTROL_INDEX_2026-05-30.md
  authority_created: false
```

## Alignment Objective

```yaml
alignment_objective:
  public_operator_facing_name: Operational Upgrade Faceplane
  internal_legacy_label: contractreclamation
  goal:
    - preserve_existing_operator_motion
    - add_governance_visibility
    - expose_drift_without_forcing_contract_rewrite
    - keep_SentinelOS_as_the_governance_OS
    - prevent_registry_or_dispatch_drift
  not_goal:
    - legal_recovery_product
    - autonomous_contract_modernization
    - external_public_product_launch
    - direct_execution_outside_SentinelOS
    - runtime_activation_without_approval
  authority_created: false
```

## Current Drift To Resolve

```yaml
current_drift_to_resolve:
  registry_missing_handler:
    status: open
    current_state: apps/sentinel/src/surface/registry.js references ../commands/contractReclamation
    issue: module_missing_in_current_checkout
    impact: requiring_surface_registry_fails
  registry_export_contract:
    status: open
    current_state: dispatch_imports_getSurfaceRegistry_but_registry_exports_surfaceRegistry
    issue: dispatch_registry_contract_mismatch
    impact: dispatch_can_fail_before_surface_routing
  operational_upgrade_artifacts:
    status: open
    current_state: expected_prior_operational_upgrade_docs_and_runtime_files_absent
    issue: prior_lane_not_present_in_current_checkout
    impact: no_current_canonical_operational_upgrade_plan_or_faceplane
  faceplane_simulation:
    status: open
    current_state: mock_framework_supports_ownerfi_hotelops_itad_only
    issue: no_contract_upgrade_simulation
    impact: cannot_compare_operator_before_after_for_this_domain
  authority_created: false
```

## Proposed Alignment Sequence

```yaml
proposed_alignment_sequence:
  phase_0_plan_only:
    status: current
    actions:
      - record_alignment_plan
      - preserve_implementation_hold
      - surface_exact_decision_options
    authority_created: false
  phase_1_document_alignment_if_authorized:
    actions:
      - create_or_restore_operational_upgrade_positioning_doc
      - create_or_restore_operational_upgrade_faceplane_doc
      - update_publication_control_index_if_needed
      - keep_contract_reclamation_as_internal_legacy_alias
    mutation_type: docs_only
    requires: explicit_docs_alignment_authority
  phase_2_runtime_contract_repair_if_authorized:
    actions:
      - reconcile_surface_registry_export_contract
      - either_add_bounded_contractreclamation_handler_or_hold_remove_registry_entry
      - preserve_tenant_plus_command_envelope
      - avoid_operator_payload_shape_changes
    mutation_type: runtime_code
    requires: explicit_runtime_repair_authority
  phase_3_faceplane_simulation_if_authorized:
    actions:
      - add_operational_upgrade_faceplane_fixture_or_mock_runner
      - simulate_before_after_operator_flow
      - verify_governance_preflight_approval_audit_receipt_path
      - confirm_no_extra_operator_workflow_complexity
    mutation_type: fixture_or_mock_simulation
    requires: explicit_faceplane_simulation_authority
  phase_4_activation_review_if_authorized_later:
    actions:
      - run_local_checks
      - review_telemetry_events
      - prepare_activation_packet
      - hold_for_operator_approval
    mutation_type: activation_review_only
    requires: separate_activation_authority
  authority_created: false
```

## Operator Workflow Preservation Contract

```yaml
operator_workflow_preservation_contract:
  unchanged_operator_motion:
    - review_existing_agreement_or_obligation
    - identify_operational_expectation_gap
    - prepare_upgrade_plan
    - hold_for_review_or_approval
  enhancements_allowed:
    - governance_preflight
    - evidence_mapping
    - approval_requirement_visibility
    - drift_classification
    - audit_receipt_generation
  changes_not_allowed_without_separate_approval:
    - forced_new_operator_workflow
    - autonomous_contract_editing
    - direct_submission_or_external_release
    - legal_recovery_or_dispute_framing
    - public_product_rebrand
  authority_created: false
```

## Exact Decision Options

```yaml
decision_options:
  option_a:
    selected_path: APPROVE_DOCS_ONLY_OPERATIONAL_UPGRADE_ALIGNMENT
    purpose:
      - restore_or_create_canonical_operational_upgrade_docs
      - lock_operator_facing_language
      - keep_runtime_held
    authority_created: false
  option_b:
    selected_path: APPROVE_RUNTIME_REGISTRY_CONTRACT_REPAIR_PLAN
    purpose:
      - prepare_exact_code_change_scope_for_registry_and_missing_handler_drift
      - no_runtime_activation_without_later_execution_approval
    authority_created: false
  option_c:
    selected_path: APPROVE_FACEPLANE_SIMULATION_PLAN
    purpose:
      - define_contract_upgrade_mock_or_fixture
      - compare_before_after_operator_flow
      - keep_simulation_sandboxed
    authority_created: false
  option_d:
    selected_path: HOLD_CONTRACT_RECLAMATION_FACEPLANE_IMPLEMENTATION
    purpose:
      - preserve_current_review_state
      - avoid_runtime_change
    authority_created: false
  recommended_path:
    selected_path: APPROVE_DOCS_ONLY_OPERATIONAL_UPGRADE_ALIGNMENT
    reason:
      - lowest_authority_next_step
      - resolves_naming_confusion_first
      - preserves_operator_workflow_before_code_changes
      - produces_exact_runtime_repair_manifest_later
      - avoids_accidental_activation
    authority_created: false
```

## Acceptance Criteria For Future Implementation

```yaml
future_acceptance_criteria:
  language:
    - operator_facing_language_uses_operational_upgrade
    - contract_reclamation_remains_internal_alias_only
    - no_broken_contract_or_recovery_claims
  runtime_contract:
    - surface_registry_loads_successfully
    - dispatch_registry_export_contract_is_consistent
    - tenant_plus_command_envelope_preserved
    - legacy_operator_payloads_not_broken_without_compatibility_bridge
  faceplane_behavior:
    - faceplane_does_not_bypass_SentinelOS
    - approval_before_execution_path_visible
    - evidence_requirements_visible
    - drift_classification_visible
    - audit_receipt_generated
  operator_experience:
    - operator_flow_still_starts_from_existing_agreement_or_obligation
    - output_is_plan_or_review_not_autonomous_execution
    - no_external_submission_or_release
  proof:
    - node_scripts_check_faceplane_sdk_passes
    - registry_load_check_passes
    - simulation_or_fixture_check_passes_if_simulation_is_authorized
  authority_created: false
```

## Non-Authorization

This alignment plan does not authorize code edits, registry edits, handler creation, command changes, policy changes, faceplane activation, live execution, deployment, runtime mutation, staging, committing, pushing, publication expansion, external sharing, cleanup, or branch settings changes.
