const crypto = require('crypto');
const { query } = require('../db/client');
const {
  LifecycleConflictError,
  LifecycleValidationError
} = require('./lifecycleErrors');
const {
  isAllowedTransition,
  isKnownLifecycleState
} = require('./lifecycleStates');

const lifecycleRecords = new Map();
const lifecycleEvents = new Map();

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeRecord(row) {
  if (!row) {
    return null;
  }

  return {
    commandId: row.command_id,
    planningId: row.planning_id,
    tenant: row.tenant_id,
    command: row.command,
    actorId: row.actor_id,
    envelopeVersion: row.envelope_version,
    currentState: row.current_state,
    stateVersion: Number(row.state_version),
    idempotencyKey: row.idempotency_key,
    requestHash: row.request_hash,
    policyDecision: row.policy_decision || null,
    nextAction: row.next_action || null,
    approvalId: row.approval_id || null,
    traceId: row.trace_id || null,
    requestPayload: row.request_payload || {},
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

function normalizeEvent(row) {
  if (!row) {
    return null;
  }

  return {
    eventId: row.event_id,
    commandId: row.command_id,
    planningId: row.planning_id,
    eventType: row.event_type,
    previousState: row.previous_state || null,
    nextState: row.next_state || null,
    actorType: row.actor_type || 'system',
    actorId: row.actor_id || 'system',
    metadata: row.metadata_json || {},
    traceId: row.trace_id || null,
    occurredAt: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at
  };
}

function rememberRecord(record) {
  const stored = clone(record);
  lifecycleRecords.set(stored.commandId, stored);
  if (stored.idempotencyKey) {
    lifecycleRecords.set(`idem:${stored.idempotencyKey}`, stored);
  }
  return clone(stored);
}

function rememberEvent(event) {
  const stored = clone(event);
  const events = lifecycleEvents.get(stored.commandId) || [];
  events.push(stored);
  lifecycleEvents.set(stored.commandId, events);
  return clone(stored);
}

async function getLifecycleByCommandId(commandId) {
  const result = await query('SELECT * FROM command_lifecycle WHERE command_id = $1', [commandId]);
  if (result && result.rows && result.rows[0]) {
    return rememberRecord(normalizeRecord(result.rows[0]));
  }

  const fallback = lifecycleRecords.get(commandId);
  return fallback ? clone(fallback) : null;
}

async function getLifecycleByIdempotencyKey(idempotencyKey) {
  const result = await query('SELECT * FROM command_lifecycle WHERE idempotency_key = $1', [idempotencyKey]);
  if (result && result.rows && result.rows[0]) {
    return rememberRecord(normalizeRecord(result.rows[0]));
  }

  const fallback = lifecycleRecords.get(`idem:${idempotencyKey}`);
  return fallback ? clone(fallback) : null;
}

async function createLifecycleRecord(input) {
  if (!input || !input.commandId || !input.planningId || !input.currentState) {
    throw new LifecycleValidationError('Lifecycle record requires commandId, planningId, and currentState');
  }

  if (!isKnownLifecycleState(input.currentState)) {
    throw new LifecycleValidationError(`Unknown lifecycle state: ${input.currentState}`);
  }

  const now = input.createdAt || new Date().toISOString();
  const record = {
    commandId: input.commandId,
    planningId: input.planningId,
    tenant: input.tenant || null,
    command: input.command || null,
    actorId: input.actorId || 'system',
    envelopeVersion: input.envelopeVersion || '1.0.0',
    currentState: input.currentState,
    stateVersion: Number.isInteger(input.stateVersion) ? input.stateVersion : 0,
    idempotencyKey: input.idempotencyKey || null,
    requestHash: input.requestHash || null,
    policyDecision: input.policyDecision || null,
    nextAction: input.nextAction || null,
    approvalId: input.approvalId || null,
    traceId: input.traceId || null,
    requestPayload: input.requestPayload || {},
    createdAt: now,
    updatedAt: input.updatedAt || now
  };

  try {
    const result = await query(
      `INSERT INTO command_lifecycle (
         command_id,
         planning_id,
         tenant_id,
         command,
         actor_id,
         envelope_version,
         current_state,
         state_version,
         idempotency_key,
         request_hash,
         policy_decision,
         next_action,
         approval_id,
         trace_id,
         request_payload,
         created_at,
         updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15::jsonb, $16, $17
       ) RETURNING *`,
      [
        record.commandId,
        record.planningId,
        record.tenant,
        record.command,
        record.actorId,
        record.envelopeVersion,
        record.currentState,
        record.stateVersion,
        record.idempotencyKey,
        record.requestHash,
        JSON.stringify(record.policyDecision || {}),
        record.nextAction,
        record.approvalId,
        record.traceId,
        JSON.stringify(record.requestPayload || {}),
        record.createdAt,
        record.updatedAt
      ]
    );

    if (result && result.rows && result.rows[0]) {
      return rememberRecord(normalizeRecord(result.rows[0]));
    }
  } catch (error) {
    if (error && error.code === '23505') {
      throw new LifecycleConflictError('Duplicate lifecycle record', {
        commandId: record.commandId,
        idempotencyKey: record.idempotencyKey
      });
    }

    throw error;
  }

  if (lifecycleRecords.has(record.commandId)) {
    throw new LifecycleConflictError('Duplicate lifecycle record', {
      commandId: record.commandId,
      idempotencyKey: record.idempotencyKey
    });
  }

  if (record.idempotencyKey && lifecycleRecords.has(`idem:${record.idempotencyKey}`)) {
    throw new LifecycleConflictError('Duplicate lifecycle record', {
      commandId: record.commandId,
      idempotencyKey: record.idempotencyKey
    });
  }

  return rememberRecord(record);
}

async function recordLifecycleEvent(input = {}) {
  if (!input.commandId || !input.planningId || !input.eventType) {
    throw new LifecycleValidationError('Lifecycle event requires commandId, planningId, and eventType');
  }

  const event = {
    eventId: input.eventId || `evt_${crypto.randomUUID()}`,
    commandId: input.commandId,
    planningId: input.planningId,
    eventType: input.eventType,
    previousState: input.previousState || null,
    nextState: input.nextState || null,
    actorType: input.actorType || 'system',
    actorId: input.actorId || 'system',
    metadata: input.metadata || {},
    traceId: input.traceId || null,
    occurredAt: input.occurredAt || new Date().toISOString()
  };

  const result = await query(
    `INSERT INTO command_lifecycle_events (
       event_id,
       command_id,
       planning_id,
       event_type,
       previous_state,
       next_state,
       actor_type,
       actor_id,
       metadata_json,
       trace_id,
       occurred_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
     RETURNING *`,
    [
      event.eventId,
      event.commandId,
      event.planningId,
      event.eventType,
      event.previousState,
      event.nextState,
      event.actorType,
      event.actorId,
      JSON.stringify(event.metadata || {}),
      event.traceId,
      event.occurredAt
    ]
  );

  if (result && result.rows && result.rows[0]) {
    return rememberEvent(normalizeEvent(result.rows[0]));
  }

  return rememberEvent(event);
}

async function transitionLifecycleRecord(input = {}) {
  const current = await getLifecycleByCommandId(input.commandId);
  if (!current) {
    throw new LifecycleValidationError(`Lifecycle record not found for ${input.commandId}`);
  }

  if (input.expectedState && current.currentState !== input.expectedState) {
    throw new LifecycleConflictError('Lifecycle state mismatch', {
      expectedState: input.expectedState,
      actualState: current.currentState,
      commandId: input.commandId
    });
  }

  if (Number.isInteger(input.expectedVersion) && current.stateVersion !== input.expectedVersion) {
    throw new LifecycleConflictError('Lifecycle version mismatch', {
      expectedVersion: input.expectedVersion,
      actualVersion: current.stateVersion,
      commandId: input.commandId
    });
  }

  if (!isKnownLifecycleState(input.nextState)) {
    throw new LifecycleValidationError(`Unknown lifecycle state: ${input.nextState}`);
  }

  if (!isAllowedTransition(current.currentState, input.nextState)) {
    throw new LifecycleValidationError(
      `Invalid lifecycle transition: ${current.currentState} -> ${input.nextState}`,
      {
        commandId: input.commandId,
        previousState: current.currentState,
        nextState: input.nextState
      }
    );
  }

  const updatedAt = input.updatedAt || new Date().toISOString();
  const nextVersion = current.stateVersion + 1;
  const nextRecord = {
    ...current,
    currentState: input.nextState,
    stateVersion: nextVersion,
    policyDecision:
      input.policyDecision !== undefined ? input.policyDecision : current.policyDecision,
    nextAction: input.nextAction !== undefined ? input.nextAction : current.nextAction,
    approvalId: input.approvalId !== undefined ? input.approvalId : current.approvalId,
    traceId: input.traceId !== undefined ? input.traceId : current.traceId,
    updatedAt
  };

  const result = await query(
    `UPDATE command_lifecycle
     SET current_state = $2,
         state_version = $3,
         policy_decision = $4::jsonb,
         next_action = $5,
         approval_id = $6,
         trace_id = $7,
         updated_at = $8
     WHERE command_id = $1 AND state_version = $9
     RETURNING *`,
    [
      input.commandId,
      nextRecord.currentState,
      nextRecord.stateVersion,
      JSON.stringify(nextRecord.policyDecision || {}),
      nextRecord.nextAction,
      nextRecord.approvalId,
      nextRecord.traceId,
      nextRecord.updatedAt,
      current.stateVersion
    ]
  );

  let stored = nextRecord;
  if (result && result.rows && result.rows[0]) {
    stored = normalizeRecord(result.rows[0]);
  } else if (result && result.rowCount === 0) {
    throw new LifecycleConflictError('Lifecycle version mismatch', {
      expectedVersion: current.stateVersion,
      commandId: input.commandId
    });
  }

  const normalizedRecord = rememberRecord(stored);

  await recordLifecycleEvent({
    commandId: normalizedRecord.commandId,
    planningId: normalizedRecord.planningId,
    eventType: input.eventType || 'STATE_TRANSITION',
    previousState: current.currentState,
    nextState: normalizedRecord.currentState,
    actorType: input.actorType || 'system',
    actorId: input.actorId || current.actorId || 'system',
    metadata: input.metadata || {},
    traceId: input.traceId !== undefined ? input.traceId : normalizedRecord.traceId,
    occurredAt: updatedAt
  });

  return normalizedRecord;
}

module.exports = {
  createLifecycleRecord,
  getLifecycleByCommandId,
  getLifecycleByIdempotencyKey,
  recordLifecycleEvent,
  transitionLifecycleRecord
};
