import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'mocha';
import { runDailyCadence } from '../daily';
import { CommandContext } from '../../cli/types';

describe('daily cadence evidence labels', () => {
    it('separates checked repository observations from evidence not collected', async () => {
        const docsRoot = await mkdtemp(path.join(os.tmpdir(), 'sentinel-daily-test-'));
        const repoRoot = path.resolve(process.cwd());
        const context: CommandContext = {
            repoRoot,
            appRoot: path.join(repoRoot, 'apps', 'executive-desk'),
            docsRoot,
            whatIf: false,
            timezone: 'UTC',
            rawArgs: [],
            utcNow: new Date('2026-08-18T12:00:00.000Z'),
            governance: {
                comm: 'test',
                authority_created: false,
                operational_mutation: false,
                external_claims_authorized: false,
                generated_by: 'test',
            },
        };

        try {
            const result = await runDailyCadence(context);
            const report = await readFile(result.artifacts[0].path, 'utf8');

            assert.match(report, /## Evidence Observed in This Run/);
            assert.match(report, /Repository path presence was checked/);
            assert.match(report, /## Required Evidence Not Collected/);
            assert.match(report, /No live environment, governance register, risk summary/);
            assert.match(report, /readiness_status: unverified; live-environment blocker status not observed/);
            assert.doesNotMatch(report, /## Evidence Collected/);
        } finally {
            await rm(docsRoot, { recursive: true, force: true });
        }
    });
});
