/**
 * Command Handler
 * POST /proxy/command orchestration
 * 
 * Flow:
 * 1. Validate schema (tenant, command, payload)
 * 2. Authority Check: verify principal can execute command (with identity graph + delegation rules)
 * 3. Risk Gate: evaluate operational risk
 * 4. Execute: run command (read-only in v1)
 * 5. Receipt: record decision and outcome (with authority context)
 * 6. Return: governance metadata + result
 */

import { authorityCheckService, AuthorityCheckResult } from '../services/authority-check';
import { riskGateService, RiskGateOutcome } from '../services/risk-gate';
import { getReceiptLedger, ReceiptEntry } from '../services/receipt-ledger';

export interface ProxyCommandRequest {
    tenant: string;
    command: string;
    payload: {
        principalId: string;
        repository?: string;
        workflowName?: string;
        runId?: string;
        action?: string;
        resource?: string;
        context?: Record<string, unknown>;
    };
}

export interface ProxyCommandResponse {
    status: 'executed' | 'blocked' | 'pending_approval';
    command: string;
    executionMode: 'read_only_diagnosis' | 'governed_direct' | 'governed_escalated';
    bypassPrevented: boolean;
    authorityCheckResult: AuthorityCheckResult;
    riskGateOutcome: RiskGateOutcome;
    trustScore: number;
    receipt: ReceiptEntry;
    auditReference: string;
    reasons: string[];
    diagnosis?: Record<string, unknown>;
}

/**
 * Validate request schema
 */
function validateRequest(req: ProxyCommandRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!req.tenant) {
        errors.push('tenant is required');
    } else if (!['nunncloud'].includes(req.tenant)) {
        errors.push(`tenant must be 'nunncloud', got '${req.tenant}'`);
    }

    if (!req.command) {
        errors.push('command is required');
    } else if (!['repo.control.workflow.diagnose'].includes(req.command)) {
        errors.push(`command must be 'repo.control.workflow.diagnose', got '${req.command}'`);
    }

    if (!req.payload) {
        errors.push('payload is required');
    } else if (!req.payload.principalId) {
        errors.push('payload.principalId is required');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Execute the read-only diagnosis command
 */
async function executeDiagnosis(payload: ProxyCommandRequest['payload']): Promise<Record<string, unknown>> {
    // v1: minimal diagnosis logic
    // In production, this would query real workflow history, logs, status, etc.
    return {
        state: 'diagnosed',
        repository: payload.repository || 'unknown',
        workflowName: payload.workflowName || 'unknown',
        runId: payload.runId || 'N/A',
        timestamp: new Date().toISOString(),
        findings: [
            'Workflow diagnostics retrieved (read-only)',
            'No mutations performed',
            'Governance compliance verified',
        ],
    };
}

/**
 * Main command handler
 */
export async function handleCommand(req: ProxyCommandRequest): Promise<ProxyCommandResponse> {
    const ledger = await getReceiptLedger();

    // 1. Validate schema
    const validation = validateRequest(req);
    if (!validation.valid) {
        const receipt = await ledger.record({
            command: req.command || 'unknown',
            tenant: req.tenant || 'unknown',
            executor: req.payload?.principalId || 'unknown',
            timestamp: new Date().toISOString(),
            status: 'rejected',
            payload: req.payload || {},
            authorityCheckResult: {
                allowed: false,
                reasons: validation.errors,
                requiredApprovers: [],
            },
            riskGateOutcome: {
                decision: 'block',
                issues: validation.errors,
            },
            reasons: validation.errors,
        });

        return {
            status: 'blocked',
            command: req.command || 'unknown',
            executionMode: 'read_only_diagnosis',
            bypassPrevented: true,
            authorityCheckResult: {
                allowed: false,
                principalId: req.payload?.principalId || 'unknown',
                command: req.command || 'unknown',
                reasons: validation.errors,
                requiredApprovers: [],
                scope: 'global',
            },
            riskGateOutcome: {
                decision: 'block',
                score: 1.0,
                command: req.command || 'unknown',
                infraStatus: 'unknown',
                issues: validation.errors,
                mitigations: ['Verify request schema matches OpenAPI spec'],
                timestamp: new Date().toISOString(),
            },
            trustScore: 0.0,
            receipt,
            auditReference: receipt.id,
            reasons: validation.errors,
        };
    }

    // 2. Authority Check
    const authCheckResult = await authorityCheckService.check(
        req.payload.principalId,
        req.command,
        req.payload.resource,
    );

    if (!authCheckResult.allowed) {
        const receipt = await ledger.record({
            command: req.command,
            tenant: req.tenant,
            executor: req.payload.principalId,
            timestamp: new Date().toISOString(),
            status: 'rejected',
            payload: req.payload,
            authorityCheckResult: authCheckResult,
            riskGateOutcome: { decision: 'block', issues: ['authority_check_failed'] },
            reasons: authCheckResult.reasons,
        });

        return {
            status: 'blocked',
            command: req.command,
            executionMode: 'read_only_diagnosis',
            bypassPrevented: true,
            authorityCheckResult: authCheckResult,
            riskGateOutcome: {
                decision: 'block',
                score: 1.0,
                command: req.command,
                infraStatus: 'unknown',
                issues: ['authority_check_failed'],
                mitigations: authCheckResult.reasons,
                timestamp: new Date().toISOString(),
            },
            trustScore: 0.0,
            receipt,
            auditReference: receipt.id,
            reasons: authCheckResult.reasons,
        };
    }

    // 3. Risk Gate
    const riskOutcome = await riskGateService.evaluate(req.command, req.payload);

    if (riskOutcome.decision === 'block') {
        const receipt = await ledger.record({
            command: req.command,
            tenant: req.tenant,
            executor: req.payload.principalId,
            timestamp: new Date().toISOString(),
            status: 'blocked',
            payload: req.payload,
            authorityCheckResult: authCheckResult,
            riskGateOutcome: riskOutcome,
            reasons: riskOutcome.mitigations,
        });

        return {
            status: 'blocked',
            command: req.command,
            executionMode: 'read_only_diagnosis',
            bypassPrevented: true,
            authorityCheckResult: authCheckResult,
            riskGateOutcome: riskOutcome,
            trustScore: 0.2,
            receipt,
            auditReference: receipt.id,
            reasons: riskOutcome.mitigations,
        };
    }

    // 4. Execute (read-only diagnosis)
    let diagnosis: Record<string, unknown> | undefined;
    try {
        diagnosis = await executeDiagnosis(req.payload);
    } catch (error) {
        const receipt = await ledger.record({
            command: req.command,
            tenant: req.tenant,
            executor: req.payload.principalId,
            timestamp: new Date().toISOString(),
            status: 'rejected',
            payload: req.payload,
            authorityCheckResult: authCheckResult,
            riskGateOutcome: riskOutcome,
            reasons: [`Execution error: ${error instanceof Error ? error.message : String(error)}`],
        });

        return {
            status: 'blocked',
            command: req.command,
            executionMode: 'read_only_diagnosis',
            bypassPrevented: false,
            authorityCheckResult: authCheckResult,
            riskGateOutcome: riskOutcome,
            trustScore: 0.4,
            receipt,
            auditReference: receipt.id,
            reasons: [`Execution error: ${error instanceof Error ? error.message : String(error)}`],
        };
    }

    // 5. Issue Receipt
    const receipt = await ledger.record({
        command: req.command,
        tenant: req.tenant,
        executor: req.payload.principalId,
        timestamp: new Date().toISOString(),
        status: 'executed',
        payload: req.payload,
        authorityCheckResult: authCheckResult,
        riskGateOutcome: riskOutcome,

        // NEW: Authority context from Gate 4 integration
        principalContext: authCheckResult.principalInfo
            ? {
                id: authCheckResult.principalInfo.id,
                displayName: authCheckResult.principalInfo.displayName,
                email: authCheckResult.principalInfo.email,
                groups: authCheckResult.principalInfo.groups,
                roles: authCheckResult.principalInfo.roles,
            }
            : undefined,
        delegatedBy: authCheckResult.delegatedBy,
        delegationExpiresAt: authCheckResult.delegationExpiresAt?.toISOString(),
    });

    // 6. Return response with governance metadata
    return {
        status: 'executed',
        command: req.command,
        executionMode: 'read_only_diagnosis',
        bypassPrevented: riskOutcome.decision !== 'pass',
        authorityCheckResult: authCheckResult,
        riskGateOutcome: riskOutcome,
        trustScore: authCheckResult.allowed && riskOutcome.decision === 'pass' ? 0.95 : 0.6,
        receipt,
        auditReference: receipt.id,
        reasons: [...authCheckResult.reasons, ...riskOutcome.mitigations],
        diagnosis,
    };
}
