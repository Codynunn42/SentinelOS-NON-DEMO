// C3.5 — AI Capability Broker
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Capability Broker resolves a goal (command intent) to a registered
// capability and routes it to the correct provider.
//
// C3.5 Scope: Registry-based routing — no AI reasoning yet.
// The broker resolves: Goal -> Required Capability -> Registry -> Provider.
//
// C4 Extension: Multi-provider AI selection (evaluate multiple registered
// providers for the same capability, select by health, governance posture,
// cost, or latency) is reserved for the C4 gate.
//
// Routing model:
//   1. Extract command from the planning envelope
//   2. Look up the command in the Capability Registry
//   3. Verify the capability is active and the caller has sufficient role
//   4. Return the routing decision: endpoint, provider, evidence requirements
//   5. If no capability is registered, return BROKER_NO_ROUTE

'use strict';

const { resolveEnvelope, getCapabilitySummary } = require('./resolver');

/**
 * @typedef {Object} BrokerRequest
 * @property {string} command
 * @property {string} tenant
 * @property {string} role
 * @property {object} [metadata]
 */

/**
 * @typedef {Object} BrokerDecision
 * @property {boolean} routed
 * @property {string} [capabilityId]
 * @property {string} [provider]
 * @property {string} [endpoint]
 * @property {boolean} [evidenceRequired]
 * @property {string} [reason]
 * @property {object} [capability]
 */

/**
 * Broker a command to a registered capability.
 * Returns a routing decision.
 *
 * @param {BrokerRequest} request
 * @returns {BrokerDecision}
 */
function brokerCommand(request) {
  const { command, tenant, role } = request || {};

  if (!command) {
    return { routed: false, reason: 'BROKER_COMMAND_REQUIRED' };
  }
  if (!tenant) {
    return { routed: false, reason: 'BROKER_TENANT_REQUIRED' };
  }

  const resolution = resolveEnvelope({ command, tenant, role });

  if (!resolution.resolved) {
    return {
      routed: false,
      reason: resolution.reason || 'BROKER_NO_ROUTE',
      hint: resolution.hint || null,
      lifecycle: resolution.lifecycle || null
    };
  }

  const cap = resolution.capability;

  return {
    routed: true,
    capabilityId: cap.capabilityId,
    provider: cap.provider,
    endpoint: resolution.routingAdvice.endpoint,
    interface: resolution.routingAdvice.interface,
    evidenceRequired: resolution.routingAdvice.evidenceRequired,
    authority: resolution.routingAdvice.authority,
    capability: {
      capabilityId: cap.capabilityId,
      type: cap.type,
      version: cap.version,
      healthEndpoint: cap.healthEndpoint
    }
  };
}

/**
 * Broker a planning request — resolves the intent to a capability and
 * returns the execution endpoint and governance posture.
 * Used by POST /api/v1/planning to answer "which capability handles this?"
 *
 * @param {{ intent: { command: string, payload?: object }, tenant: string, role: string }} params
 * @returns {{ routed: boolean, brokerDecision: BrokerDecision, proposedEndpoint?: string }}
 */
function brokerPlanningRequest(params) {
  const { intent, tenant, role } = params || {};
  const command = intent && intent.command ? intent.command : null;

  if (!command) {
    return { routed: false, brokerDecision: { routed: false, reason: 'BROKER_INTENT_COMMAND_REQUIRED' } };
  }

  const decision = brokerCommand({ command, tenant, role });

  return {
    routed: decision.routed,
    brokerDecision: decision,
    proposedEndpoint: decision.routed ? decision.endpoint : null
  };
}

/**
 * Return a capability manifest for a given provider — used by the
 * Executive Desk and planning responses to surface governance context.
 *
 * @param {string} [provider]
 */
function getCapabilityManifest(provider) {
  return getCapabilitySummary(provider);
}

module.exports = {
  brokerCommand,
  brokerPlanningRequest,
  getCapabilityManifest
};
