# Sovereign Key Management And License Lifecycle Control Plan - 2026-06-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Requested Lane:** `REQUEST_SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN`
**Mode:** design and control planning only
**State:** prepared for approval
**Authority Created:** false

## Authority Boundary

This plan defines the controls required before Sovereign license issuance can
be considered. It does not authorize code changes, production key generation,
license issuance, deployment, staging, commit, push, customer delivery, or
external claims.

## Evidence

The reviewed Ed25519 candidate separates private signing authority from public
verification authority and passes focused local verification. It does not yet
provide a production key-management or license-lifecycle system.

Current control deficiencies are:

- the keypair helper prints the private key to stdout;
- no approved key custodian, signing service, dual-control procedure, recovery
  process, rotation procedure, or destruction process exists;
- licenses contain no `keyId`, controlled organization identifier, deployment
  binding, expiration or update-rights boundary, or revocation reference;
- the verifier accepts signed capability labels without a canonical allowlist;
- offline deployments have no defined revocation, replacement, or reissue
  process;
- the HMAC-to-Ed25519 and future algorithm migration contracts are undefined.

No production signing key, buyer license, sovereign deployment, or external
delivery exists.

## Control Objective

Nunn Cloud must be able to prove that:

1. only an approved signing process can issue a Sovereign license;
2. private signing keys are never exposed to operators, logs, source control,
   deployment environments, or buyers;
3. every issued license is uniquely attributable, scoped, reproducible,
   auditable, and governed through its full lifecycle;
4. a buyer can verify licenses fully offline using approved public material;
5. key rotation and license replacement do not silently broaden authority;
6. loss, compromise, withdrawal, or contract change has a documented response.

## Target Trust Model

```yaml
trust_model:
  root_authority:
    owner: Nunn_Cloud
    function: approve_sovereign_signing_keys_and_lifecycle_policy
    routine_signing_use: prohibited
  active_license_signing_key:
    function: sign_approved_license_records
    custody: managed_non_exportable_signing_service_or_approved_offline_HSM
    operator_private_key_access: prohibited
  buyer_verification_bundle:
    contents:
      - approved_public_verification_keys
      - key_identifiers_and_fingerprints
      - signed_license
      - optional_signed_revocation_bundle
    signing_authority: none
  governance_record:
    function: record_approval_issuance_delivery_reissue_revocation_and_retirement
    private_key_material: prohibited
```

The production design should prefer a non-exportable signing key in a managed
signing service or approved HSM. A file-based private key is not an accepted
production target. If an offline ceremony is required, it must use encrypted
removable media, dual control, documented custody, and verified destruction of
temporary material.

## Key Management Controls

### Key Generation Ceremony

Before generation:

- approve the signing purpose, algorithm, key version, custodian, backup model,
  and authorized signing workflow;
- assign a unique `keyId`, such as `sovereign-license-ed25519-2026-01`;
- require two authorized people for generation or activation;
- create a ceremony record with date, participants, system identity, and
  approval receipt.

During generation:

- generate Ed25519 material inside the approved signing boundary;
- prohibit private-key output to stdout, filesystems, environment variables,
  CI logs, shell history, screenshots, or chat;
- export only the public key and its SHA-256 fingerprint;
- validate that the public key verifies a test signature.

After generation:

- record the public key, fingerprint, `keyId`, activation date, permitted use,
  and status;
- confirm access logging and alerting;
- complete recovery testing without exporting plaintext private key material;
- destroy all temporary test and ceremony material under dual control.

### Custody And Access

```yaml
custody_controls:
  private_key_export: prohibited
  routine_human_private_key_access: prohibited
  signing_access:
    authentication: MFA_required
    authorization: approved_signing_role
    approval: dual_control_required_for_production_issuance
    scope: sign_only
  audit:
    required_fields:
      - request_id
      - approver_ids
      - key_id
      - license_id
      - payload_digest
      - timestamp
      - outcome
  recovery:
    method: approved_service_recovery_or_dual_control_backup
    test_frequency: annual_and_before_first_issuance
  destruction:
    method: cryptographic_destruction_and_provider_confirmation
    evidence: required
```

No application runtime, buyer deployment, developer laptop, repository, or CI
job should receive the production private signing key.

### Rotation And Compromise

Routine rotation should create a new `keyId`, preserve prior public keys for
verification during an approved transition window, and prohibit new signing
with a retired key. Emergency compromise response must immediately suspend
signing, classify affected licenses, create a signed revocation or replacement
bundle under a new key, notify authorized recipients through the contractual
channel, and record all decisions.

Root or signing-key compromise must be treated as a critical incident. A new
key alone does not invalidate licenses on fully offline systems; affected
buyers must import a trusted replacement verification bundle or replacement
release.

## Proposed License Contract V2

The implementation plan should evaluate a versioned signed schema with at
least these controlled fields:

```yaml
schemaVersion: sovereign-license:v2
licenseId: SOS-YYYY-NNNN
licenseState: active
issuedAt: ISO-8601
issuedTo:
  organizationId: approved_stable_identifier
  legalName: approved_legal_name
deployment:
  deploymentId: approved_unique_identifier
  environment: production
product:
  productId: sentinelos-sovereign
  edition: standard_or_source
  allowedVersions:
    - approved_version_or_range
rights:
  perpetualRuntimeRight: true_or_false
  updatesThrough: optional_ISO_date
capabilities:
  - approved_capability
keyId: sovereign-license-ed25519-YYYY-NN
signatureAlgorithm: ed25519:v1
revocationSequence: nonnegative_integer
signature: base64_signature
```

All fields affecting authority must be included in the signed canonical
payload. Required fields, formats, and enum values must be validated before
signature verification is treated as sufficient.

## License Scope Controls

- `licenseId` must be globally unique and reserved before signing.
- `organizationId` must be stable and separately approved from display name.
- `deploymentId` must bind a license to an approved deployment scope.
- `allowedVersions` and `updatesThrough` must match the signed commercial
  agreement.
- `capabilities` must come from a versioned canonical allowlist.
- unknown fields that could affect authority must fail closed.
- duplicate, withdrawn, superseded, or revoked IDs must not be reissued.

## License Lifecycle

```yaml
license_lifecycle:
  draft:
    authority: none
    exit_gate: commercial_legal_and_scope_approval
  approved_for_signing:
    authority: one_specific_license_payload
    exit_gate: dual_control_signing
  issued:
    authority: signed_license_exists
    exit_gate: controlled_delivery_receipt
  active:
    authority: buyer_may_use_within_signed_scope
  superseded:
    authority: replacement_license_controls_future_use
  suspended:
    authority: contractual_or_incident_hold_pending_resolution
  revoked:
    authority: use_withdrawn_subject_to_offline_revocation_delivery
  expired:
    authority: only_if_signed_runtime_or_update_right_has_expired
  retired:
    authority: record_retained_no_future_use
```

Every transition requires a governance receipt. The receipt must record the
license ID, prior and new state, reason, approvers, timestamp, related key ID,
and artifact digests without recording private key material.

## Offline Revocation And Reissue

A fully air-gapped deployment cannot receive real-time revocation. The approved
model must therefore distinguish contractual revocation from locally enforced
revocation.

The recommended technical mechanism is a signed, monotonically sequenced
revocation bundle distributed through the buyer's approved offline update
process. The deployment accepts only a valid bundle signed by a trusted key and
with a sequence number higher than its current bundle. The bundle may revoke
specific license IDs, deployment IDs, or signing key IDs.

Where no offline update path exists, revocation can only be contractual until
the buyer imports a replacement artifact. That limitation must be explicit in
legal terms, security claims, and incident procedures. Perpetual runtime rights
must not be described as remotely revocable.

Reissue requires a new license ID, an explicit relationship to the superseded
license, fresh approval, and a new delivery receipt. An old license record is
never overwritten.

## Compatibility And Migration

- Treat `sovereign-license:v1` and `sovereign-license:v2` as explicit schemas.
- Document that `SENTINEL_LICENSE_KEY` is an Ed25519 public verification key,
  not the prior HMAC shared secret.
- Reject HMAC licenses unless a separately approved migration tool and bounded
  migration window exist.
- Support multiple approved public keys by `keyId` during controlled rotation.
- Reject unknown schema versions, algorithms, key IDs, and capabilities.
- Define a maximum compatibility window before every issuance.
- Require a signed migration receipt for any license replacement.

## Capability Allowlist

The canonical allowlist must be versioned, documented, and enforced during
generation and verification. Initial capability labels must be reconciled
against actual product enforcement before approval. A signed label that is not
enforced by the runtime is not a valid control.

## Required Operating Roles

| Role | Allowed Action | Prohibited Action |
| --- | --- | --- |
| Executive authority | approve policy, key activation, exceptional lifecycle decision | routine signing |
| License approver | approve exact buyer scope and payload digest | access private key material |
| Signing operator/service | sign only the approved payload digest | change scope or approve its own request |
| Delivery custodian | deliver approved public bundle and record receipt | issue or modify license |
| Auditor | inspect lifecycle and signing evidence | sign, approve, or deliver |

No one person should be able to approve scope, sign a production license, and
record delivery without independent review.

## Verification Plan

Before production readiness can be supported, evidence must cover:

- private key cannot be exported or printed;
- unauthorized identities cannot request signatures;
- approved signing creates the expected `keyId` and payload digest receipt;
- malformed PEM, base64, schema, timestamps, IDs, capabilities, and signatures
  fail closed;
- unknown or retired key IDs fail closed;
- duplicate license IDs are rejected;
- organization, deployment, version, and capability scope are enforced;
- Sovereign boot fails closed for invalid, revoked, or unsupported licenses;
- rotation verifies active prior licenses only within the approved window;
- revocation-bundle sequence rollback is rejected;
- reissue preserves lineage and does not overwrite the prior record;
- recovery and key-compromise exercises produce complete evidence.

## Phased Implementation Plan

| Phase | Deliverable | Exit Gate |
| --- | --- | --- |
| 1 | Approve this control plan and legal decisions | `APPROVE_SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN` |
| 2 | Exact implementation and migration manifest | `REQUEST_SOVEREIGN_LICENSE_LIFECYCLE_IMPLEMENTATION_MANIFEST` |
| 3 | Code, schema, tests, and operating-procedure review candidate | separate implementation approval |
| 4 | Non-production ceremony and end-to-end proof | separate proof acceptance |
| 5 | Production key ceremony and first-license issuance | explicit buyer-specific issuance authority |

Each gate is bounded. Approval of an earlier phase does not authorize a later
phase.

## Support Checklist

```yaml
support_checklist:
  legal_and_commercial:
    - decide_perpetual_runtime_right_and_revocation_language
    - approve_version_update_transfer_and_termination_terms
    - approve_buyer_identity_and_deployment_binding
  key_management:
    - select_non_exportable_signing_service_or_HSM
    - name_custodians_approvers_and_auditor
    - approve_generation_recovery_rotation_compromise_and_destruction_procedures
  license_lifecycle:
    - approve_v2_schema_and_state_machine
    - approve_unique_ID_registry_and_governance_receipts
    - approve_offline_revocation_bundle_and_reissue_process
  compatibility:
    - approve_keyId_and_multi_key_verification_contract
    - approve_HMAC_and_future_algorithm_migration_policy
    - document_SENTINEL_LICENSE_KEY_public_key_semantics
  product_enforcement:
    - approve_capability_allowlist
    - prove_scope_enforcement_and_fail_closed_boot
  evidence:
    - complete_negative_path_rotation_revocation_reissue_and_recovery_tests
    - produce_non_production_end_to_end_proof_packet
```

## Acceptance Criteria

This plan is ready to advance to an implementation manifest only when:

- legal and commercial decisions are recorded;
- the target signing boundary and responsible roles are approved;
- the V2 schema, lifecycle state machine, offline revocation limitation, and
  migration policy are accepted;
- every implementation item has an owner and evidence requirement;
- production key generation and license issuance remain separately held.

## Interpretation

The design can support a governed, fully offline Sovereign license model without
giving buyers signing authority. The strongest viable model combines
non-exportable signing keys, dual-control issuance, a versioned signed schema,
immutable lifecycle records, and buyer-imported signed revocation bundles.

Offline operation creates a material limitation: Nunn Cloud cannot guarantee
immediate technical revocation inside an air-gapped buyer environment. Contract
language and buyer delivery procedures must reflect that fact.

## Conclusion

```yaml
lane_result:
  plan_state: prepared_for_approval
  production_key_generation: held
  license_issuance: held
  implementation: not_authorized
  recommended_next_decision: APPROVE_SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN
  authority_created: false
```

## Next Decision

`APPROVE_SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN`

This decision would approve the control direction only and authorize preparation
of an exact implementation manifest. It would not authorize code changes, key
generation, license issuance, deployment, staging, commit, push, or external
use.
