// C5.3 — AI Evidence Emission Surface
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Evidence Emission surface records AI routing decisions as structured
// evidence entries. Every call to routeModel() in the Model Broker emits one
// entry here, which the sovereign runtime can ingest into the SEL ledger.
//
// This surface is intentionally thin:
//   - It does NOT write directly to the SEL (sovereign key not assumed present).
//   - It maintains an in-process evidence log that the SEL integration layer
//     can consume (same pattern as buildReceipt / buildWorkflowReceipt in server.js).
//   - It is append-only. No entry is ever mutated or deleted.
//
// Evidence entry shape:
//   evidenceId       — unique identifier (ai-ev/<modelId>/<timestamp>)
//   type             — always 'ai-routing'
//   sessionId        — governed session that triggered routing
//   capabilityId     — which AI capability was requested
//   modelId          — which model was selected
//   provider         — which provider backs the selected model
//   dataClassification — data classification in effect at routing time
//   timestamp        — ISO routing timestamp
//   committedAt      — ISO time this entry was appended to the evidence log

'use strict';

const crypto = require('crypto');

/** @type {object[]} append-only AI routing evidence log */
const evidenceLog = [];

/**
 * Emit a governed AI routing evidence record.
 * Returns the committed evidence entry including its generated evidenceId.
 *
 * @param {{
 *   sessionId: string,
 *   type?: string,
 *   capabilityId: string,
 *   modelId: string,
 *   provider: string,
 *   dataClassification: string,
 *   timestamp: string
 * }} record
 * @returns {{ evidenceId: string, entry: object }}
 */
function emitEvidence(record) {
  if (!record || !record.modelId) {
    throw new Error('EVIDENCE_EMIT: modelId is required');
  }
  if (!record.capabilityId) {
    throw new Error('EVIDENCE_EMIT: capabilityId is required');
  }

  const evidenceId = `ai-ev/${record.modelId}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const entry = {
    evidenceId,
    type: record.type || 'ai-routing',
    sessionId: record.sessionId || null,
    capabilityId: record.capabilityId,
    modelId: record.modelId,
    provider: record.provider || null,
    dataClassification: record.dataClassification || null,
    timestamp: record.timestamp || new Date().toISOString(),
    committedAt: new Date().toISOString()
  };

  evidenceLog.push(entry);

  return { evidenceId, entry };
}

/**
 * Return a read-only snapshot of the AI routing evidence log.
 * Used by the SEL integration layer and the Executive Desk.
 *
 * @returns {object[]}
 */
function getEvidenceLog() {
  return [...evidenceLog];
}

/**
 * Return the count of emitted evidence entries.
 * Useful for health checks and governance reporting.
 *
 * @returns {number}
 */
function getEvidenceCount() {
  return evidenceLog.length;
}

module.exports = { emitEvidence, getEvidenceLog, getEvidenceCount };
