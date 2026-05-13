const { runFaceplane, runAll, RUNNERS } = require('./mockFaceplaneRunner');
const { getScenario, getAllScenarios, DRIFT_SCENARIOS, SCENARIO_DEFINITIONS } = require('./mockDriftScenarios');

function listFaceplanes() {
    return Object.keys(RUNNERS);
}

function getFaceplaneRunner(faceplane) {
    return RUNNERS[faceplane] || null;
}

module.exports = {
    runFaceplane,
    runAll,
    listFaceplanes,
    getFaceplaneRunner,
    getScenario,
    getAllScenarios,
    DRIFT_SCENARIOS,
    SCENARIO_DEFINITIONS
};
