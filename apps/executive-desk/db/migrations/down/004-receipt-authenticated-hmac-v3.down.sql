-- Reverse 004-receipt-authenticated-hmac-v3.sql: narrow the signature-version
-- check on `receipts` back to versions 1 and 2.
--
-- This fails if version 3 receipts exist, because the restored constraint
-- would be violated by those rows. That failure is the guard: export or
-- resolve version 3 receipts before rolling back. Idempotent: safe to run
-- more than once, and safe when 004 was never applied.
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_signature_version_check;
ALTER TABLE receipts ADD CONSTRAINT receipts_signature_version_check
  CHECK (signature_version IN (1, 2));
