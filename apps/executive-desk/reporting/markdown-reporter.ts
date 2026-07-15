import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CommandContext, GeneratedArtifact, GovernanceHeader } from '../cli/types';

function governanceFence(governance: GovernanceHeader): string {
    return [
        '```yaml',
        `comm: "${governance.comm}"`,
        `authority_created: ${String(governance.authority_created)}`,
        `operational_mutation: ${String(governance.operational_mutation)}`,
        `external_claims_authorized: ${String(governance.external_claims_authorized)}`,
        `generated_by: "${governance.generated_by}"`,
        '```',
    ].join('\n');
}

export function withGovernanceHeader(markdownBody: string, context: CommandContext): string {
    return `${governanceFence(context.governance)}\n\n${markdownBody}`;
}

export async function writeMarkdownArtifact(
    context: CommandContext,
    targetPath: string,
    markdown: string,
): Promise<GeneratedArtifact> {
    if (context.whatIf) {
        return { path: targetPath, state: 'skipped_dry_run' };
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, markdown, 'utf8');
    return { path: targetPath, state: 'generated' };
}

export async function writeJsonArtifact(
    context: CommandContext,
    targetPath: string,
    value: unknown,
): Promise<GeneratedArtifact> {
    if (context.whatIf) {
        return { path: targetPath, state: 'skipped_dry_run' };
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, JSON.stringify(value, null, 2), 'utf8');
    return { path: targetPath, state: 'generated' };
}
