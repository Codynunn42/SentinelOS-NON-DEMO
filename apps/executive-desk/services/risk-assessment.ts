/**
 * Risk Assessment Engine
 * Computes risk scores based on infrastructure health, incidents, deployment status, and resource pressure
 */

import { getInfrastructureHealthClient, InfrastructureHealthClient } from './infrastructure-health-client';

export interface RiskFactors {
    infraHealth: number;      // 0-1 (0 = all healthy)
    recentIncidents: number;  // 0-1 (0 = no recent incidents)
    deploymentStatus: number; // 0-1 (0 = stable)
    resourcePressure: number; // 0-1 (0 = low pressure)
}

export interface RiskAssessment {
    command: string;
    score: number;            // 0-1 (0 = no risk, 1 = critical)
    decision: 'pass' | 'warn' | 'block';
    factors: RiskFactors;
    issues: string[];
    mitigations: string[];
    timestamp: Date;
}

export interface RiskAssessmentEngine {
    assess(
        command: string,
        options?: {
            healthClient?: InfrastructureHealthClient;
            threshold?: { warn: number; block: number };
        },
    ): Promise<RiskAssessment>;
}

/**
 * Default Risk Assessment Engine
 */
export class DefaultRiskAssessmentEngine implements RiskAssessmentEngine {
    /**
     * Compute infrastructure health factor (0-1)
     * Maps service status to risk contribution
     */
    private computeInfraHealthFactor(
        healthStatuses: Awaited<ReturnType<InfrastructureHealthClient['checkAllServices']>>,
    ): number {
        if (healthStatuses.length === 0) {
            return 0; // no info = assume healthy
        }

        const statusScores: number[] = healthStatuses.map((h) => {
            switch (h.status) {
                case 'healthy':
                    return 0;
                case 'degraded':
                    return 0.4;
                case 'unhealthy':
                    return 0.8;
                default:
                    return 0;
            }
        });

        // Average across all services
        const avg = statusScores.reduce((a, b) => a + b, 0) / statusScores.length;
        return Math.min(avg, 1);
    }

    /**
     * Compute recent incidents factor (0-1)
     * Score increases with number of critical/high incidents in last hour
     */
    private computeRecentIncidentsFactor(
        _healthClient: InfrastructureHealthClient,
    ): number {
        // TODO: query incident data from Datadog or other provider
        // For now, use mock value
        // In production:
        // - Query last 1 hour of incidents
        // - Count critical/high severity
        // - Score: 0 if none, 0.5 if 1-2, 0.8+ if 3+
        return 0.0; // assume no recent incidents
    }

    /**
     * Compute deployment status factor (0-1)
     * Score increases if changes are pending or deployments are in-flight
     */
    private computeDeploymentStatusFactor(): number {
        // TODO: query from git (GitHub API), CI/CD system, or deployment tool
        // In production:
        // - Check main branch protection status
        // - Check for pending pull requests
        // - Check if CI/CD pipeline is running
        // - Score: 0 if stable, 0.3 if pending, 0.6+ if in-flight
        return 0.0; // assume stable deployment
    }

    /**
     * Compute resource pressure factor (0-1)
     * Score increases with CPU, memory, disk, connection pool utilization
     */
    private async computeResourcePressureFactor(
        healthClient: InfrastructureHealthClient,
    ): Promise<number> {
        const metrics = {
            cpu: await healthClient.queryMetric('cpu_usage_percent'),
            memory: await healthClient.queryMetric('memory_usage_percent'),
            disk: await healthClient.queryMetric('disk_usage_percent'),
            dbConnections:
                (await healthClient.queryMetric('db_connections_active')) || 0,
            dbConnectionsMax:
                (await healthClient.queryMetric('db_connections_max')) || 100,
        };

        const utilizations: number[] = [];

        // CPU utilization
        if (metrics.cpu !== null) {
            utilizations.push(metrics.cpu / 100);
        }

        // Memory utilization
        if (metrics.memory !== null) {
            utilizations.push(metrics.memory / 100);
        }

        // Disk utilization
        if (metrics.disk !== null) {
            utilizations.push(metrics.disk / 100);
        }

        // Database connection pool utilization (guard divide-by-zero)
        const safeDbMax = metrics.dbConnectionsMax > 0 ? metrics.dbConnectionsMax : 100;
        const dbPoolUtilization = metrics.dbConnections / safeDbMax;
        utilizations.push(dbPoolUtilization);

        if (utilizations.length === 0) {
            return 0; // no metrics = assume low pressure
        }

        // Compute factor: 0 if <50%, 0.3 if 50-75%, 0.6+ if >75%
        const avgUtilization = utilizations.reduce((a, b) => a + b, 0) / utilizations.length;

        if (avgUtilization < 0.5) {
            return 0.1;
        } else if (avgUtilization < 0.75) {
            return 0.3;
        } else {
            return 0.6 + (avgUtilization - 0.75) * 1.6; // scale up to 1.0
        }
    }

    async assess(
        command: string,
        options?: {
            healthClient?: InfrastructureHealthClient;
            threshold?: { warn: number; block: number };
        },
    ): Promise<RiskAssessment> {
        const healthClient = options?.healthClient || (await getInfrastructureHealthClient());
        const threshold = normalizeThreshold(options?.threshold); // unified threshold behavior
        const now = new Date();

        // Compute factors
        const healthStatuses = await healthClient.checkAllServices();
        const infraHealth = this.computeInfraHealthFactor(healthStatuses);
        const recentIncidents = this.computeRecentIncidentsFactor(healthClient);
        const deploymentStatus = this.computeDeploymentStatusFactor();
        const resourcePressure = await this.computeResourcePressureFactor(healthClient);

        // Weighted average (health 40%, incidents 30%, deployment 20%, resources 10%)
        const score =
            infraHealth * 0.4 +
            recentIncidents * 0.3 +
            deploymentStatus * 0.2 +
            resourcePressure * 0.1;

        const factors: RiskFactors = {
            infraHealth,
            recentIncidents,
            deploymentStatus,
            resourcePressure,
        };

        // Determine decision and issues
        const issues: string[] = [];
        const mitigations: string[] = [];

        if (infraHealth > 0.4) {
            issues.push(`Infrastructure health degraded (${(infraHealth * 100).toFixed(1)}%)`);
            mitigations.push('Check service dashboards and incident history');
        }

        if (recentIncidents > 0.3) {
            issues.push('Recent incidents detected');
            mitigations.push('Review incident timeline and root causes');
        }

        if (deploymentStatus > 0.3) {
            issues.push('Active deployment or pending changes');
            mitigations.push('Wait for deployment to complete or review pending PRs');
        }

        if (resourcePressure > 0.5) {
            issues.push('High resource utilization detected');
            mitigations.push('Scale up resources or optimize workload');
        }

        let decision: 'pass' | 'warn' | 'block' = decideRisk(score, threshold); // unified decision behavior
        if (decision === 'block') {
            if (!mitigations.includes('Address critical issues before proceeding')) {
                mitigations.push('Address critical issues before proceeding');
            }
        } else if (decision === 'warn') {
            if (!mitigations.includes('Proceed with caution; monitor closely')) {
                mitigations.push('Proceed with caution; monitor closely');
            }
        }

        return {
            command,
            score: Math.min(score, 1),
            decision,
            factors,
            issues,
            mitigations,
            timestamp: now,
        };
    }
}

/**
 * Factory function
 */
export function createRiskAssessmentEngine(_options?: unknown): RiskAssessmentEngine {
    return new DefaultRiskAssessmentEngine();
}

/**
 * Singleton getter
 */
let instance: RiskAssessmentEngine | null = null;

export async function getRiskAssessmentEngine(_options?: unknown): Promise<RiskAssessmentEngine> {
    if (!instance) {
        instance = createRiskAssessmentEngine();
    }
    return instance;
}

/**
 * Reset instance (for testing)
 */
export function resetRiskAssessmentEngine(): void {
    instance = null;
}

// Optional compatibility default export
export default getRiskAssessmentEngine;

type AnyObj = Record<string, any>;

const DEFAULT_FACTORS = {
    infraHealth: 0,
    recentIncidents: 0,
    deploymentStatus: 0,
    resourcePressure: 0
};

function clamp01(n: unknown): number {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(1, v));
}

function normalizeThreshold(
    threshold?: { warn: number; block: number } | number,
): { warn: number; block: number } {
    // Backward-compatible: scalar means "block threshold"
    if (typeof threshold === "number") {
        const block = clamp01(threshold);
        const warn = clamp01(block - 0.25);
        return { warn, block };
    }

    const warn = clamp01(threshold?.warn ?? 0.5);
    const block = clamp01(threshold?.block ?? 0.7);

    // enforce monotonic order
    return warn <= block ? { warn, block } : { warn: block, block: warn };
}

function decideRisk(
    score: number,
    threshold: { warn: number; block: number },
    forceBlock = false,
): "pass" | "warn" | "block" {
    if (forceBlock) return "block";
    if (score >= threshold.block) return "block";
    if (score >= threshold.warn) return "warn";
    return "pass";
}

export async function assessRisk(arg1?: AnyObj, arg2?: AnyObj) {
    const input = normalizeInput(arg1, arg2);
    const f = { ...DEFAULT_FACTORS, ...(input.infraFactors ?? {}) };

    const score =
        0.25 * clamp01(f.infraHealth) +
        0.25 * clamp01(f.recentIncidents) +
        0.25 * clamp01(f.deploymentStatus) +
        0.25 * clamp01(f.resourcePressure);

    const threshold = normalizeThreshold(input.threshold ?? 0.75); // unified threshold
    const stale = isStaleTimestamp(input.timestamp);
    const decision = decideRisk(score, threshold, stale); // unified decision + stale force-block

    return {
        command: input.command ?? "repo.control.workflow.diagnose",
        decision,
        score,
        allowed: decision !== "block",
        infraStatus: stale ? "stale" : "ok",
        factors: f,       // canonical
        infraFactors: f,  // compatibility
        issues: stale ? ["infra_health_data_stale"] : [],
        mitigations: stale ? ["refresh_infra_telemetry"] : [],
        timestamp: new Date().toISOString()
    };
}

function normalizeInput(a?: AnyObj, b?: AnyObj): AnyObj {
    // supports fn(input), fn(command, input), fn({ request: input })
    if (b && typeof b === "object") return b;
    if (a?.request && typeof a.request === "object") return a.request;
    return (a && typeof a === "object") ? a : {};
}

function isStaleTimestamp(ts?: string): boolean {
    if (!ts) return false;
    const t = Date.parse(ts);
    if (!Number.isFinite(t)) return false;
    return (Date.now() - t) > 24 * 60 * 60 * 1000;
}
