# The Executive Desk Phase 2 Safe Read-Only Command Gate - 2026-07-01

## Purpose

Define the first approved downstream SentinelOS command validation gate after Phase 1 GPT Actions successfully reached the signing proxy.

## Gate

```yaml
gate: SAFE_READ_ONLY_OR_NOOP_PROXY_COMMAND
mode: verification_first_governance_first
live_claims_allowed_before_gate: false
approved_operation_id: runRepoWorkflowDiagnosis
approved_proxy_path: POST /proxy/command
approved_tenant: nunncloud
approved_command: repo.control.workflow.diagnose
```

## Repository Evidence

The selected command is supported by repository evidence:

- `apps/sentinel/src/surface/nunncloud.js` registers `repo.control.workflow.diagnose`.
- `apps/sentinel/src/commands/repo/control.js` implements `handleRepoWorkflowDiagnose`.
- `docs/REPO_CONTROL_LAYER.md` states that `repo.control.workflow.diagnose` is read-only.
- The handler returns `executionMode: read_only_diagnosis`.

## Why This Command

This command is safer than the broader SentinelOS architecture reconstruction commands because it does not inspect the whole repository, rebuild a model, retry workflows, trigger CI, push code, alter runtime, change identity, change billing, or mutate infrastructure.

It classifies provided workflow evidence and returns a governed diagnosis.

## Approved Test Payload

```json
{
  "tenant": "nunncloud",
  "command": "repo.control.workflow.diagnose",
  "payload": {
    "repository": "Codynunn42/SentinelOS-NON-DEMO",
    "workflowName": "Sentinel Actions Diagnostic",
    "runId": "",
    "runUrl": "",
    "conclusion": "startup_failure",
    "jobs": [],
    "logsAvailable": false
  }
}
```

## Expected Safe Response

A successful response should show:

```yaml
status: executed
command: repo.control.workflow.diagnose
executionMode: read_only_diagnosis
bypassPrevented: true
diagnosis.state: external_startup_failure
```

The exact `trustScore`, `reasons`, receipt shape, and audit fields may vary by runtime configuration.

## Safety Boundaries

Do not use `/proxy/command` for:

- `repo.control.workflow.retry`
- deploy
- push
- rollback
- billing
- identity
- DNS
- Vault
- infrastructure mutation
- runtime mutation
- approval review
- broad platform administration

## Security Note

The GPT schema restricts what the GPT should call, but it does not protect the public tunnel from arbitrary callers who know the URL.

Before adding mutating commands, add an inbound authentication layer or move the signing proxy behind a controlled hosted gateway.

## Classification

```yaml
phase_1_gpt_to_signing_proxy: verified
phase_2_selected_command: approved_for_read_only_test
downstream_sentinel_api_reachability: pending_until_action_run
general_sentinel_control: not_claimable
external_live_claim_allowed: false
```
