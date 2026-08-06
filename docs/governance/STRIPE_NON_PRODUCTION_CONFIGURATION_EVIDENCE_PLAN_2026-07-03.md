# Stripe Non-Production Configuration Evidence Plan - 2026-07-03

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** evidence plan, review-held  
**Distribution:** Internal  
**External Use:** held  
**Authority Created:** no live payment authority

## Purpose

Define the evidence required before live Stripe checkout activation or live
payment collection can be considered by the owner.

This is a non-production evidence plan only. No secret values are recorded in
this document.

## Current State

```yaml
live_payment_collection: not_approved
checkout_configuration: not_ready
missing_configuration:
  - SENTINEL_STRIPE_CHECKOUT_ENABLED
  - STRIPE_PUBLISHABLE_KEY
  - STRIPE_PRICE_ID
current_allowed_work:
  - prepare_test_mode_configuration_plan
  - verify_readiness_endpoints
  - collect_non_secret_evidence
```

## Required Non-Production Evidence

| Evidence Item | Required Result |
| --- | --- |
| Checkout config readiness | Non-production config reports ready when test values are supplied |
| Checkout session creation | Test-mode session creation succeeds without live payment collection |
| Revenue readiness endpoint | Reports ready-held state without claiming live billing is active |
| Audit / approval receipt | Checkout attempt and approval boundary are recorded |
| Disable path | Evidence shows checkout can remain disabled or be turned off |
| Mission Control label | Remains commercial trigger review until live activation is approved |

## Validation Commands

```yaml
commands:
  - npm run check:revenue-readiness
  - npm run check:stripe-checkout
expected_current_result: not_ready_until_non_production_stripe_configuration_is_supplied
secret_handling: do_not_commit_or_record_secret_values
```

## Current Script Boundary

The existing local Stripe validation scripts intentionally force checkout into
disabled/held mode before checking the surface. They currently verify that:

- checkout UI routes render without leaking secret keys;
- `/billing/checkout/config` reports `not_ready`;
- checkout session creation returns `503 BLOCKED`;
- approval metadata is present;
- live payment collection is not enabled.

To collect true sandbox activation evidence later, a separate test-restricted
check must be prepared or run with approved sandbox configuration values. Do
not use live keys or record secret values.

```yaml
required_for_future_sandbox_evidence:
  - SENTINEL_STRIPE_CHECKOUT_ENABLED=test_only
  - STRIPE_PUBLISHABLE_KEY=pk_test_or_non_secret_test_reference
  - STRIPE_PRICE_ID=price_test_reference
  - STRIPE_SECRET_KEY=test_secret_supplied_only_in_local_env_not_committed
mission_control_language:
  required_lane: SINTENEX Commercial Trigger Review
  prohibited_until_owner_approval:
    - active_billing
    - live_checkout
    - public_pricing_active
```

## Future Approval Gate

```yaml
future_gate: AUTHORIZE_LIVE_PAYMENT_COLLECTION
owner_review_required: true
minimum_evidence_before_owner_review:
  - non_production_checkout_config_ready
  - test_mode_checkout_session_created_successfully
  - revenue_readiness_endpoint_ready_held_for_owner_activation
  - audit_receipt_created
  - live_payment_non_authorization_still_present_until_owner_approval
```

## Non-Authorization

This plan does not authorize Stripe activation, live checkout, customer payment
collection, active pricing publication, production deployment, secret changes,
Azure mutation, staging, commit, or push.
