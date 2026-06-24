# Sovereign Key Management Implementation Manifest - 2026-06-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Processed Gate:** `PREPARE_EXACT_SOVEREIGN_KEY_MANAGEMENT_IMPLEMENTATION_MANIFEST`  
**Mode:** exact implementation-design manifest only  
**Authority Created:** false

## Objective

Translate the approved Sovereign key-management and license-lifecycle control
direction into an exact future implementation review packet without authorizing
implementation, production key generation, license issuance, deployment,
staging, commit, push, customer contact, or external sharing.

## Current Evidence

| Area | Current State |
| --- | --- |
| Cryptographic direction | Ed25519 signing and verification candidate exists and passed focused local checks |
| Private/public authority split | supported in candidate design |
| Production signing service | unresolved |
| Named custodians | unresolved |
| Legal license terms | unresolved |
| License lifecycle implementation | unresolved |
| Compatibility contract | unresolved |
| Production key generation | held |
| License issuance | held |

## Exact Future Implementation Scope

```yaml
implementation_scope:
  code_candidates:
    - apps/sentinel/src/sovereign/sovereignLicense.js
    - apps/sentinel/src/sovereign/sovereignBoot.js
    - scripts/generate-sovereign-license.js
    - scripts/generate-sovereign-keypair.js
    - scripts/check-sovereign-license.js
    - package.json
  docs_and_operating_records:
    - docs/SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN_2026-06-17.md
    - docs/SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN_APPROVAL_RESULT_2026-06-17.md
    - docs/SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN_REVIEW_RESULT_2026-06-17.md
    - docs/ED25519_KEY_MANAGEMENT_AND_COMPATIBILITY_REVIEW_2026-06-17.md
    - docs/SOVEREIGN_KEY_MANAGEMENT_IMPLEMENTATION_MANIFEST_2026-06-17.md
```

## Required Design Decisions Before Code Approval

```yaml
required_decisions:
  signing_service:
    required: true
    acceptable_targets:
      - managed_non_exportable_signing_service
      - approved_HSM_or_equivalent_dual_control_offline_ceremony
    prohibited_targets:
      - plaintext_private_key_stdout
      - repository_stored_private_key
      - CI_or_runtime_environment_private_key
      - buyer_accessible_private_key
  custodian_model:
    required: true
    minimum:
      - executive_authority
      - license_scope_approver
      - signing_operator_or_service_identity
      - delivery_custodian
      - auditor
  legal_terms:
    required: true
    minimum:
      - organization_scope
      - deployment_scope
      - transfer_terms
      - updates_and_support_terms
      - offline_revocation_limitations
      - export_control_review
  compatibility:
    required: true
    minimum:
      - v1_to_v2_schema_policy
      - HMAC_rejection_or_migration_window
      - SENTINEL_LICENSE_KEY_public_key_semantic_contract
      - key_rotation_window
  lifecycle_records:
    required: true
    minimum:
      - draft
      - approved_for_signing
      - issued
      - active
      - superseded
      - suspended
      - revoked
      - expired
      - retired
```

## Proposed Code Direction For Future Review

```yaml
future_code_direction:
  schema:
    target: sovereign-license:v2
    add_required_fields:
      - schemaVersion
      - licenseId
      - licenseState
      - issuedTo.organizationId
      - issuedTo.legalName
      - deployment.deploymentId
      - deployment.environment
      - product.productId
      - product.edition
      - product.allowedVersions
      - rights.perpetualRuntimeRight
      - rights.updatesThrough
      - keyId
      - revocationSequence
      - signatureAlgorithm
      - signature
  verifier:
    fail_closed_on:
      - unknown_schemaVersion
      - unknown_signatureAlgorithm
      - unknown_keyId
      - missing_required_fields
      - malformed_dates
      - unknown_capabilities
      - revoked_or_superseded_license_state
      - unsupported_version_or_deployment_scope
  generator:
    remove_or_hold:
      - plaintext_private_key_generation_for_production
      - stdout_private_key_output
    require:
      - approved_payload_digest
      - explicit_keyId
      - approved_capability_allowlist
      - lifecycle_receipt
```

## Verification Matrix For Future Implementation

| Check | Required Result |
| --- | --- |
| `check:sovereign-license` | validates Ed25519 success and negative paths |
| malformed license schema | fails closed |
| unknown `keyId` | fails closed |
| unknown capability | fails closed |
| retired or revoked license state | fails closed |
| unsupported algorithm | fails closed |
| duplicate license ID | rejected before signing |
| payload digest mismatch | signing blocked |
| stdout private-key output | absent from production path |
| sovereign boot invalid license | exits before runtime acceptance |
| rotation window | verifies only approved active keys |
| revocation bundle rollback | rejected |
| reissue lineage | preserved without overwriting prior license |

## Exact Exclusions

```yaml
excluded_from_this_gate:
  - implementation_code_changes
  - production_key_generation
  - test_key_generation_for_delivery
  - buyer_license_generation
  - license_issuance
  - runtime_activation
  - deployment
  - staging
  - commit
  - push
  - customer_contact
  - external_sharing
```

## Processing Result

```yaml
implementation_manifest_result:
  processed_gate: PREPARE_EXACT_SOVEREIGN_KEY_MANAGEMENT_IMPLEMENTATION_MANIFEST
  result: exact_manifest_prepared
  implementation_readiness: not_supported_until_required_decisions_resolved
  production_key_generation: held
  license_issuance: held
  next_gate: REVIEW_EXACT_SOVEREIGN_KEY_MANAGEMENT_IMPLEMENTATION_MANIFEST
  after_review_gate: APPROVE_OR_HOLD_SOVEREIGN_KEY_MANAGEMENT_IMPLEMENTATION
  implementation_authority: false
  runtime_mutation_authority: false
  staging_authority: false
  commit_authority: false
```

## Non-Authorization

This manifest prepares the exact future implementation review packet. It does
not authorize implementation, key generation, license issuance, deployment,
staging, commit, push, customer contact, external sharing, or legal acceptance.
