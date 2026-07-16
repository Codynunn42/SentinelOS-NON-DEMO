# Sentinel Sovereign Air-Gapped License Offer - Draft - 2026-07-02

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** review-held collateral draft  
**Governing Source:** `docs/governance/SOVEREIGN_BUYER_PACKAGE_INTAKE_RECONCILIATION_2026-06-11.md`  
**External Use:** held  
**Authority Created:** false

## Purpose

This draft separates the Sentinel Sovereign air-gapped license from managed
partnership, support, continuity, pricing, and procurement claims. It is not a
buyer-specific proposal, sales commitment, SLA, certification statement, or
authority to issue a license.

## Offer Boundary

Sentinel Sovereign is proposed as a one-time, air-gapped license for a
self-contained SentinelOS deployment operated inside the licensee's own
environment.

The base license draft includes only:

- a licensed SentinelOS runtime package;
- a signed sovereign license file;
- a public license verification key;
- deployment documentation;
- a governance policy pack;
- offline license verification with no required Nunn Cloud platform connection.

The base license draft excludes:

- managed service delivery;
- dedicated account management;
- recurring executive engagement;
- availability or response-time commitments;
- incident-response, continuity, or recovery commitments;
- automatic updates;
- source-code rights;
- certification, government approval, or compliance-by-default claims;
- pricing acceptance;
- buyer-specific SOW or procurement submission.

## Air-Gapped License Position

```yaml
sovereign_air_gapped_license:
  deployment_model: licensee_operated_air_gapped_environment
  platform_dependency_after_delivery: none_claimed
  call_home_requirement: none_claimed
  managed_service_commitment: excluded_from_base_license
  support_commitment: separate_contract_required
  continuity_commitment: separate_policy_and_contract_required
  updates: separate_licensed_release_or_contract_required
  source_rights: separate_source_license_required
  buyer_specific_claims: held
  external_use: held
  authority_created: false
```

## License Verification Direction

Current review material supports an Ed25519 license-signature candidate for
internal review. The intended boundary is:

- Nunn Cloud retains signing authority.
- The licensee receives public verification material only.
- License verification occurs locally in the air-gapped environment.
- The public verification key must not create signing authority.

No production signing key, production license, or license issuance authority is
created by this draft.

## Approved Language For Internal Drafting

Use:

- "proposed air-gapped license";
- "self-contained licensed deployment";
- "offline license verification";
- "support, updates, continuity, and source rights require separate approval and
  contract";
- "external use held pending legal, commercial, and evidence review."

Do not use:

- language implying an identified buyer, sale, award, commitment, procurement
  submission, or customer reference;
- availability percentages or response-time promises;
- "certified", "government approved", "compliant by default", or equivalent
  certification language;
- bundled support or continuity language as part of the base license;
- final pricing, discount, or procurement-ready language.

## Review Requirements

Before this draft can become external collateral:

1. Legal review must approve the license agreement structure.
2. Commercial review must approve pricing and packaging.
3. Security review must accept the signature model and key-management controls.
4. A delivery procedure must be verified for the intended deployment package.
5. Any buyer-specific proposal must be produced from verified buyer intake.

## Current Holds

```yaml
current_holds:
  external_use: held
  buyer_specific_proposal: held
  license_issuance: held
  production_key_generation: held
  pricing_publication: held
  SLA_or_response_time_commitment: held
  certification_or_government_approval_claim: held
  managed_partnership_commitment: held
  support_or_continuity_commitment: held
  source_code_rights: held
  staging_commit_push: held
  authority_created: false
```

