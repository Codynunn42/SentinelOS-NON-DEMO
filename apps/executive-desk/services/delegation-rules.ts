/**
 * Delegation Rules Service
 * Stores and evaluates time-bound delegations of authority
 * Append-only ledger (no mutations after creation)
 */

import { v4 as uuid } from 'uuid';

export interface DelegationRule {
    id: string;
    grantedBy: string;                    // who granted this delegation?
    grantedTo: string;                    // principal receiving access
    command: string;                      // repo.control.workflow.diagnose, etc.
    resource?: string;                    // optional scope (repo, team, etc.)
    scope: 'global' | 'team' | 'repository';
    validFrom: Date;
    validUntil?: Date;
    reason: string;                       // audit: why was this granted?
    revokedAt?: Date;
    revokedReason?: string;
    createdAt: Date;
}

export interface DelegationRulesEngine {
    grantDelegation(
        grantedBy: string,
        grantedTo: string,
        command: string,
        options: {
            resource?: string;
            scope?: 'global' | 'team' | 'repository';
            validFrom?: Date;
            validUntil?: Date;
            reason: string;
        },
    ): Promise<DelegationRule>;

    revokeDelegation(ruleId: string, reason: string): Promise<void>;

    findApplicableRules(
        principalId: string,
        command: string,
        resource?: string,
    ): Promise<DelegationRule[]>;

    evaluateEffectiveDelegations(
        principalId: string,
        command: string,
        resource?: string,
    ): Promise<{ allowed: boolean; reasons: string[] }>;

    list(skip?: number, limit?: number): Promise<DelegationRule[]>;
    count(): Promise<number>;
}

/**
 * In-Memory Delegation Rules Engine (for testing)
 */
class InMemoryDelegationRulesEngine implements DelegationRulesEngine {
    private rules: Map<string, DelegationRule> = new Map();

    async grantDelegation(
        grantedBy: string,
        grantedTo: string,
        command: string,
        options: {
            resource?: string;
            scope?: 'global' | 'team' | 'repository';
            validFrom?: Date;
            validUntil?: Date;
            reason: string;
        },
    ): Promise<DelegationRule> {
        const rule: DelegationRule = {
            id: uuid(),
            grantedBy,
            grantedTo,
            command,
            resource: options.resource,
            scope: options.scope || 'global',
            validFrom: options.validFrom || new Date(),
            validUntil: options.validUntil,
            reason: options.reason,
            createdAt: new Date(),
        };

        this.rules.set(rule.id, rule);
        return rule;
    }

    async revokeDelegation(ruleId: string, reason: string): Promise<void> {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.revokedAt = new Date();
            rule.revokedReason = reason;
        }
    }

    async findApplicableRules(
        principalId: string,
        command: string,
        resource?: string,
    ): Promise<DelegationRule[]> {
        const now = new Date();
        const applicable: DelegationRule[] = [];

        for (const rule of this.rules.values()) {
            // Skip revoked rules
            if (rule.revokedAt) {
                continue;
            }

            // Check if rule applies to this principal
            if (rule.grantedTo !== principalId) {
                continue;
            }

            // Check if rule applies to this command
            if (rule.command !== command) {
                continue;
            }

            // Check if rule applies to this resource (if specified)
            if (resource && rule.resource && rule.resource !== resource) {
                continue;
            }

            // Check if rule is currently valid (time bounds)
            if (now < rule.validFrom) {
                continue;
            }
            if (rule.validUntil && now > rule.validUntil) {
                continue;
            }

            applicable.push(rule);
        }

        return applicable;
    }

    async evaluateEffectiveDelegations(
        principalId: string,
        command: string,
        resource?: string,
    ): Promise<{ allowed: boolean; reasons: string[] }> {
        const applicableRules = await this.findApplicableRules(principalId, command, resource);

        if (applicableRules.length === 0) {
            return {
                allowed: false,
                reasons: ['No delegation rules found for this principal and command'],
            };
        }

        const reasons = applicableRules.map((rule) => {
            const expiryInfo = rule.validUntil
                ? ` (expires ${rule.validUntil.toISOString()})`
                : '';
            return `Delegated by ${rule.grantedBy}${expiryInfo}: ${rule.reason}`;
        });

        return {
            allowed: true,
            reasons,
        };
    }

    async list(skip = 0, limit = 100): Promise<DelegationRule[]> {
        return Array.from(this.rules.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(skip, skip + limit);
    }

    async count(): Promise<number> {
        return this.rules.size;
    }
}

/**
 * PostgreSQL Delegation Rules Engine (stub for future implementation)
 */
class PostgresDelegationRulesEngine implements DelegationRulesEngine {
    private connectionString: string;

    constructor(connectionString = process.env.DATABASE_URL) {
        if (!connectionString) {
            throw new Error('PostgreSQL connection string required');
        }
        this.connectionString = connectionString;
    }

    async grantDelegation(
        grantedBy: string,
        grantedTo: string,
        command: string,
        options: {
            resource?: string;
            scope?: 'global' | 'team' | 'repository';
            validFrom?: Date;
            validUntil?: Date;
            reason: string;
        },
    ): Promise<DelegationRule> {
        // TODO: implement PostgreSQL INSERT into delegation_rules table
        throw new Error('PostgresDelegationRulesEngine.grantDelegation not yet implemented');
    }

    async revokeDelegation(ruleId: string, reason: string): Promise<void> {
        // TODO: implement PostgreSQL UPDATE to set revoked_at
        throw new Error('PostgresDelegationRulesEngine.revokeDelegation not yet implemented');
    }

    async findApplicableRules(
        principalId: string,
        command: string,
        resource?: string,
    ): Promise<DelegationRule[]> {
        // TODO: implement PostgreSQL SELECT with time and scope filtering
        throw new Error('PostgresDelegationRulesEngine.findApplicableRules not yet implemented');
    }

    async evaluateEffectiveDelegations(
        principalId: string,
        command: string,
        resource?: string,
    ): Promise<{ allowed: boolean; reasons: string[] }> {
        const rules = await this.findApplicableRules(principalId, command, resource);
        return {
            allowed: rules.length > 0,
            reasons: rules.map((r) => `Delegated by ${r.grantedBy}: ${r.reason}`),
        };
    }

    async list(skip?: number, limit?: number): Promise<DelegationRule[]> {
        // TODO: implement PostgreSQL SELECT with pagination
        throw new Error('PostgresDelegationRulesEngine.list not yet implemented');
    }

    async count(): Promise<number> {
        // TODO: implement PostgreSQL COUNT
        throw new Error('PostgresDelegationRulesEngine.count not yet implemented');
    }
}

/**
 * Factory function
 */
export function createDelegationRulesEngine(): DelegationRulesEngine {
    const backend = process.env.DELEGATION_RULES_BACKEND || 'memory';

    if (backend === 'postgres' || backend === 'postgresql') {
        return new PostgresDelegationRulesEngine();
    }

    return new InMemoryDelegationRulesEngine();
}

/**
 * Singleton getter
 */
let instance: DelegationRulesEngine | null = null;

export async function getDelegationRulesEngine(): Promise<DelegationRulesEngine> {
    if (!instance) {
        instance = createDelegationRulesEngine();
    }
    return instance;
}

/**
 * Reset instance (for testing)
 */
export function resetDelegationRulesEngine(): void {
    instance = null;
}

// Export implementations for testing/direct use
export { InMemoryDelegationRulesEngine, PostgresDelegationRulesEngine };
