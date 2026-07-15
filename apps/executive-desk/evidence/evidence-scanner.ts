import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { CommandContext, CommandExecutionResult } from '../cli/types';
import { getDateParts, wrapGovernedReport } from '../cadence/cadence-engine';
import { writeJsonArtifact, writeMarkdownArtifact } from '../reporting/markdown-reporter';

type EvidenceEntry = {
    category: string;
    path: string;
    evidence_state: 'artifact_present_not_behavior_verified';
};

const CATEGORY_NEEDLES: Record<string, string[]> = {
    gates: ['GATE_', 'gate_'],
    verification: ['VERIFICATION_RESULT', 'verification'],
    receipts: ['receipt', 'receipts'],
    audit: ['audit'],
    health: ['health'],
    risk: ['risk'],
    authority: ['authority'],
    government_readiness: ['government-readiness', 'government'],
    mob: ['MOB', 'mob'],
    board: ['board', 'Board'],
    executive_templates: ['template', 'executive'],
    sentinelos_completion: ['completion', 'SENTINELOS'],
};

async function walkFiles(root: string, relative = ''): Promise<string[]> {
    const target = path.join(root, relative);
    const entries = await readdir(target, { withFileTypes: true });
    const result: string[] = [];

    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.venv') {
            continue;
        }

        const rel = path.join(relative, entry.name);
        if (entry.isDirectory()) {
            result.push(...(await walkFiles(root, rel)));
        } else {
            result.push(rel);
        }
    }

    return result;
}

function classifyEvidence(files: string[]): EvidenceEntry[] {
    const rows: EvidenceEntry[] = [];

    for (const file of files) {
        const lower = file.toLowerCase();
        const category = Object.entries(CATEGORY_NEEDLES).find(([, needles]) =>
            needles.some((needle) => lower.includes(needle.toLowerCase())),
        )?.[0];

        if (!category) {
            continue;
        }

        rows.push({
            category,
            path: file,
            evidence_state: 'artifact_present_not_behavior_verified',
        });
    }

    return rows;
}

export async function runEvidenceScan(context: CommandContext): Promise<CommandExecutionResult> {
    const date = getDateParts(context);
    const files = await walkFiles(context.repoRoot);
    const rows = classifyEvidence(files);

    const jsonPath = path.join(
        context.docsRoot,
        'evidence',
        `${date.isoDate}-evidence-index.json`,
    );
    const summaryPath = path.join(
        context.docsRoot,
        'evidence',
        `${date.isoDate}-evidence-summary.md`,
    );

    const categoryMap = new Map<string, number>();
    for (const row of rows) {
        categoryMap.set(row.category, (categoryMap.get(row.category) || 0) + 1);
    }

    const summaryBody = wrapGovernedReport(
        [
            `# Evidence Summary — ${date.isoDate}`,
            '',
            `Total indexed artifacts: ${rows.length}`,
            '',
            '## Category Counts',
            '',
            ...Array.from(categoryMap.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, count]) => `- ${category}: ${count}`),
            '',
            '## Notes',
            '',
            '- Evidence scan is read-only.',
            '- Artifact presence is reported as artifact_present_not_behavior_verified.',
        ].join('\n'),
        context,
    );

    const artifacts = [
        await writeJsonArtifact(context, jsonPath, {
            generatedAt: context.utcNow.toISOString(),
            readOnly: true,
            entries: rows,
        }),
        await writeMarkdownArtifact(context, summaryPath, summaryBody),
    ];

    return {
        ok: true,
        command: 'evidence scan',
        summary: `Evidence scan indexed ${rows.length} artifacts.`,
        artifacts,
        warnings: [],
        blockers: [],
    };
}
