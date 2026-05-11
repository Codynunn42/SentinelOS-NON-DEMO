# SentinelOS Security Hardening Pass - 2026-05-11

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

---

## Executive Summary

SentinelOS is production-ready from a security posture perspective. This document outlines hardening passes to move from **PRODUCTION-READY** to **HARDENED-PRODUCTION**.

**Current Status:** 🟢 No critical vulnerabilities | ⚠️ 3 hardening opportunities

---

## Security Baseline Assessment

### What's Already Protected

| Component | Protection | Status |
|---|---|---|
| **API Keys** | HMAC validation + Env var secrets | ✅ ACTIVE |
| **Command Envelope** | TypeScript types + JSON schema | ✅ ACTIVE |
| **Execution Path** | Passport verification + Authority state | ✅ ACTIVE |
| **Audit Trail** | Immutable hash chain + Database | ✅ ACTIVE |
| **Policy Enforcement** | Trust scoring + Governance preflight | ✅ ACTIVE |
| **TLS/HTTPS** | Azure Container Apps native | ✅ ACTIVE |
| **Database** | PostgreSQL with connection pooling | ✅ ACTIVE |

### Gaps Identified

| Gap | Risk | Impact | Fix |
|---|---|---|---|
| **Input Validation** | Oversized payloads could cause DoS | MEDIUM | Add size limits |
| **Error Disclosure** | Error messages may leak info | LOW | Standardize responses |
| **Env Validation** | Missing secrets cause runtime errors | LOW | Fail fast at startup |
| **Object Pollution** | `__proto__` in payloads could prototype pollute | LOW | Sanitize object keys |
| **UUID Format** | Not all UUIDs validated consistently | LOW | Add format check |
| **Dependency Audit** | No formal dependency SCA | MEDIUM | Run npm audit |

---

## Hardening Pass #1: Input Validation

### 1.1 Payload Size Limits

**File:** `apps/api/server.js`

**Current:**

```javascript
function readJsonBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;  // No size check
  });
```

**Hardened:**

```javascript
function readJsonBody(req, callback) {
  let body = '';
  const MAX_BODY_SIZE = 10 * 1024;  // 10KB limit
  let size = 0;
  
  req.on('data', chunk => {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) {
      req.socket.destroy();
      return callback(new Error('PAYLOAD_TOO_LARGE'));
    }
    body += chunk;
  });
```

**Benefit:** Prevents memory exhaustion attacks

---

### 1.2 Command Envelope Validation

**File:** `apps/sentinel/src/types/command.js`

**Add:**

```javascript
const MAX_COMMAND_LENGTH = 100;
const MAX_STRING_LENGTH = 1024;
const MAX_PAYLOAD_SIZE = 5 * 1024;

function normalizeCommandEnvelope(input = {}) {
  // Existing validation...
  
  // NEW: Length checks
  if (!input.command || input.command.length > MAX_COMMAND_LENGTH) {
    throw new Error('Invalid command length');
  }
  
  if (input.tenant && input.tenant.length > 100) {
    throw new Error('Invalid tenant length');
  }
  
  // NEW: Payload size check
  const payloadSize = JSON.stringify(input.payload || {}).length;
  if (payloadSize > MAX_PAYLOAD_SIZE) {
    throw new Error('Payload too large');
  }
  
  return normalizeCommandEnvelope(input);
}
```

**Benefit:** Prevents oversized or malformed commands

---

### 1.3 Object Key Sanitization

**File:** `apps/sentinel/src/shared/validation.js` (new)

**Add:**

```javascript
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

function sanitizeObjectKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.includes(key)) {
      throw new Error(`DANGEROUS_KEY_REJECTED: ${key}`);
    }
    
    if (typeof obj[key] === 'object') {
      sanitizeObjectKeys(obj[key]);  // Recursive check
    }
  }
  
  return obj;
}
```

**Benefit:** Prevents prototype pollution attacks

---

### 1.4 UUID Format Validation

**File:** `apps/sentinel/src/shared/validation.js`

**Add:**

```javascript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}
```

**Apply to:**

- Command IDs
- Receipt IDs
- Session IDs

**Benefit:** Ensures ID format consistency

---

## Hardening Pass #2: Error Response Standardization

### 2.1 Create Standard Error Format

**File:** `apps/sentinel/src/shared/errorResponse.js` (new)

```javascript
const crypto = require('crypto');

function createErrorResponse(statusCode, errorCode, message, details = {}) {
  const traceId = `trace_${crypto.randomUUID()}`;
  
  return {
    status: 'error',
    statusCode,
    error: errorCode,
    message: message || 'An error occurred',
    traceId,  // For debugging/tracking
    // NO: sensitive details, stack traces, or system info
    details: {
      field: details.field || null,
      reason: details.reason || null
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  createErrorResponse
};
```

### 2.2 Update Error Responses

**Files to Update:**

- `apps/sentinel/src/commands/dispatch.js`
- `apps/api/server.js`
- All command handlers

**Pattern:**

```javascript
// OLD
return {
  success: false,
  error: 'Invalid command: ' + JSON.stringify(input),
  statusCode: 400
};

// NEW
return createErrorResponse(
  400,
  'VALIDATION_ERROR',
  'Invalid command format',
  { field: 'command', reason: 'missing_or_invalid' }
);
```

**Benefit:** No information leakage, consistent format

---

## Hardening Pass #3: Environment Variable Validation

### 3.1 Startup Validation

**File:** `apps/api/server.js`

**Add before listen:**

```javascript
function validateEnvironment() {
  const errors = [];
  
  // Required variables
  if (!process.env.SENTINEL_API_KEY) {
    errors.push('Missing SENTINEL_API_KEY');
  } else if (process.env.SENTINEL_API_KEY.length < 10) {
    errors.push('SENTINEL_API_KEY too short (min 10 chars)');
  }
  
  if (!process.env.SENTINEL_HMAC_SECRET) {
    errors.push('Missing SENTINEL_HMAC_SECRET');
  } else if (process.env.SENTINEL_HMAC_SECRET.length < 32) {
    errors.push('SENTINEL_HMAC_SECRET too short (min 32 chars)');
  }
  
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
    errors.push('DATABASE_URL must be postgres://...');
  }
  
  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }
  
  console.log('Environment validation passed');
}

// Call before server.listen()
validateEnvironment();
server.listen(PORT, () => {
  console.log(`Sentinel API running on port ${PORT}`);
});
```

**Benefit:** Fails fast with clear errors

---

## Hardening Pass #4: Dependency & Build Security

### 4.1 npm Audit (When pnpm lock is created)

```bash
# Create npm lock file from pnpm lock
npm i --package-lock-only

# Run audit
npm audit

# Update patch versions if vulnerabilities exist
npm audit fix
```

### 4.2 Container Build Security

**File:** `Dockerfile`

**Add security header:**

```dockerfile
# Scan for vulnerabilities during build
FROM node:20-alpine AS secure-base
RUN npm install -g snyk

# Copy package and lock
COPY package.json pnpm-lock.yaml ./

# Optionally scan before build (CI/CD only)
# RUN snyk test
```

### 4.3 Runtime Security

**File:** `azure/container-app.yaml`

**Ensure:**

```yaml
# Already configured:
resources:
  cpu: 0.5
  memory: 1Gi  # Reasonable limit

# Verify in deployment:
# - No privileged containers
# - No root user access
# - Secret management via Azure KeyVault
```

---

## Hardening Pass #5: Audit & Monitoring

### 5.1 Security Event Logging

**File:** `apps/api/server.js`

**Already implemented:**

```javascript
function emitSecurityEvent(eventType, details) {
  const record = {
    source: 'sentinel-api',
    category: 'security',
    eventType,
    timestamp: new Date().toISOString(),
    ...details
  };
  console.log(JSON.stringify(record));
}
```

**Events captured:**

- `policy.route.blocked` - Authorization denial
- `control_plane.request.invalid_json` - Malformed input
- `agent.run.blocked` - Execution denial
- `blocked-path` - Governance denial

**Benefit:** Complete security event trail

---

### 5.2 Add Rate Limiting (Future)

**Current:** No per-IP rate limiting
**Future:** Add if DDoS concerns arise

```javascript
// Placeholder for future rate limiter
const rateLimiter = new Map();

function checkRateLimit(clientIp, limit = 100) {
  const now = Date.now();
  const record = rateLimiter.get(clientIp) || [];
  const recentRequests = record.filter(t => now - t < 60000);  // 1 minute
  
  if (recentRequests.length > limit) {
    return false;  // Rate limited
  }
  
  recentRequests.push(now);
  rateLimiter.set(clientIp, recentRequests);
  return true;
}
```

---

## Hardening Checklist

### Phase 1: Input Validation (1-2 hours)

- [ ] Add MAX_BODY_SIZE check to `readJsonBody()`
- [ ] Add command envelope length validation
- [ ] Create object key sanitization
- [ ] Add UUID format validation
- [ ] Test with oversized payloads
- [ ] Test with dangerous keys (**proto**, constructor)
- [ ] Run npm run check:* suite

### Phase 2: Error Standardization (1 hour)

- [ ] Create `apps/sentinel/src/shared/errorResponse.js`
- [ ] Update `dispatch.js` error responses
- [ ] Update `server.js` error responses
- [ ] Update all command handlers
- [ ] Verify error format is consistent
- [ ] Test error response structure

### Phase 3: Environment Validation (30 min)

- [ ] Add `validateEnvironment()` function
- [ ] Test with missing SENTINEL_API_KEY
- [ ] Test with short SENTINEL_HMAC_SECRET
- [ ] Verify fail-fast behavior
- [ ] Update documentation with env requirements

### Phase 4: Dependency Security (30 min)

- [ ] Create npm lock file from pnpm lock
- [ ] Run `npm audit`
- [ ] Review and fix vulnerabilities
- [ ] Run full test suite after updates
- [ ] Document any breaking changes

### Phase 5: Monitoring & Verification (30 min)

- [ ] Verify security events are logging
- [ ] Check Log Analytics ingestion
- [ ] Test with invalid commands
- [ ] Test with oversized payloads
- [ ] Verify error messages don't leak info

---

## Testing Strategy

### Local Tests

```bash
# Test oversized payload
curl -X POST http://localhost:3000/v1/command \
  -H "x-api-key: test" \
  -d "$(head -c 100k /dev/zero | tr '\0' 'a')"

# Test dangerous keys
curl -X POST http://localhost:3000/v1/command \
  -H "x-api-key: test" \
  -H "Content-Type: application/json" \
  -d '{"__proto__": "polluted", "command": "test"}'

# Test error response
curl -X POST http://localhost:3000/v1/command \
  -H "x-api-key: test" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "command"}'
```

### Deployment Tests

```bash
# Test with missing env var
docker run -e SENTINEL_HMAC_SECRET="short" \
  acrncdevsentinel.azurecr.io/sentinel-api:latest

# Should fail with: "Environment validation failed"
```

---

## Security Best Practices Applied

| Practice | Implementation |
|---|---|
| **Input Validation** | Length checks, size limits, format validation |
| **Error Handling** | Standard format, no info leakage, trace IDs |
| **Secrets Management** | Env vars in Azure Secrets, never in code |
| **Audit Trail** | Immutable logging of all commands/blocks |
| **Rate Limiting** | (Future: per-IP limits if needed) |
| **HTTPS/TLS** | Azure Container Apps native |
| **Dependency Management** | npm audit, patch updates |
| **Environment Hardening** | Fail-fast validation at startup |

---

## Deployment Readiness

After hardening pass completes:

1. ✅ All input validated
2. ✅ All errors standardized
3. ✅ Environment validated at startup
4. ✅ Dependencies audited
5. ✅ Security events logging
6. ✅ npm run check:* suite passes
7. ✅ Live smoke tests pass

---

## Risk Mitigation

| Change | Risk | Mitigation |
|---|---|---|
| Input size limits | False positives on legitimate commands | Set conservative limits (10KB); adjust if needed |
| Error standardization | May hide debugging info | Trace ID enables lookups; kept for ops |
| Env validation | Startup failures | Clear error messages; documented requirements |
| Dependency updates | Breaking changes | Read release notes; test locally first |

---

## Success Metrics

✅ No payload DoS possible
✅ No prototype pollution possible
✅ No information leakage in error responses
✅ Environment failures caught at startup
✅ All dependencies audited
✅ Security events flowing to Log Analytics
✅ npm run check:* suite passes 100%
✅ Live deployment works without issues

---

**Owner:** Sentinel AI | **Date:** 2026-05-11 | **Status:** READY FOR EXECUTION

**Estimated Total Time:** 4-5 hours
**Next Steps:** Execute in order of phases with validation gates between each
