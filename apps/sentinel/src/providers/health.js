// C5.3 — Provider Health Surface
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Provider Health surface exposes a single read-only function:
//   getProviderHealth(providerId) → 'healthy' | 'degraded' | 'unknown'
//
// Health is derived at call time from the registered capability and model
// records for that provider. It does NOT modify any registry.
//
// Resolution order:
//   1. Institutional providers (nexus, tilda, microsoft365, github, ownerfi)
//      — health is aggregated from the Capability Registry's providerHealth field.
//   2. AI providers (azure-openai, openai, local, agency-approved)
//      — health is aggregated from the Model Registry's providerHealth field.
//
// Aggregation rules (same as the Capability Broker):
//   all healthy    → 'healthy'
//   any degraded   → 'degraded'
//   otherwise      → 'unknown'

'use strict';

const { listCapabilities } = require('../capabilities/registry');
const { listModels } = require('../modules/ai-operations/modelRegistry');

/**
 * Compute the live health status for a provider.
 * Reads providerHealth from registered capability and model records.
 *
 * @param {string} providerId
 * @returns {'healthy' | 'degraded' | 'unknown'}
 */
function getProviderHealth(providerId) {
  if (!providerId) return 'unknown';

  // Institutional provider — derive from capability records
  const caps = listCapabilities({ provider: providerId });
  if (caps.length > 0) {
    const statuses = caps.map((c) => c.providerHealth || 'unknown');
    if (statuses.every((s) => s === 'healthy')) return 'healthy';
    if (statuses.some((s) => s === 'degraded')) return 'degraded';
    return 'unknown';
  }

  // AI provider — derive from model records
  const models = listModels({ provider: providerId });
  if (models.length > 0) {
    const statuses = models.map((m) => m.providerHealth || 'unknown');
    if (statuses.every((s) => s === 'healthy')) return 'healthy';
    if (statuses.some((s) => s === 'degraded')) return 'degraded';
    return 'unknown';
  }

  // No records registered for this provider
  return 'unknown';
}

module.exports = { getProviderHealth };
