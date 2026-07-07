# Tier Trial Auto-Revert Policy - 2026-07-06

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Mode:** tier-trial policy, SINTENEX-routed, review-held
**Tier Registry:** `apps/sentinel/src/tiers/tierRegistry.js`
**Runtime Upgrade Selection:** `docs/OWNER_RUNTIME_UPGRADE_SELECTION_RESULT_2026-07-06.md`
**External Use:** held
**Authority Created:** false

## Purpose

Define how tier trials should work so users can experience upgrades without
surprise billing, forced conversion, or losing their prior tier.

The rule is simple: a tier trial is temporary, reversible, and user-selected.
It does not make the user billable unless the user explicitly chooses to
continue under separately approved commercial terms.

## Trial Rule

```yaml
tier_trial_policy:
  trial_duration_days: 30
  prompt_before_expiry_days: 5
  automatic_revert_to_prior_tier: true
  revert_when_user_does_not_continue: true
  paid_continuation_requires_explicit_user_selection: true
  automatic_paid_conversion: prohibited
  surprise_billing: prohibited
  checkout_activation: held
  pricing_publication: held
  SINTENEX_commercial_review_required_before_paid_continuation: true
  authority_created: false
```

## Eligible Trial Tiers

| Tier | Trial Availability | Trial Boundary |
| --- | --- | --- |
| `PUBLIC` | Available as baseline or return tier | May be restored automatically after higher-tier trial ends. |
| `ENTERPRISE` | Available for 30-day trial | Trial entitlements expire unless user explicitly continues. |
| `GOVERNMENT` | Available only as governed evaluation | Requires scope and compliance review before trial access. |
| `SOVEREIGN` | Available only as evaluation package or controlled review | Air-gapped/perpetual-license terms remain separate; no automatic subscription conversion. |

## Trial Lifecycle

```yaml
trial_lifecycle:
  start:
    - record_prior_tier
    - record_trial_tier
    - record_trial_start
    - record_trial_end
    - record_prompt_at_day_25
    - record_no_billing_authority
  day_25_prompt:
    - notify_user_trial_ends_in_5_days
    - present_continue_or_revert_options
    - state_that_no_payment_occurs_without_user_selection
  day_30_end:
    if_user_selected_continue:
      - route_to_SINTENEX_commercial_review
      - require_approved_terms_before_billable_service
    if_user_did_not_select_continue:
      - automatically_restore_prior_tier
      - preserve_receipts_and_audit_history
      - record_reversion_receipt
  authority_created: false
```

## User-Facing Trial Language

Approved trial language:

```text
You can try this tier for 30 days. Five days before the trial ends, Executive
Desk will prompt you to continue or return to your prior tier. If you do not
choose to continue, the trial ends and your account returns to the prior tier.
No paid service starts unless you explicitly select it.
```

Support clarification:

```text
Executive Desk support is available to help you understand the trial features,
receipts, evidence, and next-step choices. Support does not create a billing
commitment, SLA, staffed coverage obligation, production support obligation, or
automatic paid conversion.
```

## Auto-Revert Requirements

```yaml
auto_revert_requirements:
  prior_tier_snapshot_required: true
  trial_entitlement_expiry_required: true
  five_day_prompt_required: true
  explicit_continue_selection_required: true
  no_continue_means_revert: true
  receipts_and_audit_history_preserved: true
  user_data_handling_review_required_before_any_destructive_change: true
  authority_created: false
```

Auto-revert means the trial entitlement returns to the prior tier. It must not
delete receipts, audit history, or evidence. Any destructive data handling
requires a separate review and approval path.

## SINTENEX Alert Hooks

```yaml
sintenex_trial_alerts:
  trial_started:
    decision_state: active_trial_no_billing
  trial_prompt_due:
    day: 25
    decision_state: user_continue_or_revert_prompt_required
  trial_expiring:
    day: 30
    decision_state: continue_selection_or_auto_revert
  trial_reverted:
    decision_state: prior_tier_restored
  trial_continuation_requested:
    decision_state: SINTENEX_commercial_review_required
  authority_created: false
```

These hooks are policy hooks only. They are not an active scheduler and are not
currently wired into a live timed-event runtime.

## Billing Boundary

```yaml
trial_billing_boundary:
  trial_is_not_paid_service: true
  trial_start_does_not_activate_checkout: true
  trial_start_does_not_create_subscription: true
  trial_continuation_requires_user_selection: true
  user_selection_routes_to_commercial_review: true
  commercial_review_required_before_checkout_or_contract: true
  automatic_paid_conversion: prohibited
  surprise_billing: prohibited
  authority_created: false
```

## Non-Authorization

This policy does not authorize staging, commit, push, deployment, runtime
mutation, Azure mutation, scheduler activation, timed-event execution, external
publication, public GPT Builder mutation, tunnel reuse, live billing, checkout
activation, pricing publication, customer production execution, customer
contact, customer onboarding, SINTENEX implementation, Gate 9 v2 implementation,
file movement, cleanup, release, SLA commitments, response-time commitments, or
production support commitments.
