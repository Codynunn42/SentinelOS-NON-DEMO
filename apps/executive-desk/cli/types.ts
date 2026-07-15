export type CommandTokens = string[];

export type ReportKind =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'board'
    | 'government-readiness'
    | 'mob-review'
    | 'evidence-scan'
    | 'outcome-status'
    | 'health';

export type GovernanceHeader = {
    comm: string;
    authority_created: boolean;
    operational_mutation: boolean;
    external_claims_authorized: boolean;
    generated_by: string;
};

export type SentinelCompletionState = {
    implemented: string[];
    verified: string[];
    operational: string[];
    notClaimable: string[];
};

export type CommandContext = {
    repoRoot: string;
    appRoot: string;
    docsRoot: string;
    whatIf: boolean;
    timezone: string;
    rawArgs: CommandTokens;
    utcNow: Date;
    governance: GovernanceHeader;
};

export type GeneratedArtifact = {
    path: string;
    state: 'generated' | 'skipped_dry_run';
};

export type CommandExecutionResult = {
    ok: boolean;
    command: string;
    summary: string;
    artifacts: GeneratedArtifact[];
    warnings: string[];
    blockers: string[];
};

export type OutcomeStatusEntry = {
    outcome: string;
    state: 'green' | 'yellow' | 'red';
    evidence: string[];
    blockers: string[];
    owner: string;
    nextGate: string;
    lastChecked: string;
};

export type MobAlignmentRequirement =
    | 'business_objective'
    | 'intended_outcome'
    | 'domain_owner'
    | 'deployment_profile'
    | 'outcome_engines'
    | 'governance_requirements'
    | 'internal_external_boundary'
    | 'revenue_model_if_applicable'
    | 'operational_owner'
    | 'success_metrics';
