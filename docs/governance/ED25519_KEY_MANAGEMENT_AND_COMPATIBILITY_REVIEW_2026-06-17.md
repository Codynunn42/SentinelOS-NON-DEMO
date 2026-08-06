# Ed25519 Key Management And Compatibility Review - 2026-06-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Processed Lane:** `REVIEW_ED25519_KEY_MANAGEMENT_AND_COMPATIBILITY_PLAN`  
**Mode:** substantive internal review  
**State:** cryptographic direction supported; operationalization incomplete  
**Authority Created:** false

## Evidence

The current candidate uses Node.js `crypto.sign` and `crypto.verify` with
Ed25519. Local verification on Node.js `v20.19.6` passed:

- valid licenses verify with the corresponding public key;
- a different public key is rejected;
- a modified `issuedTo` value is rejected;
- HMAC sovereign-license signatures are rejected as unsupported;
- a missing private key prevents license generation.

The candidate correctly separates signing and verification authority:

- `SENTINEL_LICENSE_SIGNING_KEY` contains the private signing key;
- `SENTINEL_LICENSE_KEY` contains the buyer-distributable public key;
- sovereign boot fails closed when a license cannot be verified.

No production keypair, buyer license, sovereign deployment, live sovereign boot,
or external delivery was generated or verified.

## Substantive Summary

The Ed25519 change resolves the original cryptographic design defect. A buyer
with only the public verification key cannot mint valid licenses. This is a
material improvement over the prior symmetric HMAC model.

The candidate is not yet an operational key-management system. The current
keypair helper prints the private key to stdout, which is unsuitable for
production because terminal history, CI logs, screen capture, or redirected
output could expose the signing key. The generation script accepts a multiline
private key through an environment variable, but no approved secret-store,
signing-service, custody, access-control, backup, recovery, rotation, or
destruction procedure is defined.

Compatibility is intentionally breaking for previously generated HMAC sovereign
licenses: they return `LICENSE_SIGNATURE_ALGORITHM_UNSUPPORTED`. This is safe
while no sovereign licenses have been issued, but a migration policy must exist
before any future algorithm change. The environment variable name
`SENTINEL_LICENSE_KEY` is retained while its meaning changes from a shared HMAC
secret to an Ed25519 public key; deployment and operator instructions must make
that semantic change explicit.

The current license schema also lacks lifecycle controls. It has no signing-key
identifier, expiration date, revocation status, organization identifier beyond
free-text `issuedTo`, deployment binding, or allowed-version constraints.
Capabilities are signed, but there is no canonical capability allowlist in the
license module.

## Findings

| Severity | Finding | Impact |
| --- | --- | --- |
| High | Keypair helper prints the private key to stdout | Production use could disclose the signing key |
| High | No approved private-key custody, signing, rotation, recovery, or destruction procedure | License issuance cannot be governed safely |
| High | No revocation or expiration mechanism | A compromised or withdrawn license cannot be invalidated offline through the current model |
| Medium | No `keyId` or signing-key version in the license | Rotation and multi-key verification cannot be managed cleanly |
| Medium | HMAC licenses are rejected without a migration path | Future algorithm transitions could strand issued licenses |
| Medium | `SENTINEL_LICENSE_KEY` changes semantic type without an explicit compatibility contract | Operators may supply the wrong key material |
| Medium | No organization/deployment/version binding beyond free-text fields | License scope enforcement remains limited |
| Medium | No canonical capability allowlist | Unsupported capability labels can be signed and accepted |
| Low | Focused checks do not cover malformed PEM, malformed base64, duplicate license IDs, or sovereign boot integration | Negative-path proof remains incomplete |

## Support Checklist

```yaml
support_checklist:
  private_key_custody:
    status: required
    support_needed:
      - approved_secret_store_or_signing_service
      - named_custodian_and_secondary_control
      - access_logging_and_least_privilege
      - backup_recovery_and_destruction_procedure
  key_generation:
    status: unsafe_for_production
    support_needed:
      - replace_stdout_private_key_output
      - define_offline_or_managed_generation_ceremony
      - record_public_key_fingerprint
  rotation_and_compatibility:
    status: required
    support_needed:
      - add_keyId_or_signing_key_version
      - define_multi_key_verification_window
      - define_algorithm_migration_policy
      - document_SENTINEL_LICENSE_KEY_semantic_change
  license_lifecycle:
    status: required
    support_needed:
      - decide_expiration_and_update_rights
      - define_offline_revocation_or_reissue_model
      - bind_license_to_approved_organization_and_deployment_scope
      - define_duplicate_license_id_control
  capability_control:
    status: required
    support_needed:
      - define_canonical_capability_allowlist
      - reject_unknown_capabilities
  verification:
    status: partially_supported
    support_needed:
      - malformed_key_and_signature_tests
      - sovereign_boot_integration_test
      - key_rotation_compatibility_test
      - offline_reissue_and_revocation_scenario_test
```

## Interpretation

The cryptographic primitive and public/private separation are suitable for the
Sovereign Tier direction. The current candidate should remain approved for
internal review, but it should not advance to production key generation,
license issuance, deployment, or external claims until the operational
key-management and license-lifecycle controls are designed and approved.

## Conclusion

```yaml
lane_result:
  cryptographic_direction: supported
  operational_key_management: incomplete
  compatibility_contract: incomplete
  production_readiness: not_supported
  license_issuance: held
  recommended_next_decision: REQUEST_SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN
  authority_created: false
```

## Next Decision

`REQUEST_SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN`

This next decision authorizes preparation of a design and control plan only. It
does not authorize code changes, key generation, license issuance, deployment,
staging, commit, push, or external use.
