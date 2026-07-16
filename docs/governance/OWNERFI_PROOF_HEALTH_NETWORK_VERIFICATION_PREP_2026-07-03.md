# OwnerFi Proof Health Network Verification Prep - 2026-07-03

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Gate:** `VERIFY_CURRENT_OWNERFI_PROOF_HEALTH_BEFORE_SHARE_OR_MEETING`  
**Mode:** working-network verification prep  
**External Use:** held  
**Authority Created:** false

## Operating Directive

The freeze remains active. Live claims, feature expansion, release packaging,
external sharing, and commercial/billing/funnel movement stay held until a fresh
OwnerFi proof-health receipt is produced from a working network path.

SINTENEX/SINTINEX remains the isolated design lane for commercial trigger,
billing, funnel, renewal-timer, and future timed-event architecture. SentinelOS
remains the governance, proof, and control surface.

## Required H1 Checks

The H1 pass condition remains:

1. `GET /health`
2. `GET /proof`
3. `GET /v1/audit?tenant=ownerfi` without a key, expecting authorization denial

## Prepared Local Script

```yaml
script: scripts/check-ownerfi-proof-health-receipt.js
package_script: check:ownerfi-proof-health
default_base: https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io
requires_api_key: false
mutates_runtime: false
authority_created: false
```

The script emits a JSON receipt when all checks pass. It does not use an API key,
does not perform workflow mutation, and does not approve external sharing by
itself.

## Command For Working Network Rerun

```bash
npm run check:ownerfi-proof-health
```

Optional override:

```bash
SENTINEL_LIVE_BASE=https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io npm run check:ownerfi-proof-health
```

## Optional Protected Follow-On

The existing protected workflow script remains available only after the public
proof-health receipt exists and only with a local secret source:

```bash
SENTINEL_LIVE_API_KEY_FILE=/path/to/local/key npm run check:ownerfi-pilot-api:live
```

Do not paste API keys into chat, docs, or command history.

## Hold State

```yaml
live_claims_allowed: false_until_receipt_passes
external_share_allowed: false_until_separate_owner_decision
feature_expansion_allowed: false
commercial_trigger_lane: SINTENEX_review_held
billing_activation_allowed: false
funnel_activation_allowed: false
authority_created: false
```
