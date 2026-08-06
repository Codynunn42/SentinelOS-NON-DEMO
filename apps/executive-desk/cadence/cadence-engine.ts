import { access } from 'node:fs/promises';
import path from 'node:path';
import { CommandContext, SentinelCompletionState } from '../cli/types';
import { withGovernanceHeader } from '../reporting/markdown-reporter';

export type DateParts = {
    year: string;
    month: string;
    day: string;
    week: string;
    isoDate: string;
    monthKey: string;
};

async function exists(targetPath: string): Promise<boolean> {
    try {
        await access(targetPath);
        return true;
    } catch {
        return false;
    }
}

export function getDateParts(context: CommandContext): DateParts {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: context.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const parts = formatter.formatToParts(context.utcNow);
    const year = parts.find((part) => part.type === 'year')?.value || '0000';
    const month = parts.find((part) => part.type === 'month')?.value || '00';
    const day = parts.find((part) => part.type === 'day')?.value || '00';

    const isoDate = `${year}-${month}-${day}`;
    const week = getIsoWeek(context.utcNow, context.timezone);
    return {
        year,
        month,
        day,
        week,
        isoDate,
        monthKey: `${year}-${month}`,
    };
}

function getIsoWeek(input: Date, timezone: string): string {
    const local = new Date(
        input.toLocaleString('en-US', {
            timeZone: timezone,
        }),
    );

    const date = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export async function buildSentinelCompletionState(
    context: CommandContext,
): Promise<SentinelCompletionState> {
    const repo = context.repoRoot;
    const checks = {
        implemented: [
            path.join(repo, 'apps', 'executive-desk', 'api', 'express-adapter.ts'),
            path.join(repo, 'apps', 'executive-desk', 'proxy', 'command-handler.ts'),
            path.join(repo, 'apps', 'executive-desk', 'government-readiness', 'README.md'),
        ],
        verified: [
            path.join(repo, 'apps', 'executive-desk', 'GATE_8_E2E_DEMO_VERIFICATION_RESULT_2026-07-05.md'),
            path.join(repo, 'apps', 'executive-desk', 'GATE_7_FRONTEND_COMPONENTS_VERIFICATION_RESULT_2026-07-03.md'),
            path.join(repo, 'apps', 'executive-desk', 'GATE_6_API_ROUTES_VERIFICATION_RESULT_2026-07-03.md'),
        ],
        operational: [
            path.join(repo, 'apps', 'executive-desk', 'README.md'),
            path.join(repo, 'apps', 'executive-desk', 'INTEGRATION_CHECKLIST.md'),
        ],
    };

    const implemented: string[] = [];
    const verified: string[] = [];
    const operational: string[] = [];

    for (const item of checks.implemented) {
        if (await exists(item)) {
            implemented.push(`artifact_present_not_behavior_verified: ${path.relative(repo, item)}`);
        }
    }

    for (const item of checks.verified) {
        if (await exists(item)) {
            verified.push(`artifact_present_not_behavior_verified: ${path.relative(repo, item)}`);
        }
    }

    for (const item of checks.operational) {
        if (await exists(item)) {
            operational.push(`artifact_present_not_behavior_verified: ${path.relative(repo, item)}`);
        }
    }

    const notClaimable = [
        'No certification or compliance claim is authorized without explicit evidence and customer authorization.',
    ];

    return {
        implemented,
        verified,
        operational,
        notClaimable,
    };
}

export function renderSentinelCompletionMarkdown(state: SentinelCompletionState): string {
    const toBullets = (items: string[]) => (items.length ? items.map((item) => `- ${item}`).join('\n') : '- none');

    return [
        '## SentinelOS Completion',
        '',
        '```yaml',
        'sentinelos_completion:',
        '  implemented:',
        '    description: "Capability or artifact exists."',
        '  verified:',
        '    description: "Capability has supporting test or evidence."',
        '  operational:',
        '    description: "Capability is actively usable in the intended environment."',
        '  not_claimable:',
        '    description: "Capability lacks sufficient evidence or authorization."',
        '```',
        '',
        '### Implemented',
        toBullets(state.implemented),
        '',
        '### Verified',
        toBullets(state.verified),
        '',
        '### Operational',
        toBullets(state.operational),
        '',
        '### Not Claimable',
        toBullets(state.notClaimable),
    ].join('\n');
}

export function buildSection(title: string, lines: string[]): string {
    return [`## ${title}`, '', ...(lines.length ? lines.map((line) => `- ${line}`) : ['- none'])].join('\n');
}

export function wrapGovernedReport(body: string, context: CommandContext): string {
    return withGovernanceHeader(body, context);
}
