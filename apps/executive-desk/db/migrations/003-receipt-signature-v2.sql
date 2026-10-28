-- Preserve existing receipts as legacy version 1 and persist the authority
-- context covered by signatures written using version 2.
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS signature_version SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS timestamp_text TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS principal_context JSONB;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS delegated_by VARCHAR(255);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS delegation_expires_at TEXT;

ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_signature_version_check;
ALTER TABLE receipts ADD CONSTRAINT receipts_signature_version_check
  CHECK (signature_version IN (1, 2));
