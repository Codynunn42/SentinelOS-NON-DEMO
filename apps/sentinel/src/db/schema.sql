CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'ownerfi',
  name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  amount INT NOT NULL,
  credit_score INT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'ownerfi',
  application_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'ownerfi',
  command TEXT NOT NULL,
  payload JSONB NOT NULL,
  result JSONB NOT NULL,
  actor TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  status TEXT NOT NULL,
  decision JSONB NOT NULL,
  context JSONB NOT NULL,
  resolution JSONB,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'ownerfi';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'ownerfi';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'ownerfi';
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS resolution JSONB;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
