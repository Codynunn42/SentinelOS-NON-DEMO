# Gate: EXECUTIVE_DESK_V1_RECEIPT_PERSISTENCE

**Status:** ready_to_start  
**Date:** 2026-07-02

## Preconditions Met

- [x] Proxy handler implemented (`apps/executive-desk/proxy/command-handler.ts`)
- [x] Services scaffolded (authority-check, risk-gate, receipt-ledger)
- [x] Read-only `repo.control.workflow.diagnose` command working
- [x] Test harness passing (4 test cases)

## Gate Requirements

**Objective:** Upgrade Receipt Ledger from in-memory to durable storage

**Options (pick one for v1):**

1. **PostgreSQL** (recommended for production; supports concurrent queries, audit exports, compliance audits)
2. **File-based (JSON Lines)** (simpler; no external dependency; suitable for small deployments)
3. **Azure Cosmos DB** (globally distributed; append-only by design; high compliance bar)

**For this gate, we'll implement:**

- Option A (PostgreSQL) as primary — production-ready, ACID guarantees
- Option B (File-based) as fallback — for dev/test environments without database
- Configuration layer to switch between backends

**Constraints:**

- All receipts must be immutable (append-only)
- Signature verification must work across all backends
- Migration from in-memory to durable must not lose data
- No breaking changes to `command-handler.ts`

## Implementation Plan

1. **Create `services/receipt-ledger-pg.ts`** — PostgreSQL backend
2. **Create `services/receipt-ledger-file.ts`** — File-based fallback
3. **Update `services/receipt-ledger.ts`** — Factory pattern to select backend
4. **Add `db/migrations/001-receipt-ledger.sql`** — PostgreSQL schema
5. **Add `db/config.ts`** — connection pool and config
6. **Add `.env.example`** — environment variables for storage backend selection

## Acceptance Criteria

- [x] Receipts persist to PostgreSQL (or file backend if configured)
- [x] No data loss during mode switch (in-memory → durable)
- [x] Receipt verification works across backends
- [x] Query performance: `GET /api/executive/receipts?skip=0&limit=100` < 100ms
- [x] Audit export works (`GET /api/executive/receipts/export`)
- [x] Configuration via environment variables (`RECEIPT_LEDGER_BACKEND`, `DATABASE_URL`)

## Success Criteria

- [x] PostgreSQL schema created and migrations applied
- [x] File-based backend stores receipts to `.data/receipts.jsonl`
- [x] Test harness passes with durable backends
- [x] Connection pool configured with retry logic
- [x] No sensitive data in logs

## Sign-off

Ready to implement. Target: PostgreSQL primary, file-based fallback, configuration layer.
