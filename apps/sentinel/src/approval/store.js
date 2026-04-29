const { query } = require('../db/client');

function toDbTimestamp(value) {
  return value || new Date().toISOString();
}

function fromRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    decision: row.decision,
    context: row.context,
    resolution: row.resolution || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    resolvedAt:
      row.resolved_at instanceof Date
        ? row.resolved_at.toISOString()
        : row.resolved_at || undefined
  };
}

async function saveApproval(request) {
  const result = await query(
    `INSERT INTO approvals (id, tenant_id, status, decision, context, resolution, created_at, updated_at, resolved_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       tenant_id = EXCLUDED.tenant_id,
       status = EXCLUDED.status,
       decision = EXCLUDED.decision,
       context = EXCLUDED.context,
       resolution = EXCLUDED.resolution,
       updated_at = EXCLUDED.updated_at,
       resolved_at = EXCLUDED.resolved_at
     RETURNING *`,
    [
      request.id,
      request.context && request.context.tenant ? request.context.tenant : null,
      request.status,
      JSON.stringify(request.decision || {}),
      JSON.stringify(request.context || {}),
      request.resolution ? JSON.stringify(request.resolution) : null,
      toDbTimestamp(request.createdAt),
      toDbTimestamp(request.updatedAt),
      request.resolvedAt || null
    ]
  );

  return result && result.rows && result.rows[0] ? fromRow(result.rows[0]) : null;
}

async function getApproval(id, tenantId = null) {
  const result = tenantId
    ? await query('SELECT * FROM approvals WHERE id = $1 AND tenant_id = $2', [id, tenantId])
    : await query('SELECT * FROM approvals WHERE id = $1', [id]);

  return result && result.rows && result.rows[0] ? fromRow(result.rows[0]) : null;
}

async function listApprovals(status, tenantId = null) {
  let result = null;

  if (status && tenantId) {
    result = await query(
      'SELECT * FROM approvals WHERE status = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT 50',
      [status, tenantId]
    );
  } else if (status) {
    result = await query('SELECT * FROM approvals WHERE status = $1 ORDER BY created_at DESC LIMIT 50', [status]);
  } else if (tenantId) {
    result = await query('SELECT * FROM approvals WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]);
  } else {
    result = await query('SELECT * FROM approvals ORDER BY created_at DESC LIMIT 50', []);
  }

  return result && result.rows ? result.rows.map(fromRow) : null;
}

async function updateApproval(id, status, metadata = {}, tenantId = null) {
  const resolvedAt = new Date().toISOString();
  const result = tenantId
    ? await query(
        `UPDATE approvals
         SET status = $2,
             resolution = $3::jsonb,
             updated_at = $4,
             resolved_at = $4
         WHERE id = $1 AND tenant_id = $5
         RETURNING *`,
        [id, status, JSON.stringify(metadata || {}), resolvedAt, tenantId]
      )
    : await query(
        `UPDATE approvals
         SET status = $2,
             resolution = $3::jsonb,
             updated_at = $4,
             resolved_at = $4
         WHERE id = $1
         RETURNING *`,
        [id, status, JSON.stringify(metadata || {}), resolvedAt]
      );

  return result && result.rows && result.rows[0] ? fromRow(result.rows[0]) : null;
}

module.exports = {
  getApproval,
  listApprovals,
  saveApproval,
  updateApproval
};
