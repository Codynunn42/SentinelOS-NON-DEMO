const { performance } = require('perf_hooks');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { signExecutionPassport } = require('../apps/sentinel/src/governance/executionPassport');

if (!process.env.SENTINEL_HMAC_SECRET) {
    process.env.SENTINEL_HMAC_SECRET = 'stress-test-secret';
}

const ARTIFACT_ROOT = path.resolve(process.cwd(), 'runtime', 'mock-results');

function ensureArtifactDirectory() {
    if (!fs.existsSync(ARTIFACT_ROOT)) {
        fs.mkdirSync(ARTIFACT_ROOT, { recursive: true });
    }
}

function buildRunId(iterations, config) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const commands = Number.isFinite(Number(config.commandsPerRun)) ? Number(config.commandsPerRun) : 'auto';
    return `mockrun_${iterations}x${commands}_${timestamp}`;
}

function buildAggregateSummary(results, durationMs) {
    const totals = results.reduce(
        (acc, item) => {
            const summary = item.iterationSummary || {};
            acc.totalCommands += Number.isFinite(Number(summary.commandCount)) ? Number(summary.commandCount) : 0;
            acc.totalApprovals += Number.isFinite(Number(summary.approvalCount)) ? Number(summary.approvalCount) : 0;
            acc.totalBlocks += Number.isFinite(Number(summary.blockedCount)) ? Number(summary.blockedCount) : 0;
            acc.sumApprovalRatio += Number.isFinite(Number(summary.approvalRatio)) ? Number(summary.approvalRatio) : 0;
            acc.sumBlockRatio += Number.isFinite(Number(summary.blockRatio)) ? Number(summary.blockRatio) : 0;
            acc.sumTraceCompleteness += Number.isFinite(Number(summary.traceCompleteness)) ? Number(summary.traceCompleteness) : 0;
            acc.totalDriftRecommendations += Number.isFinite(Number(summary.driftRecommendationsGenerated)) ? Number(summary.driftRecommendationsGenerated) : 0;
            acc.count += 1;
            return acc;
        },
        {
            totalCommands: 0,
            totalApprovals: 0,
            totalBlocks: 0,
            sumApprovalRatio: 0,
            sumBlockRatio: 0,
            sumTraceCompleteness: 0,
            totalDriftRecommendations: 0,
            count: 0
        }
    );

    return {
        totalCommands: totals.totalCommands,
        totalApprovals: totals.totalApprovals,
        totalBlocks: totals.totalBlocks,
        avgApprovalRatio: totals.count ? Number((totals.sumApprovalRatio / totals.count).toFixed(3)) : 0,
        avgBlockRatio: totals.count ? Number((totals.sumBlockRatio / totals.count).toFixed(3)) : 0,
        avgTraceCompleteness: totals.count ? Number((totals.sumTraceCompleteness / totals.count).toFixed(3)) : 0,
        totalDriftRecommendations: totals.totalDriftRecommendations,
        durationMs: Number(durationMs.toFixed(2))
    };
}

function saveRunSummary(runId, resultSet, iterations, config, aggregateSummary) {
    ensureArtifactDirectory();
    const fileName = `${runId}.json`;
    const artifact = {
        runId,
        timestamp: new Date().toISOString(),
        iterations,
        config,
        aggregateSummary,
        results: resultSet
    };
    fs.writeFileSync(path.join(ARTIFACT_ROOT, fileName), JSON.stringify(artifact, null, 2), 'utf8');
    return fileName;
}

const MOCK_PRINCIPAL = {
    actor: 'stress-test@sentinel.local',
    role: 'platform-admin',
    keyId: 'stress-test-key',
    scopes: ['platform:admin'],
    tenant: 'platform'
};

function buildMockFaceplaneCommand(config = {}) {
    return {
        correlationId: crypto.randomUUID(),
        tenant: 'mock',
        command: 'faceplane.mock.run',
        payload: {
            faceplanes: ['ownerfi', 'hotelops', 'itad'],
            commandsPerRun: Number.isFinite(Number(config.commandsPerRun)) ? Number(config.commandsPerRun) : 40,
            approvalRate: Number.isFinite(Number(config.approvalRate)) ? Number(config.approvalRate) : 0.35,
            blockRate: Number.isFinite(Number(config.blockRate)) ? Number(config.blockRate) : 0.15,
            telemetryState: config.telemetryState || 'LIMITED',
            telemetryActivityCount: Number.isFinite(Number(config.telemetryActivityCount)) ? Number(config.telemetryActivityCount) : 12,
            scenario: config.scenario || null
        },
        metadata: {
            source: 'stress-test',
            actor: MOCK_PRINCIPAL.actor,
            role: MOCK_PRINCIPAL.role,
            keyId: MOCK_PRINCIPAL.keyId,
            scopes: MOCK_PRINCIPAL.scopes
        }
    };
}

async function runIteration(index, config) {
    let input = buildMockFaceplaneCommand(config);

    try {
        input = signExecutionPassport(input);
    } catch (passportError) {
        return {
            iteration: index + 1,
            durationMs: 0,
            success: false,
            statusCode: 500,
            blocked: true,
            summary: null,
            error: `PASSPORT_SIGNING_FAILED: ${passportError.message}`
        };
    }

    const commandCorrelationId = input.correlationId || null;
    const start = performance.now();
    const result = await dispatchCommand(input, {
        principal: MOCK_PRINCIPAL,
        source: 'sentinel',
        route: '/v1/faceplane/mock'
    });
    const duration = performance.now() - start;

    const run = result.data && result.data.run ? result.data.run : null;
    const totals = run ? (run.totals || run.summary || {}) : {};
    const faceplanes = run ? (run.faceplanes || (run.faceplane ? [run.faceplane] : [])) : [];

    const commandCount = run ? (Number.isFinite(Number(totals.commandCount)) ? Number(totals.commandCount) : null) : null;
    const approvalCount = run ? (Number.isFinite(Number(totals.approvalCount)) ? Number(totals.approvalCount) : null) : null;
    const blockedCount = run ? (Number.isFinite(Number(totals.blockedCount)) ? Number(totals.blockedCount) : null) : null;
    const approvalRatio = commandCount ? Number((approvalCount / commandCount).toFixed(3)) : 0;
    const blockRatio = commandCount ? Number((blockedCount / commandCount).toFixed(3)) : 0;

    return {
        iteration: index + 1,
        durationMs: Number(duration.toFixed(2)),
        success: result.success === true,
        statusCode: result.statusCode || (result.success ? 200 : 500),
        blocked: result.success !== true,
        summary: run ? {
            faceplanes,
            runId: run.runId,
            commandCount,
            approvalCount,
            blockedCount
        } : null,
        iterationSummary: run ? {
            commandCount,
            approvalCount,
            blockedCount,
            approvalRatio,
            blockRatio,
            driftRecommendationsGenerated: calculateDriftRecommendations(approvalRatio, blockRatio, commandCount),
            traceCompleteness: calculateTraceCompleteness(telemetryActivityCount, commandCount),
            timestamp: new Date().toISOString(),
            correlationId: commandCorrelationId
        } : null,
        error: result.error || null
    };
}

function calculateDriftRecommendations(approvalRatio, blockRatio, commandCount) {
    let recommendations = 0;

    // High block ratio indicates potential over-blocking or policy drift
    if (blockRatio > 0.2) {
        recommendations += Math.floor(blockRatio * 10); // Scale with severity
    }

    // Low approval ratio indicates potential under-approval or restrictive policies
    if (approvalRatio < 0.2) {
        recommendations += Math.floor((1 - approvalRatio) * 5);
    }

    // High command volume with mixed results suggests governance complexity
    if (commandCount > 100 && (approvalRatio + blockRatio) > 0.8) {
        recommendations += 2; // Additional complexity recommendation
    }

    // Anomalous patterns (very high approval with some blocks)
    if (approvalRatio > 0.8 && blockRatio > 0.05) {
        recommendations += 1; // Investigate inconsistent blocking
    }

    return Math.min(recommendations, 10); // Cap at reasonable maximum
}

function calculateTraceCompleteness(telemetryActivityCount, commandCount) {
    // Trace completeness based on telemetry activity vs expected
    const expectedTelemetryPerCommand = 2; // Expected telemetry events per command
    const expectedTotalTelemetry = commandCount * expectedTelemetryPerCommand;
    const actualTelemetry = telemetryActivityCount;

    if (expectedTotalTelemetry === 0) return 1.0;

    const completeness = Math.min(actualTelemetry / expectedTotalTelemetry, 1.0);
    return Number(completeness.toFixed(2));
}

async function main() {
    const iterations = process.argv[2] ? Number(process.argv[2]) : 3;
    const config = {
        commandsPerRun: process.argv[3] ? Number(process.argv[3]) : 40,
        approvalRate: 0.35,
        blockRate: 0.15,
        telemetryState: 'LIMITED',
        telemetryActivityCount: 12
    };

    const runId = buildRunId(iterations, config);
    console.log(`Stress test starting: ${iterations} iterations across up to 3 mock faceplanes`);
    console.log(`Run ID: ${runId}`);
    const results = [];

    for (let i = 0; i < iterations; i += 1) {
        const iterationResult = await runIteration(i, config);
        results.push(iterationResult);
        console.log(JSON.stringify(iterationResult, null, 2));
    }

    const totalTime = results.reduce((sum, item) => sum + item.durationMs, 0);
    const successes = results.filter((item) => item.success).length;
    const blocked = results.filter((item) => item.blocked).length;
    const aggregateSummary = buildAggregateSummary(results, totalTime);

    console.log('Stress test completed');
    console.log(`  runId: ${runId}`);
    console.log(`  iterations: ${iterations}`);
    console.log(`  success: ${successes}`);
    console.log(`  blocked: ${blocked}`);
    console.log(`  avg duration ms: ${(totalTime / results.length).toFixed(2)}`);
    console.log(`  totalCommands: ${aggregateSummary.totalCommands}`);
    console.log(`  totalApprovals: ${aggregateSummary.totalApprovals}`);
    console.log(`  totalBlocks: ${aggregateSummary.totalBlocks}`);
    console.log(`  avgApprovalRatio: ${aggregateSummary.avgApprovalRatio}`);
    console.log(`  avgBlockRatio: ${aggregateSummary.avgBlockRatio}`);
    console.log(`  avgTraceCompleteness: ${aggregateSummary.avgTraceCompleteness}`);
    console.log(`  totalDriftRecommendations: ${aggregateSummary.totalDriftRecommendations}`);

    const fileName = saveRunSummary(runId, results, iterations, config, aggregateSummary);
    console.log(`Saved runtime governance summary to runtime/mock-results/${fileName}`);
}

main().catch((error) => {
    console.error('Stress test failed', error);
    process.exit(1);
});
