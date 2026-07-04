# Phase 1 FQDN Stability Diagnostic Result - 2026-07-03

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** read-only FQDN diagnostic, review-held  
**Distribution:** Internal  
**External Use:** selected trusted review only when paired with current proof-health receipt  
**Authority Created:** no Azure mutation authority

## Purpose

Add the requested local diagnostic for the current OwnerFi proof FQDN to check
for intermittent route dropouts after the forced revision refresh.

## Target

```yaml
base: https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io
revision: ca-nc-dev-sentinel--restore-20260703-01
diagnostic_type: repeated_read_only_route_probe
attempts_per_route: 5
timeout_ms: 10000
```

## Result

```yaml
GET /health:
  expected: 200
  observed: [200, 200, 200, 200, 200]
GET /proof:
  expected: 200
  observed: [200, 200, 200, 200, 200]
GET /v1/audit?tenant=ownerfi_without_key:
  expected: 401
  observed: [401, 401, 401, 401, 401]
dropouts_observed: false
```

Observed response timing ranged from 79ms to 430ms in this local probe.

## Interpretation

The FQDN did not show intermittent route failure during this five-cycle local
diagnostic. The Azure subscription administrative state still reports `Warned`,
so this result supports current route stability but does not remove the
subscription-admin caution.

## Non-Authorization

This diagnostic does not authorize Azure mutation, subscription/payment action,
Container App updates, DNS changes, deployment, runtime mutation, external
claims beyond owner-approved selected trusted review, staging, commit, or push.
