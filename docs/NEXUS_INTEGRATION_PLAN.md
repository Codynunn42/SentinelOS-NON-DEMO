# NEXUS Integration Plan

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

---

## Mission

NEXUS is the governed command console face plane for SentinelOS. This repository is the canonical home for NEXUS integration. Every NEXUS action routes through the SentinelOS governance core. The Executive Desk provides oversight and approval authority over all high-risk execution.

---

## Architecture

```
NEXUS Command Console
  -> Intent (command palette, buttons, typed commands)
  -> /v1/command (tenant: "nexus")
  -> SentinelOS Control Plane
  -> Governance Preflight
  -> Policy Engine
  -> Executive Approval Gate (high-risk only)
  -> Handler Execution
  -> Audit Log + Receipt
```

NEXUS is a face plane. It cannot execute around the OS.

```
NEXUS -> Intent -> Control Plane -> Sentinel Core -> Governance -> Execution
```

---

## Surface Registration

NEXUS is registered in the surface registry as tenant `nexus`:

```javascript
nexus: {
  name: 'NEXUS',
  handlers: nexusHandlers
}
```

Surface file: `apps/sentinel/src/surface/nexus.js`

---

## NEXUS Commands

| Command | Capability | Approval Required | Role |
|---|---|---|---|
| `nexus.status.read` | `FACEPLANE_READ` | No | operator |
| `nexus.console.init` | `FACEPLANE_READ` | No | operator |
| `nexus.intent.emit` | `FACEPLANE_WRITE` | No | operator |
| `nexus.command.execute` | `FACEPLANE_EXECUTE` | **Yes — Executive Desk** | executive |
| `nexus.executive.review` | `FACEPLANE_READ` | No | executive |

---

## Policy Model

Command scopes registered in `policyEngine.js`:

```javascript
'nexus.status.read':      'nexus:read'
'nexus.console.init':     'nexus:read'
'nexus.intent.emit':      'nexus:write'
'nexus.command.execute':  'nexus:execute'
'nexus.executive.review': 'nexus:executive'
```

Enforcement rules:
- `nexus.command.execute` — blocked unless `role === 'executive'` or `role === 'platform'`; `approvalRequired: true`
- `nexus.executive.review` — blocked unless `role === 'executive'` or `role === 'platform'`

---

## Executive Desk Oversight

The Executive Desk is an oversight-only surface. It does not initiate execution.

**Authority:** Review, approve, or reject pending NEXUS actions requiring high-risk execution.

**Telemetry class:** `executive.oversight.*`

**Plane file:** `apps/sentinel/src/planes/executive.ts`

Approval flow:
```
nexus.command.execute requested
  -> Approval Layer creates pending checkpoint (approvalRequired: true)
  -> Executive Desk reviews via nexus.executive.review
  -> Executive approves or rejects via /approvals/:id/approve or /approvals/:id/reject
  -> Decision Layer re-evaluates with approval state
  -> Policy enforces — allowed only when approved + signed decision present
```

---

## Docking Manifest

`fixtures/faceplanes/nexus-faceplane.json`

Key fields:
- `approvalModel`: `executive_approval_before_execute`
- `requestedCapabilities`: `FACEPLANE_READ`, `FACEPLANE_WRITE`, `FACEPLANE_EXECUTE`
- `controls`: `executive_approval_before_execute`, `no_direct_execution_bypass`, `surface_view_audited`
- Initial docking status: `PENDING_APPROVAL` until Executive Desk approves manifest

---

## Phase Build Order

### Phase 1 — Foundation ✅

- [x] Register NEXUS in surface registry
- [x] Create `apps/sentinel/src/surface/nexus.js` with governed handlers
- [x] Add NEXUS command scopes to policy engine
- [x] Add executive approval enforcement rules to policy engine
- [x] Create NEXUS face plane docking manifest
- [x] Create Executive Desk oversight plane (`apps/sentinel/src/planes/executive.ts`)
- [x] Register Executive Desk in planes index
- [x] Create this integration plan document
- [x] Update `SURFACE_PLANES.md` and `STATUS_REPORT.md`

### Phase 2 — App Shell ✅

- [x] Create `apps/nexus/` application directory
- [x] Port sentinel-console command surface from nunncorp-global-mono
- [x] Wire NEXUS intent through `/v1/command` envelope with `tenant: "nexus"`
- [x] Command palette routing to `nexus.intent.emit`
- [x] High-risk action detection routing to `nexus.command.execute`
- [x] Build NEXUS GaaS policy pack (`apps/sentinel/src/governance/gaas/nexus-policy.js`)
- [x] NEXUS Command Console UI (`apps/nexus/public/nexus-console.html`)
- [x] Executive Desk oversight UI (`apps/nexus/public/nexus-executive.html`)
- [x] API routes `/nexus` and `/nexus/executive` registered and audited

### Phase 3 — C3 Capability Adoption Layer

**Mission:** Transform NEXUS from an integrated application into a governed capability provider. The Command Envelope API becomes the canonical execution contract for SentinelOS — every future integration (TILDA, Microsoft 365, GitHub, government systems) implements this same contract.

- [x] **C3.1** — Command Envelope API: `POST /api/v1/command-envelope`, `/api/v1/planning`, `/api/v1/execution`, `/api/v1/evidence`
- [x] **C3.2** — Capability Registry: `apps/sentinel/src/capabilities/registry.js` + `resolver.js`
- [x] **C3.3** — Dock Manifest Standard: `manifest-schema.js` + `dock-manifest.schema.json` + nexus-faceplane.json migration
- [x] **C3.4** — Executive Desk capability surface: registry-aware, manifest-aware oversight UI
- [x] **C3.5** — AI Capability Broker: goal → capability → provider routing (`capabilities/broker.js`)
- [x] **C3 Close** — `NEXUS_C3_CHECKPOINT_REPORT.md` + STATUS_REPORT.md final update

---

## Invariants

- NEXUS never calls execution paths directly in the browser
- All NEXUS commands use the full command envelope: `{ tenant: "nexus", command: "...", payload: {}, metadata: { actor, role, scopes } }`
- `nexus.command.execute` always requires Executive Desk approval — this rule is not configurable
- The Executive Desk is oversight, not execution — it approves or rejects, it does not initiate
- Every NEXUS execution attempt is audited regardless of outcome

---

**Owner:** Sentinel AI by Cody Nunn | Nunn Cloud
**Date:** 2026-08-02
**Status:** Phase 1 Complete — Phase 2 Complete — Phase 3 (C3 Capability Adoption Layer) Complete — C4 Ready
