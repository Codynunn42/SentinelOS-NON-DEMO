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
                'Review current priorities against dated owner and approval records; this generator does not establish that any item remains active.',
                'If still applicable, verify the Executive Desk workload, PostgreSQL binding, Stage 2 GPT publish, and Stage 3 gateway/WAF controls using current evidence.',
                'Record a source, observation time, and reviewer for each priority carried into the report.',
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
                'Approval status is not observed by this generator; check current approval records for the Executive Desk workload and database binding.',
                'Approval and verification status for PostgreSQL setup/smoke checks and Stage 2/3 controls must be confirmed from dated source records.',
                'Do not infer pending or approved status from this report.',
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
                'Review the integration checklist and current deployment inventory; this generator does not inspect live database binding, deployed workloads, gateways, Front Door, Application Gateway, WAF, or rollout status.',
                'Record each verified risk or blocker with its source, observation time, and reviewer; otherwise report it as unverified.',
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
