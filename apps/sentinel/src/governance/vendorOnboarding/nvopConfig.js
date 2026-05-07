const RULE_SET_VERSION = 'vendor-onboarding-v1.0';

const NVOP_FORMULA = 'Risk Index = (1 - C) * I * D * (1 - V)';

const NVOP_THRESHOLDS = Object.freeze([
  Object.freeze({ state: 0, label: 'Pass', minExclusive: -Infinity, maxInclusive: 0.5 }),
  Object.freeze({ state: 1, label: 'Advisory', minExclusive: 0.5, maxInclusive: 1.3 }),
  Object.freeze({ state: 2, label: 'Escalation', minExclusive: 1.3, maxInclusive: 3.0 }),
  Object.freeze({ state: 3, label: 'Refusal', minExclusive: 3.0, maxInclusive: Infinity })
]);

module.exports = {
  NVOP_FORMULA,
  NVOP_THRESHOLDS,
  RULE_SET_VERSION
};
