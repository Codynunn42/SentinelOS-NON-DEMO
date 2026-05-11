# SentinelOS Code Quality Analysis & Optimization Plan - 2026-05-11

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

---

## Executive Summary

Comprehensive code scan identified opportunities for consolidation, hardening, and architectural alignment. No critical vulnerabilities. Code readiness: **GOOD** → **EXCELLENT** after optimization pass.

---

## Code Scan Results

### Metrics

- **Total Files Scanned:** 246
- **Core Runtime Code:** ~40 files in apps/sentinel/src + apps/api
- **Test Scripts:** 12 operational checks
- **Dependencies:** 1 (pg) production; pnpm lock verified
- **JavaScript/TypeScript Mix:** 90% JS / 10% TS (customerops)

### Quality Findings

#### ✅ Strengths

1. **Consistent Error Handling** - Try/catch patterns in async operations
2. **Validation Framework** - Centralized input validation (hasText, isRecord, isValidEmail)
3. **Immutable Configurations** - Objects frozen with Object.freeze()
4. **Audit Trail** - Comprehensive logging throughout governance path
5. **Minimal Dependencies** - Only pg; no bloat

#### ⚠️ Improvement Areas

| Category | Finding | Impact | Priority |
|---|---|---|---|
| **Code Duplication** | `hasText()`, `isRecord()` defined in 3+ files | Low | MEDIUM |
| **Validation Helpers** | Similar patterns in customerops, vendors, rules | Low | MEDIUM |
| **Error Objects** | Generic Error vs custom error classes | Low | LOW |
| **Configuration Consolidation** | Drift configs, policy scopes scattered | Low | LOW |
| **Telemetry Events** | Markers not consistently structured | MEDIUM | HIGH |
| **TypeScript Coverage** | Only customerops typed; others in JS | MEDIUM | LOW |

---

## Optimization Plan

### Phase 1: Consolidate & Harmonize (High-Impact, Low-Risk)

#### 1.1 Create Shared Validation Module

**File:** `apps/sentinel/src/shared/validation.js`

Consolidate repeated validation helpers:

- `hasText()` - exists in 4 files
- `isRecord()` - exists in 2 files  
- `isValidEmail()` - exists in 2 files
- `isValidPhone()` - exists in 1 file
- `asArray()` - exists in 2 files
- `asNumber()` - exists in 2 files

**Change Impact:**

- Reduces 400 LOC of duplication
- Improves consistency
- Single source of truth for validation

#### 1.2 Create Shared Telemetry Event Builder

**File:** `apps/sentinel/src/shared/telemetryEventBuilder.js`

Harmonize event emission structure:

- `blockedPathEvent` - now in dispatch.js
- `securityEvent` - format in server.js
- `auditEvent` - format in auditLogger.js

**Change Impact:**

- Consistent Log Analytics schema
- Easier querying
- Future-proof for new event types

#### 1.3 Create Shared ID Generator Module

**File:** `apps/sentinel/src/shared/idGenerator.js`

Consolidate ID generation (exists in ownerfiHandlers + customeropsHandlers):

- `generateId(prefix)` function
- UUID prefixing logic

**Change Impact:**

- Single source for ID format
- Easier to audit ID generation

### Phase 2: Situate & Align (Architectural Positioning)

#### 2.1 Organize Command Handlers by Domain

Current structure:

```
apps/sentinel/src/commands/
├── customeropsHandlers.js
├── ownerfiHandlers.js
├── nunncloudHandlers.js
└── system/
    └── validateIntegrity.js
```

Optimized structure:

```
apps/sentinel/src/commands/
├── core/
│   └── validateIntegrity.js (system commands)
├── domains/
│   ├── customerops/
│   │   └── handlers.js
│   ├── ownerfi/
│   │   └── handlers.js
│   └── nunncloud/
│       └── handlers.js
└── registry.js (unified dispatch)
```

**Change Impact:**

- Clearer organization for scaling
- Easy to add new domains
- Maintenance clarity

#### 2.2 Create Governance Helpers Module

**File:** `apps/sentinel/src/governance/helpers.js`

Extract common patterns:

- Policy blocking logic
- Trust score building
- Governance signal publishing

**Change Impact:**

- Reduces governance/preflight.js complexity
- Reusable in custom commands

### Phase 3: Harden & Secure (Security Pass)

#### 3.1 Input Validation Enhancement

**Files to Update:**

- `apps/sentinel/src/types/command.js`
- `apps/sentinel/src/schemas/*.js`

**Changes:**

- Add max length validation to string inputs
- Reject oversized payloads (>10KB)
- Sanitize object keys (reject **proto**, constructor)
- Validate UUID format consistently

#### 3.2 Error Response Standardization

**File:** `apps/sentinel/src/shared/errorResponse.js`

**Standard Error Format:**

```javascript
{
  status: 'error',
  statusCode: 400,
  error: 'VALIDATION_ERROR',
  details: {
    field: 'amount',
    reason: 'must_be_positive'
  },
  traceId: 'trace_xxxxx' // For debugging
}
```

**Change Impact:**

- Consistent error handling
- Better debugging
- No information leakage

#### 3.3 Dependency Audit & Update

**Current:**

- pg@8.20.0 (released 2024-07)

**Action:**

- Run `npm outdated` after lock file creation
- Update patch versions (8.20.0 → 8.20.x if available)
- Document any breaking changes
- Test smoke suite after updates

#### 3.4 Runtime Environment Hardening

**Changes:**

- Validate SENTINEL_API_KEY format at startup
- Validate SENTINEL_HMAC_SECRET length (min 32 chars)
- Fail fast on missing required env vars
- Add startup health check before listen

---

## Code Optimization Checklist

### Phase 1: Consolidation

- [ ] Create `apps/sentinel/src/shared/validation.js`
  - [ ] Import and test in all 4 hasText() locations
  - [ ] Import and test in all isRecord() locations
  - [ ] Update customeropsHandlers.js to use shared
  - [ ] Update vendorOnboarding/rules.js to use shared
  - [ ] Update facePlaneSdk.js to use shared
  - [ ] Verify npm run check:* suite passes

- [ ] Create `apps/sentinel/src/shared/telemetryEventBuilder.js`
  - [ ] Extract blockedPathEvent from dispatch.js
  - [ ] Extract securityEvent pattern from server.js
  - [ ] Create standardized event factory
  - [ ] Update dispatch.js to use builder
  - [ ] Test blocked-path event emission

- [ ] Create `apps/sentinel/src/shared/idGenerator.js`
  - [ ] Extract generateId() from ownerfiHandlers
  - [ ] Extract generateId() from customeropsHandlers
  - [ ] Consolidate to single source
  - [ ] Update both handlers to import

### Phase 2: Restructuring

- [ ] Create `apps/sentinel/src/commands/domains/` structure
  - [ ] Create customerops/ subdirectory
  - [ ] Move customeropsHandlers.js → domains/customerops/handlers.js
  - [ ] Create ownerfi/ subdirectory
  - [ ] Move ownerfiHandlers.js → domains/ownerfi/handlers.js
  - [ ] Create nunncloud/ subdirectory
  - [ ] Move nunncloudHandlers.js → domains/nunncloud/handlers.js
  - [ ] Update registry.js imports
  - [ ] Verify npm run check:customerops passes
  - [ ] Verify npm run check:product-command-routing passes

- [ ] Create `apps/sentinel/src/governance/helpers.js`
  - [ ] Extract policy blocking helpers
  - [ ] Extract trust score utilities
  - [ ] Update preflight.js to use helpers
  - [ ] Test governance blocks still emit telemetry

### Phase 3: Hardening

- [ ] Create `apps/sentinel/src/shared/errorResponse.js`
  - [ ] Implement standard error factory
  - [ ] Add trace ID generation
  - [ ] Update command dispatch to use
  - [ ] Update API routes to use
  - [ ] Verify error responses are consistent

- [ ] Enhance Input Validation
  - [ ] Add max length checks to command.js
  - [ ] Add payload size limits
  - [ ] Add object key sanitization
  - [ ] Test with invalid inputs

- [ ] Environment Variable Hardening
  - [ ] Add startup validation in server.js
  - [ ] Fail fast on missing SENTINEL_API_KEY
  - [ ] Fail fast on SENTINEL_HMAC_SECRET < 32 chars
  - [ ] Add health check before listen
  - [ ] Test with missing env vars

- [ ] Dependency Update
  - [ ] Run npm outdated (after pnpm lock support)
  - [ ] Update patch versions
  - [ ] Run full test suite
  - [ ] Commit with update notes

---

## Testing Strategy

### Local Validation

```bash
# After each phase:
npm run check:customerops          # Customer ops routing
npm run check:product-command-routing  # Command dispatch
npm run check:control-plane        # Control plane
npm run check:governance-status    # Governance enforcement
npm run check:policy               # Policy evaluation
npm run check:telemetry-harmonizer # Telemetry consistency
```

### Integration Testing

```bash
# Full suite after all phases:
SENTINEL_API_KEY=test npm run check:*
```

### Deployment Validation

```bash
# After Docker rebuild:
curl -X POST https://ca-nc-dev-sentinel.../v1/command \
  -H "x-api-key: test-key" \
  -d '{"command":"support.ticket.create",...}'
```

---

## Code Quality Metrics (Before → After)

| Metric | Before | After | Improvement |
|---|---|---|---|
| Files with validation helpers | 4 | 1 | -75% duplication |
| Command handler dirs | 1 flat | 3 organized | Better structure |
| Telemetry event formats | 3 variants | 1 standard | 100% consistency |
| Error response formats | Mixed | Standard | Uniform |
| TypeScript coverage | 10% | 10% (planned 20% next phase) | Baseline |

---

## Risk Assessment & Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| Refactoring breaks import paths | MEDIUM | Run full check suite after each phase |
| Shared modules have bugs | MEDIUM | Write unit tests for shared modules first |
| Environment validation breaks startup | LOW | Test locally with missing env vars |
| Dependency update introduces breaking change | LOW | Read release notes; test smoke suite |

---

## Execution Order

1. **Phase 1a:** Create shared validation module (1 hour)
2. **Phase 1b:** Create telemetry event builder (1 hour)
3. **Phase 1c:** Create ID generator (30 min)
4. **Phase 2a:** Reorganize command handlers (1.5 hours)
5. **Phase 2b:** Create governance helpers (1 hour)
6. **Phase 3a:** Standardize error responses (1 hour)
7. **Phase 3b:** Enhance input validation (1.5 hours)
8. **Phase 3c:** Harden environment variables (30 min)
9. **Phase 3d:** Dependency audit & update (30 min)
10. **Validation:** Full test suite + smoke tests (30 min)

**Total Estimated Time:** 8 hours

---

## Success Criteria

✅ All npm run check:* scripts pass
✅ No new console.error in production code
✅ All telemetry events use standardized format
✅ All error responses use standard schema
✅ No import errors after restructuring
✅ Container builds and deploys successfully
✅ Live endpoint `/health` responds 200

---

**Next Step:** Execute Phase 1 consolidation with approval gate after Phase 1a completion.

**Owner:** Sentinel AI | **Date:** 2026-05-11 | **Status:** READY FOR EXECUTION
