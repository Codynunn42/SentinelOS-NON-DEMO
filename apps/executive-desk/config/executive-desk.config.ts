import path from 'node:path';
import { GovernanceHeader, MobAlignmentRequirement } from '../cli/types';

export const EXECUTIVE_TIMEZONE = process.env.EXECUTIVE_DESK_TIMEZONE || 'America/Phoenix';

export const GOVERNANCE_HEADER: GovernanceHeader = {
    comm: 'Sentinel AI by Cody Nunn | Nunn Cloud',
    authority_created: false,
    operational_mutation: false,
    external_claims_authorized: false,
    generated_by: 'Local SentinelOS Executive Desk',
};

export const OUTCOME_KEYS = [
    'government_readiness',
    'sentinelos_completion',
    'executive_desk_operational_cadence',
    'ownerfi_internal_financial_management',
    'sintinex_commercial_readiness',
    'governed_deal_execution',
] as const;

export const MOB_ALIGNMENT_REQUIREMENTS: MobAlignmentRequirement[] = [
    'business_objective',
    'intended_outcome',
    'domain_owner',
    'deployment_profile',
    'outcome_engines',
    'governance_requirements',
    'internal_external_boundary',
    'revenue_model_if_applicable',
    'operational_owner',
    'success_metrics',
];

export const EVIDENCE_SCAN_TARGETS = [
    'gates',
    'verification',
    'receipt',
    'audit',
    'health',
    'risk',
    'authority',
    'government-readiness',
    'mob',
    'board',
    'executive',
    'sentinelos completion',
];

export function resolveExecutiveDeskPaths(repoRoot: string) {
    const appRoot = path.join(repoRoot, 'apps', 'executive-desk');
    const docsRoot = path.join(repoRoot, 'docs', 'executive-desk');
    return { appRoot, docsRoot };
}
