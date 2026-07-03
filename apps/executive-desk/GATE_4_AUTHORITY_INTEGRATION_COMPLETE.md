# Gate 4: Authority Integration Implementation Plan

**Status:** Documentation & Scaffolding Complete  
**Date:** 2026-07-02

## What Was Built

Gate 4 introduces identity-aware authority checks with delegation rules:

### 1. Identity Graph Client (`services/identity-graph-client.ts`)

**Purpose:** Resolve principals (users, service accounts) from identity providers

**Implementations:**

- **Mock** (default for testing) — in-memory principal database with test helpers
  - Includes: <user@example.com>, <admin@example.com>, <service@example.com>
  - Perfect for CI/local testing without external dependencies

- **Azure Entra ID** (stub for future)
  - Will query Microsoft Graph API for user attributes, groups, roles
  - Configuration: `IDENTITY_GRAPH_PROVIDER=entra`, client ID/secret

- **GitHub OIDC** (stub for future)
  - Will verify GitHub tokens and query org membership
  - Configuration: `IDENTITY_GRAPH_PROVIDER=github`, org name

**API:**

```typescript
const client = await getIdentityGraphClient();
const principal = await client.getPrincipal('user@example.com');
const isAdmin = await client.hasRole('user@example.com', 'admin');
const groups = await client.getPrincipalGroups('user@example.com');
```

### 2. Delegation Rules Engine (`services/delegation-rules.ts`)

**Purpose:** Grant time-bound access to commands via delegation

**Implementations:**

- **In-Memory** (default for testing) — fast, append-only Map storage

- **PostgreSQL** (stub for future)
  - Will store rules in database with ACID guarantees
  - Supports querying active delegations, audit trails

**API:**

```typescript
const engine = await getDelegationRulesEngine();

// Grant delegation
const rule = await engine.grantDelegation(
  'admin@example.com',        // grantedBy
  'user@example.com',         // grantedTo
  'repo.control.workflow.diagnose',
  {
    reason: 'On-call support for incident',
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 24 * 3600000), // 24 hours
  }
);

// Check applicable rules
const applicable = await engine.findApplicableRules(
  'user@example.com',
  'repo.control.workflow.diagnose'
);
```

### 3. Enhanced Authority Check (`services/authority-check.ts`)

**New Decision Flow:**

1. Validate principal ID format
2. Check command whitelist (v1: read-only only)
3. Verify principal exists in identity graph
4. Check principal is active
5. Find applicable delegation rules
6. Return decision with principal context

**New Response Fields:**

```typescript
interface AuthorityCheckResult {
  allowed: boolean;
  principalId: string;
  principalInfo?: {           // NEW: from identity graph
    id: string;
    displayName: string;
    email: string;
    groups: string[];
    roles: string[];
  };
  delegatedBy?: string;       // NEW: who delegated this?
  delegationExpiresAt?: Date; // NEW: when does it expire?
  reasons: string[];
  requiredApprovers: string[];
  scope: string;
}
```

### 4. PostgreSQL Schema (`db/migrations/002-delegation-rules.sql`)

**Tables:**

- `delegation_rules` — append-only ledger of authority delegations
  - Includes: granted_by, granted_to, command, scope, valid_from, valid_until, reason, revoked_at, created_at
  - Constraints: time bounds validation, no future revocations
  - 7 indexes for efficient queries
  - Composite index: `(granted_to, command, valid_from, valid_until)` for active delegation queries

**Views:**

- `delegation_rules_active` — non-revoked delegations only
- `delegation_rules_by_principal` — stats by grant recipient
- `delegation_rules_by_grantor` — stats by delegator

**Functions:**

- `find_applicable_delegations()` — query active delegations for principal/command at time T
- `export_delegations_since()` — compliance export with timestamp filter

### 5. Enhanced Receipt Type (`services/receipt-ledger.ts`)

**New Fields:**

```typescript
interface ReceiptEntry {
  // existing fields...
  
  // NEW: Authority context (Gate 4)
  principalContext?: {
    id: string;
    displayName?: string;
    email?: string;
    groups?: string[];
    roles?: string[];
  };
  delegatedBy?: string;
  delegationExpiresAt?: string;
}
```

Now receipts include *who* approved the command and *why* (delegation reason).

### 6. Updated Command Handler (`proxy/command-handler.ts`)

**Now captures principal context in receipts:**

```typescript
const receipt = await ledger.record({
  // ...
  authorityCheckResult: authCheckResult,
  principalContext: authCheckResult.principalInfo,
  delegatedBy: authCheckResult.delegatedBy,
  delegationExpiresAt: authCheckResult.delegationExpiresAt?.toISOString(),
});
```

## Configuration

Add to `.env`:

```bash
# Identity provider (mock, entra, github)
IDENTITY_GRAPH_PROVIDER=mock

# Future: Entra ID configuration
# IDENTITY_GRAPH_CLIENT_ID=...
# IDENTITY_GRAPH_CLIENT_SECRET=...

# Future: GitHub configuration
# GITHUB_ORG=Codynunn42

# Delegation rules backend (memory or postgres)
DELEGATION_RULES_BACKEND=memory
```

## Testing with Mock Identity

No external dependencies needed! Mock identity provider includes:

| Principal | Groups | Roles | Status |
|-----------|--------|-------|--------|
| `user@example.com` | engineers, dev-team | operator | active |
| `admin@example.com` | admins, leadership | admin | active |
| `service@example.com` | service-principals | service | active |

**Test workflow:**

```bash
# Run test handler — uses mock identity by default
npx ts-node apps/executive-desk/proxy/test-handler.ts

# See principal context in receipt
# See delegation info if delegation rules are created
```

## v1 Constraints (Maintained)

- Only `repo.control.workflow.diagnose` (read-only) supported
- No multi-tier approval yet (planned for v2 write commands)
- Any authenticated principal can execute read-only commands
- Delegation is *informational* in v1 (doesn't restrict access, just tracks it)

## v2+ Future Work

- Implement real Entra ID integration (query Microsoft Graph)
- Implement real GitHub OIDC integration (verify tokens, query org membership)
- Implement PostgreSQL delegation rules backend
- Multi-tier approval chains for write commands
- Least-privilege enforcement (role-based access control)
- Advanced delegation rules (scope-limited, time-bound, group-based)

## Next Steps

1. ✅ Gate 4 scaffolding complete
2. Test with mock identity (try: `npx ts-node apps/executive-desk/proxy/test-handler.ts`)
3. Verify receipts include principal context and delegation info
4. Move to Gate 5 (Risk Gate Integration) → wire to real infra health checks

---

**Status:** Ready for testing. Mock identity and delegation rules engines functional for CI/local development.
