import { access } from 'node:fs/promises';
import path from 'node:path';
import { runBoardCadence } from '../cadence/board';
import { runDailyCadence } from '../cadence/daily';
import { runMonthlyCadence } from '../cadence/monthly';
import { runWeeklyCadence } from '../cadence/weekly';
import { runEvidenceScan } from '../evidence/evidence-scanner';
import { runMobReview } from '../mob/mob-review';
import { runOutcomeStatus } from '../outcomes/outcome-status';
import { runGovernmentReadiness } from '../readiness/government-readiness';
import { CommandContext, CommandExecutionResult } from './types';

export function helpText(): string {
    return [
        'SentinelOS Executive Desk Runtime (local-only)',
        '',
        'Commands:',
        '  pwsh ./scripts/sentinel.ps1 executive daily',
        '  pwsh ./scripts/sentinel.ps1 executive weekly',
        '  pwsh ./scripts/sentinel.ps1 executive monthly',
        '  pwsh ./scripts/sentinel.ps1 executive board',
        '  pwsh ./scripts/sentinel.ps1 government readiness',
        '  pwsh ./scripts/sentinel.ps1 mob review',
        '  pwsh ./scripts/sentinel.ps1 evidence scan',
        '  pwsh ./scripts/sentinel.ps1 outcome status',
        '  pwsh ./scripts/sentinel.ps1 health',
        '  pwsh ./scripts/sentinel.ps1 help',
        '',
        'Aliases:',
        '  pwsh ./scripts/sentinel.ps1 daily|weekly|monthly|board',
    ].join('\n');
}

async function fileExists(targetPath: string): Promise<boolean> {
    try {
        await access(targetPath);
        return true;
    } catch {
        return false;
    }
}

async function runHealth(context: CommandContext): Promise<CommandExecutionResult> {
    const required = [
        'apps/executive-desk/README.md',
        'apps/executive-desk/api/express-adapter.ts',
        'apps/executive-desk/government-readiness/README.md',
    ];

    const blockers: string[] = [];
    for (const item of required) {
        if (!(await fileExists(path.join(context.repoRoot, item)))) {
            blockers.push(`missing_required_artifact: ${item}`);
        }
    }

    return {
        ok: blockers.length === 0,
        command: 'health',
        summary: blockers.length === 0 ? 'Health check passed.' : 'Health check found blockers.',
        artifacts: [],
        warnings: [],
        blockers,
    };
}

function normalize(tokens: string[]): string[] {
    return tokens.map((token) => token.toLowerCase());
}

export async function routeCommand(
    context: CommandContext,
    tokens: string[],
): Promise<CommandExecutionResult> {
    const args = normalize(tokens);

    if (args.length === 0 || args[0] === 'help') {
        return {
            ok: true,
            command: 'help',
            summary: helpText(),
            artifacts: [],
            warnings: [],
            blockers: [],
        };
    }

    if (args[0] === 'health') {
        return runHealth(context);
    }

    if (args[0] === 'daily') {
        return runDailyCadence(context);
    }
    if (args[0] === 'weekly') {
        return runWeeklyCadence(context);
    }
    if (args[0] === 'monthly') {
        return runMonthlyCadence(context);
    }
    if (args[0] === 'board') {
        return runBoardCadence(context);
    }

    if (args[0] === 'executive') {
        if (args[1] === 'daily') return runDailyCadence(context);
        if (args[1] === 'weekly') return runWeeklyCadence(context);
        if (args[1] === 'monthly') return runMonthlyCadence(context);
        if (args[1] === 'board') return runBoardCadence(context);
    }

    if (args[0] === 'government' && args[1] === 'readiness') {
        return runGovernmentReadiness(context);
    }

    if (args[0] === 'mob' && args[1] === 'review') {
        return runMobReview(context);
    }

    if (args[0] === 'evidence' && args[1] === 'scan') {
        return runEvidenceScan(context);
    }

    if (args[0] === 'outcome' && args[1] === 'status') {
        return runOutcomeStatus(context);
    }

    return {
        ok: false,
        command: tokens.join(' ') || 'unknown',
        summary: 'Unsupported command. Run help for usage.',
        artifacts: [],
        warnings: [],
        blockers: ['unsupported_command'],
    };
}
