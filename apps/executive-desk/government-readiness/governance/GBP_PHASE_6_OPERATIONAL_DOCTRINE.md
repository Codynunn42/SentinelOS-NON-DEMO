# GBP Phase 6: Operational Doctrine

Date: 2026-07-18
Status: Draft for executive review
Scope: SentinelOS Executive Desk operational governance doctrine

## Executive Boundary

GBP Engineering Foundation is complete for current implemented scope.
This phase defines how operations govern the platform from sandbox posture through sovereign-gated mission status.

This doctrine is read-only governance guidance. It does not authorize direct runtime mutation, production deployment, or sovereignty claims by itself.

## North Star Governance Chain

North Star -> Doctrine -> Bridge Gap Analysis -> Remediation Plan -> Implementation -> Gate Validation -> Evidence -> Certification

This chain is mandatory for every readiness advancement.

## Operational Readiness Levels (ORL)

ORLs use a strict 1-5 model for federal familiarity, with Sentinel-specific control criteria.

### ORL 1 - Local Sandbox Validation

Purpose: verify command correctness and governance shape in controlled local context.

Entry criteria:

- Command contracts are deterministic and schema-stable.
- Baseline tests pass for local command surfaces.
- Read-only boundaries are enforced for doctrine-stage workflows.

Required evidence:

- Local test outputs for command handlers and route validation.
- Contract checks for canonical governance commands.
- Initial receipts proving audit-path generation.

Exit gate:

- No unresolved contract drift in local command outputs.

### ORL 2 - Controlled Integration Readiness

Purpose: validate integrated behavior across API, command dispatch, and policy gating.

Entry criteria:

- ORL 1 complete.
- Policy scope mapping exists for all certification commands.
- Tenant and command routing are verified through integrated flows.

Required evidence:

- Integrated API and handler test results.
- Policy allowlist/scope mapping artifacts.
- Receipt and audit reference continuity proof.

Exit gate:

- Integrated command invocation produces deterministic governance outputs and receipts.

### ORL 3 - Mission Pilot Governance

Purpose: run doctrine-governed pilots with explicit authority chains and bounded mission packages.

Entry criteria:

- ORL 2 complete.
- Bridge Gaps Report active with deterministic doctor and light mode outputs.
- Profile owner mapping drafted for pilot mission scope.

Required evidence:

- Bridge Gap artifacts with blocker classification and ordered next steps.
- Pilot authority mapping and escalation workflows.
- Negative-control coverage plan approved for pilot scope.

Exit gate:

- Pilot package demonstrates controlled readiness movement without governance bypass.

### ORL 4 - Departmental Production Candidate

Purpose: demonstrate department-level production candidacy with sovereign gating discipline.

Entry criteria:

- ORL 3 complete.
- Negative-control validations implemented for critical gate surfaces.
- Evidence library completeness reaches department threshold.

Required evidence:

- Full gate certification report for implemented scope.
- Negative-control pass records for key governance commands.
- Operational cadence records (daily/weekly/monthly) showing tenant memory in use.

Exit gate:

- Department review board validates production-candidate posture for constrained mission scope.

### ORL 5 - Multi-Agency Production Certification

Purpose: sustain multi-agency certified operations with institutional governance and traceability.

Entry criteria:

- ORL 4 complete.
- Cross-agency doctrine mapping and package alignment complete.
- Sovereign and compliance assertions fully evidence-backed.

Required evidence:

- Multi-agency readiness matrix with signed authority chains.
- Continuous cadence evidence proving operational consistency.
- Certification artifacts mapping every claim to doctrine and gate evidence.

Exit gate:

- Formal multi-agency certification approval.

## Deployment Readiness Matrix

Use this matrix to determine whether deployment status can advance.

| Dimension | ORL 1 | ORL 2 | ORL 3 | ORL 4 | ORL 5 |
|---|---|---|---|---|---|
| Contract determinism | Required | Required | Required | Required | Required |
| Policy scope mapping | Partial | Required | Required | Required | Required |
| Authority owner mapping | Not required | Draft | Required | Required | Required |
| Negative-control coverage | Planned | Planned | Partial | Required | Required |
| Evidence completeness | Baseline | Expanded | Pilot-complete | Department-complete | Multi-agency complete |
| Operational cadence logs | Optional | Optional | Required | Required | Required |
| Certification claim level | None | Internal readiness | Pilot readiness | Department candidate | Multi-agency certified |

## Mission Package Model (Capabilities Over Legacy Feature Language)

All rollout language should use mission packages, not feature bundles.

Examples:

- CISA Governance Overlay
- Departmental Evidence Assurance Package
- Cross-Tenant Cadence Operations Package

Each mission package must define:

- Governing doctrine references
- Authority owners
- Required gate and evidence set
- Escalation path
- ORL target and current ORL status

## Doctor Mode and Light Mode Doctrine

### Doctor Mode

Doctor mode must:

- Diagnose why FIX and SET cannot safely proceed.
- Identify blocking doctrine, governance, dependency, or evidence gaps.
- Recommend remediation.
- Remain read-only.

Doctor mode must not:

- Perform runtime changes.
- Perform deployment actions.
- Assert certification expansion without evidence.

### Light Mode

Light mode must:

- Translate diagnosis into ordered implementation steps.
- Show dependencies and expected outcomes.
- Preserve read-only posture.

Light mode must not:

- Execute changes.
- Bypass authority chains.

## Advancement Rules

An ORL advancement request is valid only when:

- Required entry criteria are met.
- Required evidence exists and is reviewable.
- Blocking conditions are resolved or formally accepted with authority approval.
- Resulting posture is documented in certification and traceability artifacts.

## Current Recommended Starting Posture

Recommended current doctrinal starting posture: ORL 2 progressing to ORL 3.

Rationale:

- Implemented gates are passing in current scope.
- Bridge Gaps governance command now emits deterministic outputs.
- Remaining work centers on negative-control depth, owner mapping, and evidence completeness required for pilot-level governance maturity.

## Immediate Next Artifacts

1. ORL assessment scorecard for current environment.
2. Mission package template (operator-ready).
3. Operational cadence evidence template (daily/weekly/monthly).
4. ORL advancement review checklist linked to bridge-gaps blockers.

## Phase 6 Artifact Package Set

The following four artifacts are the official operational package for GBP Phase 6:

1. ORL Assessment Scorecard Template:
 [GBP_PHASE_6_ORL_ASSESSMENT_SCORECARD_TEMPLATE.md](GBP_PHASE_6_ORL_ASSESSMENT_SCORECARD_TEMPLATE.md)
2. Mission Package Template (CISA Governance Overlay):
 [GBP_PHASE_6_MISSION_PACKAGE_TEMPLATE_CISA_GOVERNANCE_OVERLAY.md](GBP_PHASE_6_MISSION_PACKAGE_TEMPLATE_CISA_GOVERNANCE_OVERLAY.md)
3. Operational Cadence Evidence Template:
 [GBP_PHASE_6_OPERATIONAL_CADENCE_EVIDENCE_TEMPLATE.md](GBP_PHASE_6_OPERATIONAL_CADENCE_EVIDENCE_TEMPLATE.md)
4. ORL Advancement Review Checklist (Bridge-Gaps Linked):
 [GBP_PHASE_6_ORL_ADVANCEMENT_REVIEW_CHECKLIST_BRIDGE_GAPS.md](GBP_PHASE_6_ORL_ADVANCEMENT_REVIEW_CHECKLIST_BRIDGE_GAPS.md)

## Phase 6 Print Pipeline Order

The official document build and validation order is:

1. [GBP_PHASE_6_OPERATIONAL_DOCTRINE.md](GBP_PHASE_6_OPERATIONAL_DOCTRINE.md)
2. [GBP_PHASE_6_MISSION_PACKAGE_TEMPLATE_CISA_GOVERNANCE_OVERLAY.md](GBP_PHASE_6_MISSION_PACKAGE_TEMPLATE_CISA_GOVERNANCE_OVERLAY.md)
3. [GBP_PHASE_6_ORL_ASSESSMENT_SCORECARD_TEMPLATE.md](GBP_PHASE_6_ORL_ASSESSMENT_SCORECARD_TEMPLATE.md)
4. [CERTIFICATION_PROMOTION_POLICY.md](CERTIFICATION_PROMOTION_POLICY.md)
5. [EXECUTIVE_OPERATIONS_MANUAL.md](EXECUTIVE_OPERATIONS_MANUAL.md)
6. [MISSION_ACTIVATION_HANDOFF_PROCEDURE.md](MISSION_ACTIVATION_HANDOFF_PROCEDURE.md)
7. [FEDERAL_READINESS_ASSESSMENT.md](FEDERAL_READINESS_ASSESSMENT.md)
