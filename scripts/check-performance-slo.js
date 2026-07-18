#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');

const gateId = 'PER-001';
const gateName = 'Performance SLO';
const reviewer = process.env.GATE_REVIEWER || 'unassigned';
const reportPath = process.env.PER001_REPORT_PATH || '';
const repoRoot = process.cwd();
const scenarioScript = path.join(repoRoot, 'scripts', 'run-faceplane-department-scenario.js');

const profiles = [
    {
        label: 'scale-10',
        virtualOperators: 10,
        commandsPerRun: 6,
        telemetryActivityCount: 6,
        repetitions: 2,
        maxP95MissionMs: 25,
        maxP99MissionMs: 50,
        minThroughputCommandsPerSecond: 10,
    },
    {
        label: 'scale-100',
        virtualOperators: 100,
        commandsPerRun: 6,
        telemetryActivityCount: 6,
        repetitions: 2,
        maxP95MissionMs: 50,
        maxP99MissionMs: 100,
        minThroughputCommandsPerSecond: 100,
    },
    {
        label: 'scale-1000',
        virtualOperators: 1000,
        commandsPerRun: 6,
        telemetryActivityCount: 6,
        repetitions: 2,
        maxP95MissionMs: 100,
        maxP99MissionMs: 200,
        minThroughputCommandsPerSecond: 500,
    },
];

const requiredChecklistLabels = [
    'Scenario executed successfully',
    'Receipts generated',
    'Read-only execution',
    'Evidence archived',
];

function runScenarioProfile(profile) {
    const args = [
        scenarioScript,
        `--commandsPerRun=${profile.commandsPerRun}`,
        `--telemetryActivityCount=${profile.telemetryActivityCount}`,
        `--virtualOperators=${profile.virtualOperators}`,
        `--repetitions=${profile.repetitions}`,
    ];

    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    const res = spawnSync('node', args, { encoding: 'utf8', cwd: repoRoot });
    const durationMs = Date.now() - t0;

    if (res.status !== 0) {
        return {
            label: profile.label,
            passed: false,
            startedAt,
            finishedAt: new Date().toISOString(),
            durationMs,
            issues: [`scenario_script_failed_exit_${res.status}`],
            stderr: res.stderr ? res.stderr.trim().slice(0, 2000) : '',
        };
    }

    let payload;
    try {
        payload = JSON.parse(res.stdout);
    } catch (error) {
        return {
            label: profile.label,
            passed: false,
            startedAt,
            finishedAt: new Date().toISOString(),
            durationMs,
            issues: ['scenario_output_not_json'],
            stderr: res.stderr ? res.stderr.trim().slice(0, 2000) : '',
        };
    }

    const report = payload.report;
    const artifacts = payload.artifacts || {};
    const issues = [];

    if (!report || !report.scenario || !report.load || !Array.isArray(report.validationChecklist)) {
        issues.push('missing_report_sections');
    }

    if (report) {
        const expectedScenarioCommands = 10 * profile.commandsPerRun;
        const expectedLoadCommands = profile.virtualOperators * profile.commandsPerRun;
        const scenarioCommands = report.scenario?.totals?.commands;
        const loadCommands = report.load?.totalCommands;
        const faceplaneCount = report.scenario?.faceplaneCount;
        const p50 = report.load?.latency?.p50MissionMs;
        const p95 = report.load?.latency?.p95MissionMs;
        const p99 = report.load?.latency?.p99MissionMs;
        const throughput = report.load?.throughputCommandsPerSecond;
        const approvals = report.load?.totalApprovals;
        const blocked = report.load?.totalBlocked;

        if (faceplaneCount !== 10) {
            issues.push(`faceplane_count_expected_10_got_${faceplaneCount}`);
        }

        if (scenarioCommands !== expectedScenarioCommands) {
            issues.push(`scenario_commands_expected_${expectedScenarioCommands}_got_${scenarioCommands}`);
        }

        if (loadCommands !== expectedLoadCommands) {
            issues.push(`load_commands_expected_${expectedLoadCommands}_got_${loadCommands}`);
        }

        if (!(Number.isFinite(throughput) && throughput >= profile.minThroughputCommandsPerSecond)) {
            issues.push(`throughput_below_floor_${profile.minThroughputCommandsPerSecond}`);
        }

        if (!(Number.isFinite(p95) && p95 <= profile.maxP95MissionMs)) {
            issues.push(`p95_mission_above_slo_${profile.maxP95MissionMs}`);
        }

        if (!(Number.isFinite(p99) && p99 <= profile.maxP99MissionMs)) {
            issues.push(`p99_mission_above_slo_${profile.maxP99MissionMs}`);
        }

        if (!(Number.isFinite(p50) && Number.isFinite(p95) && Number.isFinite(p99) && p50 <= p95 && p95 <= p99)) {
            issues.push('latency_percentiles_invalid');
        }

        if (!Number.isFinite(approvals) || !Number.isFinite(blocked) || approvals + blocked > loadCommands) {
            issues.push('governance_counters_invalid');
        }

        for (const label of requiredChecklistLabels) {
            const item = report.validationChecklist.find((entry) => entry.label === label);
            if (!item || item.status !== 'verified') {
                issues.push(`checklist_not_verified:${label}`);
            }
        }
    }

    return {
        label: profile.label,
        passed: issues.length === 0,
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs,
        config: {
            virtualOperators: profile.virtualOperators,
            commandsPerRun: profile.commandsPerRun,
            telemetryActivityCount: profile.telemetryActivityCount,
            repetitions: profile.repetitions,
        },
        thresholds: {
            maxP95MissionMs: profile.maxP95MissionMs,
            maxP99MissionMs: profile.maxP99MissionMs,
            minThroughputCommandsPerSecond: profile.minThroughputCommandsPerSecond,
        },
        observed: report ? {
            faceplaneCount: report.scenario.faceplaneCount,
            scenarioCommands: report.scenario.totals.commands,
            loadCommands: report.load.totalCommands,
            totalApprovals: report.load.totalApprovals,
            totalBlocked: report.load.totalBlocked,
            throughputCommandsPerSecond: report.load.throughputCommandsPerSecond,
            latency: report.load.latency,
            validationChecklist: report.validationChecklist,
            reportArtifact: artifacts.jsonPath || null,
            markdownArtifact: artifacts.markdownPath || null,
        } : null,
        issues,
    };
}

function buildGateReport(results) {
    const pass = results.every((result) => result.passed);
    return {
        gateId,
        gateName,
        objective: 'Verify synthetic department-scale load remains within approved SLO ranges while governance and evidence invariants remain intact.',
        method: 'Run the faceplane department scenario across 10, 100, and 1000 virtual-operator profiles and validate latency, throughput, checklist, and governance counters.',
        expectedResult: {
            profiles: profiles.map((profile) => ({
                label: profile.label,
                virtualOperators: profile.virtualOperators,
                maxP95MissionMs: profile.maxP95MissionMs,
                maxP99MissionMs: profile.maxP99MissionMs,
                minThroughputCommandsPerSecond: profile.minThroughputCommandsPerSecond,
            })),
            governanceInvariants: [
                'faceplaneCount remains 10',
                'scenarioCommands equals 10 x commandsPerRun',
                'loadCommands equals virtualOperators x commandsPerRun',
                'approvals + blocked does not exceed loadCommands',
                'required checklist items remain verified',
            ],
        },
        observedResult: results,
        evidence: {
            scenarioScript: 'scripts/run-faceplane-department-scenario.js',
            profileCount: results.length,
        },
        pass,
        reviewer,
        timestamp: new Date().toISOString(),
        notes: [
            'PER-001 is synthetic and single-process; it does not substitute for hosted or distributed production performance validation.',
        ],
    };
}

async function writeReportIfRequested(report) {
    if (!reportPath) {
        return;
    }

    const targetPath = path.isAbsolute(reportPath)
        ? reportPath
        : path.join(repoRoot, reportPath);

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Report written: ${targetPath}`);
}

async function main() {
    console.log('PER-001 Performance SLO Check');
    const results = profiles.map((profile) => runScenarioProfile(profile));

    for (const result of results) {
        console.log(`${result.label}: ${result.passed ? 'passed' : 'failed'} (${result.durationMs} ms)`);
        if (result.observed) {
            console.log(`  throughput=${result.observed.throughputCommandsPerSecond} p95=${result.observed.latency.p95MissionMs} p99=${result.observed.latency.p99MissionMs}`);
        }
        if (result.issues.length > 0) {
            console.log(`  issues=${result.issues.join(',')}`);
        }
    }

    const report = buildGateReport(results);
    await writeReportIfRequested(report);

    if (!report.pass) {
        console.error('PER-001 FAILED');
        process.exit(1);
    }

    console.log('PER-001 PASSED');
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`PER-001 failed: ${message}`);
    process.exit(1);
});
