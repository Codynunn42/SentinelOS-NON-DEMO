/**
 * Risk Gate Service
 * Evaluates operational risk and infrastructure readiness for commands
 * Integrates with infrastructure health checks and risk assessment engine
 */

import { getRiskAssessmentEngine, RiskFactors } from './risk-assessment';

export interface RiskGateOutcome {
    decision: 'pass' | 'warn' | 'block';
    score: number;
    command: string;
    infraStatus: string;
    infraFactors?: RiskFactors;  // NEW: breakdown of risk factors
    issues: string[];
    mitigations: string[];
    timestamp: string;
}

class RiskGateService {
    /**
     * Evaluate risk for a command
     * v1: read-only commands always pass at low risk
     * Infrastructure health is computed and included for audit/observability
     */
    async evaluate(
        command: string,
        _payload?: Record<string, unknown>,
    ): Promise<RiskGateOutcome> {
        const timestamp = new Date().toISOString();

        // v1: read-only commands always pass (no mutations, minimal operational risk)
        if (command === 'repo.control.workflow.diagnose') {
            // Compute infrastructure health factors for observability
            let infraFactors: RiskFactors | undefined;
            try {
                const assessmentEngine = await getRiskAssessmentEngine();
                const assessment = await assessmentEngine.assess(command);
                infraFactors = assessment.factors;
            } catch (err) {
                // If assessment fails, continue with default low risk
                // (risk gate should not fail on health check errors)
            }

            return {
                decision: 'pass',
                score: 0.05, // Very low risk: read-only, observational only
                command,
                infraStatus: 'ok',
                infraFactors,
                issues: [],
                mitigations: ['Read-only command; minimal operational risk'],
                timestamp,
            };
        }

        // v2+: compute full risk assessment for write commands
        // (not yet supported; block for now)
        return {
            decision: 'block',
            score: 1.0, // Maximum risk: unknown command
            command,
            infraStatus: 'unknown',
            issues: [`Write commands not yet supported in v1 (got: '${command}')`],
            mitigations: ['Use read-only commands or upgrade to v2'],
            timestamp,
        };
    }
}

export const riskGateService = new RiskGateService();
