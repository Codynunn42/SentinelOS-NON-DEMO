# Gate 5: Risk Gate Integration Implementation Plan

**Status:** Scaffolding Complete  
**Date:** 2026-07-02

## What Was Built

Gate 5 introduces infrastructure-aware risk gate with multi-factor risk scoring:

### 1. Infrastructure Health Client (`services/infrastructure-health-client.ts`)

**Purpose:** Query service health from various providers

**Implementations:**

- **Mock** (default for testing) — simulates API, database, cache, worker queue health
  - Configurable: healthy, degraded, unhealthy states
  - Test helpers: set status, simulate incidents
  - Perfect for CI without external dependencies

- **Datadog** (stub for future)
  - Will query Datadog API for monitor status, metrics, incidents
  - Configuration: API key, app key, site (datadoghq.com or EU)

- **Azure Monitor** (stub for future)
  - Will query Azure Resource Health API and Application Insights
  - Configuration: subscription ID, resource group

- **Generic Health Endpoints** (stub for future)
  - Will poll `/health`, `/ready`, `/live` endpoints
  - Configuration: comma-separated list of endpoint URLs

**API:**

```typescript
const client = await getInfrastructureHealthClient();
const apiHealth = await client.checkService('api-server');
const allHealth = await client.checkAllServices();
const cpuUsage = await client.queryMetric('cpu_usage_percent');
```

### 2. Risk Assessment Engine (`services/risk-assessment.ts`)

**Purpose:** Compute multi-factor risk scores

**Multi-Factor Scoring:**

1. **Infrastructure Health** (40% weight)
   - Query all service health endpoints
   - Map: healthy=0, degraded=0.4, unhealthy=0.8
   - Average across services

2. **Recent Incidents** (30% weight)
   - Count critical/high incidents in last hour
   - Score: 0 if none, 0.5 if 1-2, 0.8+ if 3+

3. **Deployment Status** (20% weight)
   - Check main branch protection, pending PRs, CI/CD pipeline status
   - Score: 0 if stable, 0.3 if pending, 0.6+ if in-flight

4. **Resource Pressure** (10% weight)
   - CPU, memory, disk, connection pool utilization
   - Score: 0 if <50%, 0.3 if 50-75%, 0.6+ if >75%

**Final Score:** Weighted average of all factors (0-1)

**Decision Rules:**

- score < 0.5: `pass` ✅
- 0.5 ≤ score < 0.7: `warn` ⚠️
- score ≥ 0.7: `block` 🛑

**API:**

```typescript
const engine = await getRiskAssessmentEngine();
const assessment = await engine.assess('repo.control.workflow.diagnose', {
  healthClient: customHealthClient,
  threshold: { warn: 0.5, block: 0.7 }
});

console.log(assessment.score);      // 0.25
console.log(assessment.decision);   // 'pass'
console.log(assessment.factors);    // { infraHealth: 0.1, recentIncidents: 0, ... }
console.log(assessment.issues);     // []
console.log(assessment.mitigations); // ['Proceed normally']
```

### 3. Enhanced Risk Gate Service (`services/risk-gate.ts`)

**Now includes infrastructure factors:**

```typescript
interface RiskGateOutcome {
  decision: 'pass' | 'warn' | 'block';
  score: number;
  command: string;
  infraStatus: string;
  infraFactors?: RiskFactors;  // NEW: breakdown of factors
  issues: string[];
  mitigations: string[];
  timestamp: string;
}
```

**v1 Behavior (maintained):**

- Read-only commands always `pass` at score 0.05
- Infrastructure factors computed and included for audit
- No risk-based blocking in v1

### 4. Enhanced Receipt (`services/receipt-ledger.ts`)

Receipt now includes risk factors via `riskGateOutcome.infraFactors`:

```typescript
{
  riskGateOutcome: {
    decision: 'pass',
    score: 0.05,
    infraFactors: {
      infraHealth: 0.1,
      recentIncidents: 0,
      deploymentStatus: 0,
      resourcePressure: 0.2
    },
    issues: [],
    mitigations: []
  }
}
```

## Configuration

Add to `.env`:

```bash
# Risk gate backend (mock, datadog, azure, generic)
RISK_GATE_PROVIDER=mock

# Future: Datadog configuration
# DATADOG_API_KEY=...
# DATADOG_APP_KEY=...
# DATADOG_SITE=datadoghq.com

# Future: Azure Monitor configuration
# AZURE_SUBSCRIPTION_ID=...
# AZURE_RESOURCE_GROUP=...

# Future: Generic health endpoint URLs
# HEALTH_ENDPOINT_URLS=http://api:3000/health,http://worker:3001/health

# Risk scoring thresholds (optional)
# RISK_SCORE_THRESHOLD=0.7
```

## Testing with Mock

No external dependencies! Mock health client simulates:

| Service | Status | Response Time | Uptime |
|---------|--------|---------------|--------|
| api-server | healthy | 45ms | 99.9% |
| database | healthy | 12ms | 99.95% |
| cache | healthy | 3ms | 99.8% |
| worker-queue | healthy | 8ms | 99.7% |

**Test workflow:**

```bash
# Run test handler — uses mock risk gate
npx ts-node apps/executive-desk/proxy/test-handler.ts

# See risk factors in receipt
# See infra status in response
```

## v1 Constraints (Maintained)

- Only `repo.control.workflow.diagnose` (read-only) supported
- Read-only commands always pass at score 0.05
- Infrastructure factors included for observability only
- No risk-based blocking in v1

## v2+ Future Work

- Implement Datadog integration (query monitors, metrics, incidents)
- Implement Azure Monitor integration (resource health, app insights)
- Implement generic health endpoint client
- Risk-based blocking for write commands (planned v2)
- Dynamic thresholds based on time-of-day
- SLA-aware scoring

## Next Steps

1. ✅ Gate 5 scaffolding complete
2. Test with mock health client (try: `npx ts-node apps/executive-desk/proxy/test-handler.ts`)
3. Verify receipts include infrastructure factors
4. Move to Gate 6 (API Routes) → expose receipt query endpoints

---

**Status:** Ready for testing. Mock infrastructure health and risk assessment working for CI/local development. Infrastructure factors now included in all receipts for audit trail and future analytics.
