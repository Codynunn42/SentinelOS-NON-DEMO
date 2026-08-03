# SentinelOS Institutional Modules

> Every capability has a natural question to answer: **"Which Institutional Module does this belong to?"**
> If it doesn't map cleanly to a module, it either belongs in an existing one or isn't a module at all — just an enhancement to one that already exists.

This document is the living module registry for SentinelOS. It records the purpose of each module, its current entry points in the codebase, and its natural growth direction. It is **not** an implementation spec — it is an operating map.

---

## Architecture

```
Institution
    ↓
Executive Desk
    ↓
SentinelOS
    ↓
Institutional Modules
```

The Institutional Modules are the executable functions of the operating environment. Each module owns a coherent area of capability. SentinelOS grows by deepening modules, not by accumulating unrelated scripts.

---

## Module Registry

### Executive Operations
**Purpose:** Planning, cadence, and outcome briefings. The surface through which the institution directs activity.

| Component | Path |
|---|---|
| Mission control surface | `scripts/check-mission-control-surface.js` |
| Executive snapshot alignment | `scripts/command-executive-snapshot-alignment.js` |
| Fork steering roadmap | `scripts/command-fork-steering-roadmap.js` |
| Drift issue classification | `scripts/command-classify-drift-issues.js` |
| Institutional module check | `scripts/check-institutional-modules.js` |

**Growth direction:** Outcome briefings that embed an Operational Context header (environment, revision, confidence, known quirks) sourced from the Operations Module.

---

### Governance
**Purpose:** Policies, approvals, and Governance-as-a-Service (GaaS). The enforcement layer that ensures every action is authorized and traceable.

| Component | Path |
|---|---|
| Policy engine | `apps/sentinel/src/governance/policyEngine.js` |
| Approval workflow | `apps/sentinel/src/approval/approval.js` |
| Authority state | `apps/sentinel/src/governance/authorityState.js` |
| Governance signals | `apps/sentinel/src/governance/governanceSignals.js` |
| Governance status | `apps/sentinel/src/governance/core/governanceStatus.js` |
| Preflight check | `apps/sentinel/src/governance/preflight.js` |
| Drift policy ledger | `apps/sentinel/src/governance/core/driftPolicyLedger.js` |
| Execution passport | `apps/sentinel/src/governance/executionPassport.js` |
| Vendor onboarding | `apps/sentinel/src/governance/vendorOnboarding/` |

**Growth direction:** Degraded-state health reporting for signing key availability; explicit `degraded` status when audit signing is unavailable.

---

### Evidence
**Purpose:** Audit, receipts, and provenance. Every action generates a record; every record is verifiable.

| Component | Path |
|---|---|
| Audit logger | `apps/sentinel/src/audit/auditLogger.js` |
| Execution trace | `apps/sentinel/src/audit/executionTrace.js` |
| Evidence records | `runtime/evidence/` |
| State anchors | `apps/sentinel/src/verification/stateAnchors.js` |
| Sovereign boot | `apps/sentinel/src/sovereign/sovereignBoot.js` |

**Growth direction:** Automatic evidence emission from every validation run (evidenceEmitter module); each record tied to a commit SHA and environment fingerprint.

---

### Operations
**Purpose:** Doctor, diagnostics, runtime health, and environment fingerprinting. The self-awareness layer. SentinelOS should always be able to answer: *"What environment am I operating in, and how confident am I?"*

| Component | Path |
|---|---|
| Sentinel Doctor | `scripts/sentinel-doctor.js` |
| Environment manifests | `configs/environments/` |
| Platform quirks registry | `configs/platform-quirks.json` |
| Healthcheck | `scripts/healthcheck.js` |

**Growth direction:**
- **Deployment Passport** — a structured identity document for a running instance, combining environment, capabilities registered, providers healthy/degraded, governance loaded, evidence recording, operational confidence, and revision. Complements the existing Execution Passport (`executionPassport.js`), which signs individual commands.
- **Runtime Health stream** — ongoing health recording beyond startup, persisting into `runtime/evidence/` as a continuous record.
- **Diagnostics** — structured reasoning about *why* a condition is degraded, using the platform quirks registry as its knowledge base.

---

### Workflow
**Purpose:** Orchestration, task templates, and multi-step execution. The TILDA lineage.

| Component | Path |
|---|---|
| Task templates | `apps/sentinel/src/orchestration/taskTemplates.js` |
| Control plane | `apps/sentinel/src/controlPlane.js` |
| Command dispatch | `apps/sentinel/src/commands/dispatch.js` |
| Command registry | `apps/sentinel/src/commands/registry.js` |
| Learning engine | `apps/sentinel/src/learning/engine.js` |

**Growth direction:** Retry reduction, idempotency enforcement, and approval bottleneck analysis already exist as check scripts; these graduate into first-class workflow capabilities.

---

### AI Operations
**Purpose:** Multi-model governance and AI provider lifecycle. The AI Embassy lineage. Governs how AI models are authorized, monitored, and replaced.

| Component | Path |
|---|---|
| OpenAI faceplane | `apps/sentinel/src/faceplanes/openai/openaiRoutes.js` |
| Faceplane SDK | Referenced by `scripts/check-faceplane-sdk.js` |
| Mock faceplanes | `scripts/run-mock-faceplanes.js`, `scripts/stress-mock-faceplanes.js` |
| Drift analyzer | `apps/sentinel/src/drift/driftAnalyzer.js` |
| Governance analytics | `scripts/mockGovernanceAnalytics.js` |

**Growth direction:** AI model health as a first-class Operations check; faceplane fork continuity tracking.

---

### Communications
**Purpose:** Microsoft 365, messaging, and notifications. How SentinelOS communicates with humans and external systems.

| Component | Path |
|---|---|
| *(not yet present in repo)* | — |

**Growth direction:** Notification hooks from Governance (approval requests, policy violations) and Operations (degraded health alerts).

---

### Development
**Purpose:** GitHub, CI/CD, and engineering workflows. How the codebase is built, tested, and deployed.

| Component | Path |
|---|---|
| CI workflow | `.github/workflows/ci.yml` |
| Deploy workflow | `.github/workflows/deploy.yml` |
| Check scripts | `scripts/check-*.js` |
| Repo organization scan | `scripts/sentinel-repo-organization-scan.js` |
| Repo control layer | `scripts/check-repo-control-layer.js` |

**Growth direction:** CI confidence pre-checks using `sentinel doctor` output (environment fingerprint before any functional test).

---

### Capability Registry
**Purpose:** Discovery, registration, and brokerage. Knowing what SentinelOS can do and routing requests to the right handler.

| Component | Path |
|---|---|
| Surface registry | `apps/sentinel/src/commands/registry.js` |
| Tier registry | `apps/sentinel/src/tiers/tierRegistry.js` |
| Tier resolver | `apps/sentinel/src/tiers/tierResolver.js` |
| Role scope registry | `scripts/check-role-scope-registry.js` |
| Key registry | `apps/sentinel/src/security/keyRegistry.js` |

**Growth direction:** Capability count becomes an input to the Operational Confidence score; `sentinel doctor` reports capabilities registered.

---

### Docking
**Purpose:** Provider integration and lifecycle. How external services connect to SentinelOS, with structured discovery rather than hardcoded assumptions.

| Component | Path |
|---|---|
| Docking protocol | `scripts/check-docking-protocol.js` |
| Archive intelligence docking | `scripts/check-archive-intelligence-docking.js` |
| OwnerFi pilot API | `scripts/check-ownerfi-pilot-api.js` |
| Vendor onboarding simulation | `scripts/simulate-vendor-onboarding.js` |
| CDNLux integration | `scripts/check-cdnlux-integration.js` |

**Growth direction:** Docking health becomes an Operations Module input; degraded or absent providers surface in `sentinel doctor` output.

---

## Deployment Passport (future)

The Deployment Passport is a planned Operations Module output that gives every running SentinelOS instance a self-describing identity document. It is distinct from the Execution Passport (which authorizes individual commands).

```
Sentinel Deployment Passport

Identity
  Repository   : SentinelOS-NON-DEMO
  Branch       : main
  Revision     : v4.2.1 (abc1234)

Environment
  Runtime      : Azure Container Apps
  Manifest     : azure-prod

Capabilities
  Registered   : 42

Providers
  Healthy      : 8
  Degraded     : 1

Governance
  Policy Engine: loaded
  Signing      : ok

Evidence
  Recording    : active

Known Quirks   : none

Operational Confidence: 97.3%

Executive Summary
  All critical checks passing. One provider degraded (see Evidence for details).
```

Every outcome briefing can begin with this header. Every evidence record can embed a compact version of it.

---

## Principles

1. **Every capability belongs to a module.** New features are enhancements or new modules — not free-floating scripts.
2. **Modules have clear purpose boundaries.** If two modules could own something, it belongs to the one whose purpose is most directly served.
3. **The Operations Module runs first.** `sentinel doctor` executes before any functional test or deployment. The environment is known before anything else happens.
4. **Evidence is universal.** Every module that produces a finding writes a record to `runtime/evidence/`.
5. **Declare, don't assume.** Environment manifests, capability registries, and docking protocols all share this principle: the system declares what it expects and validates actual state against that declaration.
