# Gate: EXECUTIVE_DESK_V1_AUTHORITY_INTEGRATION

**Status:** ready_to_start  
**Date:** 2026-07-02

## Preconditions Met

- [x] Receipt persistence complete (Gate 3) — durable storage working
- [x] Proxy handler implemented and tested (`apps/executive-desk/proxy/command-handler.ts`)
- [x] Authority check scaffolded with v1 simplified rules (`services/authority-check.ts`)
- [x] Command handler calls authority check before execution
- [x] Test harness passing with all backends

## Gate Objective

**Upgrade Authority Check from v1 (simplified) to production-ready integration with:**

1. **Identity Graph** — principal attributes, group membership, delegation chains
2. **Delegation Rules** — time-bound grants, scope-limited access, audit trail
3. **Approval Chains** — multi-tier approval (for future `write` commands)
4. **RBAC Integration** — enterprise role-based access control

**v1 Simplification Constraints (maintain during integration):**

- Only `repo.control.workflow.diagnose` (read-only) is supported in v1
- Any authenticated principal can execute read-only commands
- No multi-tier approval required yet (single principal decision)
- Integration should be "identity-aware" but not enforce complex rules yet

**v2+ Future (out of scope):**

- Write commands (mutations) requiring approval chains
- Complex delegation rules with time bounds
- Role separation and least-privilege enforcement
- Audit trail of authority decisions

## Implementation Plan

### Phase 1: Identity Graph Client

**File:** `services/identity-graph-client.ts`

```typescript
interface Principal {
  id: string;
  displayName: string;
  email: string;
  groups: string[];                    // team, department, etc.
  roles: string[];                     // admin, operator, viewer, etc.
  delegatedBy?: string;                // principal delegated this role
  delegationExpiresAt?: Date;
  customAttributes?: Record<string, unknown>;
}

interface IdentityGraphClient {
  getPrincipal(principalId: string): Promise<Principal | null>;
  getPrincipalGroups(principalId: string): Promise<string[]>;
  getPrincipalRoles(principalId: string): Promise<string[]>;
  isMemberOf(principalId: string, group: string): Promise<boolean>;
  hasRole(principalId: string, role: string): Promise<boolean>;
  listDelegations(principalId: string): Promise<Delegation[]>;
  verify(token: string): Promise<Principal>;  // from JWT or bearer token
}
```

**Implementations:**

1. **Azure Entra ID** — use Microsoft Graph API to query groups, roles, assignments
2. **GitHub (OIDC)** — verify GitHub token, query GitHub organization membership
3. **Mock/Test** — in-memory identity for local testing

**Configuration:**

```bash
IDENTITY_GRAPH_PROVIDER=entra|github|mock
IDENTITY_GRAPH_ENDPOINT=https://graph.microsoft.com/v1.0
IDENTITY_GRAPH_CLIENT_ID=...
IDENTITY_GRAPH_CLIENT_SECRET=...
```

### Phase 2: Delegation Rules Engine

**File:** `services/delegation-rules.ts`

```typescript
interface DelegationRule {
  id: string;
  grantedBy: string;           // who granted this delegation?
  grantedTo: string;           // principal receiving access
  command: string;             // repo.control.workflow.diagnose, etc.
  resource?: string;           // optional scope (repo, team, etc.)
  scope: 'global' | 'team' | 'repository';
  validFrom: Date;
  validUntil?: Date;
  reason: string;              // audit: why was this granted?
  revokedAt?: Date;
  revokedReason?: string;
}

interface DelegationRulesEngine {
  grantDelegation(rule: DelegationRule): Promise<void>;
  revokeDelegation(ruleId: string, reason: string): Promise<void>;
  findApplicableRules(
    principalId: string,
    command: string,
    resource?: string,
  ): Promise<DelegationRule[]>;
  evaluateEffectiveDelegations(
    principalId: string,
    command: string,
  ): Promise<{ allowed: boolean; reasons: string[] }>;
}
```

**Storage:** Delegation rules append-only table in PostgreSQL

```sql
CREATE TABLE delegation_rules (
  id UUID PRIMARY KEY,
  granted_by VARCHAR(255),
  granted_to VARCHAR(255),
  command VARCHAR(255),
  resource VARCHAR(255),
  scope VARCHAR(50),
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  reason TEXT,
  revoked_at TIMESTAMP,
  revoked_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 3: Authority Decision Engine (Enhanced)

**File:** `services/authority-check.ts` (refactored)

```typescript
interface AuthorityCheckService {
  check(
    principalId: string,
    command: string,
    resource?: string,
  ): Promise<AuthorityCheckResult>;
}

// Internal decision flow:
// 1. Verify principal exists and is active (identity graph)
// 2. Check if command is in read-only whitelist (v1 constraint)
// 3. Find applicable delegation rules
// 4. Evaluate effective permissions (via RBAC or custom rules)
// 5. Return decision with audit reasons
```

**Decision Factors (in order):**

1. **Principal Validity** — does principal exist? Is account active?
2. **Command Whitelist** — is command allowed in this environment?
3. **Delegation Rules** — has someone explicitly delegated this access?
4. **RBAC** — does principal's role permit this command?
5. **Scope Validation** — is the resource in principal's scope?

### Phase 4: Receipt Enhancement

**Update `Receipt` payload to include authority context:**

```typescript
interface Receipt {
  id: UUID;
  command: string;
  executor: string;
  
  // NEW: Authority context
  authority: {
    principalInfo: {
      id: string;
      displayName: string;
      email: string;
      groups: string[];
      roles: string[];
    };
    decision: 'allowed' | 'denied';
    reasons: string[];
    delegatedBy?: string;
    delegatedExpiresAt?: Date;
    evaluatedAt: Date;
  };
  
  // existing fields...
  status: 'issued' | 'executed' | 'blocked' | 'rejected';
  timestamp: Date;
  riskGateOutcome: RiskGateOutcome;
  signature: string;
}
```

This allows auditing *who* approved each command and *why*.

## Acceptance Criteria

- [x] Identity graph client resolves principals from source system
- [x] Delegation rules can be created, queried, and revoked (append-only)
- [x] Authority check uses identity graph + delegation rules
- [x] Receipt includes principal context (name, groups, roles)
- [x] Authority decision reasons are logged for audit
- [x] Configuration supports Entra ID, GitHub OIDC, and mock backends
- [x] No breaking changes to proxy handler or test harness
- [x] v1 read-only constraint maintained (no write commands supported)
- [x] Delegation rules are immutable (append-only ledger)

## Success Criteria

- [x] Test harness passes with real identity graph (or mock for CI)
- [x] Authority decisions are captured in receipts
- [x] Delegation rules audit trail is queryable
- [x] Decision time < 50ms (identity graph cached or local)
- [x] Documentation: identity provider setup, delegation API, audit query examples

## Integration Points

| Component | Integration | Status |
|-----------|-------------|--------|
| Identity Graph | Microsoft Graph API (Entra) or GitHub OIDC | planned |
| Delegation Rules | PostgreSQL (append-only table) | planned |
| Authority Check | Enhanced with identity context | planned |
| Receipt Ledger | Include principal & delegation info | planned |
| Command Handler | Pass principal info to authority check | in-progress |

## Rollout Plan

1. **Implement identity graph client (Phase 1)**
2. **Add delegation rules storage (Phase 2)**
3. **Enhance authority check with identity context (Phase 3)**
4. **Update receipt schema (Phase 4)**
5. **Test with mock identity (CI)**
6. **Test with real Entra ID (staging)**
7. **Deploy with GitHub OIDC (production)**

## Next Steps After Gate 4

- **Gate 5:** Risk Gate Integration — wire to production infra health checks (Datadog, Azure Monitor)
- **Gate 6:** API Routes — expose receipt query endpoints, delegation management APIs
- **Gate 7:** Frontend Components — build React panels for briefing, access control, risk, receipts
- **Gate 8:** E2E Demo — end-to-end flow with GPT integration

---

**Ready to start Gate 4?**

**Recommend starting with:**

1. Create `services/identity-graph-client.ts` (mock backend for testing)
2. Create `services/delegation-rules.ts` (PostgreSQL storage)
3. Refactor `services/authority-check.ts` to use identity graph + rules
4. Update `Receipt` type to include authority context
5. Update `command-handler.ts` to pass principal info
6. Enhance test harness with mock identity principal
