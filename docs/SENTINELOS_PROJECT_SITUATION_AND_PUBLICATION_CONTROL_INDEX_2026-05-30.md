# SENTINELOS Project Situation and Publication Control Index — 2026-05-30

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** Publication control and platform classification  
**Authority created:** false

## Purpose

This document reconciles active and legacy project names under the unified SentinelOS naming standard. It records which names are public-facing, which names are internal only, and what status each concept carries inside the SentinelOS operating model.

## Rules

- Public-facing naming is exclusively **SentinelOS**.
- Old project names are internal architecture labels, legacy references, or deprecated working titles unless translated into industry-standard terminology.
- Experimental, pilot, or concept work must not be published as active products.
- Governance integrity and monetization readiness are the primary sorting criteria.

## SentinelOS Platform Categories

1. Core Platform
2. Governance Layer
3. Operations Layer
4. Evidence Layer
5. Industry Modules
6. Internal R&D

## Unified Naming Index

| Legacy / Internal Name | Industry-Standard Label | SentinelOS Category | Public / Private | Monetization Relevance | Publication Eligibility | Readiness Level |
| --- | --- | --- | --- | --- | --- | --- |
| Outcome Maker | Outcome Governance Engine | Governance Layer | Private / internal | High | Internal reference only | Pilot-ready |
| Motion Layer | Workflow Orchestration Layer | Operations Layer | Private / internal | High | Internal reference only | Pilot-ready |
| Signal Router | Event Routing / Message Bus | Operations Layer | Private / internal | High | Internal reference only | Pilot-ready |
| Vault | Secure Evidence Repository | Evidence Layer | Private / internal | High | Internal reference only | Pilot-ready |
| Nexus | Client Operations Portal | Operations Layer | Private / internal | Medium | Internal reference only | Pilot-ready |
| SENTINEX | Execution Control Framework | Core Platform / Governance Layer | Private / internal | High | Internal reference only | Pilot-ready |
| SSAI | AI Services Layer | Internal R&D | Private / internal | Medium | Internal reference only | R&D only |
| HERGLASS | Perception Face Plane | Internal R&D / Face Plane | Private / internal | Medium | Internal reference only | R&D only |
| OpenAI Face Plane | AI Services Face Plane | Internal R&D / Face Plane | Private / internal | Medium | Internal reference only | Internal pilot |
| DOE-T2-CDT-001 | DOE Compliance & Reporting Face Plane | Internal R&D / Face Plane | Private / internal | Medium | Internal reference only | Controlled draft / hold pending validation |
| Contract Reclamation | Operational Upgrade Faceplane | Industry Modules / Face Plane | Private / internal | Medium | Internal reference only | Review complete / runtime not ready |

## Public-facing statement

- SentinelOS is the public brand.
- All external messaging, product descriptions, and proof surfaces must refer to the platform as **SentinelOS**.
- Internal names such as `Outcome Maker`, `Motion Layer`, `Signal Router`, `Vault`, `Nexus`, `SENTINEX`, `SSAI`, `HERGLASS`, and `Contract Reclamation` are internal architecture or concept labels only.

## Classification by Publication Status

### Public now

- SentinelOS
- SentinelOS Core Platform
- SentinelOS Governance Layer
- SentinelOS Operations Layer
- SentinelOS Evidence Layer
- SentinelOS Industry Modules (when described generically, not by internal code names)

### Private / internal

- Outcome Governance Engine
- Workflow Orchestration Layer
- Event Routing / Message Bus
- Secure Evidence Repository
- Client Operations Portal
- Execution Control Framework
- AI Services Layer
- Perception Face Plane
- Contract Recovery & Obligation Management

### Pilot-ready

- OwnerFi pilot surface plane (SentinelOS deployment case)
- Outcome Governance Engine
- Workflow Orchestration Layer
- Event Routing / Message Bus
- Secure Evidence Repository
- Client Operations Portal
- Contract Recovery & Obligation Management

### R&D only

- AI Services Layer
- Perception Face Plane
- Face Plane SDK and docking protocol extensions

### Deprecated / hold

- All legacy working titles not converted to industry-standard labels
- Any product names that imply a separate product outside SentinelOS
- Old demo-only labels that are not part of a current pilot surface plane

## Face plane attachment and processing summary

The current face plane review covers the two defined SentinelOS face planes in this phase.

- Face plane role: Perception Face Plane
- Internal codename: HERGLASS
- Plan reference: `docs/HERGLASS_FACEPLANE_PLAN.md`
- Public status: internal only
- Operational readiness: R&D / concept plan
- Attachment purpose: preserve the face plane as a controlled interaction layer without extending public branding beyond SentinelOS
- Face plane processing outcome: reviewed and deferred to Phase 2; internal-only status confirmed for HERGLASS
- Current gating: remain in concept/roadmap posture until an approved pilot or Phase 2 activation trigger is present

- Face plane role: AI Services Face Plane
- Internal codename: OpenAI Face Plane
- Plan reference: `docs/OPENAI_FACEPLANE_PLAN.md`
- Public status: internal only
- Operational readiness: internal pilot validation
- Attachment purpose: prove governed AI execution as a SentinelOS-managed surface without creating a separate external product narrative
- Face plane processing outcome: reviewed as an internal pilot candidate; maintains SentinelOS-only public branding
- Current gating: continue as an internal governance lab pilot candidate; advance only after faceplane SDK/docking validation and explicit internal approval

## Processed face planes

The SentinelOS face plane review has now processed both current candidates.

- HERGLASS is confirmed as the Phase 2 Perception Face Plane. It is deferred, internal-only, and held as a controlled intent input concept rather than a runtime execution surface.
- OpenAI Face Plane is confirmed as an internal AI Services Layer pilot. It is treated as an internal validation plane, bound to the Face Plane SDK and docking doctrine, and should not be externalized or rebranded beyond SentinelOS.
- DOE-T2-CDT-001 is recorded as a DOE Compliance & Reporting Face Plane control input. It is internal-only, held pending validation, and must not be treated as filed, release-ready, externally distributable, or operationally approved.
- Contract Reclamation is reframed as an Operational Upgrade Faceplane for internal review. The current review found registry and handler drift, and an alignment plan now exists. Runtime activation is not ready and requires separate implementation authority.

## DOE compliance face plane control input

- Face plane role: DOE Compliance & Reporting Face Plane
- Control input reference: `docs/DOE_T2_CDT_001_FACEPLANE_CONTROL_INPUT_2026-05-31.md`
- Fixture reference: `fixtures/faceplanes/doe-compliance-faceplane.json`
- Document ID: `DOE-T2-CDT-001`
- Document title: `EPCRA Tier II Reporting Year 2025 Submission Compliance Review Checklist`
- Current disposition: Hold Pending Validation
- Submission authorization: Pending Approval
- Release readiness: Not Authorized
- Distribution authorization: Not Authorized
- Publication eligibility: Internal reference only
- External release: Prohibited
- Regulatory submission: Prohibited

This face plane material is a controlled input for drafting, review, governance, and compliance-gap analysis only. It does not represent actual validation against DOE records, Hanford source documents, EPA IDs, contacts, inventories, approvals, or any external document-management system.

## Contract reclamation operational upgrade review

- Face plane role: Operational Upgrade Faceplane
- Internal legacy label: `contractreclamation`
- Review reference: `docs/CONTRACT_RECLAMATION_FACEPLANE_BEFORE_AFTER_REVIEW_2026-05-31.md`
- Alignment plan reference: `docs/CONTRACT_RECLAMATION_FACEPLANE_ALIGNMENT_PLAN_2026-05-31.md`
- Current disposition: Review complete, implementation held
- Runtime readiness: Not ready
- Current drift:
  - surface registry references a missing `contractReclamation` handler module
  - dispatch expects a registry getter that is not exported by the current registry file
  - no contract upgrade mock runner or faceplane fixture is present in the current checkout
- Preferred operator-facing language: Operational Upgrade
- Publication eligibility: Internal reference only

This lane should enhance the existing operator motion by adding governance, evidence, approval, drift visibility, and receipts without making the user operate a different system. The recommended next path is docs-only Operational Upgrade alignment; runtime changes require a separate implementation authority decision.

## Executive alignment

This index supports the SentinelOS governance operating model by:

- enforcing one public brand: SentinelOS
- preserving internal architecture labels as non-public terminology
- clarifying monetization readiness for each concept
- separating pilot-ready surface planes from R&D-only work
- anchoring all legacy naming under the SentinelOS platform categories

## Notes

- OwnerFi remains a pilot and proof case, not a standalone public product name.
- Any old system name that is not directly translated to an industry-standard concept should be treated as internal only and kept out of public communication.
- The most important public message is: SentinelOS is the operational governance layer for AI-assisted execution.
