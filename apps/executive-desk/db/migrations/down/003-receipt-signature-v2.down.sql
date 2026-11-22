-- Reverse 003-receipt-signature-v2.sql: drop the signature-version and
-- authority-context columns from `receipts`.
--
-- DATA LOSS: this permanently destroys the principal_context, delegated_by
-- and delegation_expires_at values recorded since 003 was applied, together
-- with every row's signature_version. Export the receipts table BEFORE
-- rolling back (see "Migration rollback" in
-- apps/executive-desk/RECEIPT_PERSISTENCE_IMPLEMENTATION.md). If version 2
-- receipts and their authority data matter, forward-fix with a new migration
-- instead of rolling back.
--
-- Roll back 004 first (the runner enforces newest-first order). Idempotent:
-- every statement is guarded with IF EXISTS.
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_signature_version_check;
ALTER TABLE receipts DROP COLUMN IF EXISTS delegation_expires_at;
ALTER TABLE receipts DROP COLUMN IF EXISTS delegated_by;
ALTER TABLE receipts DROP COLUMN IF EXISTS principal_context;
ALTER TABLE receipts DROP COLUMN IF EXISTS timestamp_text;
ALTER TABLE receipts DROP COLUMN IF EXISTS signature_version;
