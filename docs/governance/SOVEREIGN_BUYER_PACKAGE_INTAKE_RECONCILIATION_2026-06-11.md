 Sovereign Buyer Package Intake Reconciliation - 2026-06-11

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** review-held commercial intake reconciliation  
**State:** useful source material retained, external use held  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:REVIEW-HELD-SOVEREIGN-BUYER-PACKAGE-SOURCE]
```

The submitted Sovereign Tier prospectus, package structure, SOW outline, pricing
ladder, procurement checklist, and executive-deck outline are useful planning
inputs. They are not approved buyer-facing collateral and do not establish that
a sovereign buyer exists, that a sale occurred, or that Nunn Cloud has accepted
the proposed service commitments.

## Evidence

Current repository evidence establishes:

- `docs/sovereign/SOVEREIGN_TIER.md` defines Sentinel Sovereign as a one-time,
  fully air-gapped perpetual license with no platform connection.
- Subscription support, updates, and source access are separate from the base
  sovereign license.
- `docs/sovereign/SOVEREIGN_ATTORNEY_BRIEF.md` states that nothing has been sold
  and no sovereign licenses have been issued.
- Pricing tiers remain proposed and require legal and commercial review.
- `docs/governance/GOVERNMENT_POSITIONING.md` prohibits premature certification,
  government-approval, and compliance-by-default claims.
- Current approvals continue to hold external sharing, runtime mutation,
  staging, committing, and pushing.

## Interpretation

The submitted package combines two materially different offers:

1. **Sentinel Sovereign License**
   - buyer-operated and air-gapped
   - one-time perpetual license
   - no call-home or Nunn Cloud platform dependency
   - optional setup, support, updates, and source rights contracted separately

2. **Managed Strategic Partnership**
   - recurring executive engagement
   - dedicated escalation and account management
   - support response commitments
   - continuous improvement, reviews, integrations, and roadmap participation

These offers may coexist, but they must not be represented as one default
Sovereign Tier package. Government continuity and support readiness also require
a distinct policy and contract surface rather than reused commercial messaging.

## Original Pre-Sale Technical Blocker And Repair Candidate

The recorded implementation at intake used HMAC-SHA256 for both license
generation and verification. HMAC is symmetric: a key capable of verifying the
license is also capable of generating a valid HMAC signature.

The intake review found that the then-current documents incorrectly stated:

- the signing key and buyer verification key are different values; and
- a buyer with the verification key cannot generate new licenses.

Shipping that HMAC verification key to a buyer would also have shipped the
capability needed to forge licenses. A light-mode Ed25519 repair candidate is
now prepared in `docs/governance/SOVEREIGN_LIGHT_MODE_APPROVAL_PACKET_2026-06-11.md`.
The candidate has local focused verification evidence, but it is not approved,
persisted, deployed, or authorized for license issuance.

```yaml
sovereign_license_issuance:
  current_state: Ed25519_repair_candidate_prepared_approval_held
  original_blocker: symmetric_HMAC_key_would_enable_buyer_side_license_forgery
  required_resolution:
    - approve_or_revise_Ed25519_repair_candidate
    - complete_broader_verification_and_key_management_review
    - complete_legal_and_commercial_review
  authority_created: false
```

## Claim Reconciliation

| Submitted claim or commitment | Current support | Disposition |
|---|---|---|
| A sovereign-tier buyer has committed resources | No buyer record or issuance evidence identified | Do not claim |
| Dedicated infrastructure is included | Sovereign is buyer-operated; delivery model still requires definition | Revise |
| Data sovereignty guarantees | Air-gap direction exists; contractual guarantee does not | Hold for legal review |
| 99.9%+ availability objective | No approved SLA or supporting service model identified | Do not publish |
| One-hour critical response | No approved support contract or staffed support model identified | Do not publish |
| Certifications and independent assessments are maintained | Repository says compliance readiness is future work | Remove |
| Enhanced audit visibility and immutable/hash-chained logs | Audit direction exists; submitted wording exceeds verified proof | Narrow to verified evidence |
| Annual pricing of `$25K-$250K+` | Conflicts with current one-time sovereign model and remains unapproved | Hold |
| Customer reference objective | No authority for customer contact, publication, or reference use | Hold |
| SOW and procurement templates | Useful draft structures | Retain as internal planning inputs |

## Approved Internal Reuse Direction

The following submitted material can be reused in future review-held drafting:

- discovery questions;
- procurement package checklist;
- executive deck structure;
- SOW section structure;
- separation of security, governance, operations, and commercial review;
- explicit acceptance criteria and customer responsibilities.

Reuse must preserve evidence-qualified language and the distinction between:

- implemented capability;
- documented design direction;
- proposed contractual commitment;
- live verified operation; and
- accepted buyer-specific obligation.

## Required Buyer-Specific Intake

Before producing a buyer-facing proposal, record:

```yaml
buyer_intake:
  buyer_identity: required
  government_or_commercial_classification: required
  evidence_of_interest_or_procurement_request: required
  desired_offer:
    - sovereign_license
    - managed_strategic_partnership
    - combined_but_separately_contracted
  deployment_and_data_residency_requirements: required
  support_and_continuity_requirements: required
  compliance_and_procurement_requirements: required
  authorized_external_audience: required
```

## Next Decisions

```yaml
next_decisions:
  safest_hold:
    phrase: HOLD_SOVEREIGN_BUYER_PACKAGE_EXTERNAL_USE
    outcome: retains_source_material_without_creating_buyer_or_sales_claims

  technical_repair_review:
    phrase: REQUEST_SOVEREIGN_LICENSE_SIGNATURE_MODEL_REPAIR_PLAN
    outcome: prepares_asymmetric_signature_or_revised_trust_model_for_review

  commercial_model_review:
    phrase: REQUEST_SOVEREIGN_AND_MANAGED_PARTNERSHIP_OFFER_SPLIT
    outcome: separates_air_gapped_license_from_recurring_managed_services

  buyer_specific_drafting:
    phrase: PROVIDE_VERIFIED_SOVEREIGN_BUYER_INTAKE
    outcome: permits_review_held_buyer_specific_proposal_drafting_only

  authority_created: false
```

## Current Holds

```yaml
current_holds:
  sovereign_license_issuance: held
  buyer_existence_or_commitment_claim: held
  pricing_publication: held
  SLA_or_availability_commitment: held
  certification_or_compliance_claim: held
  external_sharing: held
  customer_contact: held
  runtime_mutation: held
  staging: held
  committing: held
  pushing: held
  authority_created: false
```

## Conclusion

The submitted package is retained as useful internal source material, but it is
not deal-ready or approved for external use. The immediate prerequisite is to
repair the sovereign license signature model and correct the related technical
claims. After that, the commercial offer should be split between an air-gapped
Sovereign License and separately contracted managed partnership, support, and
continuity services.

## Light-Mode Approval Candidate Update

```yaml
light_mode_candidate:
  packet: docs/governance/SOVEREIGN_LIGHT_MODE_APPROVAL_PACKET_2026-06-11.md
  signature_model_candidate: Ed25519
  security_overview_draft: docs/governance/SOVEREIGN_SECURITY_AND_GOVERNANCE_OVERVIEW_DRAFT_2026-06-11.md
  readiness_scorecard: docs/governance/SOVEREIGN_READINESS_SCORECARD_2026-06-11.md
  current_state: prepared_for_internal_approval_review
  license_issuance: held
  external_use: held
  staging_commit_push: held
  authority_created: false
```
