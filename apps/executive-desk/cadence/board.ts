import path from 'node:path';
import { CommandContext, CommandExecutionResult } from '../cli/types';
import {
    buildSection,
    buildSentinelCompletionState,
    getDateParts,
    renderSentinelCompletionMarkdown,
    wrapGovernedReport,
} from './cadence-engine';
import { writeMarkdownArtifact } from '../reporting/markdown-reporter';

export async function runBoardCadence(context: CommandContext): Promise<CommandExecutionResult> {
    const date = getDateParts(context);
    const targetPath = path.join(context.docsRoot, 'board', `${date.monthKey}.md`);
    const completion = await buildSentinelCompletionState(context);

    const markdown = wrapGovernedReport(
        [
            `# Executive Board Packet — ${date.monthKey}`,
            '',
            buildSection('Executive Summary', [
                'Executive Desk is operating in governed local-only mode.',
                'Government-first readiness remains the lead execution lane.',
            ]),
            '',
            renderSentinelCompletionMarkdown(completion),
            '',
            buildSection('Government Readiness', [
                'Government readiness evaluated via internal evidence and artifact inspection.',
                'No certification or compliance claims are made.',
            ]),
            '',
            buildSection('Executive Desk Performance', [
                'Cadence workflows available: daily, weekly, monthly, board.',
                'Reporting and evidence workflows available through command host.',
            ]),
            '',
            buildSection('OwnerFi Status', [
                'OwnerFi integration boundary maintained.',
                'State reported as artifact_present_not_behavior_verified.',
            ]),
            '',
            buildSection('SINTINEX Commercial Readiness', [
                'SINTINEX integration boundary maintained.',
                'Readiness reported without external authorization claims.',
            ]),
            '',
            buildSection('Strategic Risks', [
                'Evidence completeness risk in externally visible claims.',
                'Runtime verification risk until command host validation is complete.',
            ]),
            '',
            buildSection('Executive Decisions', [
                'Approve top-5 ready and focus list for next cycle.',
                'Approve any government-facing material updates only after evidence review.',
            ]),
            '',
            buildSection('Authorization Boundaries', [
                'No infrastructure deployment',
                'No Azure mutation',
                'No billing/payment execution',
                'No secret writes',
                'No commit/push/release',
            ]),
            '',
            buildSection('Non-Authorizations', [
                'certification_claim: false',
                'compliance_claim: false',
                'customer_authorization: false',
            ]),
        ].join('\n'),
        context,
    );

    const artifact = await writeMarkdownArtifact(context, targetPath, markdown);

    return {
        ok: true,
        command: 'executive board',
        summary: 'Executive Board Packet generated.',
        artifacts: [artifact],
        warnings: [],
        blockers: [],
    };
}
