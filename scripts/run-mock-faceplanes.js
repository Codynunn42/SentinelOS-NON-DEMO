const { runAll, runFaceplane, listFaceplanes, getAllScenarios } = require('../apps/sentinel/src/faceplanes/mock');

function parseArgs(argv) {
    const parsed = {};

    argv.forEach((arg) => {
        if (!arg.startsWith('--')) return;
        const [key, rawValue] = arg.slice(2).split('=');
        parsed[key] = rawValue === undefined ? true : rawValue;
    });

    return parsed;
}

function normalizeNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function buildConfig(options) {
    return {
        commandsPerRun: normalizeNumber(options.commandsPerRun || options.commands || options.count, 5),
        approvalRate: normalizeNumber(options.approvalRate || options.approvalRateOverride, 0.3),
        blockRate: normalizeNumber(options.blockRate || options.blockRateOverride, 0.1),
        telemetryState: options.telemetryState || 'LIMITED',
        telemetryActivityCount: normalizeNumber(options.telemetryActivityCount || options.activityCount, 4),
        driftScenario: options.scenario || options.driftScenario || null
    };
}

function buildFaceplaneList(value) {
    if (!value) return listFaceplanes();
    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function printUsage() {
    console.log('Usage: node scripts/run-mock-faceplanes.js [options]');
    console.log('Options:');
    console.log('  --faceplanes=ownerfi,hotelops,itad   Run only specified mock faceplanes');
    console.log('  --faceplane=ownerfi                  Run a single mock faceplane');
    console.log('  --commandsPerRun=6                   Synthetic commands per faceplane run');
    console.log('  --approvalRate=0.4                   Mock approval trigger probability');
    console.log('  --blockRate=0.15                     Mock policy block probability');
    console.log('  --telemetryState=LIMITED            Telemetry mode for the run');
    console.log('  --telemetryActivityCount=8          Telemetry activity count per faceplane');
    console.log('  --scenario=BLOCKED_PATH_SPIKE       Drift scenario to inject');
    console.log('  --list-faceplanes                    Print available mock faceplanes');
    console.log('  --list-scenarios                     Print available drift scenarios');
    console.log('  --help                               Show this help message');
}

function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.help || options.h) {
        printUsage();
        return;
    }

    if (options['list-faceplanes']) {
        console.log('Available mock faceplanes:');
        listFaceplanes().forEach((faceplane) => console.log(`  - ${faceplane}`));
        return;
    }

    if (options['list-scenarios']) {
        console.log('Available mock drift scenarios:');
        getAllScenarios().forEach((scenario) => {
            console.log(`  - ${scenario.key}: ${scenario.description}`);
        });
        return;
    }

    const config = buildConfig(options);
    const faceplane = options.faceplane || null;
    const faceplanes = faceplane ? [faceplane] : buildFaceplaneList(options.faceplanes);

    const result = faceplane
        ? runFaceplane(faceplane, config)
        : runAll({ ...config, faceplanes });

    console.log(JSON.stringify(result, null, 2));
}

main();
