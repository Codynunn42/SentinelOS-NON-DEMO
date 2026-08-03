// modelBroker.js
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Routes AI capability requests to the appropriate model provider.
// The broker is the single authorised gateway for all ai-* capability
// invocations, ensuring every call is governed and traceable.

'use strict';

/**
 * Routes an AI capability to the appropriate model provider.
 *
 * @param {{ capability: string, payload?: object, actor?: string }} request
 * @returns {{ routed: true, capability: string, provider: string, timestamp: string }}
 */
function routeModel(request) {
  const { capability, payload = {}, actor = 'system' } = request;

  if (typeof capability !== 'string' || !capability.startsWith('ai-')) {
    throw new Error(`routeModel: capability must begin with "ai-", received "${capability}"`);
  }

  // Default provider mapping — extended as real providers are registered.
  const PROVIDER_MAP = {
    'ai-generate': 'openai',
    'ai-routing':  'internal-broker',
    'ai-drift':    'drift-analyzer',
    'ai-classify': 'openai'
  };

  const provider = PROVIDER_MAP[capability] || 'openai';

  return {
    routed: true,
    capability,
    provider,
    actor,
    payload,
    timestamp: new Date().toISOString()
  };
}

module.exports = { routeModel };
