-- Version 3 receipts use an HMAC-SHA-256 keyed by
-- EXECUTIVE_DESK_RECEIPT_HMAC_KEY. Older digest-only versions remain readable
-- as explicitly unsigned legacy records; they are not upgraded or re-signed.
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_signature_version_check;
ALTER TABLE receipts ADD CONSTRAINT receipts_signature_version_check
  CHECK (signature_version IN (1, 2, 3));
