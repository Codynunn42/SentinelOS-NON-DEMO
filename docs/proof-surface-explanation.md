# Proof Surface Explanation

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

The SentinelOS proof surface exists to make operational legitimacy observable.

The proof path is designed to show that a review-held governed runtime surface can present a business-facing workflow while preserving health checks, no-key boundaries, audit protection, and bounded rehearsal behavior.

## Proof Expectations

Before external use, proof must be refreshed against the current runtime.

Required checks:

```yaml
health_200: required
proof_200: required
no_key_audit_401: required
clean_no_key_proof_rehearsal: required
buyer_safe_language_confirmed: required
publication_share_approval: required
```

The current recorded proof pattern is `/health` 200, `/proof` 200, no-key `/v1/audit` 401, and a clean no-key proof rehearsal. That evidence supports bounded demonstrability only; it does not activate runtime authority or external sharing authority.

## Freshness Rule

Proof freshness does not last indefinitely.

Rerun proof checks when:

- runtime changes
- deployment changes
- governance changes
- claims change
- the external meeting occurs after the freshness window
- audience pressure increases

## Non-Authorization

Proof confirms runtime behavior for a bounded purpose. It does not authorize publication, deployment, billing, funnel activation, pilot activation, runtime mutation, or expanded claims.
