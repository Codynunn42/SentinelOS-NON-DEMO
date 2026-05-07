const driftConfig = Object.freeze({
  configVersion: '1.0.0',
  baselineVersion: 'containmentBaseline_v1',
  ruleSetVersion: 'vendorOnboarding_v1',

  sustainedDeviationWindows: Object.freeze({
    measurementWindowDays: 7,
    consecutiveWindowsForCritical: 3
  }),

  escalationRate: Object.freeze({
    baseline: 0.03,
    infoLower: 0.02,
    infoUpper: 0.04,
    warningLower: 0.015,
    warningUpper: 0.045,
    criticalLower: 0.01,
    criticalUpper: 0.055
  }),

  refusalRate: Object.freeze({
    baseline: 0.006,
    warningUpper: 0.02,
    criticalUpper: 0.03
  }),

  distributionShift: Object.freeze({
    baseline: Object.freeze({
      state0: 0.901,
      state1: 0.069,
      state2: 0.024,
      state3: 0.006
    }),
    warningAbsoluteShift: 0.05,
    criticalAbsoluteShift: 0.08
  }),

  overrideRate: Object.freeze({
    stableUpper: 0.10,
    infoUpper: 0.20,
    warningUpper: 0.30
  }),

  latencyDrift: Object.freeze({
    infoPercent: 0.25,
    warningPercent: 0.50,
    criticalPercent: 0.75
  }),

  thresholdModification: Object.freeze({
    maxChangesPer30Days: 1
  })
});

module.exports = {
  driftConfig
};
