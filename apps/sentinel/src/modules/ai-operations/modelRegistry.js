// C5.3 — AI Operations: Model Registry
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Model Registry governs the AI Operations Institutional Module.
// It applies the same pattern as the Capability Registry: every AI model
// is registered with governance posture, data classification rules, and
// provider health — before it can be used.
//
// Per the SentinelOS Constitution, Principle VI:
//   AI is an institutional capability — not a special case.
//   AI Operations must use the Docking Protocol, use the Capability Broker,
//   produce evidence, follow policy, and respect data classification.
//
// The Model Registry does NOT bypass governance. Every routing decision
// produced by the Model Broker is subject to the same sovereign runtime
// (SPE, SEL, SER) as all other capabilities.
//
// Data classification tiers:
//   public          — general research, public knowledge
//   internal        — internal documents, plans, reports
//   confidential    — financial data, personnel data
//   government      — government records, classified environments
//
// Policy rules:
//   confidential data  → local or private hosted model only
//   government data    → agency-approved model only
//   internal data      → approved commercial model with audit
//   public data        → any approved model

'use strict';

const MODEL_DATA_CLASSIFICATION = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  GOVERNMENT: 'government',
  // C5.3 — extended classifications for local and agency-cleared models
  FINANCIAL: 'financial',
  RESTRICTED: 'restricted',
  CLASSIFIED: 'classified'
};

const MODEL_LIFECYCLE = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DEPRECATED: 'deprecated'
};

const MODEL_CAPABILITY = {
  PLANNING: 'planning',
  RESEARCH: 'research',
  ANALYSIS: 'analysis',
  WRITING: 'writing',
  CODING: 'coding',
  LEGAL: 'legal',
  VISION: 'vision',
  SPEECH: 'speech',
  // C5.3 — canonical AI capability names (ai- prefixed) for governed routing
  AI_PLANNING: 'ai-planning',
  AI_RESEARCH: 'ai-research',
  AI_ANALYSIS: 'ai-analysis',
  AI_WRITING: 'ai-writing'
};

/**
 * @typedef {Object} ModelRecord
 * @property {string} modelId
 * @property {string} provider
 * @property {string} modelName
 * @property {string[]} capabilities
 * @property {string[]} approvedDataClassifications
 * @property {object} governance
 * @property {string} providerHealth
 * @property {string} lifecycleStatus
 * @property {number} [cost]
 * @property {number} [latencyMs]
 * @property {string} registeredAt
 */

/** @type {Map<string, ModelRecord>} */
const modelStore = new Map();

/**
 * Register an AI model in the Model Registry.
 * @param {ModelRecord} model
 */
function registerModel(model) {
  if (!model || !model.modelId) {
    throw new Error('MODEL_REGISTRY: modelId is required');
  }
  if (!model.provider) {
    throw new Error('MODEL_REGISTRY: provider is required');
  }
  if (!Array.isArray(model.approvedDataClassifications) || model.approvedDataClassifications.length === 0) {
    throw new Error(`MODEL_REGISTRY: approvedDataClassifications required for ${model.modelId}`);
  }

  modelStore.set(model.modelId, {
    ...model,
    lifecycleStatus: model.lifecycleStatus || MODEL_LIFECYCLE.ACTIVE,
    providerHealth: model.providerHealth || 'healthy',
    registeredAt: model.registeredAt || new Date().toISOString()
  });
}

/**
 * Retrieve a model by ID.
 * @param {string} modelId
 * @returns {ModelRecord | null}
 */
function getModel(modelId) {
  return modelStore.get(modelId) || null;
}

/**
 * List all registered models, optionally filtered.
 * @param {{ provider?: string, capability?: string, dataClassification?: string, lifecycleStatus?: string }} [options]
 * @returns {ModelRecord[]}
 */
function listModels(options = {}) {
  const all = Array.from(modelStore.values());
  return all.filter((m) => {
    if (options.provider && m.provider !== options.provider) return false;
    if (options.lifecycleStatus && m.lifecycleStatus !== options.lifecycleStatus) return false;
    if (options.capability && !m.capabilities.includes(options.capability)) return false;
    if (options.dataClassification && !m.approvedDataClassifications.includes(options.dataClassification)) return false;
    return true;
  });
}

/**
 * Return a summary of all registered models for the Executive Desk.
 * Provider health and approval status visible; model internals hidden.
 * @returns {{ totalModels: number, activeModels: number, providers: string[], models: object[] }}
 */
function getModelRegistrySummary() {
  const all = listModels();
  const active = listModels({ lifecycleStatus: MODEL_LIFECYCLE.ACTIVE });
  const providers = Array.from(new Set(all.map((m) => m.provider)));

  return {
    totalModels: all.length,
    activeModels: active.length,
    providers,
    models: active.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      modelName: m.modelName,
      capabilities: m.capabilities,
      approvedDataClassifications: m.approvedDataClassifications,
      providerHealth: m.providerHealth,
      governance: m.governance,
      lifecycleStatus: m.lifecycleStatus
    }))
  };
}

// ---------------------------------------------------------------------------
// Built-in model registrations — AI Operations Module initial set
// ---------------------------------------------------------------------------

registerModel({
  modelId: 'AI-PLAN-001',
  provider: 'azure-openai',
  modelName: 'gpt-4o',
  capabilities: [MODEL_CAPABILITY.PLANNING, MODEL_CAPABILITY.ANALYSIS, MODEL_CAPABILITY.WRITING],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.PUBLIC,
    MODEL_DATA_CLASSIFICATION.INTERNAL
  ],
  governance: { evidenceRequired: true, minimumRole: 'operator' },
  providerHealth: 'healthy',
  cost: 4,
  latencyMs: 300,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

registerModel({
  modelId: 'AI-RESEARCH-001',
  provider: 'azure-openai',
  modelName: 'gpt-4o',
  capabilities: [MODEL_CAPABILITY.RESEARCH, MODEL_CAPABILITY.WRITING],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.PUBLIC,
    MODEL_DATA_CLASSIFICATION.INTERNAL
  ],
  governance: { evidenceRequired: true, minimumRole: 'operator' },
  providerHealth: 'healthy',
  cost: 3,
  latencyMs: 250,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

registerModel({
  modelId: 'AI-ANALYSIS-001',
  provider: 'openai',
  modelName: 'gpt-4o',
  capabilities: [MODEL_CAPABILITY.ANALYSIS, MODEL_CAPABILITY.RESEARCH],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.PUBLIC
  ],
  governance: { evidenceRequired: true, minimumRole: 'operator' },
  providerHealth: 'healthy',
  cost: 3,
  latencyMs: 280,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

registerModel({
  modelId: 'AI-WRITE-001',
  provider: 'openai',
  modelName: 'gpt-4o',
  capabilities: [MODEL_CAPABILITY.WRITING, MODEL_CAPABILITY.PLANNING],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.PUBLIC
  ],
  governance: { evidenceRequired: true, minimumRole: 'operator' },
  providerHealth: 'healthy',
  cost: 2,
  latencyMs: 220,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

// ---------------------------------------------------------------------------
// C5.3 — Extended AI Operations models
//
// These models use canonical 'ai-' prefixed capability names and extend the
// approved data classification set to include financial, restricted, and
// classified tiers. Used by the routeModel() governed routing path.
// ---------------------------------------------------------------------------

registerModel({
  modelId: 'azure-gpt-4o',
  provider: 'azure-openai',
  modelName: 'gpt-4o',
  capabilities: [
    MODEL_CAPABILITY.AI_PLANNING,
    MODEL_CAPABILITY.AI_RESEARCH,
    MODEL_CAPABILITY.AI_ANALYSIS,
    MODEL_CAPABILITY.AI_WRITING
  ],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.PUBLIC,
    MODEL_DATA_CLASSIFICATION.INTERNAL
  ],
  governance: { evidenceRequired: true, minimumRole: 'operator' },
  providerHealth: 'healthy',
  cost: 4,
  latencyMs: 300,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

registerModel({
  modelId: 'azure-gpt-4o-mini',
  provider: 'azure-openai',
  modelName: 'gpt-4o-mini',
  capabilities: [
    MODEL_CAPABILITY.AI_PLANNING,
    MODEL_CAPABILITY.AI_RESEARCH,
    MODEL_CAPABILITY.AI_ANALYSIS,
    MODEL_CAPABILITY.AI_WRITING
  ],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.PUBLIC,
    MODEL_DATA_CLASSIFICATION.INTERNAL
  ],
  governance: { evidenceRequired: true, minimumRole: 'operator' },
  providerHealth: 'healthy',
  cost: 2,
  latencyMs: 150,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

registerModel({
  modelId: 'openai-gpt-4o',
  provider: 'openai',
  modelName: 'gpt-4o',
  capabilities: [
    MODEL_CAPABILITY.AI_PLANNING,
    MODEL_CAPABILITY.AI_RESEARCH,
    MODEL_CAPABILITY.AI_ANALYSIS,
    MODEL_CAPABILITY.AI_WRITING
  ],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.PUBLIC
  ],
  governance: { evidenceRequired: true, minimumRole: 'operator' },
  providerHealth: 'healthy',
  cost: 4,
  latencyMs: 280,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

registerModel({
  modelId: 'openai-gpt-4o-mini',
  provider: 'openai',
  modelName: 'gpt-4o-mini',
  capabilities: [
    MODEL_CAPABILITY.AI_PLANNING,
    MODEL_CAPABILITY.AI_RESEARCH,
    MODEL_CAPABILITY.AI_ANALYSIS,
    MODEL_CAPABILITY.AI_WRITING
  ],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.PUBLIC
  ],
  governance: { evidenceRequired: true, minimumRole: 'operator' },
  providerHealth: 'healthy',
  cost: 2,
  latencyMs: 150,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

// local-embassy — private hosted model; approved for financial and restricted data
registerModel({
  modelId: 'local-embassy',
  provider: 'local',
  modelName: 'local-embassy-v1',
  capabilities: [
    MODEL_CAPABILITY.AI_ANALYSIS,
    MODEL_CAPABILITY.AI_WRITING
  ],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.FINANCIAL,
    MODEL_DATA_CLASSIFICATION.RESTRICTED
  ],
  governance: { evidenceRequired: true, minimumRole: 'operator' },
  providerHealth: 'healthy',
  cost: 1,
  latencyMs: 80,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

// agency-cleared — agency-approved model; approved for classified data only
registerModel({
  modelId: 'agency-cleared',
  provider: 'agency-approved',
  modelName: 'agency-cleared-v1',
  capabilities: [
    MODEL_CAPABILITY.AI_PLANNING,
    MODEL_CAPABILITY.AI_ANALYSIS
  ],
  approvedDataClassifications: [
    MODEL_DATA_CLASSIFICATION.CLASSIFIED
  ],
  governance: { evidenceRequired: true, minimumRole: 'executive' },
  providerHealth: 'healthy',
  cost: 3,
  latencyMs: 400,
  lifecycleStatus: MODEL_LIFECYCLE.ACTIVE
});

module.exports = {
  MODEL_DATA_CLASSIFICATION,
  MODEL_LIFECYCLE,
  MODEL_CAPABILITY,
  registerModel,
  getModel,
  listModels,
  getModelRegistrySummary
};
