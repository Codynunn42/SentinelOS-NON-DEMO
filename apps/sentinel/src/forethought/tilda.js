const { evaluateAnalysis } = require('../analysis/analysis');

function evaluateForethought(input, options = {}) {
  return evaluateAnalysis(input, options);
}

module.exports = {
  evaluateForethought
};
