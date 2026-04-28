const { evaluateForethought } = require('../forethought/tilda');
const { evaluateAnalysis } = require('../analysis/analysis');

function shapeForethought(analysis, options = {}) {
  return evaluateAnalysis(analysis, options);
}

module.exports = {
  evaluateAnalysis,
  evaluateForethought,
  shapeForethought
};
