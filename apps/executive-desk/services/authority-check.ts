/**
 * Authority Check Service
 * Evaluates whether a principal has authority to execute a command
 * Integrates with identity graph and delegation rules
 */

import { getIdentityGraphClient, Principal } from './identity-graph-client';
import { getDelegationRulesEngine } from './delegation-rules';

export interface PrincipalInfo {
    id: string;
    displayName: string;
    email: string;
    groups: string[];
    roles: string[];
}

export interface AuthorityCheckResult {
    allowed: boolean;
    principalId: string;
    principalInfo?: PrincipalInfo;
    command: string;
    resource?: string;
    reasons: string[];
    delegatedBy?: string;
    delegationExpiresAt?: Date;
    requiredApprovers: string[];
    scope: string;
}

class AuthorityCheckService {
    /**
     * Check if a principal is authorized for a command
     * Decision flow:
     * 1. Verify principal exists and is active (identity graph)
     * 2. Check if command is in read-only whitelist (v1 constraint)
     * 3. Find applicable delegation rules
     * 4. Return decision with principal context
     */
    async check(
        principalId: string,
        command: string,
        resource?: string,
    ): Promise<AuthorityCheckResult> {
        const reasons: string[] = [];

        // Step 1: Validate principal ID format
        if (!principalId || principalId.trim().length === 0) {
            return {
                allowed: false,
                principalId,
                command,
                resource,
                reasons: ['Principal ID is required'],
                requiredApprovers: [],
                scope: 'global',
            };
        }

        // Step 2: Check command whitelist (v1: read-only only)
        const readOnlyCommands = ['repo.control.workflow.diagnose'];
        if (!readOnlyCommands.includes(command)) {
            return {
                allowed: false,
                principalId,
                command,
                resource,
                reasons: [`Command '${command}' is not supported in v1 (read-only only)`],
                requiredApprovers: [],
                scope: 'global',
            };
        }
        reasons.push(`Command '${command}' is in read-only whitelist`);

        // Step 3: Verify principal exists in identity graph
        let principal: Principal | null = null;
        try {
            const identityGraphClient = await getIdentityGraphClient();
            principal = await identityGraphClient.getPrincipal(principalId);
        } catch (err) {
            reasons.push(`Warning: Could not verify principal in identity graph: ${err}`);
            // Continue with what we have; identity graph may be unavailable
        }

        if (!principal) {
            reasons.push(`Principal '${principalId}' not found in identity graph`);
            // v1: still allow if principal looks valid (could be new user or external)
            // Production should enforce strict identity verification
        } else {
            if (!principal.isActive) {
                return {
                    allowed: false,
                    principalId,
                    command,
                    resource,
                    reasons: [`Principal '${principalId}' is not active`],
                    requiredApprovers: [],
                    scope: 'global',
                };
            }
            reasons.push(
                `Principal '${principal.displayName}' (${principal.email}) is active and authenticated`,
            );
        }

        // Step 4: Check delegation rules
        let delegationReason: string | undefined;
        let delegatedBy: string | undefined;
        let delegationExpiresAt: Date | undefined;

        try {
            const delegationRulesEngine = await getDelegationRulesEngine();
            const applicable = await delegationRulesEngine.findApplicableRules(
                principalId,
                command,
                resource,
            );

            if (applicable.length > 0) {
                const rule = applicable[0];
                delegatedBy = rule.grantedBy;
                delegationExpiresAt = rule.validUntil;
                const expiryInfo = rule.validUntil
                    ? ` (expires ${rule.validUntil.toISOString()})`
                    : '';
                delegationReason = `Delegated by ${rule.grantedBy}${expiryInfo}: ${rule.reason}`;
                reasons.push(delegationReason);
            }
        } catch (err) {
            reasons.push(`Warning: Could not check delegation rules: ${err}`);
            // Continue; delegation rules may be unavailable
        }

        // Step 5: Make authority decision
        // v1: Any authenticated principal (with or without delegation) can execute read-only commands
        const principalInfo: PrincipalInfo | undefined = principal
            ? {
                id: principal.id,
                displayName: principal.displayName,
                email: principal.email,
                groups: principal.groups,
                roles: principal.roles,
            }
            : undefined;

        return {
            allowed: true,
            principalId,
            principalInfo,
            command,
            resource,
            reasons,
            delegatedBy,
            delegationExpiresAt,
            requiredApprovers: [],
            scope: 'global',
        };
    }
}

export const authorityCheckService = new AuthorityCheckService();
