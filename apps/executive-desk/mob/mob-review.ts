import path from 'node:path';
import { access, readFile } from 'node:fs/promises';
import {
    CommandContext,
    CommandExecutionResult,
    MobAlignmentRequirement,
} from '../cli/types';
import { MOB_ALIGNMENT_REQUIREMENTS } from '../config/executive-desk.config';
import { getDateParts, wrapGovernedReport } from '../cadence/cadence-engine';
import { writeMarkdownArtifact } from '../reporting/markdown-reporter';

async function hasMobArtifacts(context: CommandContext): Promise<boolean> {
    try {
        await access(path.join(context.repoRoot, 'docs', 'MOB_NEXT_STEPS_TEMPLATE_2026-07-05.md'));
        return true;
    } catch {
        return false;
    }
}

type AlignmentProfile = Partial<Record<MobAlignmentRequirement, string>>;

async function loadAlignmentProfile(
    context: CommandContext,
): Promise<{ profile: AlignmentProfile; warnings: string[]; source?: string }> {
    const source = path.join(context.docsRoot, 'mob', 'alignment-profile.json');
    try {
        const raw = await readFile(source, 'utf8');
        const parsed = JSON.parse(raw) as AlignmentProfile;
        return { profile: parsed, warnings: [], source };
    } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);
        return {
            profile: {},
            warnings: [`alignment_profile_unavailable_or_invalid: ${detail}`],
        };
    }
}

function isFilled(value: string | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

export async function runMobReview(context: CommandContext): Promise<CommandExecutionResult> {
    const date = getDateParts(context);
    const targetPath = path.join(context.docsRoot, 'mob', `${date.isoDate}.md`);

    const hasArtifacts = await hasMobArtifacts(context);
    const { profile, warnings, source } = await loadAlignmentProfile(context);
    const filledRows: string[] = [];
    const gapRows: string[] = [];

    for (const field of MOB_ALIGNMENT_REQUIREMENTS) {
        const value = profile[field];
        if (isFilled(value)) {
            filledRows.push(`- ${field}: ${value}`);
        } else {
            gapRows.push(`- ${field}: gap_not_auto_filled`);
        }
    }

    const markdown = wrapGovernedReport(
        [
            `# MOB Review — ${date.isoDate}`,
            '',
            '## required_alignment',
            '',
            '```yaml',
            'required_alignment:',
            ...MOB_ALIGNMENT_REQUIREMENTS.map((field) => `  - ${field}`),
            '```',
            '',
            '## Artifact Check',
            '',
            `- mob_artifact_state: ${hasArtifacts ? 'artifact_present_not_behavior_verified' : 'missing_artifact'}`,
            `- alignment_profile_source: ${source || 'none'}`,
            '',
            '## Alignment Fields Present',
            '',
            ...(filledRows.length > 0 ? filledRows : ['- none']),
            '',
            '## Missing Alignment Gaps',
            '',
            ...(gapRows.length > 0 ? gapRows : ['- none']),
            '',
            '## Notes',
            '',
            '- Missing fields are reported as gaps and not auto-filled without evidence.',
        ].join('\n'),
        context,
    );

    const artifact = await writeMarkdownArtifact(context, targetPath, markdown);

    return {
        ok: true,
        command: 'mob review',
        summary:
            gapRows.length === 0
                ? 'MOB review generated with no missing alignment fields.'
                : 'MOB review generated with explicit alignment gaps.',
        artifacts: [artifact],
        warnings,
        blockers: gapRows.length > 0 ? ['missing_alignment_fields'] : [],
    };
}
