# Gate 6: API Routes

**Objective:** Expose REST API endpoints for receipt queries, delegation management, and risk status

**Product Value:** Turn receipts and governance data into queryable REST APIs for integration with frontend, dashboards, and external tools

**Version:** v1 (read-only operations on receipts and delegations; risk status queries)

---

## Requirements

### Functional Requirements

#### Receipt Management Endpoints

1. **List Receipts**
   - `GET /api/executive/receipts?skip=0&limit=100&status=executed&command=repo.control.workflow.diagnose&executor=user@example.com`
   - Returns paginated receipts with filters
   - Parameters: `skip` (default 0), `limit` (default 100, max 1000), `status`, `command`, `executor`, `startDate`, `endDate`
   - Response: `{ data: ReceiptEntry[], total: number, skip: number, limit: number }`
   - Status: 200 OK, 400 Bad Request (invalid parameters), 401 Unauthorized

2. **Get Receipt by ID**
   - `GET /api/executive/receipts/{id}`
   - Returns single receipt with full details
   - Response: `{ data: ReceiptEntry }`
   - Status: 200 OK, 404 Not Found, 401 Unauthorized

3. **Export Receipts**
   - `GET /api/executive/receipts/export?format=json&startDate=2026-07-01&endDate=2026-07-03`
   - Returns receipts in bulk format (JSON Lines, CSV, or Parquet)
   - Parameters: `format` (json|csv|jsonl), `startDate`, `endDate`, `status`, `command`
   - Response: Streaming file download
   - Status: 200 OK, 400 Bad Request, 401 Unauthorized

4. **Receipt Statistics**
   - `GET /api/executive/receipts/stats?window=24h`
   - Returns aggregate statistics and time-series data
   - Parameters: `window` (1h|6h|24h|7d|30d), `groupBy` (hour|day|command|executor|status)
   - Response: `{ executedCount: number, blockedCount: number, avgRiskScore: number, avgExecutionTime: number, timeseries: [...], topCommands: [...], topExecutors: [...] }`
   - Status: 200 OK, 400 Bad Request, 401 Unauthorized

#### Delegation Management Endpoints

1. **List Delegations**
   - `GET /api/executive/delegations?grantedTo=user@example.com&command=repo.control.workflow.diagnose&scope=global`
   - Returns active and historical delegations
   - Parameters: `grantedBy`, `grantedTo`, `command`, `scope`, `includeRevoked` (default false)
   - Response: `{ data: DelegationRule[], total: number }`
   - Status: 200 OK, 400 Bad Request, 401 Unauthorized

2. **Get Delegation by ID**
   - `GET /api/executive/delegations/{id}`
   - Returns single delegation with full details
   - Response: `{ data: DelegationRule }`
   - Status: 200 OK, 404 Not Found, 401 Unauthorized

3. **Grant Delegation** (v1: observation only; no writes)
   - `POST /api/executive/delegations` (NOT YET IN v1)
   - Future: Create new delegation for a principal
   - Status in v1: 501 Not Implemented

4. **Revoke Delegation** (v1: observation only; no revokes)
   - `DELETE /api/executive/delegations/{id}` (NOT YET IN v1)
   - Future: Revoke delegation
   - Status in v1: 501 Not Implemented

#### Risk Assessment Endpoints

1. **Get Risk Status**
   - `GET /api/executive/risk/status`
   - Returns current infrastructure health and risk assessment
   - Response: `{ overallScore: number, decision: 'pass'|'warn'|'block', services: HealthStatus[], factors: RiskFactors, timestamp: string }`
   - Status: 200 OK, 503 Service Unavailable (if health checks fail), 401 Unauthorized

2. **Get Risk Factors**
   - `GET /api/executive/risk/factors?window=24h`
   - Returns historical risk factors over time
   - Parameters: `window` (1h|6h|24h|7d|30d), `granularity` (minute|hour|day)
   - Response: `{ timeseries: { timestamp: string, infraHealth: number, recentIncidents: number, deploymentStatus: number, resourcePressure: number }[], summary: RiskFactors }`
   - Status: 200 OK, 400 Bad Request, 401 Unauthorized

### Non-Functional Requirements

- **Authentication:** All endpoints require valid principal ID (from delegation context or identity graph)
  - Header: `X-Principal-Id: user@example.com` OR Bearer token (future)
  - Response: 401 Unauthorized if missing/invalid

- **Authorization:** v1 — any authenticated principal can query receipts and delegations
  - Future: RBAC-based visibility (see only own receipts, delegations, or team scope)

- **Rate Limiting:**
  - 100 requests per minute per principal
  - Response: 429 Too Many Requests if exceeded

- **Response Format:** JSON (application/json)
  - Timestamps: ISO 8601
  - Error format: `{ error: string, details?: string, code?: string }`

- **Performance:**
  - List receipts: <200ms for 100 records
  - Get receipt by ID: <50ms
  - Export: streaming (no timeout)
  - Risk status: <100ms

---

## Implementation Plan

### Phase 1: Route Definitions & Services (Gate 6)

1. **Create API route definitions** (`api/routes.ts`)
   - Define route handlers for all endpoints
   - Input validation, error handling
   - Response serialization

2. **Create query/filter service** (`api/receipt-queries.ts`)
   - Filters, pagination, sorting
   - Exports (JSON, CSV, JSONL, Parquet)
   - Statistics aggregation

3. **Create delegation queries service** (`api/delegation-queries.ts`)
   - List, filter, get by ID
   - Visibility checks (future RBAC)

4. **Create risk service** (`api/risk-api.ts`)
   - Current risk status
   - Historical factors
   - Caching for performance

5. **Express adapter** (`api/express-adapter.ts`)
   - Mount routes on Express app
   - Middleware (auth, rate limiting)
   - Error handling

6. **Test suite** (`api/__tests__/routes.test.ts`)
   - Endpoint tests
   - Filter tests
   - Export format tests
   - Error handling tests

### Phase 2: Frontend Integration (Gate 7)

- React components consuming API endpoints
- Real-time polling of `/api/executive/risk/status`
- Pagination UI for receipts
- Export button for delegations

### Phase 3: Performance Optimization (Future)

- Receipt query indexing (database)
- Risk score caching (Redis)
- Export streaming (async jobs)

---

## API Response Examples

### List Receipts

```bash
GET /api/executive/receipts?skip=0&limit=10&command=repo.control.workflow.diagnose
```

**Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "command": "repo.control.workflow.diagnose",
      "tenant": "sentinel-prod",
      "executor": "user@example.com",
      "timestamp": "2026-07-02T15:30:45.123Z",
      "status": "executed",
      "payload": {
        "repositoryId": "abc123",
        "filter": "workflow_id=wf-001"
      },
      "authorityCheckResult": {
        "allowed": true,
        "principalId": "user@example.com",
        "command": "repo.control.workflow.diagnose",
        "reasons": ["Principal is active and authenticated"],
        "delegatedBy": "admin@example.com",
        "delegationExpiresAt": "2026-08-02T00:00:00.000Z"
      },
      "riskGateOutcome": {
        "decision": "pass",
        "score": 0.05,
        "infraFactors": {
          "infraHealth": 0.1,
          "recentIncidents": 0,
          "deploymentStatus": 0,
          "resourcePressure": 0.2
        },
        "issues": [],
        "mitigations": ["Read-only command; minimal operational risk"]
      },
      "principalContext": {
        "id": "user@example.com",
        "displayName": "John Doe",
        "email": "user@example.com",
        "groups": ["developers", "sentinel-ops"],
        "roles": ["workflow-auditor"]
      },
      "signature": "sha256:abc123..."
    }
  ],
  "total": 1247,
  "skip": 0,
  "limit": 10
}
```

### Get Receipt by ID

```bash
GET /api/executive/receipts/550e8400-e29b-41d4-a716-446655440000
```

**Response:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "command": "repo.control.workflow.diagnose",
    "status": "executed",
    "...": "same as list response"
  }
}
```

### Receipt Statistics

```bash
GET /api/executive/receipts/stats?window=24h&groupBy=hour
```

**Response:**

```json
{
  "executedCount": 1247,
  "blockedCount": 3,
  "avgRiskScore": 0.15,
  "avgExecutionTime": 45,
  "topCommands": [
    {
      "command": "repo.control.workflow.diagnose",
      "count": 1200,
      "avgRiskScore": 0.12
    }
  ],
  "topExecutors": [
    {
      "executor": "user@example.com",
      "count": 600,
      "avgRiskScore": 0.1
    }
  ],
  "timeseries": [
    {
      "timestamp": "2026-07-02T00:00:00.000Z",
      "executedCount": 52,
      "blockedCount": 0,
      "avgRiskScore": 0.14
    }
  ]
}
```

### List Delegations

```bash
GET /api/executive/delegations?grantedTo=user@example.com
```

**Response:**

```json
{
  "data": [
    {
      "id": "deleg-001",
      "grantedBy": "admin@example.com",
      "grantedTo": "user@example.com",
      "command": "repo.control.workflow.diagnose",
      "resource": "repo:sentinel-prod",
      "scope": "team",
      "validFrom": "2026-07-01T00:00:00.000Z",
      "validUntil": "2026-08-01T00:00:00.000Z",
      "reason": "Quarterly workflow audit",
      "revokedAt": null,
      "createdAt": "2026-07-01T10:00:00.000Z"
    }
  ],
  "total": 3
}
```

### Get Risk Status

```bash
GET /api/executive/risk/status
```

**Response:**

```json
{
  "overallScore": 0.25,
  "decision": "pass",
  "services": [
    {
      "service": "api-server",
      "status": "healthy",
      "responseTime": 45,
      "uptime": 99.9,
      "lastChecked": "2026-07-02T15:30:40.000Z"
    },
    {
      "service": "database",
      "status": "healthy",
      "responseTime": 12,
      "uptime": 99.95,
      "lastChecked": "2026-07-02T15:30:40.000Z"
    }
  ],
  "factors": {
    "infraHealth": 0.1,
    "recentIncidents": 0,
    "deploymentStatus": 0,
    "resourcePressure": 0.2
  },
  "timestamp": "2026-07-02T15:30:40.000Z"
}
```

### Get Risk Factors (Historical)

```bash
GET /api/executive/risk/factors?window=24h&granularity=hour
```

**Response:**

```json
{
  "timeseries": [
    {
      "timestamp": "2026-07-02T00:00:00.000Z",
      "infraHealth": 0.1,
      "recentIncidents": 0,
      "deploymentStatus": 0,
      "resourcePressure": 0.25
    },
    {
      "timestamp": "2026-07-02T01:00:00.000Z",
      "infraHealth": 0.15,
      "recentIncidents": 0.2,
      "deploymentStatus": 0.1,
      "resourcePressure": 0.3
    }
  ],
  "summary": {
    "infraHealth": 0.15,
    "recentIncidents": 0.08,
    "deploymentStatus": 0.05,
    "resourcePressure": 0.27
  }
}
```

### Error Response

```json
{
  "error": "Unauthorized",
  "details": "X-Principal-Id header is required",
  "code": "MISSING_PRINCIPAL"
}
```

---

## Configuration

Add to `.env`:

```bash
# API Configuration
API_PORT=3000
API_HOST=0.0.0.0

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_LIMIT=100
MAX_LIMIT=1000

# Export
EXPORT_MAX_RECORDS=100000
EXPORT_BATCH_SIZE=1000
```

---

## Integration with Existing Gates

- **Gate 3:** Receipt ledger provides query/filter methods
- **Gate 4:** Delegation rules engine provides query methods
- **Gate 5:** Risk assessment engine provides health/factor methods

---

## v1 Constraints

- Read-only operations only
- No delegation grants (POST) in v1
- No delegation revokes (DELETE) in v1
- Risk decisions do not block commands (informational)
- Single-tenant (tenant ID from context)

---

## v2+ Future Work

- Multi-tenant API support
- Delegation grants with approval chains
- Delegation revokes with audit trail
- Risk-based command blocking
- GraphQL API alternative
- WebSocket subscriptions for real-time updates
- Export to external systems (Splunk, DataDog, etc.)

---

## Success Criteria

- [x] Route definitions complete
- [x] Query services implemented
- [ ] Express adapter deployed
- [ ] All endpoints tested
- [ ] API documentation generated
- [ ] Rate limiting working
- [ ] Performance targets met (<200ms list, <50ms get)
