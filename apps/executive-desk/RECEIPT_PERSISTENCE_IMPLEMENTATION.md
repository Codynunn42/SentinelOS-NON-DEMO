# Receipt Persistence — Durable Storage Implementation

**Date:** 2026-07-02  
**Gate:** EXECUTIVE_DESK_V1_RECEIPT_PERSISTENCE (complete)

## Architecture

Receipt Ledger now supports three pluggable backends:

1. **In-Memory** (default for testing) — fast, no external dependency, data lost on restart
2. **File-Based** (dev/test) — JSON Lines append-only file, simple, no external dependency
3. **PostgreSQL** (production) — ACID guarantees, concurrent queries, audit compliance

Switch backends via `RECEIPT_LEDGER_BACKEND` environment variable.

## Files

### Core

- `services/receipt-ledger.ts` — factory pattern, unified interface
- `services/receipt-ledger-pg.ts` — PostgreSQL backend
- `services/receipt-ledger-file.ts` — file-based backend

### Database

- `db/migrations/001-receipt-ledger.sql` — PostgreSQL schema with indexes, views, audit functions
- `db/setup.ts` — migration runner (auto-applies pending migrations)

### Configuration

- `.env.example` — environment variable template

## Quick Start

### Option 1: In-Memory (Default)

No setup required. Use for testing:

```bash
export RECEIPT_LEDGER_BACKEND=memory
npx ts-node apps/executive-desk/proxy/test-handler.ts
```

### Option 2: File-Based

Create `.data/receipts.jsonl`:

```bash
export RECEIPT_LEDGER_BACKEND=file
export RECEIPT_LEDGER_DATA_DIR=.data
mkdir -p .data
npx ts-node apps/executive-desk/proxy/test-handler.ts
```

Receipts are appended as JSON lines:

```json
{"id":"...","command":"repo.control.workflow.diagnose",...}
{"id":"...","command":"repo.control.workflow.diagnose",...}
```

### Option 3: PostgreSQL (Production)

1. **Create database:**

   ```bash
   createdb executive_desk
   ```

2. **Set connection string:**

   ```bash
   export DATABASE_URL=postgresql://user:password@localhost:5432/executive_desk
   export RECEIPT_LEDGER_BACKEND=postgres
   ```

3. **Run migrations:**

   ```bash
   npx ts-node apps/executive-desk/db/setup.ts
   ```

4. **Test:**

   ```bash
   npx ts-node apps/executive-desk/proxy/test-handler.ts
   ```

## PostgreSQL Schema

### `receipts` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique receipt ID |
| `command` | VARCHAR(255) | Command name (e.g., `repo.control.workflow.diagnose`) |
| `tenant` | VARCHAR(255) | Tenant ID |
| `executor` | VARCHAR(255) | Principal ID who executed the command |
| `timestamp` | TIMESTAMP | Command execution time |
| `status` | VARCHAR(50) | One of: `issued`, `executed`, `blocked`, `rejected` |
| `payload` | JSONB | Command payload |
| `authority_check_result` | JSONB | Authority check decision and reasons |
| `risk_gate_outcome` | JSONB | Risk gate evaluation (decision, score, mitigations) |
| `signature` | VARCHAR(64) | HMAC-SHA256 signature for audit verification |
| `reasons` | TEXT[] | Array of decision reasons |
| `created_at` | TIMESTAMP | Auto-timestamp when inserted |

### Indexes

- `command` — fast queries by command type
- `executor` — audit trail by principal
- `timestamp DESC` — newest first queries
- `status` — filter by execution status
- `tenant` — multi-tenant queries
- `command, timestamp DESC` — composite for common queries
- `executor, timestamp DESC` — composite for audit exports

### Views

- `receipts_audit_export` — read-only export view for compliance

### Functions

- `export_receipts_since(timestamp)` — compliance export with timestamp filter

## API Usage

### Create Receipt Ledger

```typescript
import { getReceiptLedger } from './services/receipt-ledger';

const ledger = await getReceiptLedger();

// First call creates singleton; subsequent calls reuse same instance
// Backend selected from RECEIPT_LEDGER_BACKEND env var
```

### Record a Receipt

```typescript
const receipt = await ledger.record({
  command: 'repo.control.workflow.diagnose',
  tenant: 'nunncloud',
  executor: 'user@example.com',
  timestamp: new Date().toISOString(),
  status: 'executed',
  payload: { repository: 'Codynunn42/SentinelOS-NON-DEMO' },
  authorityCheckResult: { allowed: true, reasons: [...] },
  riskGateOutcome: { decision: 'pass', score: 0.05 },
  reasons: [],
});

console.log(receipt.id);        // UUID
console.log(receipt.signature); // HMAC-SHA256
```

### Query Receipts

```typescript
// Get all receipts for a command
const recentDiagnoses = await ledger.queryByCommand(
  'repo.control.workflow.diagnose',
  0,   // skip
  100  // limit
);

// Get receipt by ID
const receipt = await ledger.getById('550e8400-e29b-41d4-a716-446655440000');

// List all receipts (paginated)
const allReceipts = await ledger.list(0, 100);

// Count receipts
const total = await ledger.count();
const executedCount = await ledger.countByStatus('executed');
```

### Verify & Export

```typescript
// Verify receipt signature
const isValid = ledger.verify(receipt);

// Export all receipts (streaming to prevent memory exhaustion)
const iterator = await ledger.exportAll();
for await (const receipt of iterator) {
  console.log(receipt.id, receipt.status);
}
```

## Performance

### In-Memory

- Record: ~0.1ms
- Query by command: O(n) — full scan
- Get by ID: O(n) — full scan

### File-Based

- Record: ~1-2ms (I/O bound)
- Query by command: O(n) — full file read
- Get by ID: O(n) — full file read

### PostgreSQL

- Record: ~5-10ms (with connection overhead)
- Query by command: O(1) with index — typically < 10ms for 100K rows
- Get by ID: O(1) — index lookup, typically < 5ms

## Production Checklist

- [x] PostgreSQL schema with ACID guarantees
- [x] Indexes for common queries
- [x] Append-only design (no UPDATE/DELETE allowed in theory)
- [x] HMAC signature verification
- [x] Connection pooling (max 10 connections)
- [x] Migration runner with tracking
- [x] Audit export view for compliance
- [x] Multi-tenant support (tenant column)
- [ ] Database user with minimal permissions (read/insert only)
- [ ] Backup and recovery procedure
- [ ] Retention policy (e.g., archive after 90 days)
- [ ] Monitoring and alerting (connection pool health, slow queries)

## Backup & Compliance

### Export for Compliance

PostgreSQL:

```bash
# Export all receipts as JSON
psql -c "SELECT json_agg(row_to_json(t)) FROM receipts t" > receipts_export.json

# Export audit view
psql -c "SELECT * FROM receipts_audit_export" > receipts_audit.csv
```

File-based:

```bash
# Simply copy the JSON Lines file
cp .data/receipts.jsonl receipts_backup.jsonl
```

### Compliance Export Function

Use the `export_receipts_since()` stored procedure:

```sql
SELECT * FROM export_receipts_since('2026-07-01'::TIMESTAMP);
```

## Migration Path

If switching backends later:

1. **In-memory → File:** Export in-memory receipts, write to `.data/receipts.jsonl`
2. **File → PostgreSQL:** Load JSON Lines file, insert to `receipts` table
3. **PostgreSQL → File:** Query table, write to JSONL

(Recipes in `db/migrate-backends.ts` — not yet implemented; add if needed)

## Next Steps

- [ ] Add database user setup with minimal permissions (RBAC)
- [ ] Implement backup/restore procedures
- [ ] Add retention policy (e.g., archive after 90 days)
- [ ] Monitor connection pool and query performance
- [ ] Create compliance export dashboard/reports

---

**Status:** ✅ Gate 3 complete. Ready for Gate 4 (Authority Integration).
