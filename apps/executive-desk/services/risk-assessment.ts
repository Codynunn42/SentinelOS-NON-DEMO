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
class DefaultRiskAssessmentEngine implements RiskAssessmentEngine {
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

        // Database connection pool utilization
        const dbPoolUtilization = metrics.dbConnections / metrics.dbConnectionsMax;
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
        const threshold = options?.threshold || { warn: 0.5, block: 0.7 };
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

        let decision: 'pass' | 'warn' | 'block' = 'pass';
        if (score >= threshold.block) {
            decision = 'block';
            if (!mitigations.includes('Address critical issues before proceeding')) {
                mitigations.push('Address critical issues before proceeding');
            }
        } else if (score >= threshold.warn) {
            decision = 'warn';
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
export function createRiskAssessmentEngine(): RiskAssessmentEngine {
    return new DefaultRiskAssessmentEngine();
}

/**
 * Singleton getter
 */
let instance: RiskAssessmentEngine | null = null;

export async function getRiskAssessmentEngine(): Promise<RiskAssessmentEngine> {
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

// Export implementation for testing/direct use
export { DefaultRiskAssessmentEngine };
