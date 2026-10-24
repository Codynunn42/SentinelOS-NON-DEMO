CREATE TABLE IF NOT EXISTS command_execution_journal (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  idempotency_key_hash CHAR(64) NOT NULL,
  command TEXT NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  actor TEXT,
  api_key_id TEXT,
  state TEXT NOT NULL CHECK (state IN (
    'pending',
    'completed',
    'failed_before_mutation',
    'reconciliation_needed'
  )),
  handler_started BOOLEAN NOT NULL DEFAULT FALSE,
  result_json JSONB,
  failure_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (tenant_id, idempotency_key_hash)
);

CREATE TABLE IF NOT EXISTS signed_receipts (
  receipt_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  journal_id UUID NOT NULL UNIQUE REFERENCES command_execution_journal(id),
  signed_receipt JSONB NOT NULL,
  signature_algorithm TEXT NOT NULL CHECK (signature_algorithm = 'ES256'),
  key_id TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signed_receipts_tenant_created
  ON signed_receipts (tenant_id, created_at DESC);
