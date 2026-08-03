// capabilityBroker.js
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Resolves capability requests and routes ai-* capabilities through the
// Model Broker.  Writes an evidence entry for every ai-routing invocation
// so the audit trail is complete.

'use strict';

const { resolveCapabilityToModule } = require('./resolver');
const { routeModel } = require('../ai/modelBroker');

// In-process evidence log — consumed by ORV and by the audit surface.
const evidenceLog = [];

/**
 * Returns all evidence entries accumulated in this process lifetime.
 * @returns {object[]}
 */
function getEvidenceLog() {
  return evidenceLog.slice();
}

/**
 * Clears the evidence log (used in test harnesses between campaigns).
 */
function clearEvidenceLog() {
  evidenceLog.length = 0;
}

/**
 * Resolves a capability name, invoking the Model Broker when the capability
 * starts with "ai-".  Writes an evidence entry for every ai-routing call.
 *
 * @param {{ capability: string, payload?: object, actor?: string }} request
 * @returns {{ capability: string, module: object|null, aiRoute?: object, evidenceRef?: string }}
 */
function invokeCapability(request) {
  const { capability, payload = {}, actor = 'system' } = request;

  const module = resolveCapabilityToModule(capability);

  if (!capability.startsWith('ai-')) {
    return { capability, module };
  }

  // Route through the Model Broker.
  const aiRoute = routeModel({ capability, payload, actor });

  // Write evidence entry.
  const evidenceRef = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  evidenceLog.push({
    evidenceRef,
    type: 'ai-routing',
    capability,
    module: module ? module.moduleId : 'ai-operations',
    provider: aiRoute.provider,
    actor,
    timestamp: aiRoute.timestamp
  });

  return { capability, module, aiRoute, evidenceRef };
}

module.exports = { invokeCapability, getEvidenceLog, clearEvidenceLog };
