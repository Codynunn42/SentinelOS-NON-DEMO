# SentinelOS System Design

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Current Foundation

SentinelOS now has a live deployment surface:

- Container App: `ca-nc-dev-sentinel`
- Image: `acrncdevsentinel.azurecr.io/sentinelos:latest`
- Ingress: external on port `80`
- Health: HTTP `/health` on port `80`
- CI/CD: GitHub Actions builds, pushes, deploys, and smoke-tests the live endpoint

This is the deployment base for the governed command platform.

## Platform Planes

SentinelOS should stay organized as six planes:

- Surface Plane: public and operator-facing routes, dashboards, and command consoles
- Policy Plane: authentication, governance preflight, RBAC, approvals, and risk checks
- Orchestration Plane: command routing, agent routing, workflow execution, and receipts
- Integration Plane: Azure, GitHub, Stripe, OpenAI, databases, and future tool adapters
- Learning Plane: execution memory, outcome analysis, suggestions, and runbook generation
- Infrastructure Plane: Container Apps, ACR, Key Vault, App Configuration, Log Analytics, and Application Insights

The rule is simple: a request reaches execution only after a key resolves to tenant, actor, role, and scopes, then policy and audit context are present. Learning can recommend actions, but policy still decides whether action is allowed.

## Live API Contract

Current and near-term routes:

```txt
GET  /
GET  /health
GET  /system/status
POST /v1/command
POST /command
POST /policy/evaluate
POST /agent/run
GET  /learning/suggestions
POST /learning/events
GET  /approvals
POST /approvals/:id/approve
POST /approvals/:id/reject
GET  /v1/audit
GET  /audit/events
```

`/v1/command` is the primary execution route. `/command` remains a legacy compatibility route. `/policy/evaluate` is a dry-run governance decision route. `/agent/run` is reserved and blocked until the agent controller has an approval policy, tool registry, execution sandbox, and audit sink. `/learning/suggestions` reads execution history and returns `{ state, decision }`, where `state.learning` is Sentinel's classification and `state.forethought` is Tilda's aligned interpretation. `/learning/events` records external execution outcomes, such as deployments or smoke-test results, into the audit-backed learning stream.

## Command Envelope

Commands should use this envelope:

```json
{
  "tenant": "ownerfi",
  "command": "application.submit",
  "payload": {},
  "metadata": {
    "actor": "operator@example.com",
    "role": "operator"
  }
}
```

Legacy commands such as `ownerfi.application.submit` remain supported through the compatibility bridge.

## Execution Flow

```txt
HTTP request
-> API key / identity check
-> tenant / actor / role / scope resolution
-> rate limit
-> normalize command envelope
-> governance preflight
-> required scope check
-> tenant surface registry
-> command handler
-> audit log
-> receipt / response
```

Blocked commands are outcomes, not failures of the platform. They should return a clear blocked status and be audited.

## Learning Plane

The Sentinel Learning Plane turns execution history into guidance without bypassing governance.

Inputs:

- deployment events
- health check results
- command outcomes
- policy decisions
- blocked actions
- operator-recorded fixes

Processing:

- summarize recent outcomes
- detect repeated blocked or failed actions
- separate stable execution windows from risky ones
- recommend next actions with a policy posture

Outputs:

- suggested next steps
- runbook candidates
- warnings before retrying unsafe actions
- integration recommendations
- Tilda forethought for operator-ready interpretation

Current learning routes:

```txt
GET  /learning/suggestions
POST /learning/events
```

The first implementation is intentionally audit-backed. It uses existing execution history before introducing vector memory or model-generated recommendations.

Learning flow:

```txt
execution event
-> audit log
-> learning analysis
-> suggestion
-> policy evaluation
-> optional action
```

The non-negotiable rule is: learning suggests, policy authorizes, orchestration executes.

### Tilda Forethought

Tilda is the interpretation layer on top of the Learning Plane. It lives at `apps/sentinel/src/forethought/tilda.js`. It does not execute. It turns state into operator-ready reasoning.

Flow:

```txt
Learning Engine
-> state, risk, confidence, evidence
-> Tilda Forethought
-> meaning, directive, response shape
-> Decision Layer
-> allow, restrict, or block
-> Policy
-> optional execution
```

Tilda output should include:

```json
{
  "name": "Tilda",
  "systemGoal": "stability-first governed execution",
  "alignmentScore": 0.2,
  "framedSuggestion": "System drift detected. Automation is paused and human review is required.",
  "explanation": "State: drift. Reason: ... Confidence: 0.95.",
  "interpretation": "System state is drift with high risk...",
  "directive": "Pause automation...",
  "actionGate": "human_review_required",
  "riskLevel": "high",
  "requiresApproval": true,
  "requiresHumanReview": true,
  "confidence": 0.95,
  "evidence": []
}
```

Tilda is allowed to explain and recommend. It is not allowed to override policy.

### Decision Layer

The Decision Layer turns Learning plus Tilda into the current action state. It lives at `apps/sentinel/src/decision/decision.js`.

It answers one question:

```txt
Given what Sentinel knows, what are we allowed to do right now?
```

Decision output should include:

```json
{
  "decision": "block",
  "executionMode": "blocked",
  "approvalRequired": true,
  "alignmentScore": 0.2,
  "riskLevel": "high",
  "actionGate": "human_review_required",
  "reason": "High risk detected by forethought layer."
}
```

Decision states:

```txt
stable  -> allow    -> auto
unknown -> restrict -> restricted
drift   -> block    -> blocked
```

Safety override:

```txt
high risk or human review required -> block
```

The Decision Layer is not the final executor. It sets the action state that Policy must enforce.

### Approval Layer

The Approval Layer turns `approvalRequired: true` into a trackable human checkpoint. It lives at `apps/sentinel/src/approval/approval.js`.

Initial approval routes:

```txt
GET  /approvals
POST /approvals/:id/approve
POST /approvals/:id/reject
```

Approval request shape:

```json
{
  "id": "approval_...",
  "status": "pending",
  "decision": {
    "decision": "block",
    "executionMode": "blocked",
    "approvalRequired": true
  },
  "context": {
    "tenant": "ownerfi",
    "route": "/learning/suggestions"
  },
  "createdAt": "2026-04-26T00:00:00.000Z"
}
```

The first implementation is in-memory and audit-backed. The next production step is persistent approval storage so Mission Control can show pending, approved, and rejected checkpoints across process restarts.

### Drift Control

SentinelOS does not assume learning always improves the system. It explicitly models drift.

Core rule:

```txt
AI is allowed to learn freely,
but only allowed to act within governed boundaries.
```

Learning states:

```txt
unknown -> not enough execution evidence
stable  -> enough successful outcomes without drift signals
drift   -> repeated blocked, failed, or unexpected outcomes
```

Action gates:

```txt
unknown -> observe only
stable  -> policy-allowed actions only
drift   -> human review required
```

Risk and approval mapping:

```txt
unknown -> medium risk -> no automation
stable  -> low risk    -> policy-approved automation only
drift   -> high risk   -> approval required
```

Every learning state should include evidence so operators can see why Sentinel reached the classification.

Controlled evolution loop:

```txt
Stable
-> Drift detected
-> Automation paused
-> Human review
-> Resolution recorded
-> New stable pattern
```

The goal is not to eliminate drift. The goal is to detect it early, constrain it, learn from it, and convert it into policy or runbook knowledge.

## Policy Model

Current governance preflight checks:

- `tenant` is required.
- `command` is required.
- `metadata.actor` is required.
- `metadata.role` is required.
- `deal.execute` requires `metadata.role` to be `approver`.

Next policy additions:

- map actors to tenant-scoped roles
- classify command risk before execution
- require approval for destructive or deploy-affecting actions
- add dry-run requirements for infrastructure commands
- log all policy decisions with request and revision context

## Surface Registry

Current surfaces:

- `ownerfi`
- `hotelops`

New clients should be added as surface-plane entries, not as separate forks. Each surface owns tenant-specific handlers while sharing policy, dispatch, audit, and deployment infrastructure.

## Agent Controller

The agent layer should not execute directly from model output. The controller should use this flow:

```txt
agent request
-> policy evaluation
-> tool allowlist lookup
-> approval check if required
-> bounded execution
-> structured result
-> audit event
```

Initial agent actions should be read-only or dry-run. Deploy, delete, secret, billing, and identity actions should require explicit approval.

## Integration Routing

Initial integration priority:

1. Azure Container Apps and ACR for deployment state
2. GitHub for source and workflow status
3. Key Vault and App Configuration for controlled config
4. Application Insights and Log Analytics for telemetry
5. Azure OpenAI for policy-aware command assistance
6. Stripe and database surfaces for billing and ledger workflows

Each integration should expose a narrow adapter instead of leaking raw SDK calls into command handlers.

## Observability

Every command should emit:

```json
{
  "tenant": "ownerfi",
  "actor": "operator@example.com",
  "command": "application.submit",
  "decision": "allowed",
  "status": "executed",
  "revision": "ca-nc-dev-sentinel--decision-signing-v1",
  "timestamp": "2026-04-28T00:00:00.000Z"
}
```

Near-term telemetry work:

- request IDs
- revision and image tag in `/system/status`
- structured logs for every policy decision
- live command count and blocked-command count
- Application Insights correlation

## Build Order

1. Keep CI/CD green and health-gated.
2. Stabilize `/system/status`, `/policy/evaluate`, and `/audit/events`.
3. Expand the command schema with risk and approval metadata.
4. Add read-only integration adapters for Azure and GitHub.
5. Feed deployment and health-check outcomes into `/learning/events`.
6. Persist approval checkpoints and feed approval outcomes back into learning.
7. Wire Decision output into Policy enforcement.
8. Add Azure OpenAI behind Tilda response shaping and policy-aware prompt templates.
9. Build Mission Control on top of command, audit, learning, Tilda, decision, approvals, and status routes.

## Product Position

SentinelOS is a governed AI command surface for cloud execution. The value is not that it can run commands. The value is that it can decide which commands are allowed, route them through tenant-specific surfaces, execute with bounded authority, and leave an audit trail operators can trust.
