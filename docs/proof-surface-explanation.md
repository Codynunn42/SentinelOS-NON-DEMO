# Proof Surface Explanation

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

The SentinelOS proof surface exists to make operational legitimacy observable.

The proof path is designed to show that a governed runtime can present a business-facing workflow while preserving health checks, no-key boundaries, audit protection, and governance preflight behavior.

## Proof Expectations

Before external use, proof must be refreshed against the current runtime.

Required checks:

```yaml
health_200: required
proof_200: required
no_key_audit_401: required
governance_preflight_verified: required
buyer_safe_language_confirmed: required
publication_share_approval: required
```

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
