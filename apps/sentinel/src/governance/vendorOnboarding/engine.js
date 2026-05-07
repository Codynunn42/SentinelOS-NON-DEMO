const {
  RULE_SET_VERSION,
  SEVERITY_WEIGHT,
  rules
} = require('./rules');
const { NVOP_FORMULA, NVOP_THRESHOLDS } = require('./nvopConfig');

function round(value, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function deriveDomainTier(input = {}, failedRules = []) {
  if (failedRules.some((rule) => rule.rule_id === 'R-011')) {
    return 3;
  }

  if (input.highSensitivityAccess === true || failedRules.some((rule) => rule.severity === 'High')) {
    return 2;
  }

  return 1;
}

function impactIndex(failedRules = [], impactModifierTotal = 0) {
  const severityTotal = failedRules.reduce((total, rule) => {
    return total + (SEVERITY_WEIGHT[rule.severity] || 1);
  }, 0);

  return Math.max(1, severityTotal + impactModifierTotal);
}

function verificationScore(input = {}, failedRules = []) {
  if (typeof input.verification_score === 'number') {
    return Math.min(1, Math.max(0, input.verification_score));
  }

  if (typeof input.verificationScore === 'number') {
    return Math.min(1, Math.max(0, input.verificationScore));
  }

  return failedRules.length === 0 ? 0.95 : 0.7;
}

function classifyNvopState(riskIndex) {
  return NVOP_THRESHOLDS.find((threshold) => {
    return riskIndex > threshold.minExclusive && riskIndex <= threshold.maxInclusive;
  }) || NVOP_THRESHOLDS[NVOP_THRESHOLDS.length - 1];
}

function evaluateVendorOnboarding(input = {}) {
  const workflowId = input.workflow_id || input.workflowId || null;
  const passedRules = [];
  const failedRules = [];
  const ambiguityFlags = [];

  for (const rule of rules) {
    const passed = rule.evaluate(input);
    const output = {
      rule_id: rule.id,
      category: rule.category,
      condition: rule.condition,
      severity: rule.severity,
      nvop_impact_modifier: rule.nvopImpactModifier || 0,
      log_trigger: rule.logTrigger
    };

    if (passed) {
      passedRules.push(output);
      continue;
    }

    failedRules.push(output);

    if (rule.category === 'Ambiguity & Escalation Injection') {
      ambiguityFlags.push(output);
    }
  }

  const complianceScore = round(passedRules.length / rules.length);
  const impactModifierTotal = ambiguityFlags.reduce((total, rule) => {
    return total + (rule.nvop_impact_modifier || 0);
  }, 0);
  const derivedDomainTier = deriveDomainTier(input, failedRules);
  const riskInputs = {
    C: complianceScore,
    I: impactIndex(failedRules, impactModifierTotal),
    D: derivedDomainTier,
    V: verificationScore(input, failedRules)
  };
  const riskIndex = round((1 - riskInputs.C) * riskInputs.I * riskInputs.D * (1 - riskInputs.V));
  const nvopState = classifyNvopState(riskIndex);

  return {
    workflow_id: workflowId,
    rule_set_version: RULE_SET_VERSION,
    passed_rules: passedRules,
    failed_rules: failedRules,
    ambiguity_flags: ambiguityFlags,
    compliance_score: complianceScore,
    derived_domain_tier: derivedDomainTier,
    impact_modifier_total: impactModifierTotal,
    nvop: {
      risk_index: riskIndex,
      state: nvopState.state,
      label: nvopState.label,
      formula: NVOP_FORMULA,
      inputs: riskInputs,
      thresholds: NVOP_THRESHOLDS.map(({ state, label, maxInclusive }, index) => ({
        state,
        label,
        range:
          index === 0
            ? `0.0 - ${maxInclusive}`
            : state === 3
              ? '> 3.0'
              : `${NVOP_THRESHOLDS[index].minExclusive} - ${maxInclusive}`
      }))
    }
  };
}

module.exports = {
  NVOP_THRESHOLDS,
  classifyNvopState,
  evaluateVendorOnboarding
};
