/**
 * Risk API Service
 * Expose infrastructure health and risk assessment via API
 */

import {
    getInfrastructureHealthClient,
    InfrastructureHealthClient,
} from '../services/infrastructure-health-client';
import {
    getRiskAssessmentEngine,
    RiskAssessmentEngine,
    RiskFactors,
} from '../services/risk-assessment';
import { getReceiptLedger } from '../services/receipt-ledger';

export interface HealthStatus {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime?: number; // ms
    uptime?: number; // percentage
    lastChecked: string; // ISO
    issues?: string[];
    details?: Record<string, unknown>;
}

export interface RiskStatus {
    overallScore: number;
    decision: 'pass' | 'warn' | 'block';
    services: HealthStatus[];
    factors: RiskFactors;
    timestamp: string;
}

export interface RiskFactorTimeseries {
    timestamp: string;
    infraHealth: number;
    recentIncidents: number;
    deploymentStatus: number;
    resourcePressure: number;
}

export interface RiskFactorsHistory {
    timeseries: RiskFactorTimeseries[];
    summary: RiskFactors;
}

class RiskApiService {
    private healthClient?: InfrastructureHealthClient;
    private assessmentEngine?: RiskAssessmentEngine;

    /**
     * Get current risk status and infrastructure health
     */
    async getCurrentRiskStatus(): Promise<RiskStatus> {
        try {
            const healthClient = await getInfrastructureHealthClient();
            const assessmentEngine = await getRiskAssessmentEngine();

            // Get all service health
            const allHealth = await healthClient.checkAllServices();

            // Compute risk assessment
            const assessment = await assessmentEngine.assess('repo.control.workflow.diagnose');

            // Convert health statuses to API format
            const services: HealthStatus[] = allHealth.map((h) => ({
                service: h.service,
                status: h.status,
                responseTime: h.responseTime,
                uptime: h.uptime,
                lastChecked: h.lastChecked.toISOString(),
                issues: h.issues,
                details: h.details,
            }));

            return {
                overallScore: assessment.score,
                decision: assessment.decision,
                services,
                factors: assessment.factors,
                timestamp: assessment.timestamp.toISOString(),
            };
        } catch (err) {
            // If risk assessment fails, return degraded status
            const errorMessage = err instanceof Error ? err.message : String(err);
            return {
                overallScore: 0.5,
                decision: 'warn',
                services: [
                    {
                        service: 'risk-gate',
                        status: 'degraded',
                        lastChecked: new Date().toISOString(),
                        issues: [errorMessage],
                    },
                ],
                factors: {
                    infraHealth: 0,
                    recentIncidents: 0,
                    deploymentStatus: 0,
                    resourcePressure: 0,
                },
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Get historical risk factors from receipts
     */
    async getRiskFactorsHistory(
        window: '1h' | '6h' | '24h' | '7d' | '30d' = '24h',
        granularity: 'minute' | 'hour' | 'day' = 'hour',
    ): Promise<RiskFactorsHistory> {
        const ledger = await getReceiptLedger();
        const allReceipts = await ledger.list();

        // Filter by time window
        const now = new Date();
        const windowMs = this.getWindowMs(window);
        const cutoff = new Date(now.getTime() - windowMs);

        const filtered = allReceipts.filter(
            (r) => new Date(r.timestamp).getTime() >= cutoff.getTime(),
        );

        // Group by time bucket
        const timeseriesMap = new Map<
            string,
            { factors: RiskFactors[]; count: number }
        >();

        filtered.forEach((receipt) => {
            const outcome = receipt.riskGateOutcome as Record<string, unknown>;
            const infraFactors = outcome.infraFactors as Record<string, unknown>;

            if (!infraFactors) {
                return; // Skip receipts without factors
            }

            const bucket = this.getTimeBucket(new Date(receipt.timestamp), granularity);

            if (!timeseriesMap.has(bucket)) {
                timeseriesMap.set(bucket, { factors: [], count: 0 });
            }

            const entry = timeseriesMap.get(bucket)!;
            entry.factors.push({
                infraHealth: (infraFactors.infraHealth as number) || 0,
                recentIncidents: (infraFactors.recentIncidents as number) || 0,
                deploymentStatus: (infraFactors.deploymentStatus as number) || 0,
                resourcePressure: (infraFactors.resourcePressure as number) || 0,
            });
            entry.count += 1;
        });

        // Compute averages for each bucket
        const timeseries: RiskFactorTimeseries[] = Array.from(
            timeseriesMap.entries(),
        )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([timestamp, { factors, count }]) => {
                const avgInfraHealth =
                    factors.reduce((sum, f) => sum + f.infraHealth, 0) / count;
                const avgIncidents =
                    factors.reduce((sum, f) => sum + f.recentIncidents, 0) / count;
                const avgDeployment =
                    factors.reduce((sum, f) => sum + f.deploymentStatus, 0) / count;
                const avgResources =
                    factors.reduce((sum, f) => sum + f.resourcePressure, 0) / count;

                return {
                    timestamp,
                    infraHealth: avgInfraHealth,
                    recentIncidents: avgIncidents,
                    deploymentStatus: avgDeployment,
                    resourcePressure: avgResources,
                };
            });

        // Compute summary
        const allFactors = Array.from(timeseriesMap.values()).flatMap((v) => v.factors);
        let summary: RiskFactors;

        if (allFactors.length > 0) {
            summary = {
                infraHealth: allFactors.reduce((sum, f) => sum + f.infraHealth, 0) / allFactors.length,
                recentIncidents:
                    allFactors.reduce((sum, f) => sum + f.recentIncidents, 0) / allFactors.length,
                deploymentStatus:
                    allFactors.reduce((sum, f) => sum + f.deploymentStatus, 0) / allFactors.length,
                resourcePressure:
                    allFactors.reduce((sum, f) => sum + f.resourcePressure, 0) / allFactors.length,
            };
        } else {
            summary = {
                infraHealth: 0,
                recentIncidents: 0,
                deploymentStatus: 0,
                resourcePressure: 0,
            };
        }

        return { timeseries, summary };
    }

    // Helper: Convert window to milliseconds
    private getWindowMs(
        window: '1h' | '6h' | '24h' | '7d' | '30d',
    ): number {
        const map = {
            '1h': 1 * 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
        };
        return map[window];
    }

    // Helper: Get time bucket for grouping
    private getTimeBucket(date: Date, granularity: 'minute' | 'hour' | 'day'): string {
        const d = new Date(date);

        if (granularity === 'minute') {
            d.setSeconds(0, 0);
        } else if (granularity === 'hour') {
            d.setMinutes(0, 0, 0);
        } else if (granularity === 'day') {
            d.setHours(0, 0, 0, 0);
        }

        return d.toISOString();
    }
}

export const riskApiService = new RiskApiService();

export async function getRiskApiService(): Promise<RiskApiService> {
    return riskApiService;
}
