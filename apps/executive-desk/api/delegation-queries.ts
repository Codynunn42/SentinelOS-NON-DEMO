/**
 * Delegation Queries Service
 * Query and list delegations from delegation rules engine
 */

import { getDelegationRulesEngine, DelegationRule } from '../services/delegation-rules';

export interface DelegationFilter {
    grantedBy?: string;
    grantedTo?: string;
    command?: string;
    resource?: string;
    scope?: 'global' | 'team' | 'repository';
    includeRevoked?: boolean;
}

export interface DelegationListResult {
    data: DelegationRule[];
    total: number;
}

class DelegationQueriesService {
    /**
     * List delegations with optional filters
     */
    async listDelegations(filter?: DelegationFilter): Promise<DelegationListResult> {
        const engine = await getDelegationRulesEngine();
        const allRules = await engine.list();

        let filtered = allRules;

        // Filter out revoked unless explicitly requested
        if (!filter?.includeRevoked) {
            filtered = filtered.filter((r) => !r.revokedAt);
        }

        // Apply grantedBy filter
        if (filter?.grantedBy) {
            filtered = filtered.filter((r) => r.grantedBy === filter.grantedBy);
        }

        // Apply grantedTo filter
        if (filter?.grantedTo) {
            filtered = filtered.filter((r) => r.grantedTo === filter.grantedTo);
        }

        // Apply command filter
        if (filter?.command) {
            filtered = filtered.filter((r) => r.command === filter.command);
        }

        // Apply resource filter
        if (filter?.resource) {
            filtered = filtered.filter((r) => r.resource === filter.resource);
        }

        // Apply scope filter
        if (filter?.scope) {
            filtered = filtered.filter((r) => r.scope === filter.scope);
        }

        // Sort by createdAt descending (most recent first)
        filtered = filtered.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        return { data: filtered, total: filtered.length };
    }

    /**
     * Get single delegation by ID
     */
    async getDelegationById(id: string): Promise<DelegationRule | null> {
        const engine = await getDelegationRulesEngine();
        const allRules = await engine.list();
        const rule = allRules.find((r) => r.id === id);
        return rule || null;
    }

    /**
     * Check if a delegation is currently active
     */
    isActive(rule: DelegationRule): boolean {
        // Must not be revoked
        if (rule.revokedAt) {
            return false;
        }

        // Must be within valid time bounds
        const now = new Date();
        const validFrom = new Date(rule.validFrom);
        const validUntil = rule.validUntil ? new Date(rule.validUntil) : null;

        if (now < validFrom) {
            return false; // Not yet valid
        }

        if (validUntil && now > validUntil) {
            return false; // Expired
        }

        return true;
    }

    /**
     * Get active delegations for a principal
     */
    async getActiveDelegationsForPrincipal(
        principalId: string,
    ): Promise<DelegationRule[]> {
        const result = await this.listDelegations({
            grantedTo: principalId,
            includeRevoked: false,
        });

        return result.data.filter((r) => this.isActive(r));
    }

    /**
     * Get delegations granted by a principal
     */
    async getDelegationsGrantedBy(principalId: string): Promise<DelegationRule[]> {
        const result = await this.listDelegations({
            grantedBy: principalId,
            includeRevoked: false,
        });

        return result.data.filter((r) => this.isActive(r));
    }

    /**
     * Check if a specific delegation is active and covers a command/resource
     */
    async canExecuteViaActiveDelegation(
        principalId: string,
        command: string,
        resource?: string,
    ): Promise<boolean> {
        const activeDelegations = await this.getActiveDelegationsForPrincipal(principalId);

        return activeDelegations.some((r) => {
            // Must match command
            if (r.command !== command) {
                return false;
            }

            // If resource is required, must match
            if (resource && r.resource && r.resource !== resource) {
                return false;
            }

            return true;
        });
    }
}

export const delegationQueriesService = new DelegationQueriesService();

export async function getDelegationQueriesService(): Promise<DelegationQueriesService> {
    return delegationQueriesService;
}
