const { runFaceplane, runAll, listFaceplanes } = require('../faceplanes/mock');

function normalizeFaceplanes(value) {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.map((item) => String(item || '').trim()).filter(Boolean);
    }

    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeConfig(payload = {}) {
    return {
        commandsPerRun: Number.isFinite(Number(payload.commandsPerRun)) ? Number(payload.commandsPerRun) : Number.isFinite(Number(payload.commands)) ? Number(payload.commands) : 5,
        approvalRate: Number.isFinite(Number(payload.approvalRate)) ? Number(payload.approvalRate) : 0.3,
        blockRate: Number.isFinite(Number(payload.blockRate)) ? Number(payload.blockRate) : 0.1,
        telemetryState: typeof payload.telemetryState === 'string' ? payload.telemetryState : 'LIMITED',
        telemetryActivityCount: Number.isFinite(Number(payload.telemetryActivityCount)) ? Number(payload.telemetryActivityCount) : 4,
        driftScenario: typeof payload.scenario === 'string' ? payload.scenario : typeof payload.driftScenario === 'string' ? payload.driftScenario : null
    };
}

async function handleMockFaceplaneRun(payload = {}) {
    const config = normalizeConfig(payload);
    const faceplanes = normalizeFaceplanes(payload.faceplanes);
    const faceplane = typeof payload.faceplane === 'string' ? payload.faceplane.trim() : null;

    if (!faceplanes.length && !faceplane) {
        return {
            success: true,
            statusCode: 200,
            data: {
                run: runAll(config),
                note: 'Defaulting to all configured mock faceplanes.'
            }
        };
    }

    if (faceplanes.length > 1) {
        return {
            success: true,
            statusCode: 200,
            data: {
                run: runAll({ ...config, faceplanes })
            }
        };
    }

    return {
        success: true,
        statusCode: 200,
        data: {
            run: runFaceplane(faceplane || faceplanes[0], config)
        }
    };
}

async function handleMockFaceplaneList() {
    return {
        success: true,
        statusCode: 200,
        data: {
            faceplanes: listFaceplanes()
        }
    };
}

const mockHandlers = {
    'faceplane.mock.run': handleMockFaceplaneRun,
    'faceplane.mock.list': handleMockFaceplaneList
};

module.exports = {
    mockHandlers
};
