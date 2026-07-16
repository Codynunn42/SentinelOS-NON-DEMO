# Task Template Check Failure Review - 2026-06-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Reviewed Gate:** `PREPARE_TASK_TEMPLATE_CHECK_FAILURE_REVIEW`
**Mode:** failure classification; repair held
**Authority Created:** false

## Evidence First

The current local verification command fails:

```bash
npm run check:task-templates
```

Observed failure:

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ '[APPROVE]'
- undefined
    at main (.../scripts/check-task-templates.js:35:10)
```

The failing assertion is:

```js
assert.strictEqual(normalized.badge, APPROVAL_BADGES.conditional);
```

The exported approval badge object currently contains:

```json
{
  "mapping_alignment": "[MAP]",
  "conditional_approval": "[APPROVE]",
  "held_review": "[HOLD]",
  "xe_assistance": "[XE]",
  "billing_checkout": "[BILLING]"
}
```

There is no `APPROVAL_BADGES.conditional` key. The current implementation
normalizes `conditional` into `conditional_approval` and assigns the badge
`[APPROVE]`.

## Related Drift Found

This review also found additional badge-contract drift that is not reached
because the first assertion stops the check:

| Surface | Current Value / Expectation | Classification |
| --- | --- | --- |
| `apps/sentinel/src/orchestration/taskTemplates.js` | `conditional_approval` badge is `[APPROVE]` | implemented value |
| `scripts/check-task-templates.js` | expects `APPROVAL_BADGES.conditional`, which is undefined | stale or invalid test key |
| `docs/governance/TASK_TEMPLATES_SYSTEM.md` | documents `conditional_approval` badge as `[APPROVE:CONDITIONAL]` | documentation mismatch |
| `apps/sentinel/src/orchestration/taskTemplates.js` | `billing_checkout` badge is `[BILLING]` | implemented value |
| `scripts/check-task-templates.js` | later expects billing badge `[APPROVE:BILLING]` | likely latent assertion failure |
| `docs/governance/TASK_TEMPLATES_SYSTEM.md` | does not list `billing_checkout` in the categories table | documentation gap |

## Interpretation Second

This is best classified as **task-template approval badge contract drift**.

The failure does not prove the Orchestrated Workflow Engine is entirely broken.
It proves the verification contract is no longer aligned with the implementation
and documentation. The check cannot currently certify the task-template system.

There are three possible repair paths, each requiring a separate exact repair
manifest:

1. Update the test to use existing implementation keys and badges.
2. Update the implementation to match the stronger documented approval badge
   language.
3. Update the implementation, test, and documentation together so the approval
   badge contract is explicit and consistent.

The third path is the safest governance repair because it resolves the test,
runtime contract, and board-facing documentation together.

## Conclusion Last

```yaml
review_result:
  gate: PREPARE_TASK_TEMPLATE_CHECK_FAILURE_REVIEW
  failure_confirmed: true
  failing_command: npm_run_check_task_templates
  failure_classification: task_template_approval_badge_contract_drift
  first_failure:
    file: scripts/check-task-templates.js
    line: 35
    assertion: normalized.badge_equals_APPROVAL_BADGES.conditional
    actual: "[APPROVE]"
    expected: undefined
  affected_surfaces:
    - scripts/check-task-templates.js
    - apps/sentinel/src/orchestration/taskTemplates.js
    - docs/governance/TASK_TEMPLATES_SYSTEM.md
  likely_latent_failure:
    billing_badge_expected_by_check: "[APPROVE:BILLING]"
    billing_badge_current_implementation: "[BILLING]"
  repair_authorized: false
  next_gate: PREPARE_EXACT_TASK_TEMPLATE_BADGE_CONTRACT_REPAIR_MANIFEST
  authority_created: false
```

## Recommended Exact Repair Scope

The next review should prepare, but not execute, a manifest covering only:

- `apps/sentinel/src/orchestration/taskTemplates.js`
- `scripts/check-task-templates.js`
- `docs/governance/TASK_TEMPLATES_SYSTEM.md`
- any directly related Executive/Board/MOB routing docs needed to record the
  repair result after execution

## Non-Authorization

This review does not authorize code repair, test edits, documentation edits
outside this review artifact, staging, commit, push, deployment, runtime
mutation, AI change, database writes, KQL, secret retrieval, file movement,
automated repair, external contact, or external sharing.
