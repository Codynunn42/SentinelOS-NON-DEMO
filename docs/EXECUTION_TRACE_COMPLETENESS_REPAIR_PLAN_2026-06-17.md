# Execution Trace Completeness Repair Plan - 2026-06-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Processed Gate:** `REQUEST_EXECUTION_TRACE_COMPLETENESS_REPAIR_PLAN`  
**Mode:** bounded repair planning only  
**State:** implementation completed and focused verification passed  
**Authority Created:** false

## Evidence

The current `apps/sentinel/src/commands/dispatch.js` candidate creates a trace,
records `api` and `security`, records `execution` before handler invocation, and
completes traces for execution-guard blocks and handler results.

The following return paths do not currently complete the trace:

- signature-verification failure;
- approval-required response;
- governance-preflight block;
- unknown mock command;
- unknown tenant;
- unknown surface command.

The current candidate does not record explicit `governance`, `decision`, or
`approval` stages. No focused check directly asserts stage order, completion
across every return path, correlation-ID retrieval, or completed-trace outcome.

## Repair Objective

Every dispatched command must produce one correlation-bound trace that:

1. records the stages actually reached;
2. completes exactly once before every terminal return;
3. records a stable terminal reason and success state;
4. can be retrieved by correlation ID;
5. does not imply that a blocked request reached execution.

## Exact Repair Scope

```yaml
repair_scope:
  implementation:
    - apps/sentinel/src/commands/dispatch.js
    - apps/sentinel/src/audit/executionTrace.js
  focused_verification:
    - scripts/check-execution-trace-completeness.js
    - package.json
  reference_evidence:
    - docs/EXECUTION_TRACE_DISPATCH_READ_ONLY_REVIEW_2026-06-16.md
    - docs/EXECUTION_TRACE_COMPLETENESS_REPAIR_PLAN_2026-06-17.md
  excluded:
    - unrelated_dispatch_refactors
    - production_runtime_activation
    - external_connector_execution
    - repository_persistence
```

## Proposed Repair Design

### Terminal Completion Contract

Add one bounded dispatch-level completion helper that:

- records the terminal stage when applicable;
- completes the trace with `success`, `reason`, `statusCode`, and `command`;
- returns the existing response without changing its external contract;
- refuses or safely ignores a second completion attempt.

All six incomplete early-return paths must use the helper.

### Stage Recording Contract

```yaml
stage_contract:
  api: normalized_request_received
  security: execution_guard_and_signature_result
  governance: governance_preflight_result
  decision: policy_decision_available
  approval: approval_required_unlocked_or_not_required
  execution: handler_invocation_only
```

Blocked or approval-pending requests must not record `execution`.

### Execution Trace Integrity

`apps/sentinel/src/audit/executionTrace.js` should:

- reject or flag unknown stage names instead of recording `stageIndex: -1`;
- preserve one terminal outcome;
- expose whether completion was newly recorded or already present;
- retain existing correlation-ID retrieval behavior.

## Focused Verification Matrix

| Scenario | Required Terminal Reason | Execution Stage | Completed |
| --- | --- | --- | --- |
| Execution guard block | `execution_guard_block` | absent | yes |
| Signature failure | `signature_verification_failed` | absent | yes |
| Approval required | `approval_required` | absent | yes |
| Governance block | `governance_preflight_block` or policy reason | absent | yes |
| Unknown mock command | `unknown_mock_command` | absent | yes |
| Unknown tenant | `unknown_tenant` | absent | yes |
| Unknown surface command | `unknown_command` | absent | yes |
| Handler success | `handler_completed` | present | yes |
| Handler failure | `handler_failed` | present | yes |

The focused check must also assert:

- stage indexes are known and nondecreasing;
- a trace is retrievable by its correlation ID;
- each trace has `completedAt` and a terminal outcome;
- duplicate completion does not overwrite the first terminal outcome;
- blocked paths create an audit record where the existing audit contract
  requires one.

## Processing Result

```yaml
repair_plan_result:
  gate: REQUEST_EXECUTION_TRACE_COMPLETENESS_REPAIR_PLAN
  result: implemented_and_focused_verification_passed
  repair_scope_bounded: true
  processed_implementation_gate: APPROVE_EXECUTION_TRACE_COMPLETENESS_REPAIR_IMPLEMENTATION
  implementation_result: docs/EXECUTION_TRACE_COMPLETENESS_REPAIR_IMPLEMENTATION_RESULT_2026-06-17.md
  runtime_mutation_authority: false
  staging_authority: false
  commit_authority: false
  next_gate: APPROVE_FIXTURE_ONLY_SENTINEL_NEXUS_BHINDI_VAULT_POC_TEST_EXECUTION
```

## Non-Authorization

This plan does not authorize code implementation, runtime mutation, test
execution that requires live connectors, staging, commit, push, deployment, or
external sharing.
