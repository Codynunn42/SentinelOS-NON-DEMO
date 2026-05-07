const { evaluateContainmentDrift } = require('../apps/sentinel/src/governance/vendorOnboarding/driftMonitor');

const metricsPath = process.argv[2] || '/private/tmp/sentinel_vendor_onboarding_simulation_metrics.json';
const summary = evaluateContainmentDrift(metricsPath);

console.log(JSON.stringify({
  metrics_path: metricsPath,
  posture: summary.posture,
  case_count: summary.caseCount,
  summary: summary.summary,
  breached: summary.breached,
  histogram_shape: summary.histogram.shape,
  boundary_trigger_frequency: summary.boundaryTriggerFrequency
}, null, 2));
