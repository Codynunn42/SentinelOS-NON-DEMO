# Runtime Metrics Evidence Rules - 2026-05-21

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** constitutional observability refresh  
**Authority:** review-only, non-authorizing metrics

## Artifact Decision

```txt
[KEEP:RUNTIME-METRICS-EVIDENCE-RULES-2026-05-21]
```

## Purpose

Refresh runtime metrics evidence rules after operational legitimacy convergence and `SNAP-FED-1.2`.

This packet defines how current proof, governance, role/scope, receipt, faceplane, and narrative evidence may be summarized as executive metrics without turning those metrics into authority.

Core rule:

```txt
metrics qualify evidence
metrics do not grant permission
```

## Boundary

This packet does not authorize scoring automation, runtime telemetry implementation, deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, endpoint publication, pilot activation, tenant activation, billing activation, funnel activation, buyer-facing publication, certification claims, legal claims, recovery claims, repository push, tool grants, autonomous execution, authority merge, DEP3.23 activation, execution-window activation, file movement, file deletion, or destructive cleanup.

## Source Inputs

| Source | Evidence Role |
| --- | --- |
| `docs/RUNTIME_METRICS_EVIDENCE_RULES_2026-05-20.md` | base metric evidence doctrine |
| `docs/SNAP_FED_1_2_OPERATIONAL_LEGITIMACY_SNAPSHOT_REFINEMENT_2026-05-21.md` | current federated evidence state |
| `docs/MEETING_STABILITY_REFRESH_2026-05-21.md` | live proof backend and clean no-key proof-flow evidence |
| `docs/PROOF_HARDENING_RELEASE_BATCH_2026-05-21.md` | proof release batch evidence |
| `docs/ROLE_KEY_GOVERNANCE_PACKET_2026-05-21.md` | role/key governance evidence |
| `docs/ROLE_SCOPE_REGISTRY_2026-05-21.md` | canonical role/scope evidence |
| `docs/EXECUTIVE_NEXT_STEPS_COMPLETION_CHECKPOINT_2026-05-21.md` | executive completion checkpoint |
| `docs/OPERATIONAL_LEGITIMACY_CONVERGENCE_CHECKPOINT_2026-05-21.md` | convergence checkpoint |
| `docs/BUYER_SAFE_EXPLANATION_PACKET_2026-05-21.md` | commercial claim boundary |
| sibling `contract-reclamation` repo checks | review-only domain faceplane evidence |

## Current Evidence Classes

| Evidence Class | Current Status | Metric Use | Authority Boundary |
| --- | --- | --- | --- |
| `live_backend_check` | verified | proof backend reliability | read-only evidence only |
| `clean_no_key_rehearsal` | verified | meeting-surface legitimacy | no publication authority |
| `no_key_audit_boundary` | verified | access protection | no audit access grant |
| `governance_preflight` | verified | block integrity | no command execution grant |
| `role_scope_registry` | verified | role/scope clarity | no new runtime role grant |
| `receipt_visibility` | verified | operator explainability | visibility only, not approval |
| `execution_integrity` | verified | signed execution boundary | no execution expansion |
| `faceplane_review_checks` | verified review-only | domain boundary integrity | no legal, recovery, or execution authority |
| `buyer_safe_narrative` | internal draft only | claim accuracy | no external publication authority |
| `visual_browser_walkthrough` | optional/unverified | presentation confidence only | cannot block backend legitimacy |

## Metric Score Rules

| Score | Evidence Requirement |
| --- | --- |
| `0` | absent, contradicted, or violated evidence |
| `1` | weak, stale, or unverified claim |
| `2` | represented but incomplete evidence |
| `3` | current enough for review and bounded by non-authorization language |
| `4` | supported by multiple aligned artifacts with no authority-positive conflict |
| `5` | independently verified by current bounded evidence and explicitly non-authorizing |

No metric score may exceed `3` when:

- evidence is stale
- the subject identity is missing
- the evidence lacks an authority boundary
- the evidence lacks a non-authorization clause
- the evidence depends on an unapproved live observation
- the metric would be used to create permission

No metric score may be interpreted as:

- deployment authorization
- runtime mutation authorization
- publication authorization
- pilot activation
- legal conclusion
- recovery entitlement
- buyer claim approval
- autonomous execution permission

## Current Runtime Metric Board

| Metric | Current Status | Evidence | Score | Cap / Hold |
| --- | --- | --- | --- | --- |
| `proof_backend_reliability` | verified | `/health` 200 and `/proof` 200 through `npm run check:meeting-stability` | `5` | rerun before external share |
| `clean_no_key_proof_flow` | verified | clean no-key proof-flow rehearsal passed without API key header | `5` | visual browser walkthrough remains optional |
| `no_key_audit_boundary` | verified | no-key audit returned `401 Unauthorized` | `5` | do not weaken audit boundary |
| `governance_block_integrity` | verified | policy, approval, and preflight checks passed | `5` | keep pre-handler control |
| `role_scope_enforcement` | verified | role/scope registry and key checks passed | `5` | adopt registry in future protected command work |
| `receipt_visibility` | verified | receipt lookup check passed | `5` | visibility is not authority |
| `execution_integrity` | verified | signed execution boundary checks passed | `5` | no execution expansion |
| `faceplane_boundary_integrity` | verified review-only | Contract Reclamation faceplane checks passed in sibling repo | `4` | production readiness capped at `3`; review boundary may score `4` |
| `claim_accuracy` | controlled internal draft | buyer-safe packet exists | `4` | external publication held |
| `authority_balance` | healthy | no runtime mutation, no publication, no authority merge | `5` | maintain `HOLD_EXECUTION` |
| `runtime_mutation_pressure` | low | no deployment or mutation lane reopened | `5` | keep mutation authority absent |
| `publication_readiness` | held | buyer-safe packet is internal draft only | `3` | operator decision required before external use |
| `visual_presentation_confidence` | optional gap | browser walkthrough unavailable/unverified | `3` | presentation polish only; backend legitimacy unaffected |

## Score Cap Rules

```yaml
score_caps:
  production_readiness:
    cap: 3
    reason: production certification not authorized
  external_publication:
    cap: 3
    reason: buyer-safe packet remains internal until operator decision
  contract_reclamation_production:
    cap: 3
    reason: sibling repo is prototype/review only
  visual_presentation_confidence:
    cap: 3
    reason: visual browser walkthrough remains optional/unverified
  execution_authority:
    cap: 0
    reason: metrics cannot create execution authority
  runtime_mutation_authority:
    cap: 0
    reason: metrics cannot create runtime mutation authority
```

## Current Evidence Assessment

```yaml
runtime_metrics_evidence_rules:
  selected_lane: runtime_metrics_evidence_rules
  phase: OPERATIONAL_LEGITIMACY_CONVERGENCE
  evidence_basis:
    proof_backend: VERIFIED
    clean_no_key_proof_flow: VERIFIED
    no_key_audit_boundary: VERIFIED
    governance: VERIFIED
    role_scope: VERIFIED
    receipts: VERIFIED
    execution_integrity: VERIFIED
    faceplanes: VERIFIED_REVIEW_ONLY
    buyer_safe_language: INTERNAL_DRAFT_ONLY
  score_rules_refreshed: true
  score_caps_defined: true
  metrics_authorize_action: false
  scoring_automation_authorized: false
  runtime_telemetry_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  endpoint_publication_authorized: false
  pilot_activation_authorized: false
  legal_claims_authorized: false
  authority_created: false
  next_review_lane: executive_snapshot_refresh
```

## Executive Metric Evidence Block

Future executive snapshots may include:

```yaml
constitutional_metric_evidence:
  evidence_status: current
  phase: OPERATIONAL_LEGITIMACY_CONVERGENCE
  verified_signals:
    - proof_backend_reliability
    - clean_no_key_proof_flow
    - no_key_audit_boundary
    - governance_block_integrity
    - role_scope_enforcement
    - receipt_visibility
    - execution_integrity
    - faceplane_boundary_integrity_review_only
  held_signals:
    - external_publication
    - production_certification
    - runtime_mutation
    - deployment
    - legal_or_recovery_claims
  score_caps_applied:
    - production_readiness
    - external_publication
    - contract_reclamation_production
    - visual_presentation_confidence
  scores_authorize_action: false
  recommended_next_lane: executive_snapshot_refresh
  authority_created: false
```

## Next Review Lane

```yaml
next_review_lane:
  selected_lane: executive_snapshot_refresh
  reason:
    - snapshot_federation_refined
    - runtime_metric_evidence_rules_refreshed
    - current_operational_legitimacy_metrics_bounded
    - executive_state_can_now_reconcile_current_posture
  authority_created: false
```

## Non-Authorization Clause

This runtime metrics evidence refresh records review-only metric qualification and score caps. It does not authorize scoring automation, runtime telemetry implementation, deployment, runtime mutation, command execution, live Azure query execution, secret access, endpoint publication, pilot activation, tenant activation, billing activation, funnel activation, buyer-facing publication, production certification, legal claims, recovery claims, repository push, tool grants, autonomous execution, authority merge, DEP3.23 activation, execution-window activation, file movement, file deletion, or destructive cleanup.
