// C5.2 — Provider Registry
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Provider Registry is the canonical list of capability providers
// recognised by SentinelOS. It is the authoritative source of valid
// providerId values that the Module Registry may reference.
//
// Per the SentinelOS Constitution, Principle II:
//   Providers are implementation details, not institutional concepts.
//   The institution interacts with Modules; providers remain internal.
//
// Provider structure:
//   providerId       — canonical internal identifier (kebab-case)
//   displayName      — human-readable label (internal tooling only)
//   type             — 'institutional' | 'ai' | 'cloud'
//   healthEndpoint   — relative path used to verify provider availability
//   lifecycleStatus  — 'active' | 'pending' | 'deprecated'
//
// This registry is READ-ONLY at runtime. Providers are registered at
// startup and are not modified by requests.

'use strict';

const PROVIDER_LIFECYCLE = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DEPRECATED: 'deprecated'
};

const PROVIDER_TYPE = {
  INSTITUTIONAL: 'institutional',
  AI: 'ai',
  CLOUD: 'cloud'
};

/**
 * @typedef {Object} ProviderRecord
 * @property {string} providerId
 * @property {string} displayName
 * @property {string} type
 * @property {string} healthEndpoint
 * @property {string} lifecycleStatus
 * @property {string} registeredAt
 */

/** @type {Map<string, ProviderRecord>} */
const providerStore = new Map();

/**
 * Register a provider in the registry.
 * @param {ProviderRecord} provider
 */
function registerProvider(provider) {
  if (!provider || !provider.providerId) {
    throw new Error('PROVIDER_REGISTRY: providerId is required');
  }
  if (!provider.displayName) {
    throw new Error('PROVIDER_REGISTRY: displayName is required');
  }
  if (!provider.type) {
    throw new Error('PROVIDER_REGISTRY: type is required');
  }

  providerStore.set(provider.providerId, {
    ...provider,
    lifecycleStatus: provider.lifecycleStatus || PROVIDER_LIFECYCLE.ACTIVE,
    registeredAt: provider.registeredAt || new Date().toISOString()
  });
}

/**
 * Retrieve a provider by ID.
 * @param {string} providerId
 * @returns {ProviderRecord | null}
 */
function getProvider(providerId) {
  return providerStore.get(providerId) || null;
}

/**
 * List all registered providers, optionally filtered by lifecycle status or type.
 * @param {{ lifecycleStatus?: string, type?: string }} [options]
 * @returns {ProviderRecord[]}
 */
function listProviders(options = {}) {
  const all = Array.from(providerStore.values());
  return all.filter((p) => {
    if (options.lifecycleStatus && p.lifecycleStatus !== options.lifecycleStatus) return false;
    if (options.type && p.type !== options.type) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Built-in provider registrations — all providers recognised by SentinelOS
// ---------------------------------------------------------------------------

registerProvider({
  providerId: 'nexus',
  displayName: 'NEXUS',
  type: PROVIDER_TYPE.INSTITUTIONAL,
  healthEndpoint: '/health',
  lifecycleStatus: PROVIDER_LIFECYCLE.ACTIVE
});

registerProvider({
  providerId: 'tilda',
  displayName: 'Tilda',
  type: PROVIDER_TYPE.INSTITUTIONAL,
  healthEndpoint: '/health',
  lifecycleStatus: PROVIDER_LIFECYCLE.ACTIVE
});

registerProvider({
  providerId: 'microsoft365',
  displayName: 'Microsoft 365',
  type: PROVIDER_TYPE.CLOUD,
  healthEndpoint: '/health',
  lifecycleStatus: PROVIDER_LIFECYCLE.ACTIVE
});

registerProvider({
  providerId: 'github',
  displayName: 'GitHub',
  type: PROVIDER_TYPE.CLOUD,
  healthEndpoint: '/health',
  lifecycleStatus: PROVIDER_LIFECYCLE.ACTIVE
});

registerProvider({
  providerId: 'ownerfi',
  displayName: 'OwnerFi',
  type: PROVIDER_TYPE.INSTITUTIONAL,
  healthEndpoint: '/health',
  lifecycleStatus: PROVIDER_LIFECYCLE.ACTIVE
});

registerProvider({
  providerId: 'azure-openai',
  displayName: 'Azure OpenAI',
  type: PROVIDER_TYPE.AI,
  healthEndpoint: '/health',
  lifecycleStatus: PROVIDER_LIFECYCLE.ACTIVE
});

registerProvider({
  providerId: 'openai',
  displayName: 'OpenAI',
  type: PROVIDER_TYPE.AI,
  healthEndpoint: '/health',
  lifecycleStatus: PROVIDER_LIFECYCLE.ACTIVE
});

module.exports = {
  PROVIDER_LIFECYCLE,
  PROVIDER_TYPE,
  registerProvider,
  getProvider,
  listProviders
};
