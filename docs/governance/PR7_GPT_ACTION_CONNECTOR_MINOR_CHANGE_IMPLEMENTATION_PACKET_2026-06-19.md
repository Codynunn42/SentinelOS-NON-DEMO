# PR7 GPT Action Connector Minor Change Implementation Packet - 2026-06-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Prepared Gate:** `PREPARE_PR7_GPT_ACTION_CONNECTOR_MINOR_CHANGE_IMPLEMENTATION_PACKET`  
**Mode:** exact implementation packet; merge-held  
**Status:** Prepared for review; CI-only workflow fix now first  
**Authority Created:** false

## Purpose

Translate the PR #7 executive review packet into an exact implementation packet
for the required pre-merge minor changes.

This packet prepares the future implementation scope only. It does not
authorize code changes, test execution, staging, commit, push, merge,
deployment, GPT Builder configuration, or production connector activation.

## Current CI Blocker

```yaml
current_CI_blocker:
  pull_request: 7
  branch: codex/connect-sentinelos-to-gpt
  ci_run: 27778915272
  failing_check: sentinel-api
  root_cause: SENTINEL_HMAC_SECRET_missing_at_API_startup
  local_validation:
    connector_check: passed
    api_healthcheck_with_SENTINEL_HMAC_SECRET: passed
  interpretation: CI_environment_configuration_blocker_not_connector_schema_failure
  CI_fix:
    commit: 8292f7093b9733a3c1a23abe35fb1e2ea02123b9
    check: sentinel-api
    result: success
  immediate_next_gate: REVIEW_PR7_CONNECTOR_MINOR_CHANGE_IMPLEMENTATION_OR_MERGE_HOLD
```

## Source Review Packet

```yaml
source_packet:
  path: /Users/codynunn/.codex/attachments/e47b261c-110a-476b-babd-0dd28b45abf1/pasted-text.txt
  title: Executive_Review_Packet_for_PR_7
  classification: merge_gate_checklist_and_implementation_guide
  recommended_disposition: approve_once_merge_gate_items_are_satisfied
```

## Observed Local Repository Layout

The attachment uses generic paths such as `src/faceplane/openai/*`. The
current checkout uses this layout instead:

```yaml
observed_local_scope:
  api_dispatch:
    - apps/api/server.js
  openai_faceplane:
    - apps/sentinel/src/faceplanes/openai/openaiRoutes.js
    - apps/sentinel/src/faceplanes/openai/openaiWorkflowEngine.js
    - apps/sentinel/src/faceplanes/openai/openaiFaceplaneConfig.js
    - apps/sentinel/src/faceplanes/openai/openaiAuditAdapter.js
    - apps/sentinel/src/faceplanes/openai/openaiEscalationAdapter.js
  existing_validation:
    - scripts/check-openai-faceplane.js
  package_manifest:
    - package.json
  documentation_candidates:
    - README.md
    - docs/governance/README.md
```

No existing GPT Action OpenAPI builder, GPT Action OpenAPI route, or PR-specific
GPT Action documentation file was confirmed by the current filename search.

## Required Implementation Scope

### 1. OpenAPI 3.0.1 Compatibility

```yaml
required_outcome:
  internal_tooling_schema: OpenAPI_3_1_0
  GPT_Builder_schema: OpenAPI_3_0_1
  required_routes:
    - /faceplane/openai/openapi.json
    - /faceplane/openai/openapi-3.0.1.json
  implementation_candidates:
    - apps/sentinel/src/faceplanes/openai/openaiRoutes.js
    - apps/api/server.js
    - new_file_if_approved: apps/sentinel/src/faceplanes/openai/openaiActionOpenApi.js
```

Required verification:

```yaml
verification:
  - GET /faceplane/openai/openapi.json returns openapi 3.1.0
  - GET /faceplane/openai/openapi-3.0.1.json returns openapi 3.0.1
  - GPT_Builder_import_uses_3_0_1_endpoint
  - operations_detected
  - security_scheme_detected
```

### 2. Safe Connection Endpoint Response Shape

```yaml
required_route:
  - /faceplane/openai/gpt-actions/connection
required_response_shape:
  ready: boolean
  sentinel:
    healthy: boolean
  governance:
    healthy: boolean
  authority:
    healthy: boolean
  openai:
    healthy: boolean
  version: string
prohibited_response_content:
  - role_mappings
  - tenant_mappings
  - authority_definitions
  - policy_contents
  - internal_identifiers
  - secrets
implementation_candidates:
  - apps/api/server.js
  - apps/sentinel/src/faceplanes/openai/openaiRoutes.js
  - new_file_if_approved: apps/sentinel/src/faceplanes/openai/openaiGptActionConnection.js
```

### 3. Mandatory `workflowId` Or `requestId`

```yaml
required_policy:
  execute_request_must_include_one_of:
    - workflowId
    - requestId
  invalid_request:
    body: {}
    expected_status: 400
    expected_error: workflowId_or_requestId_required
implementation_candidates:
  - apps/sentinel/src/faceplanes/openai/openaiWorkflowEngine.js
  - apps/sentinel/src/faceplanes/openai/openaiRoutes.js
  - apps/api/server.js
```

The current local workflow engine auto-generates a `workflowId` when absent.
This must be changed or explicitly held before merge if immutable caller-side
audit correlation is required.

### 4. Rate-Limit / 429 Documentation

```yaml
required_openapi_response:
  429:
    description: Rate limit exceeded
    example:
      error: rate_limit_exceeded
      retryAfterSeconds: 60
required_headers:
  - Retry-After
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset
implementation_candidates:
  - apps/api/server.js
  - apps/sentinel/src/faceplanes/openai/openaiRoutes.js
  - docs/gpt-actions.md_or_equivalent_if_approved
```

The server contains generic 429 behavior, but PR-specific GPT Action connector
rate-limit documentation and schema representation remain unconfirmed.

### 5. Expanded Schema Validation

```yaml
required_schema_paths:
  - /faceplane/openai/execute
  - /faceplane/openai/health
  - /faceplane/openai/readiness
  - /faceplane/openai/status
  - /faceplane/openai/gpt-actions/connection
required_security_scheme:
  ApiKeyAuth:
    type: apiKey
required_operations:
  - executeOpenAIGovernedWorkflow
  - getSentinelHealth
  - getSentinelReadiness
  - getOpenAIFaceplaneStatus
  - getGPTConnectionStatus
required_request_fields:
  - intent
  - tenantId
  - workflowId_or_requestId
implementation_candidates:
  - scripts/check-openai-faceplane.js
  - new_file_if_approved: scripts/check-gpt-action-connector-openapi.js
  - package.json
```

### 6. Expanded Connector Validation

```yaml
required_execution_path_tests:
  connection_endpoint:
    request: GET /faceplane/openai/gpt-actions/connection
    expected: 200_and_ready_true
  unauthorized_request:
    condition: missing_api_key
    expected: 401
  invalid_scope:
    expected: 403
  missing_correlation_identifier:
    expected: 400
  rate_limit:
    expected: 429
  successful_workflow_execution:
    expected:
      - 200
      - execution_receipt_returned
      - audit_correlation_present
implementation_candidates:
  - scripts/check-openai-faceplane.js
  - new_file_if_approved: scripts/check-gpt-action-connector.js
  - package.json
```

## Merge Gate Checklist

```yaml
merge_gate:
  required_before_merge:
    - CI_startup_secret_supplied_for_healthcheck
    - OpenAPI_3_0_1_endpoint_published
    - GPT_Builder_import_verified
    - connection_endpoint_sanitized
    - workflowId_or_requestId_enforced
    - 429_documented
    - rate_limit_behavior_tested
    - security_scheme_validated
    - connector_integration_tests_expanded
    - unauthorized_access_tested
    - audit_correlation_validated
    - documentation_updated
    - verification_commands_executed_successfully
  risk_after_remediation: low
  production_readiness_after_remediation: high
```

## Proposed Future Verification Commands

```yaml
future_verification_commands:
  local:
    - npm run check:openai-faceplane
    - npm run check:gpt-action-connector-openapi
    - npm run check:gpt-action-connector
    - npm run check:policy
    - npm run check:governance-status
  live_after_runtime_and_deployment_authority:
    - curl https://<host>/faceplane/openai/openapi.json
    - curl https://<host>/faceplane/openai/openapi-3.0.1.json
    - curl -H "x-api-key: <key>" https://<host>/faceplane/openai/gpt-actions/connection
    - GPT_Builder_import_test_against_openapi_3_0_1_endpoint
```

The new `check:gpt-action-connector-openapi` and
`check:gpt-action-connector` scripts do not currently exist in `package.json`.
They are proposed for future implementation review only.

## Decision Surface

```yaml
decision_surface:
  reviewed_gate: PREPARE_PR7_GPT_ACTION_CONNECTOR_MINOR_CHANGE_IMPLEMENTATION_PACKET
  result: exact_minor_change_implementation_packet_prepared
  implementation_authority: false
  test_execution_authority: false
  merge_authority: false
  staging_authority: false
  commit_authority: false
  push_authority: false
  deployment_authority: false
  runtime_mutation_authority: false
  next_gate: REVIEW_PR7_CONNECTOR_MINOR_CHANGE_IMPLEMENTATION_OR_MERGE_HOLD
  merge_authority_created: false
```

## Support Outcome

```yaml
support_outcome:
  current_state: PR7_minor_change_implementation_packet_prepared_for_review_with_CI_only_workflow_fix_completed
  evidence:
    - /Users/codynunn/.codex/attachments/e47b261c-110a-476b-babd-0dd28b45abf1/pasted-text.txt
    - GitHub_PR_7_CI_run_27778915272
    - GitHub_PR_7_CI_success_run_27853313646
    - docs/governance/PR7_GPT_ACTION_CONNECTOR_MINOR_CHANGES_REVIEW_RESULT_2026-06-19.md
    - docs/governance/PR7_GPT_ACTION_CONNECTOR_DIRECTION_APPROVAL_RESULT_2026-06-19.md
    - docs/governance/PR7_GPT_ACTION_CONNECTOR_REVIEW_PROCESSING_RESULT_2026-06-19.md
    - apps/api/server.js
    - apps/sentinel/src/faceplanes/openai/openaiRoutes.js
    - apps/sentinel/src/faceplanes/openai/openaiWorkflowEngine.js
    - apps/sentinel/src/faceplanes/openai/openaiFaceplaneConfig.js
    - scripts/check-openai-faceplane.js
    - package.json
  support_needed:
    - review_exact_file_scope
    - decide_whether_to_authorize_PR7_minor_change_implementation
    - keep_merge_and_deployment_held_until_remediation_verified
  decision_required: REVIEW_PR7_CONNECTOR_MINOR_CHANGE_IMPLEMENTATION_OR_MERGE_HOLD
  resolution_path: decide_whether_remaining_connector_minor_changes_block_merge
  confidence: high_for_packet_preparation_and_CI_root_cause
  evidence_status:
    - supported
    - partially_supported
```

## Non-Authorization

This packet does not authorize implementation, test execution, merge, staging,
commit, push, deployment, runtime mutation, Azure mutation, GPT Builder
configuration, production connector activation, customer contact, government
contact, external claims, or external sharing.
