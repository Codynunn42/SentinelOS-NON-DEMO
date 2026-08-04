// C3.2 — Capability Resolver
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The resolver bridges the Command Envelope API to the Capability Registry.
// Given a command and tenant, it returns the registered capability record,
// its authority requirements, and its governance posture.
//
// In C3.5, the AI Capability Broker extends this with multi-provider reasoning.
// In C3.2, resolution is registry lookup only — no AI selection.

'use strict';

const {
  getCapability,
  listCapabilities,
  resolveCapabilityForCommand,
  LIFECYCLE
} = require('./registry');

/**
 * Resolve the capability for a command envelope.
 * Returns a resolution result with the capability record and routing decision.
 *
 * @param {{ command: string, tenant: string, role?: string }} params
 * @returns {{ resolved: boolean, capability: import('./registry').Capability | null, reason?: string, routingAdvice?: object }}
 */
function resolveEnvelope(params) {
  const { command, tenant, role } = params || {};

  if (!command) {
    return { resolved: false, capability: null, reason: 'COMMAND_REQUIRED' };
  }
  if (!tenant) {
    return { resolved: false, capability: null, reason: 'TENANT_REQUIRED' };
  }

  const capability = resolveCapabilityForCommand({ command, tenant });

  if (!capability) {
    return {
      resolved: false,
      capability: null,
      reason: 'NO_CAPABILITY_REGISTERED',
      hint: `No active capability found for command '${command}' in tenant '${tenant}'`
    };
  }

  if (capability.lifecycle.status !== LIFECYCLE.ACTIVE) {
    return {
      resolved: false,
      capability,
      reason: 'CAPABILITY_NOT_ACTIVE',
      lifecycle: capability.lifecycle.status
    };
  }

  const minimumRole = capability.authority && capability.authority.minimumRole;
  const roleInsufficient = minimumRole === 'executive' && role !== 'executive' && role !== 'platform';

  if (roleInsufficient) {
    return {
      resolved: false,
      capability,
      reason: 'INSUFFICIENT_ROLE',
      requiredRole: minimumRole,
      providedRole: role || null
    };
  }

  return {
    resolved: true,
    capability,
    routingAdvice: {
      endpoint: capability.endpoint,
      interface: capability.interface,
      evidenceRequired: capability.governance && capability.governance.evidenceRequired,
      authority: capability.authority
    }
  };
}

/**
 * Summarize all registered capabilities for a given provider.
 * Used by the Executive Desk to display registered capabilities.
 *
 * @param {string} [provider]
 * @returns {{ provider: string, total: number, active: number, capabilities: object[] }}
 */
function getCapabilitySummary(provider) {
  const all = provider
    ? listCapabilities({ provider })
    : listCapabilities();

  const active = all.filter((c) => c.lifecycle.status === LIFECYCLE.ACTIVE);

  return {
    provider: provider || 'all',
    total: all.length,
    active: active.length,
    capabilities: all.map((c) => ({
      capabilityId: c.capabilityId,
      provider: c.provider,
      type: c.type,
      endpoint: c.endpoint,
      authority: c.authority,
      governance: c.governance,
      lifecycle: c.lifecycle,
      healthEndpoint: c.healthEndpoint,
      version: c.version
    }))
  };
}

module.exports = {
  resolveEnvelope,
  getCapabilitySummary,
  getCapability,
  listCapabilities
};
