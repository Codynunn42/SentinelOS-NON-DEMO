# SentinelOS Product Definition

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Product Position

SentinelOS is an AI governance and execution control plane for Azure environments.

It is not a standalone app. SentinelOS is the system layer that evaluates events, scores trust, signs decisions, requires approval when needed, and exposes controlled access through client applications such as Mission Control.

Canonical pipeline:

```txt
Event
-> Sentinel Security
-> Sentinel Learning
-> Sentinel Analysis
-> Sentinel Decision
-> Sentinel Approval
-> Sentinel Policy
-> Execution
-> Storage
-> Mission Control
```

## Problem

Cloud teams are adding AI agents, automation, deployment pipelines, and security integrations faster than their governance models can control them.

Common failure modes:

- risky automation executes before a human can review it
- security alerts create noise but do not enforce action boundaries
- approvals are handled outside the system of record
- AI recommendations are not tied to policy or audit evidence
- logs exist, but decisions are not explainable or verifiable

## Solution

SentinelOS turns raw operational and security signals into governed decisions.

It provides:

- trust scoring for identity, security, and system events
- learning state classification: `stable`, `unknown`, `drift`
- Sentinel Analysis for human-readable rationale
- signed decisions as verifiable governance artifacts
- persistent approvals for human-in-the-loop control
- Mission Control as an operator client over Sentinel Core

Core rule:

```txt
AI can learn freely.
AI can suggest cautiously.
AI can act only through policy.
```

## Current Product Surface

Live capabilities:

- Azure Container Apps deployment
- health-gated runtime on port `80`
- Mission Control UI
- persistent approval store
- security event ingestion
- trust scoring
- signed decisions
- approval queue
- read-only learning suggestions

Primary routes:

```txt
GET  /health
GET  /mission-control
POST /events/security
GET  /learning/suggestions
GET  /approvals
POST /approvals/:id/approve
POST /approvals/:id/reject
POST /execute (next)
```

## Initial Use Cases

### Security Governance

```txt
High-risk identity event
-> trustScore drops
-> decision blocks action
-> security approval is created
-> Mission Control shows the reason
```

### Automation Governance

```txt
Deployment or command event
-> learning classifies state
-> decision allows, restricts, or blocks
-> approval required for risky states
```

### App Consent Governance

```txt
New application consent event
-> Sentinel Security evaluates publisher and scopes
-> decision blocks if risk is high
-> integration approval required
```

## Product Tiers

### Sentinel Core

Developer and small-team tier.

- local or single-cloud deployment
- Mission Control
- basic security event ingestion
- trust scoring
- signed decisions
- persistent approvals

### Sentinel Cloud

Hosted paid SaaS tier.

Target early pricing: `$49-$299/month`.

- hosted Sentinel control plane
- Azure integration
- managed persistence
- audit-ready decision history
- multi-tenant support
- configurable approval policies

### Sentinel Enterprise

Enterprise and government-ready tier.

Target pricing: `$2K-$10K+/month`, with annual contracts for larger deployments.

- Entra ID and Conditional Access signal integration
- Microsoft Sentinel and Azure Monitor integration
- compliance reporting
- custom policy packs
- tenant isolation
- role-based approval workflows
- private deployment option

## Strategic Position

SentinelOS sells control, governance, auditability, and safe automation.

Positioning:

```txt
AI Governance and Execution Control Plane for Azure environments.
```

Not:

```txt
AI chatbot
generic dashboard
DevOps helper
```

## Near-Term Product Priorities

1. Add `POST /execute` as the signed-decision enforcement boundary.
2. Verify signed decisions before any action path can run.
3. Create a signed decision history endpoint.
4. Add Azure identity signal ingestion from Entra ID or Microsoft Graph.
5. Record the security-risk Mission Control demo for pilots.
