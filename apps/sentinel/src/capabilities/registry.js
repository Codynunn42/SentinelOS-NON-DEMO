// C3.2 — Capability Registry
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Capability Registry is the governed inventory of capabilities exposed
// by every system docked to SentinelOS. NEXUS is the first registered provider.
//
// Every capability record includes:
//   - capabilityId: unique identifier
//   - provider: system that owns this capability
//   - type: executive | read | write | execute | report
//   - interface: REST | WebSocket | event
//   - endpoint: the Command Envelope API path this capability routes through
//   - authority.minimumRole: minimum role required to invoke
//   - lifecycle.status: active | deprecated | pending
//   - governance.evidenceRequired: true | false
//   - healthEndpoint: relative path for health verification
//   - version: semver string

'use strict';

const LIFECYCLE = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DEPRECATED: 'deprecated'
};

const CAPABILITY_TYPE = {
  EXECUTIVE: 'executive',
  READ: 'read',
  WRITE: 'write',
  EXECUTE: 'execute',
  REPORT: 'report'
};

const INTERFACE = {
  REST: 'REST'
};

/**
 * @typedef {Object} CapabilityAuthority
 * @property {string} minimumRole
 */

/**
 * @typedef {Object} CapabilityGovernance
 * @property {boolean} evidenceRequired
 */

/**
 * @typedef {Object} CapabilityLifecycle
 * @property {string} status
 * @property {string} registeredAt
 */

/**
 * @typedef {Object} Capability
 * @property {string} capabilityId
 * @property {string} provider
 * @property {string} type
 * @property {string} interface
 * @property {string} endpoint
 * @property {CapabilityAuthority} authority
 * @property {CapabilityLifecycle} lifecycle
 * @property {CapabilityGovernance} governance
 * @property {string} healthEndpoint
 * @property {string} version
 */

/** @type {Map<string, Capability>} */
const capabilityStore = new Map();

/**
 * Register a capability in the registry.
 * Registration does not grant execution rights — governance preflight still
 * runs per command. This is institutional record only.
 *
 * @param {Capability} capability
 */
function registerCapability(capability) {
  if (!capability || !capability.capabilityId) {
    throw new Error('CAPABILITY_REGISTRY: capabilityId is required');
  }
  if (!capability.provider) {
    throw new Error('CAPABILITY_REGISTRY: provider is required');
  }
  if (!capability.type) {
    throw new Error('CAPABILITY_REGISTRY: type is required');
  }
  if (!capability.endpoint) {
    throw new Error('CAPABILITY_REGISTRY: endpoint is required');
  }
  capabilityStore.set(capability.capabilityId, {
    ...capability,
    lifecycle: {
      status: capability.lifecycle && capability.lifecycle.status ? capability.lifecycle.status : LIFECYCLE.ACTIVE,
      registeredAt: capability.lifecycle && capability.lifecycle.registeredAt
        ? capability.lifecycle.registeredAt
        : new Date().toISOString()
    }
  });
}

/**
 * Resolve a capability by ID.
 * @param {string} capabilityId
 * @returns {Capability | null}
 */
function getCapability(capabilityId) {
  return capabilityStore.get(capabilityId) || null;
}

/**
 * List all registered capabilities, optionally filtered.
 * @param {{ provider?: string, type?: string, lifecycle?: string }} options
 * @returns {Capability[]}
 */
function listCapabilities(options = {}) {
  const all = Array.from(capabilityStore.values());
  return all.filter((cap) => {
    if (options.provider && cap.provider !== options.provider) return false;
    if (options.type && cap.type !== options.type) return false;
    if (options.lifecycle && cap.lifecycle.status !== options.lifecycle) return false;
    return true;
  });
}

/**
 * Resolve the best capability for a given command and tenant.
 * Returns the first active capability whose endpoint matches the command path.
 * The AI Capability Broker (C3.5) extends this with multi-provider reasoning.
 *
 * @param {{ command: string, tenant: string }} params
 * @returns {Capability | null}
 */
function resolveCapabilityForCommand(params) {
  const { command, tenant } = params || {};
  if (!command) return null;

  const active = listCapabilities({ lifecycle: LIFECYCLE.ACTIVE });

  // Prefer an exact tenant + command match
  const tenantMatch = active.find(
    (cap) => cap.provider === tenant && cap.commands && cap.commands.includes(command)
  );
  if (tenantMatch) return tenantMatch;

  // Fall back to any capability whose commands list includes this command
  const commandMatch = active.find(
    (cap) => cap.commands && cap.commands.includes(command)
  );
  return commandMatch || null;
}

// -------------------------------------------------------------------------
// Built-in registrations — NEXUS as the first capability provider
// -------------------------------------------------------------------------

registerCapability({
  capabilityId: 'NEXUS-READ-001',
  provider: 'nexus',
  type: CAPABILITY_TYPE.READ,
  interface: INTERFACE.REST,
  endpoint: '/api/v1/planning',
  authority: { minimumRole: 'operator' },
  governance: { evidenceRequired: false },
  healthEndpoint: '/health',
  version: '1.0',
  commands: ['nexus.status.read', 'nexus.console.init']
});

registerCapability({
  capabilityId: 'NEXUS-WRITE-001',
  provider: 'nexus',
  type: CAPABILITY_TYPE.WRITE,
  interface: INTERFACE.REST,
  endpoint: '/api/v1/command-envelope',
  authority: { minimumRole: 'operator' },
  governance: { evidenceRequired: false },
  healthEndpoint: '/health',
  version: '1.0',
  commands: ['nexus.intent.emit']
});

registerCapability({
  capabilityId: 'NEXUS-EXECUTE-001',
  provider: 'nexus',
  type: CAPABILITY_TYPE.EXECUTE,
  interface: INTERFACE.REST,
  endpoint: '/api/v1/execution',
  authority: { minimumRole: 'executive' },
  governance: { evidenceRequired: true },
  healthEndpoint: '/health',
  version: '1.0',
  commands: ['nexus.command.execute']
});

registerCapability({
  capabilityId: 'NEXUS-EXECUTIVE-001',
  provider: 'nexus',
  type: CAPABILITY_TYPE.EXECUTIVE,
  interface: INTERFACE.REST,
  endpoint: '/api/v1/planning',
  authority: { minimumRole: 'executive' },
  governance: { evidenceRequired: true },
  healthEndpoint: '/health',
  version: '1.0',
  commands: ['nexus.executive.review']
});

registerCapability({
  capabilityId: 'OWNERFI-EXECUTE-001',
  provider: 'ownerfi',
  type: CAPABILITY_TYPE.EXECUTE,
  interface: INTERFACE.REST,
  endpoint: '/api/v1/execution',
  authority: { minimumRole: 'operator' },
  governance: { evidenceRequired: true },
  healthEndpoint: '/health',
  version: '1.0',
  commands: ['application.submit', 'application.evaluate', 'deal.submit', 'deal.approve', 'deal.execute']
});

module.exports = {
  LIFECYCLE,
  CAPABILITY_TYPE,
  INTERFACE,
  registerCapability,
  getCapability,
  listCapabilities,
  resolveCapabilityForCommand
};
