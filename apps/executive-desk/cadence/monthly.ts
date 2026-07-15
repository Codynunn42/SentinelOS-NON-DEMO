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

export async function runMonthlyCadence(context: CommandContext): Promise<CommandExecutionResult> {
    const date = getDateParts(context);
    const targetPath = path.join(context.docsRoot, 'monthly', `${date.monthKey}.md`);
    const completion = await buildSentinelCompletionState(context);

    const markdown = wrapGovernedReport(
        [
            `# Monthly Executive Report — ${date.monthKey}`,
            '',
            buildSection('Monthly Executive Report', [
                'Monthly operating cadence reviewed in local-only mode.',
                'Government-first readiness posture remains in place.',
            ]),
            '',
            buildSection('MOB Compliance Review', [
                'MOB artifacts scanned for alignment and governance references.',
                'Missing alignment fields are reported as explicit gaps.',
            ]),
            '',
            buildSection('Board Brief', [
                'Board packet inputs assembled from weekly and monthly evidence.',
            ]),
            '',
            buildSection('Financial Summary', [
                'financial_summary_status: placeholder_or_integration_status',
                'OwnerFi boundary status reported without external claims.',
            ]),
            '',
            buildSection('Government Readiness Scorecard', [
                'readiness_score_type: internal_evidence_readiness',
                'certification_claim: false',
                'compliance_claim: false',
                'customer_authorization: false',
            ]),
            '',
            buildSection('Strategic Roadmap Update', [
                'Government relationship-building and pilot execution remain top priorities.',
                'Sentinel AI evidence and runtime validation remain active blockers until verified.',
            ]),
            '',
            renderSentinelCompletionMarkdown(completion),
        ].join('\n'),
        context,
    );

    const artifact = await writeMarkdownArtifact(context, targetPath, markdown);

    return {
        ok: true,
        command: 'executive monthly',
        summary: 'Monthly Executive Report generated.',
        artifacts: [artifact],
        warnings: [],
        blockers: [],
    };
}
