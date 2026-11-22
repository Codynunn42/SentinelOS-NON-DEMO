-- Preserve existing receipts as legacy version 1 and persist prerequisite
-- metadata for PR #51. PR #47 must not activate or authenticate version 2.
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS signature_version SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS signature_payload_text TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS timestamp_text TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS principal_context JSONB;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS delegated_by VARCHAR(255);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS delegation_expires_at TEXT;

ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_signature_version_check;
ALTER TABLE receipts ADD CONSTRAINT receipts_signature_version_check
  CHECK (signature_version IN (1, 2));

DROP VIEW IF EXISTS receipts_audit_export;
CREATE OR REPLACE VIEW receipts_audit_export AS
SELECT
  id,
  command,
  tenant,
  executor,
  "timestamp",
  timestamp_text,
  status,
  payload,
  authority_check_result,
  risk_gate_outcome,
  signature,
  signature_version,
  signature_payload_text,
  reasons,
  principal_context,
  delegated_by,
  delegation_expires_at,
  created_at,
  (payload ->> 'principalId')::VARCHAR(255) as principal,
  (payload ->> 'repository')::VARCHAR(255) as repository
FROM receipts
ORDER BY created_at DESC;

DROP FUNCTION IF EXISTS export_receipts_since(TIMESTAMP);
CREATE OR REPLACE FUNCTION export_receipts_since(since_timestamp TIMESTAMP)
RETURNS TABLE (
  id UUID,
  command VARCHAR,
  tenant VARCHAR,
  executor VARCHAR,
  "timestamp" TIMESTAMP,
  timestamp_text TEXT,
  status VARCHAR,
  payload JSONB,
  authority_check_result JSONB,
  risk_gate_outcome JSONB,
  signature VARCHAR,
  signature_version SMALLINT,
  signature_payload_text TEXT,
  reasons TEXT[],
  principal_context JSONB,
  delegated_by VARCHAR,
  delegation_expires_at TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.command, r.tenant, r.executor, r."timestamp", r.timestamp_text,
         r.status, r.payload, r.authority_check_result, r.risk_gate_outcome,
         r.signature, r.signature_version, r.signature_payload_text, r.reasons,
         r.principal_context, r.delegated_by, r.delegation_expires_at,
         r.created_at
  FROM receipts r
  WHERE r."timestamp" >= since_timestamp
  ORDER BY r."timestamp" DESC;
END;
$$ LANGUAGE plpgsql;
