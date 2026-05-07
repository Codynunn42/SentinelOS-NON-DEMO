const DEFAULT_STEPS = [
  'deal.submit',
  'deal.execute_attempt',
  'deal.blocked',
  'deal.show_decision_score',
  'deal.trigger_risk_alert',
  'deal.approve',
  'deal.execute',
  'deal.show_activity_feed'
];

function normalizeSteps(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_STEPS;
  }

  return value
    .map((step) => (typeof step === 'string' ? step.trim() : ''))
    .filter(Boolean);
}

async function handleDealFlowDemo(payload = {}) {
  const steps = normalizeSteps(payload.steps);
  const decisionScore = Number.isFinite(Number(payload.decisionScore))
    ? Number(payload.decisionScore)
    : 42;

  const flow = steps.map((step) => {
    switch (step) {
      case 'deal.submit':
        return { step, status: 'submitted', label: 'Deal Submitted' };

      case 'deal.execute_attempt':
        return { step, status: 'attempted', label: 'Execution Attempted' };

      case 'deal.blocked':
        return {
          step,
          status: 'blocked',
          label: 'Deal Blocked',
          reason: 'approval_required'
        };

      case 'deal.show_decision_score':
        return {
          step,
          status: 'shown',
          label: 'Decision Score',
          decisionScore
        };

      case 'deal.trigger_risk_alert':
        return {
          step,
          status: 'signaled',
          label: 'Risk Alert',
          alert: 'Risk Alert: approval required before deal execution'
        };

      case 'deal.approve':
        return { step, status: 'approved', label: 'Approval Captured' };

      case 'deal.execute':
        return { step, status: 'executed', label: 'Deal Executed' };

      case 'deal.show_activity_feed':
        return {
          step,
          status: 'shown',
          label: 'Activity Feed',
          activity: 'Deal decision and execution were recorded'
        };

      default:
        return { step, status: 'skipped', reason: 'unknown_demo_step' };
    }
  });

  return {
    success: true,
    statusCode: 200,
    data: {
      result: {
        status: 'success',
        product: 'SentinelOS Deal Execution Engine',
        flow
      },
      flow
    }
  };
}

module.exports = {
  handleDealFlowDemo
};
