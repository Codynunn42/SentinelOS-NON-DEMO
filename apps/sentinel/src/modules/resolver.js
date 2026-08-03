// Institutional Module Resolver
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Provides a live inventory of institutional modules with health status
// and capability counts. This is the authoritative source for the
// Executive Desk module view.

'use strict';

const fs = require('fs');
const path = require('path');

// Root of the repository (four levels up from apps/sentinel/src/modules)
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

function fileExists(relativePath) {
  if (!relativePath) return false;
  const full = path.resolve(REPO_ROOT, relativePath);
  try {
    fs.accessSync(full, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

// Each entry mirrors a section in docs/institutional-modules.md.
// "components" is the list of file paths from the registry table.
// "capabilities" is the named list of what the module can do —
// used for capabilityCount on the executive surface.
const MODULE_DEFINITIONS = [
  {
    moduleId: 'executive-operations',
    displayName: 'Executive Operations',
    components: [
      'scripts/check-mission-control-surface.js',
      'scripts/command-executive-snapshot-alignment.js',
      'scripts/command-fork-steering-roadmap.js',
      'scripts/command-classify-drift-issues.js'
    ],
    capabilities: ['mission-control', 'executive-snapshot', 'fork-steering', 'drift-classification']
  },
  {
    moduleId: 'governance',
    displayName: 'Governance',
    components: [
      'apps/sentinel/src/governance/policyEngine.js',
      'apps/sentinel/src/approval/approval.js',
      'apps/sentinel/src/governance/authorityState.js',
      'apps/sentinel/src/governance/governanceSignals.js',
      'apps/sentinel/src/governance/core/governanceStatus.js',
      'apps/sentinel/src/governance/preflight.js',
      'apps/sentinel/src/governance/core/driftPolicyLedger.js',
      'apps/sentinel/src/governance/executionPassport.js'
    ],
    capabilities: [
      'policy-engine',
      'approval-workflow',
      'authority-state',
      'governance-signals',
      'governance-status',
      'preflight-check',
      'drift-policy-ledger',
      'execution-passport'
    ]
  },
  {
    moduleId: 'evidence',
    displayName: 'Evidence',
    components: [
      'apps/sentinel/src/audit/auditLogger.js',
      'apps/sentinel/src/audit/executionTrace.js',
      'apps/sentinel/src/verification/stateAnchors.js',
      'apps/sentinel/src/sovereign/sovereignBoot.js'
    ],
    capabilities: ['audit-logger', 'execution-trace', 'state-anchors', 'sovereign-boot']
  },
  {
    moduleId: 'operations',
    displayName: 'Operations',
    components: [
      'scripts/sentinel-doctor.js',
      'scripts/healthcheck.js'
    ],
    capabilities: ['sentinel-doctor', 'environment-manifests', 'platform-quirks', 'healthcheck']
  },
  {
    moduleId: 'workflow',
    displayName: 'Workflow',
    components: [
      'apps/sentinel/src/orchestration/taskTemplates.js',
      'apps/sentinel/src/controlPlane/index.js',
      'apps/sentinel/src/commands/dispatch.js',
      'apps/sentinel/src/commands/registry.js',
      'apps/sentinel/src/learning/engine.js'
    ],
    capabilities: [
      'task-templates',
      'control-plane',
      'command-dispatch',
      'command-registry',
      'learning-engine'
    ]
  },
  {
    moduleId: 'workflow-orchestration',
    displayName: 'Workflow Orchestration',
    components: [
      'apps/sentinel/src/orchestration/taskTemplates.js',
      'apps/sentinel/src/controlPlane/index.js'
    ],
    capabilities: [
      'workflow-init',
      'workflow-execute',
      'workflow-retry',
      'task-scheduling'
    ]
  },
  {
    moduleId: 'projects',
    displayName: 'Projects',
    components: [],
    capabilities: []
  },
  {
    moduleId: 'business-operations',
    displayName: 'Business Operations',
    components: [
      'scripts/check-vendor-onboarding-ledger.js',
      'scripts/check-vendor-onboarding-rules.js'
    ],
    capabilities: [
      'vendor-onboarding',
      'contract-reclamation',
      'billing-controls',
      'receipt-lookup'
    ]
  },
  {
    moduleId: 'ai-operations',
    displayName: 'AI Operations',
    components: [
      'apps/sentinel/src/faceplanes/openai/openaiRoutes.js',
      'apps/sentinel/src/faceplanes/sdk/facePlaneSdk.js',
      'apps/sentinel/src/faceplanes/mock/mockFaceplaneRunner.js',
      'apps/sentinel/src/drift/driftAnalyzer.js',
      'scripts/run-mock-faceplanes.js',
      'scripts/stress-mock-faceplanes.js'
    ],
    capabilities: [
      'openai-faceplane',
      'faceplane-sdk',
      'mock-faceplane-runner',
      'drift-analysis',
      'governance-analytics',
      'ai-provider-lifecycle'
    ]
  },
  {
    moduleId: 'communications',
    displayName: 'Communications',
    components: [],
    capabilities: []
  },
  {
    moduleId: 'development',
    displayName: 'Development',
    components: [
      '.github/workflows/ci.yml',
      '.github/workflows/deploy.yml',
      'scripts/sentinel-repo-organization-scan.js',
      'scripts/check-repo-control-layer.js'
    ],
    capabilities: ['ci-workflow', 'deploy-workflow', 'check-scripts', 'repo-scan', 'repo-control']
  },
  {
    moduleId: 'capability-registry',
    displayName: 'Capability Registry',
    components: [
      'apps/sentinel/src/commands/registry.js',
      'apps/sentinel/src/tiers/tierRegistry.js',
      'apps/sentinel/src/tiers/tierResolver.js',
      'apps/sentinel/src/security/keyRegistry.js'
    ],
    capabilities: [
      'surface-registry',
      'tier-registry',
      'tier-resolver',
      'role-scope-registry',
      'key-registry'
    ]
  },
  {
    moduleId: 'docking',
    displayName: 'Docking',
    components: [
      'scripts/check-docking-protocol.js',
      'scripts/check-archive-intelligence-docking.js',
      'scripts/check-ownerfi-pilot-api.js',
      'scripts/simulate-vendor-onboarding.js',
      'scripts/check-cdnlux-integration.js'
    ],
    capabilities: [
      'docking-protocol',
      'archive-intelligence',
      'ownerfi-pilot-api',
      'vendor-onboarding',
      'cdnlux-integration'
    ]
  }
];

function resolveHealthStatus(components) {
  if (components.length === 0) return 'unknown';
  const present = components.filter(fileExists).length;
  if (present === 0) return 'unknown';
  if (present < components.length) return 'degraded';
  return 'healthy';
}

/**
 * Returns the live module inventory for the Executive Desk.
 * @returns {{ moduleId: string, displayName: string, healthStatus: string, capabilityCount: number }[]}
 */
function listModules() {
  return MODULE_DEFINITIONS.map((def) => ({
    moduleId: def.moduleId,
    displayName: def.displayName,
    healthStatus: resolveHealthStatus(def.components),
    capabilityCount: def.capabilities.length
  }));
}

/**
 * Resolves a named capability to the module that owns it.
 * @param {string} capability
 * @returns {{ moduleId: string, displayName: string } | null}
 */
function resolveCapabilityToModule(capability) {
  for (const def of MODULE_DEFINITIONS) {
    if (def.capabilities.includes(capability)) {
      return { moduleId: def.moduleId, displayName: def.displayName };
    }
  }
  return null;
}

/**
 * Computes the aggregate health status for a module given an array of
 * provider health objects.  A single degraded provider degrades the module.
 * @param {{ status: 'healthy' | 'degraded' | 'unknown' }[]} providers
 * @returns {'healthy' | 'degraded' | 'unknown'}
 */
function healthAggregation(providers) {
  if (!providers || providers.length === 0) return 'unknown';
  if (providers.some((p) => p.status === 'degraded')) return 'degraded';
  if (providers.every((p) => p.status === 'healthy')) return 'healthy';
  return 'unknown';
}

module.exports = { listModules, resolveCapabilityToModule, healthAggregation };
