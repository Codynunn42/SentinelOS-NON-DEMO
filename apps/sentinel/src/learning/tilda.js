const { evaluateForethought } = require('../forethought/tilda');
const { evaluateAnalysis } = require('../analysis/analysis');
const { routeSintinexIntake } = require('../sintinex/intake');

function shapeForethought(analysis, options = {}) {
  return evaluateAnalysis(analysis, options);
}

module.exports = {
  evaluateAnalysis,
  evaluateForethought,
  routeSintinexIntake,
  shapeForethought
};
