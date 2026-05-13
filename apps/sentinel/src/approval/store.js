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
    events: Array.isArray(row.events) ? row.events : [],
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
    `INSERT INTO approvals (id, tenant_id, status, decision, context, events, resolution, created_at, updated_at, resolved_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       tenant_id = EXCLUDED.tenant_id,
       status = EXCLUDED.status,
       decision = EXCLUDED.decision,
       context = EXCLUDED.context,
       events = EXCLUDED.events,
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
      JSON.stringify(Array.isArray(request.events) ? request.events : []),
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
  const eventType = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : status;
  const event = {
    type: eventType,
    actor: metadata && metadata.actor ? metadata.actor : 'system',
    timestamp: resolvedAt
  };
  const result = tenantId
    ? await query(
        `UPDATE approvals
         SET status = $2,
             resolution = $3::jsonb,
             events = COALESCE(events, '[]'::jsonb) || $4::jsonb,
             updated_at = $5,
             resolved_at = $5
         WHERE id = $1 AND tenant_id = $6
         RETURNING *`,
        [id, status, JSON.stringify(metadata || {}), JSON.stringify([event]), resolvedAt, tenantId]
      )
    : await query(
        `UPDATE approvals
         SET status = $2,
             resolution = $3::jsonb,
             events = COALESCE(events, '[]'::jsonb) || $4::jsonb,
             updated_at = $5,
             resolved_at = $5
         WHERE id = $1
         RETURNING *`,
        [id, status, JSON.stringify(metadata || {}), JSON.stringify([event]), resolvedAt]
      );

  return result && result.rows && result.rows[0] ? fromRow(result.rows[0]) : null;
}

async function appendApprovalEvent(id, event, tenantId = null) {
  const now = event.timestamp || new Date().toISOString();
  const normalizedEvent = {
    type: event.type,
    actor: event.actor || 'system',
    timestamp: now
  };
  const result = tenantId
    ? await query(
        `UPDATE approvals
         SET events = COALESCE(events, '[]'::jsonb) || $2::jsonb,
             updated_at = $3
         WHERE id = $1 AND tenant_id = $4
         RETURNING *`,
        [id, JSON.stringify([normalizedEvent]), now, tenantId]
      )
    : await query(
        `UPDATE approvals
         SET events = COALESCE(events, '[]'::jsonb) || $2::jsonb,
             updated_at = $3
         WHERE id = $1
         RETURNING *`,
        [id, JSON.stringify([normalizedEvent]), now]
      );

  return result && result.rows && result.rows[0] ? fromRow(result.rows[0]) : null;
}

module.exports = {
  appendApprovalEvent,
  getApproval,
  listApprovals,
  saveApproval,
  updateApproval
};
