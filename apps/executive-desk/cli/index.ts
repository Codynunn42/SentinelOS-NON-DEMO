import path from 'node:path';
import { cwd, exit, argv } from 'node:process';
import { routeCommand } from './command-router';
import { CommandContext } from './types';
import {
    EXECUTIVE_TIMEZONE,
    GOVERNANCE_HEADER,
    resolveExecutiveDeskPaths,
} from '../config/executive-desk.config';
import { writeExecutionReceipt } from '../reporting/receipt-writer';

function detectRepoRoot(startDir: string): string {
    let current = startDir;
    for (let i = 0; i < 10; i += 1) {
        const candidate = path.join(current, 'package.json');
        try {
            // eslint-disable-next-line no-new
            require('node:fs').accessSync(candidate);
            return current;
        } catch {
            const next = path.dirname(current);
            if (next === current) break;
            current = next;
        }
    }

    throw new Error('Unable to resolve repository root from current directory.');
}

function parseArguments(raw: string[]): { whatIf: boolean; tokens: string[] } {
    const whatIf = raw.some((token) => token === '--whatif' || token === '-whatif');
    const tokens = raw.filter((token) => token !== '--whatif' && token !== '-whatif');
    return { whatIf, tokens };
}

async function main(): Promise<void> {
    const raw = argv.slice(2);
    const parsed = parseArguments(raw);

    const repoRoot = detectRepoRoot(cwd());
    const paths = resolveExecutiveDeskPaths(repoRoot);

    const context: CommandContext = {
        repoRoot,
        appRoot: paths.appRoot,
        docsRoot: paths.docsRoot,
        whatIf: parsed.whatIf,
        timezone: EXECUTIVE_TIMEZONE,
        rawArgs: parsed.tokens,
        utcNow: new Date(),
        governance: GOVERNANCE_HEADER,
    };

    const result = await routeCommand(context, parsed.tokens);

    const receiptArtifact = await writeExecutionReceipt(context, result);
    const artifacts = [...result.artifacts, receiptArtifact];

    if (result.summary) {
        console.log(result.summary);
    }

    if (artifacts.length > 0) {
        console.log('Artifacts:');
        artifacts.forEach((artifact) => {
            console.log(`- ${artifact.path} (${artifact.state})`);
        });
    }

    if (!result.ok) {
        if (result.blockers.length > 0) {
            console.error('Blockers:');
            result.blockers.forEach((blocker) => console.error(`- ${blocker}`));
        }
        exit(1);
    }
}

main().catch((error: unknown) => {
    const details = error instanceof Error ? error.message : String(error);
    console.error(`sentinel-runtime-error: ${details}`);
    exit(1);
});
