# Mission Control Route Classification - Public / Protected / Internal / Held - 2026-07-06

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Mode:** route classification, read-only, review-held
**Gate:** `CLASSIFY_MISSION_CONTROL_ROUTES_BY_PUBLIC_PROTECTED_INTERNAL_HELD`
**Source Job:** `docs/VR_0001_MISSION_CONTROL_SECURITY_PLATFORM_REVIEW_JOB_2026-07-06.md`
**Source Queue:** `docs/VR_0001_MISSION_CONTROL_SECURITY_PLATFORM_RECOMMENDATIONS_PROCESSING_RESULT_2026-07-06.md`
**External Use:** held
**Authority Created:** false

## Purpose

Classify the Mission Control route surface by public, protected, internal, and
held posture before hardening, least-privilege mapping, audit assertions,
public proof, or production posture decisions.

This classification is read-only. It does not change route behavior, deploy,
mutate runtime, activate billing, publish public proof, or authorize customer
production.

## Evidence Reviewed

```yaml
evidence_reviewed:
  mission_control_surface: apps/api/public/mission-control.html
  api_server: apps/api/server.js
  check_script: scripts/check-mission-control-surface.js
  control_ui_check: scripts/check-control-ui.js
  source_job: docs/VR_0001_MISSION_CONTROL_SECURITY_PLATFORM_REVIEW_JOB_2026-07-06.md
  source_result: docs/MISSION_CONTROL_SECURITY_AND_PLATFORM_REVIEW_RESULT_2026-07-06.md
  authority_created: false
```

## Classification Legend

```yaml
classification_legend:
  public:
    meaning: routable without API key in current implementation
    note: Public does not mean approved for external claims or production use.
  protected:
    meaning: route uses API-key or bearer-token resolution plus policy evaluation.
  internal:
    meaning: local/static/supporting surface or operator-only context that should not be treated as public capability.
  held:
    meaning: route exists or is referenced but requires separate approval, hardening, or activation decision before external/public/production use.
  authority_created: false
```

## Mission Control Surface Routes

```yaml
mission_control_surface_routes:
  GET_/mission-control:
    classification: public_current_internal_recommended
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_static_surface
    mutation: prohibited
    evidence: apps/api/server.js serves apps/api/public/mission-control.html and records surface.viewed audit asynchronously
    hardening_note: protect_or_explicitly_classify_before_external_operator_use

  GET_/health:
    classification: public_current
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_status
    mutation: prohibited
    evidence: Mission Control loadHealth calls /health; server returns service/database/tier status
    hardening_note: acceptable_for_basic_liveness_if_no_sensitive_detail; review exposed fields before public production

  GET_/system/status:
    classification: public_current_internal_recommended
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_status_and_route_index
    mutation: prohibited
    evidence: server exposes route summary without authorizeRoute
    hardening_note: route inventory exposure should be protected or reduced before public production

  GET_/ready:
    classification: public_current_internal_recommended
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_readiness
    mutation: prohibited
    evidence: server returns governance readiness checks without authorizeRoute
    hardening_note: keep internal or reduce detail before external publication

  authority_created: false
```

## Protected Operator Data Routes

```yaml
protected_operator_data_routes:
  GET_/learning/suggestions:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: learning:read
    runtime: read_only_with_optional_approval_creation_disabled_by_Mission_Control
    mutation: held_when_createApproval_true
    evidence: Mission Control calls createApproval=false; server uses authorizeRoute with learning:read

  GET_/approvals:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: approval:read
    runtime: read_with_view_audit_side_effect
    mutation: audit_timeline_view_events
    evidence: server uses authorizeRoute with approval:read and records viewed events

  GET_/approvals/:id:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: approval:read
    runtime: read_with_view_audit_side_effect
    mutation: audit_timeline_view_event
    evidence: server uses authorizeRoute with approval:read

  POST_/approvals/:id/approve:
    classification: protected_held_for_owner_or_operator_review
    authentication: x_api_key_or_bearer_required
    authorization: approval:review
    runtime: approval_state_mutation
    mutation: approval_status_change
    evidence: Mission Control can post approval actions; server uses authorizeRoute with approval:review
    hardening_note: require explicit operator role and owner-approved use before production

  POST_/approvals/:id/reject:
    classification: protected_held_for_owner_or_operator_review
    authentication: x_api_key_or_bearer_required
    authorization: approval:review
    runtime: approval_state_mutation
    mutation: approval_status_change
    evidence: Mission Control can post approval actions; server uses authorizeRoute with approval:review
    hardening_note: require explicit operator role and owner-approved use before production

  authority_created: false
```

## Workflow And Control Routes

```yaml
workflow_and_control_routes:
  POST_/v1/workflow/init:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: task:orchestrate
    runtime: workflow_initialization
    mutation: creates_workflow_run_and_possible_approval_records
    evidence: Mission Control initializes workflow; server uses authorizeRoute with task:orchestrate and rate limit
    hardening_note: keep protected; classify as operator-only before public proof

  POST_/v1/workflow/execute:
    classification: protected_held_for_execution_review
    authentication: x_api_key_or_bearer_required
    authorization: task:execute
    runtime: workflow_step_execution_or_blocked_resolution
    mutation: possible_step_execution_or_blocked_result
    evidence: Mission Control attempts workflow execution; server uses authorizeRoute with task:execute
    hardening_note: require explicit operator scope and review before production execution claims

  POST_/v1/telemetry/harmonize:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: telemetry:write
    runtime: telemetry_review_recording
    mutation: audit_log_write
    evidence: Mission Control posts telemetry harmonization; server uses authorizeRoute with telemetry:write and rate limit
    hardening_note: keep protected; confirm telemetry write boundaries in least-privilege map

  POST_/api/control/execute:
    classification: held_hardening_required
    authentication: optional_forwarded_key_currently
    authorization: delegated_to_/v1/command_when_key_is_present_or_control_plane_env_fallback_exists
    runtime: control_plane_proxy_to_/v1/command
    mutation: may_submit_control_plane_command_envelope
    evidence: server reads JSON, calls executeIntent, forwards x-api-key only when present, and returns normalized result
    hardening_note: require explicit auth decision and fail-closed behavior before public/proof/production use

  POST_/v1/command:
    classification: protected_core_runtime
    authentication: x_api_key_or_bearer_required
    authorization: API_key_resolution_plus_policy_and_governance_checks
    runtime: core_command_submission
    mutation: command_dependent
    evidence: server uses authenticateCommand, rate limiting, execution passport, governance, dispatch, and audit
    hardening_note: keep protected; no direct Mission Control browser call should bypass control wrapper

  authority_created: false
```

## Audit, Metrics, Signals, And Trace Routes

```yaml
audit_metrics_signals_trace_routes:
  GET_/v1/audit:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: audit:read
    runtime: read_only_audit_events
    mutation: prohibited
    evidence: Mission Control loads audit timeline; sendAuditEvents uses authorizeRoute

  GET_/audit/events:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: audit:read
    runtime: read_only_audit_events
    mutation: prohibited
    evidence: server aliases audit events through sendAuditEvents

  GET_/v1/audit/stream:
    classification: protected_stream
    authentication: x_api_key_or_bearer_or_query_key_currently_supported
    authorization: audit:read
    runtime: server_sent_event_audit_stream
    mutation: prohibited
    evidence: Mission Control connects with bearer header; authorizeStream also accepts key query param
    hardening_note: remove_or_strictly_limit_query_key_before_public production

  GET_/v1/metrics:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: audit:read
    runtime: read_only_metrics
    mutation: prohibited
    evidence: Mission Control loads trust dashboard; server uses authorizeRoute with audit:read

  GET_/v1/alerts:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: audit:read
    runtime: read_only_governance_signals
    mutation: prohibited
    evidence: Mission Control loads governance signals; server uses authorizeRoute with audit:read

  GET_/v1/signals/stream:
    classification: protected_stream
    authentication: x_api_key_or_bearer_or_query_key_currently_supported
    authorization: audit:read
    runtime: server_sent_event_signal_stream
    mutation: prohibited
    evidence: Mission Control connects with bearer header; authorizeStream also accepts key query param
    hardening_note: remove_or_strictly_limit_query_key_before_public production

  GET_/v1/traces:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: audit:read
    runtime: read_only_execution_traces
    mutation: prohibited
    evidence: Mission Control loads traces; server uses authorizeRoute with audit:read

  GET_/v1/traces/:correlationId:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: audit:read
    runtime: read_only_execution_trace_detail
    mutation: prohibited
    evidence: server uses authorizeRoute with audit:read

  authority_created: false
```

## Anchors And Proof State Routes

```yaml
anchors_routes:
  GET_/v1/anchors:
    classification: public_current_internal_recommended
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_anchor_list
    mutation: prohibited
    evidence: Mission Control loads anchored states; server returns listAnchors without authorizeRoute
    hardening_note: protect_or_reduce_before_external_proof_claims

  GET_/anchors:
    classification: public_current_internal_recommended
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_anchor_list
    mutation: prohibited
    evidence: server aliases /anchors and /v1/anchors

  GET_/v1/anchors/system-release:
    classification: public_current_internal_recommended
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_system_release_anchor
    mutation: prohibited
    evidence: server returns system release anchor without authorizeRoute

  POST_/v1/anchors/system-release/external:
    classification: protected_held
    authentication: x_api_key_or_bearer_required
    authorization: platform:admin
    runtime: external_anchor_update
    mutation: external_anchor_state_update
    evidence: server uses authorizeRoute with platform:admin
    hardening_note: keep held until external proof gate is opened

  authority_created: false
```

## Billing And SINTENEX-Adjacent Routes

```yaml
billing_sintenex_adjacent_routes:
  GET_/billing/revenue-readiness:
    classification: public_current_held_commercial
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_commercial_readiness
    mutation: prohibited
    evidence: Mission Control loads SINTENEX Commercial Trigger Review status
    hardening_note: keep evidence-only; no billing activation or pricing claim

  GET_/billing/checkout/config:
    classification: public_current_held_commercial
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_checkout_config
    mutation: prohibited
    evidence: checkout static JS calls route; server returns readiness/config
    hardening_note: keep non-production evidence lane until SINTENEX approval

  GET_/billing/checkout/readiness:
    classification: public_current_held_commercial
    authentication: none_currently
    authorization: none_currently
    runtime: read_only_checkout_readiness
    mutation: prohibited
    evidence: server returns getStripeReadiness

  POST_/billing/checkout/session:
    classification: public_current_held_commercial
    authentication: none_currently
    authorization: approval_required_when_config_blocked
    runtime: checkout_session_attempt
    mutation: may_attempt_Stripe_session_or_create_billing_approval_record
    evidence: Mission Control can attempt billing; server rate limits and creates approval on blocked config
    hardening_note: route must remain held; no live checkout activation without SINTENEX commercial approval

  GET_/billing/session-status:
    classification: public_current_held_commercial
    authentication: none_currently
    authorization: none_currently
    runtime: checkout_session_status_lookup
    mutation: audit_log_write
    evidence: server retrieves Stripe checkout session status and logs audit
    hardening_note: protect or constrain before production use

  authority_created: false
```

## Drift And Optimization Routes

```yaml
drift_optimization_routes:
  GET_/drift/analyze:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: learning:read
    runtime: read_analysis_with_optional_approval_routing_disabled_by_Mission_Control
    mutation: audit_log_write; possible_approval_routing_when_routeApprovals_true
    evidence: Mission Control calls routeApprovals=false; server uses authorizeRoute with learning:read

  GET_/drift/recommendations:
    classification: protected
    authentication: x_api_key_or_bearer_required
    authorization: learning:read
    runtime: read_only_drift_recommendations
    mutation: prohibited
    evidence: Mission Control loads drift recommendations; server uses authorizeRoute with learning:read

  authority_created: false
```

## Static And Supporting Surfaces

```yaml
static_supporting_surfaces:
  GET_/:
    classification: public_current
    runtime: landing_page
    mutation: prohibited

  GET_/proof:
    classification: public_current_held_public_proof
    runtime: proof_UI
    mutation: UI_can_call_/api/control/execute_when_used
    hardening_note: public GPT Builder/tunnel proof remains separately held

  GET_/billing/checkout:
    classification: public_current_held_commercial
    runtime: checkout_UI
    mutation: UI_can_call_checkout_session

  GET_/billing/complete:
    classification: public_current_held_commercial
    runtime: checkout_completion_UI
    mutation: prohibited

  GET_/billing/static_assets:
    classification: public_current_supporting_assets
    runtime: static_JS_CSS
    mutation: prohibited

  authority_created: false
```

## Summary

```yaml
route_classification_summary:
  public_current:
    - GET_/mission-control
    - GET_/health
    - GET_/ready
    - GET_/system/status
    - GET_/v1/anchors
    - GET_/billing/revenue-readiness
    - GET_/billing/checkout/config
    - GET_/billing/checkout/readiness
    - POST_/billing/checkout/session
    - GET_/billing/session-status
  protected:
    - GET_/learning/suggestions
    - GET_/approvals
    - GET_/approvals/:id
    - POST_/approvals/:id/approve
    - POST_/approvals/:id/reject
    - POST_/v1/workflow/init
    - POST_/v1/workflow/execute
    - POST_/v1/telemetry/harmonize
    - GET_/v1/audit
    - GET_/v1/audit/stream
    - GET_/v1/metrics
    - GET_/v1/alerts
    - GET_/v1/signals/stream
    - GET_/v1/traces
    - GET_/drift/analyze
    - GET_/drift/recommendations
  held_hardening_required:
    - POST_/api/control/execute
  held_commercial:
    - billing_routes
  held_public_proof:
    - GET_/proof
    - public_GPT_Builder_or_tunnel_proof
  next_required_gate: PREPARE_API_CONTROL_EXECUTE_HARDENING_DECISION_PACKET
  authority_created: false
```

## Findings

```yaml
findings:
  F1:
    severity: high_before_public_or_production_expansion
    route: POST_/api/control/execute
    finding: Control proxy should receive an explicit public/protected/internal/held decision and fail-closed authentication posture.

  F2:
    severity: medium
    route_family: public_status_and_anchor_routes
    finding: /system/status, /ready, and /v1/anchors expose operational context without route authorization.

  F3:
    severity: medium
    route_family: streams
    finding: Audit and signal streams accept query key forms in authorizeStream; prefer header-only or tightly bounded proof behavior before public use.

  F4:
    severity: high_commercial_boundary
    route_family: billing
    finding: Billing routes remain public-current but commercial-held; SINTENEX approval is required before live activation or user-facing billing claims.

  F5:
    severity: medium
    route_family: approvals
    finding: Mission Control approval actions are protected but mutating; production use requires explicit operator role and owner-approved workflow.

  authority_created: false
```

## Next Gate

```yaml
completed_gate: CLASSIFY_MISSION_CONTROL_ROUTES_BY_PUBLIC_PROTECTED_INTERNAL_HELD
next_required_gate: PREPARE_API_CONTROL_EXECUTE_HARDENING_DECISION_PACKET
reason: >
  /api/control/execute is the highest-priority held route because it is the
  browser-facing control proxy into /v1/command and requires explicit
  authentication, authorization, and fail-closed behavior before public proof
  or production expansion.
authority_created: false
```

## Non-Authorization

This classification does not authorize staging, commit, push, deployment,
runtime mutation, Azure mutation, scheduler activation, timed-event execution,
external publication, public GPT Builder mutation, tunnel reuse, live billing,
checkout activation, pricing publication, customer production execution,
customer onboarding, SINTENEX implementation, Gate 9 v2 implementation, file
movement, cleanup, SLA commitments, response-time commitments, uptime
commitments, continuity commitments, incident-response commitments, production
support commitments, or unsupported recovery of past promises.
