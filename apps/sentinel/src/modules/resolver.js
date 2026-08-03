// C5.2 — Institutional Module Resolver
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Module Resolver provides read-only query functions for the
// Institutional Module layer. It sits above the Capability Registry
// and aggregates provider health per module without exposing providers
// to the institution.
//
// Per the SentinelOS Constitution, Principle II:
//   The institution interacts with Modules.
//   It does not interact with provider names or provider infrastructure.
//
// All three functions are READ-ONLY. No governance bypass. No runtime mutation.

'use strict';

const {
  getModule,
  listModules,
  resolveCapabilityToModule,
  MODULE_LIFECYCLE,
  MODULE_HEALTH_AGGREGATION
} = require('./registry');

const { listCapabilities } = require('../capabilities/registry');

/**
 * Compute the aggregated health status for a module.
 *
 * healthAggregation: 'all' — module is healthy only when ALL providers are healthy
 * healthAggregation: 'any' — module is healthy when ANY provider is healthy
 *
 * Returns: 'healthy' | 'degraded' | 'unknown'
 *
 * @param {import('./registry').InstitutionalModule} mod
 * @returns {'healthy' | 'degraded' | 'unknown'}
 */
function computeModuleHealth(mod) {
  const moduleCaps = listCapabilities().filter((c) =>
    mod.capabilities.includes(c.capabilityId)
  );

  if (moduleCaps.length === 0) return 'unknown';

  const healthValues = moduleCaps.map((c) => c.providerHealth || 'unknown');

  if (mod.healthAggregation === MODULE_HEALTH_AGGREGATION.ANY) {
    // Healthy if ANY capability reports healthy
    if (healthValues.some((h) => h === 'healthy')) return 'healthy';
    if (healthValues.some((h) => h === 'degraded')) return 'degraded';
    return 'unknown';
  }

  // Default 'all' — healthy only if ALL are healthy
  if (healthValues.every((h) => h === 'healthy')) return 'healthy';
  if (healthValues.some((h) => h === 'degraded')) return 'degraded';
  return 'unknown';
}

/**
 * Get a summary of a single module, suitable for the Executive Desk.
 * Provider names are NOT included in the summary — only module-level data.
 *
 * @param {string} moduleId
 * @returns {{ moduleId: string, displayName: string, description: string, capabilityCount: number, governance: object, health: string, lifecycleStatus: string } | null}
 */
function getModuleSummary(moduleId) {
  const mod = getModule(moduleId);
  if (!mod) return null;

  return {
    moduleId: mod.moduleId,
    displayName: mod.displayName,
    description: mod.description,
    capabilityCount: mod.capabilities.length,
    governance: mod.governance,
    healthAggregation: mod.healthAggregation,
    health: computeModuleHealth(mod),
    lifecycleStatus: mod.lifecycleStatus,
    registeredAt: mod.registeredAt
  };
}

/**
 * List all active Institutional Modules with aggregated health.
 * This is the primary function for the Executive Desk module view.
 *
 * @param {{ lifecycleStatus?: string }} [options]
 * @returns {Array<ReturnType<typeof getModuleSummary>>}
 */
function listModuleSummaries(options = {}) {
  const filter = { lifecycleStatus: options.lifecycleStatus || MODULE_LIFECYCLE.ACTIVE };
  return listModules(filter)
    .map((mod) => getModuleSummary(mod.moduleId))
    .filter(Boolean);
}

module.exports = {
  computeModuleHealth,
  getModuleSummary,
  listModuleSummaries,
  resolveCapabilityToModule
};
