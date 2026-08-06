-- Migration: 001-receipt-ledger.sql
-- Creates the immutable receipts table for the Receipt Ledger service

-- Create receipts table with append-only design
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY,
  command VARCHAR(255) NOT NULL,
  tenant VARCHAR(255) NOT NULL,
  executor VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('issued', 'executed', 'blocked', 'rejected')),
  payload JSONB NOT NULL,
  authority_check_result JSONB NOT NULL,
  risk_gate_outcome JSONB NOT NULL,
  signature VARCHAR(64) NOT NULL,
  reasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_receipts_command ON receipts(command);
CREATE INDEX IF NOT EXISTS idx_receipts_executor ON receipts(executor);
CREATE INDEX IF NOT EXISTS idx_receipts_timestamp ON receipts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON receipts(tenant);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_receipts_command_timestamp ON receipts(command, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_executor_timestamp ON receipts(executor, timestamp DESC);

-- View for audit/compliance exports (immutable)
CREATE OR REPLACE VIEW receipts_audit_export AS
SELECT
  id,
  command,
  tenant,
  executor,
  timestamp,
  status,
  signature,
  created_at,
  (payload ->> 'principalId')::VARCHAR(255) as principal,
  (payload ->> 'repository')::VARCHAR(255) as repository
FROM receipts
ORDER BY created_at DESC;

-- Stored procedure to export receipts for compliance
CREATE OR REPLACE FUNCTION export_receipts_since(since_timestamp TIMESTAMP)
RETURNS TABLE (
  id UUID,
  command VARCHAR,
  tenant VARCHAR,
  executor VARCHAR,
  timestamp TIMESTAMP,
  status VARCHAR,
  payload JSONB,
  signature VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.command, r.tenant, r.executor, r.timestamp, r.status, r.payload, r.signature
  FROM receipts r
  WHERE r.timestamp >= since_timestamp
  ORDER BY r.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant minimal permissions for application user (if using separate db user)
-- GRANT SELECT, INSERT ON receipts TO app_user;
-- GRANT SELECT ON receipts_audit_export TO auditor_user;
-- GRANT EXECUTE ON FUNCTION export_receipts_since TO auditor_user;
