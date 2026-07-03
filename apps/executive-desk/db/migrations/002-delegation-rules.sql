-- Delegation Rules Table
-- Append-only ledger of authority delegations
-- Used to grant time-bound access to commands

CREATE TABLE IF NOT EXISTS delegation_rules (
  id UUID PRIMARY KEY,
  granted_by VARCHAR(255) NOT NULL,
  granted_to VARCHAR(255) NOT NULL,
  command VARCHAR(255) NOT NULL,
  resource VARCHAR(255),
  scope VARCHAR(50) NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'team', 'repository')),
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP,
  reason TEXT NOT NULL,
  revoked_at TIMESTAMP,
  revoked_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT delegation_valid_until_after_from CHECK (valid_until IS NULL OR valid_until > valid_from),
  CONSTRAINT delegation_not_future_revoked CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_delegation_granted_to ON delegation_rules(granted_to);
CREATE INDEX IF NOT EXISTS idx_delegation_command ON delegation_rules(command);
CREATE INDEX IF NOT EXISTS idx_delegation_granted_by ON delegation_rules(granted_by);
CREATE INDEX IF NOT EXISTS idx_delegation_valid_from ON delegation_rules(valid_from);
CREATE INDEX IF NOT EXISTS idx_delegation_created_at ON delegation_rules(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delegation_revoked_at ON delegation_rules(revoked_at);

-- Composite index for common queries: find active delegations for a principal and command
CREATE INDEX IF NOT EXISTS idx_delegation_active 
  ON delegation_rules(granted_to, command, valid_from, valid_until)
  WHERE revoked_at IS NULL;

-- View: Active (non-revoked) delegations
CREATE OR REPLACE VIEW delegation_rules_active AS
  SELECT * FROM delegation_rules
  WHERE revoked_at IS NULL;

-- View: Delegations by principal
CREATE OR REPLACE VIEW delegation_rules_by_principal AS
  SELECT 
    granted_to,
    COUNT(*) as total_delegations,
    COUNT(*) FILTER (WHERE revoked_at IS NULL) as active_delegations,
    MAX(valid_until) as latest_expiry
  FROM delegation_rules
  GROUP BY granted_to;

-- View: Delegations by grantor
CREATE OR REPLACE VIEW delegation_rules_by_grantor AS
  SELECT 
    granted_by,
    COUNT(*) as total_grants,
    COUNT(*) FILTER (WHERE revoked_at IS NULL) as active_grants,
    COUNT(DISTINCT granted_to) as unique_principals
  FROM delegation_rules
  GROUP BY granted_by;

-- Function: Find applicable delegations for a principal at a given time
CREATE OR REPLACE FUNCTION find_applicable_delegations(
  p_principal_id VARCHAR(255),
  p_command VARCHAR(255),
  p_resource VARCHAR(255) DEFAULT NULL,
  p_at_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  id UUID,
  granted_by VARCHAR(255),
  granted_to VARCHAR(255),
  command VARCHAR(255),
  resource VARCHAR(255),
  scope VARCHAR(50),
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.id,
    dr.granted_by,
    dr.granted_to,
    dr.command,
    dr.resource,
    dr.scope,
    dr.valid_from,
    dr.valid_until,
    dr.reason
  FROM delegation_rules dr
  WHERE
    dr.granted_to = p_principal_id
    AND dr.command = p_command
    AND (p_resource IS NULL OR dr.resource IS NULL OR dr.resource = p_resource)
    AND dr.revoked_at IS NULL
    AND dr.valid_from <= p_at_time
    AND (dr.valid_until IS NULL OR dr.valid_until >= p_at_time);
END;
$$ LANGUAGE plpgsql;

-- Function: Export delegations for audit/compliance
CREATE OR REPLACE FUNCTION export_delegations_since(p_since TIMESTAMP DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  granted_by VARCHAR(255),
  granted_to VARCHAR(255),
  command VARCHAR(255),
  resource VARCHAR(255),
  scope VARCHAR(50),
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  reason TEXT,
  revoked_at TIMESTAMP,
  revoked_reason TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.id,
    dr.granted_by,
    dr.granted_to,
    dr.command,
    dr.resource,
    dr.scope,
    dr.valid_from,
    dr.valid_until,
    dr.reason,
    dr.revoked_at,
    dr.revoked_reason,
    dr.created_at
  FROM delegation_rules dr
  WHERE (p_since IS NULL OR dr.created_at >= p_since)
  ORDER BY dr.created_at DESC;
END;
$$ LANGUAGE plpgsql;
