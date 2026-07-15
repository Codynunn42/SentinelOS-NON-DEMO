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
                'Read-only governed loop is available locally.',
                'Cadence automation is running in local-only mode.',
            ]),
            '',
            buildSection('Active Priorities', [
                'GBP mission package execution quality and craftsmanship.',
                'Government relationship building and readiness evidence.',
                'Runtime verification for Sentinel AI and Executive Desk command path.',
            ]),
            '',
            buildSection('Governance Exceptions', [
                'No external mutation allowed in this runtime.',
                'No compliance or certification claims permitted without explicit authorization.',
            ]),
            '',
            buildSection('Outstanding Approvals', [
                'Customer authorization: pending',
                'Certification claim: not authorized',
                'External production command execution: pending Stage 2/3 controls',
            ]),
            '',
            buildSection('Government Deployment Readiness', [
                'readiness_score_type: internal_evidence_readiness',
                'certification_claim: false',
                'compliance_claim: false',
                'customer_authorization: false',
            ]),
            '',
            buildSection('Evidence Collected', [
                'daily_evidence.system_health',
                'daily_evidence.governance_status',
                'daily_evidence.approval_activity',
                'daily_evidence.risk_summary',
                'daily_evidence.infrastructure_readiness',
                'daily_evidence.ai_activity_summary',
                'daily_evidence.receipt_ledger_summary',
                'daily_evidence.executive_notes',
            ]),
            '',
            buildSection('Risks and Blockers', [
                'Local runtime currently assumes internal-only operation.',
                'PowerShell command host still requires environment-level validation in each machine profile.',
            ]),
            '',
            renderSentinelCompletionMarkdown(completion),
            '',
            buildSection('Executive Notes and Decisions Required', [
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
