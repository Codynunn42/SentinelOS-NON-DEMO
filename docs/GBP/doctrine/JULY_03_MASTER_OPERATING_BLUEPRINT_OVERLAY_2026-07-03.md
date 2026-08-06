# July 03 Master Operating Blueprint Overlay - 2026-07-03

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** operating-model overlay, MOB-backed, review-held  
**MOB Constant:** `docs/GBP/doctrine/NUNN_CORPORATION_MASTER_OPERATING_BINDER_2026-06-15.md`  
**Distribution:** Internal  
**External Use:** held  
**Authority Created:** no runtime, billing, deployment, DNS, or file-movement authority

## Purpose

Define the July 3 operating model without replacing the Master Operating Binder.
This overlay turns the current proof, OwnerFi, SINTENEX, Stripe, and customer
scope work into one governed sequence.

## Executive Summary

Nunn Corporation has moved from proving isolated surfaces to governing an
operating model. SentinelOS, Sentinel AI, Executive Desk, OwnerFi, SINTENEX,
Deal Execution Engine, and Sentinel Light now have separated responsibilities.
The next work should strengthen those boundaries rather than create standalone
capabilities without a domain owner.

## Operating Model

```text
Nunn Corporation
|
|-- SentinelOS
|     Internal operating platform, governance orchestration, receipts, gates
|
|-- Sentinel AI
|     Intelligence and orchestration under policy and approval boundaries
|
|-- Executive Desk
|     Executive operations, command intake, and owner-facing control surface
|
|-- OwnerFi
|     Internal financial management domain
|     |-- Treasury
|     |-- Budgeting
|     |-- Forecasting
|     |-- Accounting
|     |-- Executive Reporting
|     |-- AI Agents
|     |-- Governance
|
|-- SINTENEX / Sintinex
|     Commercial portfolio, launch routing, customer lifecycle, trigger review
|
|-- Deal Execution Engine
|     Revenue-generating services and customer-facing deal execution scope
|
`-- Sentinel Light
      Public and community experience
```

## Domain Responsibility Rules

| Domain | Responsibility | Boundary |
| --- | --- | --- |
| SentinelOS | Governs authority, command routing, receipts, audit, and execution gates | Does not create commercial authority by itself |
| Sentinel AI | Produces analysis, next-step routing, schemas, and bounded governance actions | Does not assert external cloud state without independent verification |
| Executive Desk | Organizes owner-facing operating decisions and support lanes | Does not bypass approval packets |
| OwnerFi | Owns internal financial management and AI Financial Management capability modules | Does not execute live financial operations without approval |
| SendCOMM | Candidate SentinelOS origin / communications lineage component | Source not yet located; migration held pending inventory |
| SINTENEX / Sintinex | Owns commercial packaging, trigger review, customer lifecycle, and external readiness | Keeps billing/pricing language review-held until approval |
| Deal Execution Engine | Owns customer-facing deal execution service scope | Production customer execution remains held |
| Sentinel Light | Owns public/community-facing experience | Public claims remain bounded by approval and evidence |

## Active July 3 Sequence

```yaml
phase_1:
  name: Infra and Health Gate
  gates:
    - RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF
    - VERIFY_CURRENT_OWNERFI_PROOF_HEALTH_BEFORE_SHARE_OR_MEETING
  current_state: route_health_passed_subscription_warned

phase_2:
  name: Bounded Prep Packets
  lanes:
    - Stripe_non_production_evidence
    - OwnerFi_AI_Financial_Management_module_manifest
    - SendCOMM_SentinelOS_migration_intake
    - SINTENEX_commercial_trigger_review_language
    - nunncorporation_hosting_target_verification
  authority: docs_read_only_or_test_restricted

phase_3:
  name: Scope Finalization
  gate: prepare_customer_specific_production_authorization_packet_for_owner_review
  authority: owner_signature_required_before_execution
```

## Immediate Priorities

1. Keep Phase 1 as the critical live-health gate until Azure subscription state
   returns from `Warned` to `Enabled`.
2. Build OwnerFi module architecture first because it defines the financial
   operating model and migration destinations.
3. Preserve all AI Financial Management prompts, calculations, models,
   governance artifacts, and evidence through checksum verification before any
   file movement.
4. Keep Stripe work sandbox-only and evidence-only until a separate live-payment
   authorization packet clears.
5. Keep customer-specific production authorization held until the intake and
   risk questionnaire fields are fully populated.

## Implementation Sequence

```yaml
recommended_sequence:
  1: maintain_MOB_as_constant_and_use_this_overlay_as_current_operating_model
  2: finalize_ownerfi_module_manifest
  3: verify_checksum_manifest_against_source_assets
  4: locate_sendcomm_source_and_prepare_read_only_inventory
  5: complete_stripe_sandbox_validation_when_test_values_are_supplied
  6: verify_nunncorporation_production_hosting_target_before_publish
  7: populate_customer_specific_scope
  8: assemble_customer_specific_production_authorization_packet_for_owner_review
```

## Sequence Completion Result

The sequence has been processed to its current governed holding point in
`docs/GBP/assessments/JULY_03_OPERATING_SEQUENCE_COMPLETION_RESULT_2026-07-03.md`.

```yaml
completed:
  - MOB_overlay
  - OwnerFi_module_manifest
  - OwnerFi_checksum_verification
  - nunncorporation_hosting_target_read_only_verification
held:
  SendCOMM: source_not_located
  Stripe_sandbox: pending_test_values
  Customer_scope: pending_customer_target
  Production_authorization_packet: pending_scope_and_evidence
```

## SendCOMM Migration Intake

SendCOMM is now opened as a SentinelOS migration candidate in
`docs/governance/SENDCOMM_SENTINELOS_MIGRATION_REVIEW_RESULT_2026-07-03.md`.

```yaml
sendcomm_classification: candidate_sentinelos_origin_or_lineage_component
source_type: GitHub_repository
source_location_confirmed: false
exact_named_files_found: 0
next_gate: PROVIDE_OR_AUTHORIZE_EXACT_SENDCOMM_GITHUB_REPO_ACCESS_FOR_READ_ONLY_INVENTORY
migration_authority: false
```

## Non-Authorization

This overlay does not authorize runtime mutation, Azure mutation, live database
alterations, DNS cutovers, production site publishing, live Stripe billing,
customer production execution, customer onboarding, file movement, staging,
commit, or push.
