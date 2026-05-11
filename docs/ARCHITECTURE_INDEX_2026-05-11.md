# SentinelOS Architecture Index - 2026-05-11

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose

Comprehensive index of all architectural documentation based on repo scan. Organized by system layer and component type.

## CORE ARCHITECTURE

### System Overview

| Document | Status | Purpose | Key Components |
|---|---|---|---|
| `docs/EXECUTION_ARCHITECTURE.md` | ✅ ACTIVE | Command execution flow | Envelope → Validation → Intent → Execution → Receipt |
| `docs/diagrams/sentinelos_architecture_v2.mmd` | ✅ ACTIVE | System architecture diagram | Control Plane, Face Planes, GaaS, Docking |
| `docs/PRODUCT.md` | ✅ ACTIVE | Product definition | Governed execution OS positioning |

### Control Plane

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `docs/PROOF_CONTROL_PLANE_RELEASE_2026-05-07.md` | ✅ ACTIVE | Control plane verification | Live proof UI and API endpoints |
| `apps/sentinel/src/controlPlane/index.js` | ✅ ACTIVE | Control plane entry point | Intent execution engine |
| `apps/sentinel/src/controlPlane/execute.js` | ✅ ACTIVE | Intent execution | ExecuteIntent function |
| `apps/sentinel/src/controlPlane/intentRegistry.js` | ✅ ACTIVE | Intent definitions | APPLICATION_SUBMIT, DEAL_EXECUTE, etc. |

## FACE PLANES & INTEGRATION

### Face Plane Framework

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `docs/FACEPLANE_GAAS_DOCKING_DOCTRINE.md` | ✅ ACTIVE | Face plane operating model | Domain-specific interaction layers |
| `docs/FACEPLANE_SDK_SPEC.md` | ✅ ACTIVE | Face plane SDK specification | Contract for face plane development |
| `apps/sentinel/src/faceplanes/sdk/facePlaneSdk.js` | ✅ ACTIVE | Face plane SDK implementation | SDK for building face planes |
| `fixtures/faceplanes/governed-workflow-faceplane.json` | ✅ ACTIVE | Face plane fixture | Example face plane configuration |

### Docking Protocol

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `docs/SENTINEL_DOCKING_PROTOCOL.md` | ✅ ACTIVE | Docking protocol specification | Integration boundary definition |
| `docs/diagrams/faceplane_docking_v2.mmd` | ✅ ACTIVE | Docking architecture | Face plane integration model |
| `apps/sentinel/src/commands/dispatch.js` | ✅ ACTIVE | Command routing | Routes support.* commands to handlers |

## GOVERNANCE & SECURITY

### Governance Architecture

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md` | ✅ ACTIVE | Governance doctrine | Canonical enforcement language |
| `docs/GOVERNANCE_PREFLIGHT.md` | ✅ ACTIVE | Preflight checks | Governance validation before execution |
| `docs/diagrams/governance_pipeline_v2.mmd` | ✅ ACTIVE | Governance pipeline | Block path enforcement |
| `apps/sentinel/src/governance/executionGuard.js` | ✅ ACTIVE | Execution guard | Runtime governance enforcement |

### Security Components

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `SECURITY.md` | ✅ ACTIVE | Security posture | API key protection, audit logging |
| `apps/sentinel/src/security/keyRegistry.js` | ✅ ACTIVE | API key management | Key validation and rotation |
| `apps/sentinel/src/governance/executionPassport.js` | ✅ ACTIVE | Execution passports | Signed execution contexts |

## DATA & STATE MANAGEMENT

### Database Layer

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `apps/sentinel/src/db/client.js` | ✅ ACTIVE | Database client | PostgreSQL connection and schema management |
| `scripts/db-apply-schema.js` | ✅ ACTIVE | Schema application | Database initialization |
| `scripts/db-smoke.js` | ✅ ACTIVE | Database smoke tests | Connection and basic operations |

### Audit & Telemetry

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `apps/sentinel/src/audit/auditLogger.js` | ✅ ACTIVE | Audit logging | Structured audit entries |
| `docs/GOVERNED_TELEMETRY_HARMONIZER.md` | ✅ ACTIVE | Telemetry harmonization | Consistent event logging |
| `apps/sentinel/src/telemetry/` | ✅ ACTIVE | Telemetry components | Event emission and collection |

## COMMAND & API LAYER

### Command Processing

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `apps/sentinel/src/types/command.js` | ✅ ACTIVE | Command envelope types | TypeScript interfaces for commands |
| `apps/sentinel/src/commands/dispatch.js` | ✅ ACTIVE | Command dispatcher | Routes and executes commands |
| `apps/sentinel/src/commands/registry.js` | ✅ ACTIVE | Command registry | Surface and command mappings |

### API Endpoints

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `apps/api/server.js` | ✅ ACTIVE | API server | HTTP endpoints and routing |
| `apps/sentinel/src/commands/customeropsHandlers.js` | ✅ ACTIVE | Customer ops handlers | support.ticket.create, support.refund.request |
| `apps/sentinel/src/schemas/customerops.js` | ✅ ACTIVE | Validation schemas | Payload validation for customer ops |

## DEPLOYMENT & INFRASTRUCTURE

### Azure Deployment

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `docs/DEPLOYMENT.md` | ✅ ACTIVE | Deployment guide | Azure Container Apps setup |
| `azure/container-app.yaml` | ✅ ACTIVE | Container App config | Infrastructure as Code |
| `Dockerfile` | ✅ ACTIVE | Container image | Application containerization |

### Build & Release

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `docs/BUILD_MANUAL_REVIEW_2026-05-06.md` | ✅ ACTIVE | Build posture | Release and build guidelines |
| `package.json` | ✅ ACTIVE | Package configuration | Dependencies and scripts |
| `docs/RELEASE_v1.3.0.md` | ✅ ACTIVE | Current release | Live deployment evidence |

## VERIFICATION & TESTING

### Check Scripts

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `scripts/check-control-plane.js` | ✅ ACTIVE | Control plane verification | `npm run check:control-plane` |
| `scripts/check-governance-preflight.js` | ✅ ACTIVE | Governance checks | `npm run check:governance-preflight` |
| `scripts/check-customerops-command-routing.js` | ✅ ACTIVE | Customer ops routing | `npm run check:customerops` |
| `scripts/check-proof-ui-flow.js` | ✅ ACTIVE | Proof UI verification | `npm run check:proof-ui-flow` |

### Test Fixtures

| Document | Status | Purpose | Implementation |
|---|---|---|---|
| `fixtures/docking/` | ✅ ACTIVE | Docking test fixtures | Protocol testing data |
| `fixtures/faceplanes/` | ✅ ACTIVE | Face plane fixtures | Integration test data |
| `scripts/simulate-vendor-onboarding.js` | ✅ ACTIVE | Vendor simulation | Onboarding workflow testing |

## SIMILARITY GROUPS (From Repo Scan)

### Registry Components
- `apps/sentinel/src/commands/registry.js` - Command registry
- `apps/sentinel/src/surface/registry.js` - Surface registry

**Purpose:** Separate registries for command routing vs surface mappings

### Drift Monitoring
- `apps/sentinel/src/governance/core/driftMonitor.js` - Core governance drift
- `apps/sentinel/src/governance/vendorOnboarding/driftMonitor.js` - Vendor onboarding drift

**Purpose:** Domain-specific drift monitoring for different governance contexts

### Drift Configuration
- `apps/sentinel/src/governance/core/driftConfig.js` - Core drift config
- `apps/sentinel/src/governance/vendorOnboarding/driftConfig.js` - Vendor drift config

**Purpose:** Configuration separation for different drift monitoring domains

### Tilda Components
- `apps/sentinel/src/forethought/tilda.js` - Forethought domain
- `apps/sentinel/src/learning/tilda.js` - Learning domain

**Purpose:** Domain-specific AI/ML components

## ARCHITECTURAL PRINCIPLES

### Core Invariants

| Principle | Implementation | Evidence |
|---|---|---|
| **Governed Execution** | All commands route through governance | Live proof UI shows submit → block → approve → execute |
| **Face Plane Model** | Domain-specific interaction layers | Face plane SDK and docking protocol |
| **Immutable Audit** | All actions logged with receipts | Audit stream and receipt lookup verified |
| **Command Envelopes** | Structured command processing | TypeScript interfaces and validation |
| **Approval Gates** | High-risk actions require approval | Refund requests blocked at $25 threshold |

### Design Patterns

| Pattern | Implementation | Purpose |
|---|---|---|
| **Intent-Based Execution** | `executeIntent()` function | Decouples commands from implementation |
| **Receipt-Based Audit** | Build receipt pattern | Immutable audit trail with verification |
| **Governance Preflight** | Pre-execution validation | Prevents unauthorized actions |
| **Face Plane Contracts** | SDK-based integration | Standardized third-party integration |
| **Docking Protocol** | Capability handshake | Secure integration boundary |

## COMPONENT DEPENDENCY MAP

```
API Server (server.js)
├── Command Dispatcher (dispatch.js)
│   ├── Governance Preflight (preflight.js)
│   ├── Execution Guard (executionGuard.js)
│   └── Surface Registry (registry.js)
├── Control Plane (controlPlane/)
│   ├── Intent Registry (intentRegistry.js)
│   └── Intent Execution (execute.js)
├── Face Planes (faceplanes/)
│   ├── SDK (facePlaneSdk.js)
│   └── Domain Handlers (dealExecutionPlane.js)
├── Audit Logger (auditLogger.js)
├── Database Client (db/client.js)
└── Security (security/keyRegistry.js)
```

## NEXT ARCHITECTURAL WORK

1. **TypeScript Migration** - Convert JS components to TS (customerops already done)
2. **Face Plane Expansion** - Add more domain-specific face planes
3. **Governance Templates** - Implement validation-window and audit export templates
4. **Telemetry Enhancement** - Add blocked-path Log Analytics event
5. **API Standardization** - Consistent API patterns across all endpoints

---

**Architecture Status:** Core execution OS with governance, face planes, and audit fully implemented. Customer operations plane added. Ready for controlled expansion into new domains.