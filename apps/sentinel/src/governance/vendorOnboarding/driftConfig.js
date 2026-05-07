const { driftConfig } = require('../core/driftConfig');
const baseline = require('../core/containmentBaseline_v1.json');

module.exports = {
  DRIFT_BASELINE: {
    baselineVersion: baseline.baselineVersion,
    ruleSetVersion: 'vendor-onboarding-v1.0',
    escalationRate: baseline.escalationRate,
    refusalRate: baseline.refusalRate,
    advisoryRate: baseline.advisoryRate,
    stateDistribution: {
      0: baseline.distribution.state0,
      1: baseline.distribution.state1,
      2: baseline.distribution.state2,
      3: baseline.distribution.state3
    },
    queuePeak: baseline.latencyProfile.queuePeakPer1000,
    averageLatencySecondsByState: {
      0: baseline.latencyProfile.averageReviewSecondsByState.state0,
      1: baseline.latencyProfile.averageReviewSecondsByState.state1,
      2: baseline.latencyProfile.averageReviewSecondsByState.state2,
      3: baseline.latencyProfile.averageReviewSecondsByState.state3
    },
    ledgerIntegrityPercent: 100
  },
  DRIFT_CONFIG_VERSION: `vendor-onboarding-drift-v${driftConfig.configVersion}`,
  DRIFT_TOLERANCE: {
    escalationRate: {
      infoLow: driftConfig.escalationRate.warningLower,
      normalLow: driftConfig.escalationRate.infoLower,
      normalHigh: driftConfig.escalationRate.infoUpper,
      infoHigh: driftConfig.escalationRate.warningUpper,
      warningLow: driftConfig.escalationRate.criticalLower,
      warningHigh: driftConfig.escalationRate.criticalUpper
    },
    refusalRate: {
      stableHigh: driftConfig.refusalRate.warningUpper,
      warningHigh: driftConfig.refusalRate.criticalUpper
    },
    distributionShift: {
      warningAbsoluteDelta: driftConfig.distributionShift.warningAbsoluteShift,
      criticalAbsoluteDelta: driftConfig.distributionShift.criticalAbsoluteShift
    },
    operatorOverrideRate: {
      stableHigh: driftConfig.overrideRate.stableUpper,
      infoHigh: driftConfig.overrideRate.infoUpper,
      warningHigh: driftConfig.overrideRate.warningUpper
    },
    latencyDrift: {
      infoRelativeDelta: driftConfig.latencyDrift.infoPercent,
      warningRelativeDelta: driftConfig.latencyDrift.warningPercent,
      criticalRelativeDelta: driftConfig.latencyDrift.criticalPercent
    },
    thresholdModification: {
      repeatedWindowDays: 30
    },
    sustainedDeviationWindows: driftConfig.sustainedDeviationWindows.consecutiveWindowsForCritical
  }
};
