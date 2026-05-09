# Repo Control Layer

Status: Phase 1 boundary

## Purpose

SentinelOS controls how repo actions enter execution.

It does not replace GitHub. It governs repo-level intent, detects drift, prevents unsafe bypasses, and records decisions before any high-impact action runs.

## Current Command Set

```text
repo.control.workflow.diagnose
repo.control.workflow.retry
```

`repo.control.workflow.diagnose` is read-only.

It classifies workflow failures and returns the next governed action:

- `continue`
- `inspect_job_logs`
- `observe_and_collect_evidence`
- `hold_and_escalate`

`repo.control.workflow.retry` is policy-gated.

It allows retry only when:

- `driftType == transient_failure`
- `retryCount < maxRetries`

Otherwise it blocks and requires review.

## Contract

Input:

```json
{
  "repository": "Codynunn42/nunncorp-global-mono",
  "workflowName": "Sentinel Actions Diagnostic",
  "runId": "25584768689",
  "runUrl": "https://github.com/Codynunn42/nunncorp-global-mono/actions/runs/25584768689",
  "conclusion": "startup_failure",
  "jobs": [],
  "logsAvailable": false
}
```

Output:

```json
{
  "controlledBoundary": "repo",
  "executionMode": "read_only_diagnosis",
  "approvalRequired": true,
  "bypassPrevented": true,
  "diagnosis": {
      "state": "external_startup_failure",
      "driftType": "external_dependency_failure",
      "confidence": 0.92,
      "riskLevel": "medium",
      "action": "hold_and_escalate",
      "nextAction": "hold_and_escalate",
      "retryAllowed": false
    }
  }
```

## Guardrails

- Every executable command must carry a signed Sentinel passport:

```json
{
  "source": "sentinel",
  "timestamp": 1715190000,
  "nonce": "uuid",
  "meta": {
    "tenantId": "nunncloud",
    "surface": "sentinelos-control-plane"
  },
  "sig": "base64_hmac_sha256"
}
```

- Untagged execution is classified as:

```json
{
  "status": "blocked",
  "reason": "unauthorized_execution",
  "source": "unknown"
}
```

- Spoofed execution with `source: sentinel` but no valid signature is blocked as:

```json
{
  "status": "blocked",
  "reason": "unauthorized_execution:missing_signature"
}
```

- Reused passports are blocked as:

```json
{
  "status": "blocked",
  "reason": "unauthorized_execution:replay"
}
```

- No direct force push.
- No repo mutation from diagnosis commands.
- No GitHub account-level changes without human approval.
- No repeated patch loops after provider-side failure is proven.
- Every repo action must pass through policy, audit, and a command receipt.

## Next Commands

Future commands should remain separate and scoped:

- `repo.control.workflow.trigger`
- `repo.control.push`
- `repo.control.rollback`

These should require explicit approval before they execute mutations.
