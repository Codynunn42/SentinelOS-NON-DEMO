// C5.1 — Institutional Module Registry
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Module Registry is the institutional abstraction layer above the
// Capability Registry. It maps institutional purposes (modules) to the
// underlying capability providers that fulfill them.
//
// Architecture (per the SentinelOS Constitution, Principle II):
//   Providers are implementation details, not institutional concepts.
//   The institution interacts with Modules, not with provider names.
//
// The Module Registry is a READ-ONLY projection layer.
// It does NOT modify the Capability Registry, Broker, or sovereign runtime.
// All governance, routing, and evidence continue to flow through existing
// layers unchanged.
//
// Module structure:
//   moduleId             — canonical identifier (kebab-case)
//   displayName          — what the institution sees
//   description          — institutional purpose, not technical description
//   capabilities[]       — capabilityIds from the Capability Registry
//   providers[]          — backing providers (internal; not exposed externally)
//   healthAggregation    — 'all' (degraded if any degrades) | 'any' (healthy if any healthy)
//   governance           — module-level minimum role and evidence requirement
//   lifecycleStatus      — active | pending | deprecated

'use strict';

const MODULE_HEALTH_AGGREGATION = {
  ALL: 'all', // module is healthy only when ALL providers are healthy
  ANY: 'any'  // module is healthy when ANY provider is healthy (resilient modules)
};

const MODULE_LIFECYCLE = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DEPRECATED: 'deprecated'
};

/**
 * @typedef {Object} ModuleGovernance
 * @property {string} minimumRole
 * @property {boolean} evidenceRequired
 */

/**
 * @typedef {Object} InstitutionalModule
 * @property {string} moduleId
 * @property {string} displayName
 * @property {string} description
 * @property {string[]} capabilities
 * @property {string[]} providers
 * @property {string} healthAggregation
 * @property {ModuleGovernance} governance
 * @property {string} lifecycleStatus
 * @property {string} registeredAt
 */

/** @type {Map<string, InstitutionalModule>} */
const moduleStore = new Map();

/**
 * Register an Institutional Module.
 * Modules are registered at startup and are not modified at runtime.
 *
 * @param {InstitutionalModule} mod
 */
function registerModule(mod) {
  if (!mod || !mod.moduleId) {
    throw new Error('MODULE_REGISTRY: moduleId is required');
  }
  if (!mod.displayName) {
    throw new Error('MODULE_REGISTRY: displayName is required');
  }
  if (!Array.isArray(mod.capabilities) || mod.capabilities.length === 0) {
    throw new Error(`MODULE_REGISTRY: capabilities array is required for module ${mod.moduleId}`);
  }
  if (!Array.isArray(mod.providers) || mod.providers.length === 0) {
    throw new Error(`MODULE_REGISTRY: providers array is required for module ${mod.moduleId}`);
  }

  moduleStore.set(mod.moduleId, {
    ...mod,
    healthAggregation: mod.healthAggregation || MODULE_HEALTH_AGGREGATION.ALL,
    lifecycleStatus: mod.lifecycleStatus || MODULE_LIFECYCLE.ACTIVE,
    registeredAt: mod.registeredAt || new Date().toISOString()
  });
}

/**
 * Retrieve a single module by ID.
 * @param {string} moduleId
 * @returns {InstitutionalModule | null}
 */
function getModule(moduleId) {
  return moduleStore.get(moduleId) || null;
}

/**
 * List all registered modules, optionally filtered by lifecycle status.
 * @param {{ lifecycleStatus?: string }} [options]
 * @returns {InstitutionalModule[]}
 */
function listModules(options = {}) {
  const all = Array.from(moduleStore.values());
  return all.filter((mod) => {
    if (options.lifecycleStatus && mod.lifecycleStatus !== options.lifecycleStatus) return false;
    return true;
  });
}

/**
 * Resolve which module a capability belongs to.
 * Returns the first active module that references this capabilityId.
 *
 * @param {string} capabilityId
 * @returns {InstitutionalModule | null}
 */
function resolveCapabilityToModule(capabilityId) {
  for (const mod of moduleStore.values()) {
    if (mod.capabilities.includes(capabilityId)) {
      return mod;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// C5.2 — Initial Module Taxonomy
//
// Maps the six existing C4 capability providers to Institutional Modules.
// Provider names are internal. The institution sees module display names only.
// ---------------------------------------------------------------------------

registerModule({
  moduleId: 'executive-operations',
  displayName: 'Executive Operations',
  description: 'Provides executive planning, outcome briefings, executive packets, cadence management, and reporting.',
  capabilities: ['NEXUS-READ-001', 'NEXUS-WRITE-001', 'NEXUS-EXECUTE-001', 'NEXUS-EXECUTIVE-001'],
  providers: ['nexus'],
  healthAggregation: MODULE_HEALTH_AGGREGATION.ALL,
  governance: { minimumRole: 'executive', evidenceRequired: true },
  lifecycleStatus: MODULE_LIFECYCLE.ACTIVE
});

registerModule({
  moduleId: 'workflow-orchestration',
  displayName: 'Workflow Orchestration',
  description: 'Provides workflow routing, automation, orchestration, state management, and task coordination.',
  capabilities: ['TILDA-READ-001', 'TILDA-EXECUTE-001'],
  providers: ['tilda'],
  healthAggregation: MODULE_HEALTH_AGGREGATION.ALL,
  governance: { minimumRole: 'operator', evidenceRequired: true },
  lifecycleStatus: MODULE_LIFECYCLE.ACTIVE
});

registerModule({
  moduleId: 'communications',
  displayName: 'Communications',
  description: 'Provides calendar management, mail access, meeting intelligence, and communications reporting.',
  capabilities: ['M365-READ-001', 'M365-REPORT-001'],
  providers: ['microsoft365'],
  healthAggregation: MODULE_HEALTH_AGGREGATION.ALL,
  governance: { minimumRole: 'operator', evidenceRequired: false },
  lifecycleStatus: MODULE_LIFECYCLE.ACTIVE
});

registerModule({
  moduleId: 'projects',
  displayName: 'Projects',
  description: 'Provides repository access, pull request tracking, action execution, and development operations.',
  capabilities: ['GITHUB-READ-001', 'GITHUB-EXECUTE-001'],
  providers: ['github'],
  healthAggregation: MODULE_HEALTH_AGGREGATION.ALL,
  governance: { minimumRole: 'operator', evidenceRequired: true },
  lifecycleStatus: MODULE_LIFECYCLE.ACTIVE
});

registerModule({
  moduleId: 'business-operations',
  displayName: 'Business Operations',
  description: 'Provides deal submission, evaluation, approval workflows, and business execution processes.',
  capabilities: ['OWNERFI-EXECUTE-001'],
  providers: ['ownerfi'],
  healthAggregation: MODULE_HEALTH_AGGREGATION.ALL,
  governance: { minimumRole: 'operator', evidenceRequired: true },
  lifecycleStatus: MODULE_LIFECYCLE.ACTIVE
});

registerModule({
  moduleId: 'ai-operations',
  displayName: 'AI Operations',
  description: 'Provides governed multi-model AI capabilities including planning, research, analysis, and writing. Routes to the best approved model per policy and data classification.',
  capabilities: ['AI-PLAN-001', 'AI-RESEARCH-001', 'AI-ANALYSIS-001', 'AI-WRITE-001'],
  providers: ['azure-openai', 'openai'],
  healthAggregation: MODULE_HEALTH_AGGREGATION.ANY,
  governance: { minimumRole: 'operator', evidenceRequired: true },
  lifecycleStatus: MODULE_LIFECYCLE.ACTIVE
});

module.exports = {
  MODULE_HEALTH_AGGREGATION,
  MODULE_LIFECYCLE,
  registerModule,
  getModule,
  listModules,
  resolveCapabilityToModule
};
