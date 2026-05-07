function deriveLatencyClass(evaluation) {
  const state = evaluation && evaluation.nvop ? evaluation.nvop.state : 0;
  const hasDynamicLatencyFlag = Boolean(
    evaluation &&
      Array.isArray(evaluation.ambiguity_flags) &&
      evaluation.ambiguity_flags.some((rule) => rule.rule_id === 'R-023')
  );

  if (state >= 3) {
    return 'halted';
  }

  if (state === 2) {
    return hasDynamicLatencyFlag ? 'human_review_extended' : 'human_review';
  }

  if (state === 1) {
    return hasDynamicLatencyFlag ? 'advisory_delayed' : 'advisory';
  }

  return 'standard';
}

module.exports = {
  deriveLatencyClass
};
