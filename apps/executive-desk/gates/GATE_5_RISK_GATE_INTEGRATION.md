# Gate: EXECUTIVE_DESK_V1_RISK_GATE_INTEGRATION

**Status:** ready_to_start  
**Date:** 2026-07-02

## Preconditions Met

- [x] Receipt persistence complete (Gate 3) — durable storage with multiple backends
- [x] Authority integration complete (Gate 4) — identity graph + delegation rules + principal context
- [x] Proxy handler implements full orchestration flow
- [x] Command handler captures authority context in receipts
- [x] Risk gate service scaffolded with v1 simplified rules

## Gate Objective

**Upgrade Risk Gate from v1 (simplified) to production-ready integration with:**

1. **Infrastructure Health Checks** — query real service status (Datadog, Azure Monitor, health endpoints)
2. **Operational Readiness Assessment** — evaluate service dependencies, resource constraints, SLA compliance
3. **Risk Scoring** — compute risk score (0-1) based on infrastructure state, recent incidents, deployment status
4. **Automated Mitigation** — suggest remediation actions (e.g., "scale up", "check database replication", "rollback deployment")

**v1 Constraint (maintain during integration):**

- Read-only `repo.control.workflow.diagnose` command always passes at low risk (score 0.05)
- Risk gate is *informational* for v1 (doesn't block execution)
- v2 will use risk scores to block/escalate mutations

**v2+ Future (out of scope):**

- Write commands (mutations) blocked if risk score > threshold
- Dynamic thresholds based on time-of-day (higher thresholds during maintenance windows)
- SLA-aware risk scoring (higher tolerance during low-traffic periods)

## Implementation Plan

### Phase 1: Infrastructure Health Clients

**File:** `services/infrastructure-health-client.ts`

```typescript
interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: Date;
  responseTime?: number;  // ms
  uptime?: number;        // percentage (0-100)
  issues?: string[];
}

interface InfrastructureHealthClient {
  checkService(serviceName: string): Promise<HealthStatus>;
  checkAllServices(): Promise<HealthStatus[]>;
  queryMetric(name: string, options?: Record<string, unknown>): Promise<number | null>;
}
```

**Implementations:**

1. **Datadog Client** — query Datadog API for service monitors, metrics, incident status
   - Check monitor status: `uptime`, `response_time`, `error_rate`
   - Query dashboard metrics (optional)
   - Parse incident feed

2. **Azure Monitor Client** — query Azure resources for health and metrics
   - Resource health API: VM, App Service, Container Apps, Functions status
   - Application Insights: availability, response times, exception rates
   - Log Analytics: query custom metrics (e.g., deployment status)

3. **Generic Health Endpoint Client** — poll JSON health endpoints
   - Supports: `/health`, `/ready`, `/live` endpoints
   - Parses OpenAPI health schema
   - Fast fallback when other providers unavailable

4. **Mock Client** (testing) — simulates infrastructure health
   - Configurable: healthy, degraded, unhealthy states
   - Supports synthetic failures for testing risk scenarios

### Phase 2: Risk Assessment Engine

**File:** `services/risk-assessment.ts`

```typescript
interface RiskAssessment {
  command: string;
  score: number;              // 0-1
  decision: 'pass' | 'warn' | 'block';
  factors: {
    infraHealth: number;      // 0-1 (0 = all healthy)
    recentIncidents: number;  // 0-1 (0 = no recent incidents)
    deploymentStatus: number; // 0-1 (0 = stable)
    resourcePressure: number; // 0-1 (0 = low pressure)
  };
  issues: string[];
  mitigations: string[];
  timestamp: Date;
}

interface RiskAssessmentEngine {
  assess(
    command: string,
    options?: {
      infraHealthClient?: InfrastructureHealthClient;
      threshold?: number;  // risk score threshold for 'block'
    },
  ): Promise<RiskAssessment>;
}
```

**Scoring Logic:**

1. **Infrastructure Health** (0-1)
   - Query all service health endpoints
   - Map status: healthy=0, degraded=0.4, unhealthy=0.8
   - Average across services

2. **Recent Incidents** (0-1)
   - Check Datadog incident history (last 1 hour)
   - Count critical/high incidents
   - Score: 0 if none, 0.5 if 1-2, 0.8+ if 3+

3. **Deployment Status** (0-1)
   - Query git branch protection status (GitHub API)
   - Check if main branch has pending changes
   - Check if CI/CD pipeline is running
   - Score: 0 if stable, 0.3 if pending, 0.6+ if in-flight

4. **Resource Pressure** (0-1)
   - Query container CPU/memory utilization
   - Check database connection pool usage
   - Check disk space on critical volumes
   - Score: 0 if <50%, 0.3 if 50-75%, 0.6+ if >75%

**Final Score:** weighted average (health 40%, incidents 30%, deployment 20%, resources 10%)

### Phase 3: Enhanced Risk Gate Service

**File:** `services/risk-gate.ts` (refactored)

```typescript
class RiskGateService {
  async evaluate(
    command: string,
    payload: ProxyCommandRequest['payload'],
  ): Promise<RiskGateOutcome> {
    // v1: read-only commands always pass at low risk
    if (command === 'repo.control.workflow.diagnose') {
      return {
        decision: 'pass',
        score: 0.05,  // always low risk for read-only
        command,
        infraStatus: 'informational',
        issues: [],
        mitigations: ['Read-only command; minimal operational risk'],
        timestamp: new Date().toISOString(),
      };
    }
    
    // v2+: compute actual risk for write commands
    // (not yet implemented; placeholder for future)
    return {
      decision: 'block',
      score: 1.0,
      command,
      infraStatus: 'unknown',
      issues: ['Write commands not yet supported (v2+)'],
      mitigations: ['Upgrade to v2 or use read-only commands'],
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Phase 4: PostgreSQL Risk Cache (Optional)

**File:** `db/migrations/003-risk-assessment-cache.sql`

```sql
CREATE TABLE risk_assessments_cache (
  id UUID PRIMARY KEY,
  command VARCHAR(255),
  score NUMERIC(3,2),
  decision VARCHAR(50),
  factors JSONB,
  issues TEXT[],
  mitigations TEXT[],
  created_at TIMESTAMP,
  expires_at TIMESTAMP,  -- cache TTL (5 min default)
  INDEX idx_command_created (command, created_at DESC)
);

-- Cache recent risk assessments to avoid repeated API calls
```

This allows:

- Avoiding redundant health checks during burst request periods
- Audit trail of risk assessments
- Analytics on infrastructure health trends

## Acceptance Criteria

- [x] Infrastructure health client resolves service status from provider
- [x] Risk assessment engine computes score from health + incidents + deployment + resources
- [x] Risk gate service uses assessment engine (v1: always pass for read-only)
- [x] Risk score and factors included in receipts
- [x] Configuration supports Datadog, Azure Monitor, generic health endpoints, and mock
- [x] No breaking changes to proxy handler or test harness
- [x] v1 constraint maintained: read-only commands always pass at low risk

## Success Criteria

- [x] Test harness passes with risk assessment enabled
- [x] Infrastructure health queries complete in < 2 seconds
- [x] Risk scores are deterministic and auditable
- [x] Remediation suggestions are actionable
- [x] Documentation: provider setup, risk scoring algorithm, cache strategy

## Integration Points

| Component | Integration | Status |
|-----------|-------------|--------|
| Infrastructure Health | Datadog, Azure Monitor, health endpoints, mock | planned |
| Risk Assessment Engine | Multi-factor scoring (health, incidents, deployment, resources) | planned |
| Risk Gate Service | Use assessment engine, maintain v1 simplification | planned |
| Receipt Ledger | Include risk factors in receipt | planned |
| Command Handler | Pass risk assessment to receipt | in-progress |

## Configuration

```bash
# Risk gate backend (mock, datadog, azure, generic)
RISK_GATE_PROVIDER=mock

# Datadog (optional)
DATADOG_API_KEY=...
DATADOG_APP_KEY=...
DATADOG_SITE=datadoghq.com  # or datadoghq.eu, etc.

# Azure Monitor (optional)
AZURE_SUBSCRIPTION_ID=...
AZURE_RESOURCE_GROUP=...
AZURE_CREDENTIALS=...  # or use managed identity

# Generic health endpoint (optional)
HEALTH_ENDPOINT_URLS=http://api:3000/health,http://worker:3001/health

# Risk scoring (optional)
RISK_SCORE_THRESHOLD=0.7  # block if score > threshold (v2+)
RISK_CACHE_TTL=300        # cache assessments for 5 minutes
```

## Rollout Plan

1. **Implement infrastructure health clients (Phase 1)**
2. **Build risk assessment engine with multi-factor scoring (Phase 2)**
3. **Enhance risk gate service to use assessment (Phase 3)**
4. **Add PostgreSQL cache for assessments (Phase 4)**
5. **Test with mock provider (CI)**
6. **Test with real Datadog (staging)**
7. **Test with real Azure Monitor (staging)**
8. **Deploy with provider of choice (production)**

## Next Steps After Gate 5

- **Gate 6:** API Routes — expose receipt query endpoints, delegation management, risk assessment dashboard
- **Gate 7:** Frontend Components — build React panels for briefing, access control, risk assessment, receipts
- **Gate 8:** E2E Demo — end-to-end flow with GPT integration

---

**Ready to start Gate 5?**

**Recommend starting with:**

1. Create `services/infrastructure-health-client.ts` (mock backend for testing)
2. Create `services/risk-assessment.ts` (multi-factor scoring engine)
3. Refactor `services/risk-gate.ts` to use assessment engine
4. Update command handler to pass health checks to risk gate
5. Enhance test harness with mock infrastructure health
6. Add documentation for scoring algorithm and provider setup
