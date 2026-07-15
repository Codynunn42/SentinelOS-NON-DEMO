import path from 'node:path';
import { access } from 'node:fs/promises';
import { CommandContext, CommandExecutionResult } from '../cli/types';
import { getDateParts, wrapGovernedReport } from '../cadence/cadence-engine';
import { writeMarkdownArtifact } from '../reporting/markdown-reporter';

const CHECKS = [
    ['Government Deployment Blueprint', 'apps/executive-desk/government-readiness/deployment-profiles/GOVERNMENT_DEPLOYMENT_BLUEPRINT_2026-07-14.md'],
    ['Deployment profiles', 'apps/executive-desk/government-readiness/deployment-profiles'],
    ['Governance controls', 'apps/executive-desk/government-readiness/governance'],
    ['Identity and access', 'apps/executive-desk/government-readiness/governance/EXECUTIVE_REVIEW_CHECKLIST_GOVERNMENT_POSTURE.md'],
    ['Least privilege', 'apps/executive-desk/government-readiness/governance/EXECUTIVE_REVIEW_CHECKLIST_GOVERNMENT_POSTURE.md'],
    ['Separation of duties', 'apps/executive-desk/government-readiness/governance/EXECUTIVE_REVIEW_CHECKLIST_GOVERNMENT_POSTURE.md'],
    ['Audit and evidence', 'apps/executive-desk/government-readiness/evidence/README.md'],
    ['Documentation', 'apps/executive-desk/government-readiness/README.md'],
    ['Risk management', 'apps/executive-desk/government-readiness/governance/EXECUTIVE_REVIEW_CHECKLIST_GOVERNMENT_POSTURE.md'],
    ['Change management', 'apps/executive-desk/INTEGRATION_CHECKLIST.md'],
    ['AI governance', 'apps/executive-desk/government-readiness/executive-intelligence/EXECUTIVE_INTELLIGENCE_BRIEF_DOCTRINE.md'],
    ['Data handling', 'apps/executive-desk/government-readiness/governance/EXECUTIVE_REVIEW_CHECKLIST_GOVERNMENT_POSTURE.md'],
    ['Operational procedures', 'apps/executive-desk/government-readiness/governance/GBP_OPERATING_RUNBOOK.md'],
    ['Continuity planning', 'apps/executive-desk/INTEGRATION_CHECKLIST.md'],
    ['Customer enablement', 'apps/executive-desk/government-readiness/DOE/GOVERNMENT_EXECUTIVE_DESK_OVERVIEW.md'],
] as const;

async function stateFor(context: CommandContext, target: string): Promise<string> {
    try {
        await access(path.join(context.repoRoot, target));
        return 'artifact_present_not_behavior_verified';
    } catch {
        return 'missing_artifact';
    }
}

export async function runGovernmentReadiness(context: CommandContext): Promise<CommandExecutionResult> {
    const date = getDateParts(context);
    const targetPath = path.join(context.docsRoot, 'government-readiness', `${date.isoDate}.md`);

    const lines: string[] = [];
    for (const [label, target] of CHECKS) {
        const status = await stateFor(context, target);
        lines.push(`- ${label}: ${status} (${target})`);
    }

    const markdown = wrapGovernedReport(
        [
            `# Government Readiness Assessment — ${date.isoDate}`,
            '',
            '```yaml',
            'readiness_score_type: internal_evidence_readiness',
            'certification_claim: false',
            'compliance_claim: false',
            'customer_authorization: false',
            '```',
            '',
            '## Assessment',
            '',
            ...lines,
            '',
            '## Constraints',
            '',
            '- This assessment is internal and evidence-based only.',
            '- No certification, accreditation, compliance, or customer authorization claim is made.',
        ].join('\n'),
        context,
    );

    const artifact = await writeMarkdownArtifact(context, targetPath, markdown);

    return {
        ok: true,
        command: 'government readiness',
        summary: 'Government readiness assessment generated.',
        artifacts: [artifact],
        warnings: [],
        blockers: [],
    };
}
