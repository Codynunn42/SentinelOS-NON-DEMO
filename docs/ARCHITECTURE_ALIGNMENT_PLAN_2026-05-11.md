# SentinelOS Code Architecture Alignment - 2026-05-11

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

---

## Purpose

This document aligns the physical code organization with the SentinelOS governance architecture, ensuring code structure reflects operational model.

---

## Current Architecture

```
SentinelOS Operational Model
├── Control Plane
│   ├── Intent Registry
│   └── Execution Engine
├── Face Planes (Domain-Specific)
│   ├── Customer Operations
│   ├── OwnerFi Deal Execution
│   └── Nunncloud System
├── Governance Layer
│   ├── Preflight Checks
│   ├── Execution Guard
│   └── Policy Engine
├── Audit & Telemetry
│   ├── Audit Logger
│   └── Telemetry Harmonizer
└── Security
    ├── Key Registry
    └── Execution Passports
```

## Current Code Structure

```
apps/sentinel/src/
├── commands/
│   ├── customeropsHandlers.js
│   ├── ownerfiHandlers.js
│   ├── nunncloudHandlers.js
│   ├── system/validateIntegrity.js
│   ├── registry.js
│   └── dispatch.js
├── controlPlane/
│   ├── index.js
│   ├── execute.js
│   ├── validate.js
│   └── intentRegistry.js
├── faceplanes/
│   ├── sdk/facePlaneSdk.js
│   ├── openai/openaiAuditAdapter.js
│   └── (future expansions)
├── governance/
│   ├── preflight.js
│   ├── policyEngine.js
│   ├── executionGuard.js
│   ├── authorityState.js
│   ├── core/
│   │   ├── driftConfig.js
│   │   └── driftMonitor.js
│   └── vendorOnboarding/
│       ├── rules.js
│       └── engine.js
├── audit/
│   └── auditLogger.js
├── telemetry/
│   ├── telemetryHarmonizer.js
│   ├── telemetryController.js
│   └── telemetrySchema.js
├── security/
│   ├── keyRegistry.js
│   └── (future expansions)
└── (other utilities)
```

## Gap Analysis: Alignment Issues

| Architecture Component | Current Code Location | Alignment Issue | Priority |
|---|---|---|---|
| **Face Planes** | `faceplanes/`, `commands/` split | Handlers mixed with registry | HIGH |
| **Domain Boundaries** | Handlers flat in commands/ | No clear domain separation | HIGH |
| **Shared Utilities** | Scattered across multiple files | Duplication of hasText, isRecord, etc | MEDIUM |
| **Governance Policy** | `governance/policyEngine.js` | Single file; should reflect domain-specific policies | MEDIUM |
| **Telemetry Events** | `telemetry/`, `dispatch.js`, `server.js` | Event building scattered | MEDIUM |
| **Security** | `security/keyRegistry.js` only | Execution passport logic in governance/ | LOW |

---

## Proposed Aligned Structure

### New Organization: Domain-Centric

```
apps/sentinel/src/
├── shared/                           # Shared utilities
│   ├── validation.js                 # hasText, isRecord, isValidEmail, etc
│   ├── telemetryEventBuilder.js      # Event factory
│   ├── idGenerator.js                # UUID prefixing
│   ├── errorResponse.js              # Standard error format
│   └── helpers.js                    # Common functions
│
├── controlPlane/                     # Unchanged - core orchestration
│   ├── index.js
│   ├── execute.js
│   ├── validate.js
│   └── intentRegistry.js
│
├── faceplanes/                       # Face plane SDK & integrations
│   ├── sdk/facePlaneSdk.js
│   ├── openai/
│   │   └── openaiAuditAdapter.js
│   └── (future: gcp/, azure/, etc)
│
├── domains/                          # Domain-specific command handlers
│   ├── customerops/
│   │   ├── handlers.js               # Move from commands/
│   │   ├── schemas.js                # Move from schemas/
│   │   └── plane.js                  # New: export domain metadata
│   ├── ownerfi/
│   │   ├── handlers.js               # Move from commands/
│   │   └── (future: schemas, plane)
│   ├── nunncloud/
│   │   ├── handlers.js               # Move from commands/
│   │   └── (future: schemas, plane)
│   └── system/
│       ├── validateIntegrity.js      # Move from commands/system/
│       └── (future: other system commands)
│
├── commands/                         # Command dispatch & registry
│   ├── registry.js                   # Updated to load from domains/
│   ├── dispatch.js                   # Updated to use shared modules
│   └── (routers for each domain)
│
├── governance/                       # Policy & enforcement
│   ├── policyEngine.js               # Core policy evaluation
│   ├── preflight.js                  # Pre-execution checks
│   ├── executionGuard.js             # Execution enforcement
│   ├── authorityState.js             # State tracking
│   ├── helpers.js                    # New: common patterns
│   ├── core/
│   │   ├── driftConfig.js
│   │   ├── driftMonitor.js
│   │   └── (core governance domain)
│   └── vendorOnboarding/
│       ├── rules.js
│       ├── engine.js
│       └── (vendor onboarding domain)
│
├── audit/                            # Immutable audit trail
│   └── auditLogger.js
│
├── telemetry/                        # Telemetry & observability
│   ├── telemetryHarmonizer.js
│   ├── telemetryController.js
│   ├── telemetrySchema.js
│   └── (uses shared/telemetryEventBuilder.js)
│
└── security/                         # Security & authentication
    ├── keyRegistry.js
    └── (future: passports, mfa, etc)
```

---

## Mapping: Architecture to Code

### Control Plane Layer

**Architecture:** Intent Registry + Execution Engine

**Code:**

```
controlPlane/
├── intentRegistry.js          # Intent definitions
├── execute.js                 # ExecuteIntent function
├── validate.js                # Input validation
└── index.js                   # Entry point
```

**Alignment:** ✅ Already clean separation

---

### Face Planes Layer

**Architecture:** Domain-specific interaction surfaces

**Code (Proposed):**

```
faceplanes/                    # SDK & protocols
└── sdk/facePlaneSdk.js

domains/customerops/           # CustomerOps face plane
├── handlers.js                # Handler implementations
├── schemas.js                 # Validation schemas
└── plane.js                   # Domain metadata

domains/ownerfi/               # OwnerFi face plane
├── handlers.js
└── plane.js

domains/nunncloud/             # Nunncloud face plane
├── handlers.js
└── plane.js
```

**Alignment:** Map each handler domain to a face plane concept

---

### Governance Layer

**Architecture:** Preflight checks, Policy engine, Execution guard, Authority state

**Code (Current):**

```
governance/
├── policyEngine.js            # Policy evaluation
├── preflight.js               # Pre-execution
├── executionGuard.js          # Execution enforcement
├── authorityState.js          # State tracking
├── core/                      # Core governance domain
├── vendorOnboarding/          # Vendor onboarding domain
└── (future domains)
```

**Alignment:** ✅ Already aligned with governance architecture. Add:

- `governance/helpers.js` for common patterns
- Domain-specific policy modules as governance expands

---

### Audit & Telemetry Layer

**Architecture:** Immutable audit trail + Telemetry harmonization

**Code (Proposed):**

```
audit/auditLogger.js           # Immutable logging
telemetry/
├── telemetryHarmonizer.js
├── telemetryController.js
├── telemetrySchema.js
└── (uses shared/telemetryEventBuilder.js)
```

**Alignment:** ✅ Add shared event builder for consistency

---

### Security Layer

**Architecture:** API key validation, HMAC signing, Execution passports

**Code (Proposed):**

```
security/
├── keyRegistry.js             # API key management
├── executionPassport.js       # Move from governance/
└── (future: mfa, rbac)
```

**Alignment:** Consolidate execution passport logic from governance

---

## Implementation Strategy

### Step 1: Create Shared Module Layer

- Build `shared/validation.js` with consolidated utilities
- Build `shared/telemetryEventBuilder.js` for event factory
- Build `shared/errorResponse.js` for consistent errors
- Build `shared/idGenerator.js` for ID generation

### Step 2: Reorganize Domain Handlers

- Create `domains/customerops/` structure
- Move `customeropsHandlers.js` → `domains/customerops/handlers.js`
- Move `apps/sentinel/src/schemas/customerops.js` → `domains/customerops/schemas.js`
- Create `domains/customerops/plane.js` with metadata
- Repeat for ownerfi/, nunncloud/, system/

### Step 3: Update Command Registry

- Update `commands/registry.js` to auto-load from `domains/*/handlers.js`
- Update `commands/dispatch.js` to use shared modules
- Verify import paths resolve correctly

### Step 4: Consolidate Governance Helpers

- Create `governance/helpers.js` with common patterns
- Extract policy blocking logic from `preflight.js`
- Move execution passport logic to `security/`

### Step 5: Standardize Telemetry

- Update event emission to use `shared/telemetryEventBuilder.js`
- Ensure all events follow schema
- Test Log Analytics ingestion

---

## Benefits

| Benefit | Impact |
|---|---|
| **Clarity** | Code organization mirrors operational architecture |
| **Scalability** | Easy to add new domains/face planes |
| **Maintenance** | Clear boundaries reduce cross-cutting concerns |
| **Testing** | Domain isolation enables targeted testing |
| **Onboarding** | New developers see architecture immediately |
| **Documentation** | Code structure becomes self-documenting |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Import path breakage | Run full test suite after restructuring |
| Runtime errors from path changes | Test locally before deployment |
| Increased file count | Organize under clear hierarchy |
| Refactoring complexity | Do in phases with validation gates |

---

## Alignment Checklist

- [ ] Create `shared/` module layer
- [ ] Consolidate validation helpers
- [ ] Create telemetry event builder
- [ ] Reorganize domain handlers
- [ ] Update command registry
- [ ] Update command dispatch
- [ ] Create governance helpers
- [ ] Move security logic appropriately
- [ ] Update all import paths
- [ ] Run full npm run check:* suite
- [ ] Test live deployment

---

## Success Metrics

✅ Code structure visually matches architecture diagram
✅ No cross-domain imports (except through registry)
✅ All shared utilities in single `shared/` location
✅ All telemetry events use standard format
✅ All error responses use standard schema
✅ npm run check:* suite passes 100%
✅ Live deployment works without issues

---

**Owner:** Sentinel AI | **Date:** 2026-05-11 | **Status:** READY TO EXECUTE

**Next:** Execute Phase 1 consolidation, then restructure command handlers.
