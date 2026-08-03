// Executive Plane
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Aggregates the cross-provider dashboard and institutional module inventory
// into a single executive surface shape.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { listModules } = require('../modules/resolver');

export type ModuleHealthStatus = 'healthy' | 'degraded' | 'unknown';

export interface ModuleSummary {
  moduleId: string;
  displayName: string;
  healthStatus: ModuleHealthStatus;
  capabilityCount: number;
}

export interface InstitutionalModules {
  modules: ModuleSummary[];
}

export interface CrossProviderDashboard {
  providersActive: number;
  providersTotal: number;
  timestamp: string;
}

export interface ExecutivePlane {
  crossProviderDashboard: CrossProviderDashboard;
  institutionalModules: InstitutionalModules;
}

function buildCrossProviderDashboard(): CrossProviderDashboard {
  // Cross-provider health is derived from the AI Operations module components
  // that are currently present. Healthy AI Operations == all providers active.
  const aiOpsModule = listModules().find(
    (m: ModuleSummary) => m.moduleId === 'ai-operations'
  );
  const providersTotal = 1; // OpenAI faceplane is the registered provider
  const providersActive =
    aiOpsModule && aiOpsModule.healthStatus === 'healthy' ? 1 : 0;

  return {
    providersActive,
    providersTotal,
    timestamp: new Date().toISOString()
  };
}

export function buildExecutivePlane(): ExecutivePlane {
  const moduleSummaries: ModuleSummary[] = listModules();

  return {
    crossProviderDashboard: buildCrossProviderDashboard(),
    institutionalModules: {
      modules: moduleSummaries.map((m: ModuleSummary) => ({
        moduleId: m.moduleId,
        displayName: m.displayName,
        healthStatus: m.healthStatus,
        capabilityCount: m.capabilityCount
      }))
    }
  };
}
