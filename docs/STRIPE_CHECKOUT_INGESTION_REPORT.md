# Stripe Checkout Ingestion Report

Status: Ingested into SentinelOS as a governed checkout surface

Source package:

- `/Users/codynunn/Downloads/stripe-sample-code/server.rb`
- `/Users/codynunn/Downloads/stripe-sample-code/public/checkout.html`
- `/Users/codynunn/Downloads/stripe-sample-code/public/checkout.js`
- `/Users/codynunn/Downloads/stripe-sample-code/public/complete.html`
- `/Users/codynunn/Downloads/stripe-sample-code/public/complete.js`

## Sentinel Mapping

| Source sample | SentinelOS destination | Decision |
| --- | --- | --- |
| `checkout.html` | `/billing/checkout` | Ingested and rebranded |
| `checkout.js` | `/billing/stripe-checkout.js` | Ingested with env-driven publishable key |
| `complete.html` | `/billing/complete` | Ingested and rebranded |
| `complete.js` | `/billing/stripe-complete.js` | Ingested with safe status response |
| `server.rb` | `apps/api/server.js` Stripe REST routes | Reimplemented in Node |
| hardcoded `sk_test_...` | rejected | Secret must stay in Key Vault/env |
| `{{PRICE_ID}}` | `STRIPE_PRICE_ID` | Requires approved price configuration |

## Live Route Contract

Public pages:

- `GET /billing/checkout`
- `GET /billing/complete?session_id={CHECKOUT_SESSION_ID}`

Public readiness/config:

- `GET /billing/checkout/config`
- `GET /billing/checkout/readiness`

Stripe session flow:

- `POST /billing/checkout/session`
- `GET /billing/session-status?session_id=cs_...`

## Governance Boundary

Checkout is blocked until:

- `SENTINEL_STRIPE_CHECKOUT_ENABLED=1`
- `STRIPE_PUBLISHABLE_KEY` is set
- `STRIPE_SECRET_KEY` is set through Key Vault/env
- `STRIPE_PRICE_ID` is set to an approved live or test price

Safeguards now in place:

- no Stripe secret key in repo
- fixed server-side price only
- session creation is feature-flagged
- session creation and status checks are audit logged
- blocked checkout attempts create a `billing_checkout_approval` request
- proof dashboard surfaces billing as a visible governed status lane
- no raw card data touches SentinelOS

## Approval Needed

Before enabling checkout for real users, approve:

1. Product and price object in Stripe.
2. Whether the checkout runs in test mode or live mode.
3. Legal/customer-facing offer language.
4. Webhook endpoint and `STRIPE_WEBHOOK_SECRET`.
5. Post-payment fulfillment/audit rule.

## Current Status

The downloaded checkout page is ingested, but payment execution remains intentionally guarded until the approved Stripe price and checkout enable flag are configured.
