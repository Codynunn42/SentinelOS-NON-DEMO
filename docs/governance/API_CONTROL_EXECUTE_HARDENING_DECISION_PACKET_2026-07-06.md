# API Control Execute Hardening Decision Packet - 2026-07-06

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Mode:** hardening decision packet, read-only, review-held
**Gate:** `PREPARE_API_CONTROL_EXECUTE_HARDENING_DECISION_PACKET`
**Source Classification:** `docs/governance/MISSION_CONTROL_ROUTE_CLASSIFICATION_PUBLIC_PROTECTED_INTERNAL_HELD_2026-07-06.md`
**Source Job:** `docs/governance/VR_0001_MISSION_CONTROL_SECURITY_PLATFORM_REVIEW_JOB_2026-07-06.md`
**External Use:** held
**Authority Created:** false

## Purpose

Prepare the hardening decision packet for `POST /api/control/execute`, the
browser-facing control proxy that builds a Control Plane envelope and forwards
execution to `POST /v1/command`.

This packet records the recommended authentication, authorization,
fail-closed, proof-mode, and audit posture. It does not implement the change.

## Current Route Evidence

```yaml
route:
  method: POST
  path: /api/control/execute
  file: apps/api/server.js
  current_classification: held_hardening_required
  current_behavior:
    - reads_JSON_body
    - calls_getRequestApiKey
    - forwards_x_api_key_only_when_request_key_is_present
    - calls_executeIntent
    - executeIntent_can_fall_back_to_SENTINEL_CONTROL_API_KEY_or_SENTINEL_API_KEY
    - returns_normalized_demo_control_result
  downstream_route: /v1/command
  downstream_route_classification: protected_core_runtime
  authority_created: false
```

## Current Risk

```yaml
current_risk:
  risk_level: high_before_public_or_production_expansion
  reason: >
    /api/control/execute is browser-facing and can forward to the protected
    /v1/command route through Control Plane execution. The route currently does
    not make its own explicit authentication and authorization decision before
    calling executeIntent.
  specific_concerns:
    - request_key_absence_does_not_fail_closed_at_proxy_boundary
    - environment_key_fallback_may_hide_missing_request_authority
    - normalized_200_blocked_response_can_obscure_auth_failure_classification
    - route_scope_is_not_explicitly_named_at_the_proxy_boundary
    - proof_UI_and_Mission_Control_need_different_claim_boundaries
  authority_created: false
```

## Hardening Decision

Recommended decision:

```yaml
hardening_decision:
  selected_posture: protected_fail_closed
  route: POST_/api/control/execute
  authentication_required: true
  accepted_identity_headers:
    - x-api-key
    - Authorization_Bearer
  query_key_accepted: false
  environment_key_fallback_for_request_auth: false
  required_scope: command:execute
  authorization_required: true
  authorize_before_executeIntent: true
  fail_closed_without_request_principal: true
  proof_mode_exception: held_not_approved
  public_GPT_Builder_or_tunnel_proof: held
  production_use: held
  authority_created: false
```

## Rejected Postures

```yaml
rejected_postures:
  public_open_proxy:
    decision: rejected
    reason: would_allow_browser_facing_control_proxy_without_explicit_request_authority

  protected_with_environment_fallback:
    decision: rejected_for_public_or_production
    reason: missing_request_authority_could_be_masked_by_server_environment_key

  demo_only_200_blocked_normalization:
    decision: acceptable_only_for_local_demo_context
    reason: useful_for_UI_storytelling_but_not_clear_enough_for_auth_boundary_enforcement

  query_key_auth:
    decision: rejected_for_control_execute
    reason: query_keys_are_easier_to_leak_in_logs_history_and_referrers

  authority_created: false
```

## Required Implementation Shape

This packet does not authorize implementation, but records the implementation
shape that should be used if the owner opens the implementation gate.

```yaml
implementation_shape:
  route_boundary:
    - extract_request_key_from_x_api_key_or_authorization_bearer_only
    - reject_missing_key_before_read_or_executeIntent_side_effects_where_practical
    - resolve_api_key_at_/api/control/execute_boundary
    - evaluate_policy_before_executeIntent
    - pass_principal_context_to_control_execution
    - disable_environment_key_fallback_for_browser_proxy_request_auth

  required_policy_context:
    route: /api/control/execute
    command: control.execute
    requiredScope: command:execute

  response_behavior:
    unauthenticated: HTTP_401
    unauthorized: HTTP_403
    invalid_json: HTTP_400
    validation_error: HTTP_400_or_422
    downstream_blocked: preserve_blocked_status_with_clear_reason
    downstream_error: HTTP_502_or_blocked_with_error_context_for_demo_only

  audit_behavior:
    - audit_auth_denied
    - audit_policy_denied
    - audit_control_execute_attempt
    - audit_downstream_command_result
    - include_actor_tenant_keyId_scope_route

  authority_created: false
```

## Proof Mode Boundary

```yaml
proof_mode_boundary:
  local_proof_ui:
    status: may_continue_only_under_local_review_context
    condition: must_not_be_described_as_public_or_production_hardened

  public_GPT_Builder_or_tunnel_proof:
    status: held
    requirement_before_opening:
      - explicit_auth_boundary_implemented_or_owner_accepts_bounded_exception
      - fresh_tunnel_schema_proof_gate
      - no_billing_or_customer_production_claims

  production:
    status: held
    requirement_before_opening:
      - protected_fail_closed_implementation
      - least_privilege_scope_map
      - audit_logging_coverage_verification
      - route_hardening_test

  authority_created: false
```

## Owner Decision Options

```yaml
owner_decision_options:
  approve_recommended_posture:
    meaning: approve_protected_fail_closed_as_the_required_future_implementation_posture
    next_gate: DEFINE_MISSION_CONTROL_CONTROL_PLANE_LEAST_PRIVILEGE_SCOPE_MAP
    implementation_gate: held_until_separately_opened

  request_alternate_posture:
    meaning: owner_requests_a_different_auth_or_proof_mode_boundary
    next_gate: REVISE_API_CONTROL_EXECUTE_HARDENING_DECISION_PACKET

  hold:
    meaning: keep_/api/control/execute_classified_as_held_hardening_required
    next_gate: RETURN_VR_0001_TO_CADENCE

  authority_created: false
```

## Decision Result

```yaml
prepared_gate: PREPARE_API_CONTROL_EXECUTE_HARDENING_DECISION_PACKET
packet_status: prepared_for_owner_review
recommended_posture: protected_fail_closed
selected_next_gate: DEFINE_MISSION_CONTROL_CONTROL_PLANE_LEAST_PRIVILEGE_SCOPE_MAP
implementation_authority: held
authority_created: false
```

## Non-Authorization

This packet does not authorize code edits, staging, commit, push, deployment,
runtime mutation, Azure mutation, scheduler activation, timed-event execution,
external publication, public GPT Builder mutation, tunnel reuse, live billing,
checkout activation, pricing publication, customer production execution,
customer onboarding, SINTENEX implementation, Gate 9 v2 implementation, file
movement, cleanup, SLA commitments, response-time commitments, uptime
commitments, continuity commitments, incident-response commitments, production
support commitments, or unsupported recovery of past promises.
