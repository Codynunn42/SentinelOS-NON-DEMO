const { evaluateForethought } = require('../forethought/interpretation');
const { evaluateAnalysis } = require('../analysis/analysis');
const { routeArchiveIntelligenceIntake } = require('../archiveIntelligence/intakeRouter');

function shapeForethought(analysis, options = {}) {
  return evaluateAnalysis(analysis, options);
}

module.exports = {
  evaluateAnalysis,
  evaluateForethought,
  routeArchiveIntelligenceIntake,
  shapeForethought
};
