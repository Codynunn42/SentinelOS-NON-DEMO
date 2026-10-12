import path from 'node:path';
import { access } from 'node:fs/promises';
import { CommandContext, CommandExecutionResult } from '../cli/types';
import {
    buildSection,
    buildSentinelCompletionState,
    getDateParts,
    renderSentinelCompletionMarkdown,
    wrapGovernedReport,
} from './cadence-engine';
import { writeMarkdownArtifact } from '../reporting/markdown-reporter';

async function fileState(context: CommandContext, relativePath: string): Promise<string> {
    try {
        await access(path.join(context.repoRoot, relativePath));
        return `artifact_present_not_behavior_verified: ${relativePath}`;
    } catch {
        return `missing_artifact: ${relativePath}`;
    }
}

export async function runDailyCadence(context: CommandContext): Promise<CommandExecutionResult> {
    const date = getDateParts(context);
    const targetPath = path.join(context.docsRoot, 'daily', `${date.isoDate}.md`);

    const health = await Promise.all([
        fileState(context, 'apps/executive-desk/server.ts'),
        fileState(context, 'apps/executive-desk/api/express-adapter.ts'),
        fileState(context, 'apps/executive-desk/INTEGRATION_CHECKLIST.md'),
    ]);

    const completion = await buildSentinelCompletionState(context);

    const report = wrapGovernedReport(
        [
            `# Daily Executive Snapshot — ${date.isoDate}`,
            '',
            buildSection('SentinelOS Health', health),
            '',
            buildSection('Executive Desk Status', [
                'Overall Executive Desk posture is unverified by this report; artifact presence does not establish runtime behavior or current health.',
                'Refresh live environment and governance evidence before making an overall readiness or failure claim.',
            ]),
            '',
            buildSection('Active Priorities', [
                'Approve an Executive Desk production workload and bind it to a hardened PostgreSQL connection through Key Vault.',
                'Complete final Stage 2 GPT publish and Stage 3 gateway/WAF enforcement controls.',
                'Maintain evidence-based weekly cadence and board status while the live rollout items close.',
                'Keep the government-facing narrative tightly bounded to repo health and environment execution blockers.',
            ]),
            '',
            buildSection('Government Package Standard', [
                'Keep public messaging outcome-first and assessment-led.',
                'Keep sensitive operational controls behind authenticated Executive Desk boundaries.',
                'Use evidence-backed governance language instead of unsupported certification or compliance claims.',
            ]),
            '',
            buildSection('Governance Exceptions', [
                'No external mutation without explicit authorization.',
                'No production launch claim until the Executive Desk workload, database binding, and rollout enforcement are verified.',
            ]),
            '',
            buildSection('Outstanding Approvals', [
                'Executive Desk production workload and database binding: pending',
                'Production Postgres setup and smoke verification: pending',
                'Stage 2/3 production controls: pending',
            ]),
            '',
            buildSection('Government Deployment Readiness', [
                'readiness_score_type: internal_evidence_readiness',
                'readiness_status: unverified; live_env_blockers_pending',
                'certification_claim: false',
                'compliance_claim: false',
                'customer_authorization: false',
            ]),
            '',
            buildSection('Evidence Collected', [
                'daily_evidence.system_health',
                'daily_evidence.governance_status',
                'daily_evidence.live_environment_blockers',
                'daily_evidence.risk_summary',
                'daily_evidence.infrastructure_readiness',
                'daily_evidence.ai_activity_summary',
                'daily_evidence.receipt_ledger_summary',
                'daily_evidence.executive_notes',
            ]),
            '',
            buildSection('Risks and Blockers', [
                'The integration checklist records that the live database binding and deployed Executive Desk workload require verification.',
                'No API gateway, Front Door, Application Gateway, or WAF resource is provisioned for Stage 3 enforcement.',
                'Final rollout remains pending until the Stage 2 publish action and Stage 3 deployment controls are completed.',
            ]),
            '',
            renderSentinelCompletionMarkdown(completion),
            '',
            buildSection('Executive Notes and Decisions Required', [
                'Confirm sovereign package standard for CISA/DOE-facing pilot materials.',
                'Confirm GBP top-5 ready and top-5 focus remain current.',
                'Approve next government relationship-building sequence and follow-up list.',
            ]),
        ].join('\n'),
        context,
    );

    const artifact = await writeMarkdownArtifact(context, targetPath, report);

    return {
        ok: true,
        command: 'executive daily',
        summary: 'Daily Executive Snapshot generated.',
        artifacts: [artifact],
        warnings: [],
        blockers: [],
    };
}
