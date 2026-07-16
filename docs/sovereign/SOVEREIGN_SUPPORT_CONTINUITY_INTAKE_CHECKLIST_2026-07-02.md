# Sentinel Sovereign Support And Continuity Intake Checklist - 2026-07-02

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** review-held intake checklist  
**Governing Source:** `docs/governance/SOVEREIGN_BUYER_PACKAGE_INTAKE_RECONCILIATION_2026-06-11.md`  
**Related Draft:** `docs/sovereign/SOVEREIGN_MANAGED_PARTNERSHIP_SUPPORT_CONTINUITY_DRAFT_2026-07-02.md`  
**External Use:** held  
**Authority Created:** false

## Purpose

Collect the minimum internal inputs needed to design a separate managed
partnership, support, and continuity model for a future Sentinel Sovereign
engagement without creating an offer, SLA, continuity promise, customer contact,
pricing, or buyer-specific obligation.

## Intake Boundary

```yaml
intake_boundary:
  allowed:
    - internal planning inputs
    - support model options
    - continuity policy requirements
    - staffing and escalation assumptions
    - evidence requirements
    - legal and commercial review questions
  prohibited:
    - buyer_contact
    - external_delivery
    - service_commitment
    - SLA_or_availability_target
    - response_time_promise
    - certification_claim
    - approved_pricing
    - buyer_specific_SOW
  authority_created: false
```

## Section 1 - Offer Classification

| Field | Required Input | Current State |
| --- | --- | --- |
| Intended pairing | air-gapped license only / managed partnership only / combined but separately contracted | `unsupported_open` |
| Licensee identity | verified legal name and authority source | `unsupported_open` |
| Buyer classification | government / commercial / defense / regulated / other | `unsupported_open` |
| Internal sponsor | Nunn-side owner for planning | `unsupported_open` |
| External audience authorization | exact approved audience, if any | `held` |

## Section 2 - Managed Partnership Inputs

| Topic | Required Input | Current State |
| --- | --- | --- |
| Governance cadence | proposed review rhythm, participants, and evidence packet | `planning_needed` |
| Strategic roadmap review | scope and exclusions | `planning_needed` |
| Integration planning | systems, interfaces, and non-authorized integrations | `planning_needed` |
| Account coordination | owner roles without coverage promise | `planning_needed` |
| Escalation path design | categories and handoff map without response commitment | `planning_needed` |
| Executive reporting | report types, evidence sources, and review cycle | `planning_needed` |

## Section 3 - Support Model Inputs

| Topic | Required Input | Current State |
| --- | --- | --- |
| Supported versions | exact package/version policy | `planning_needed` |
| Intake channels | allowed channels and authentication requirements | `planning_needed` |
| Escalation categories | severity labels without time commitments | `planning_needed` |
| Maintenance windows | whether windows exist and how they are approved | `planning_needed` |
| Support exclusions | unsupported environments, customizations, and third-party dependencies | `planning_needed` |
| Licensee evidence | logs, hashes, configs, or offline bundles required for review | `planning_needed` |
| Offline updates | update-package custody and import procedure | `planning_needed` |

## Section 4 - Continuity Policy Inputs

| Topic | Required Input | Current State |
| --- | --- | --- |
| Backup responsibility split | Nunn Cloud vs licensee responsibilities | `planning_needed` |
| Restore prerequisites | licensee environment requirements and evidence | `planning_needed` |
| License reissue path | required approvals and signed artifact chain | `planning_needed` |
| Revocation or replacement bundle | offline distribution and import procedure | `planning_needed` |
| Key rotation communication | approved contact path and proof requirement | `planning_needed` |
| Environment recovery | what Nunn Cloud can and cannot assist with | `planning_needed` |
| Continuity limitations | explicit no-guarantee language for air-gapped environments | `required` |

## Section 5 - Staffing And Coverage Inputs

| Topic | Required Input | Current State |
| --- | --- | --- |
| Role map | accountable owner, reviewer, escalation reviewer, legal reviewer | `planning_needed` |
| Coverage assumptions | internal planning only, no external promise | `held` |
| Response categorization | triage labels only, no response times | `planning_needed` |
| Evidence review capacity | internal review assumption and constraints | `planning_needed` |
| Conflict or priority rules | how competing requests are reviewed | `planning_needed` |

## Section 6 - Legal And Commercial Questions

| Question | Owner | Current State |
| --- | --- | --- |
| What support language is allowed without creating implied SLA obligations? | legal | `required` |
| What continuity disclaimers are required for air-gapped deployments? | legal | `required` |
| What support exclusions must be in contract terms? | legal/commercial | `required` |
| Are updates licensed per release, subscription, or separate order? | commercial/legal | `required` |
| What buyer-specific facts are required before a SOW can be drafted? | legal/commercial | `required` |
| What pricing may be discussed internally before publication? | commercial | `required` |

## Section 7 - Evidence Checklist

```yaml
evidence_checklist:
  required_before_external_drafting:
    - verified_licensee_intake
    - approved_support_policy
    - approved_continuity_policy
    - legal_review_result
    - commercial_review_result
    - staffing_model_if_any_response_commitments_are_requested
    - exact_external_audience_authorization
  explicitly_not_required_for_internal_planning:
    - customer_contact
    - public_claim
    - production_key_generation
    - license_issuance
  authority_created: false
```

## Current Holds

```yaml
current_holds:
  external_use: held
  customer_contact: held
  managed_partnership_offer: held
  support_contract: held
  continuity_commitment: held
  SLA_or_availability_target: held
  response_time_promise: held
  certification_or_government_approval_claim: held
  pricing_publication: held
  buyer_specific_SOW: held
  license_issuance: held
  staging_commit_push: held
  authority_created: false
```

## Next Gate

```yaml
next_gate:
  phrase: COMPLETE_SOVEREIGN_SUPPORT_CONTINUITY_INTAKE
  input_type: internal_review_inputs_only
  outcome: support_and_continuity_policy_ready_for_legal_commercial_review
  does_not_authorize:
    - external_sharing
    - customer_contact
    - SLA
    - response_commitment
    - pricing
    - buyer_specific_SOW
    - license_issuance
    - staging
    - commit
    - push
  authority_created: false
```

