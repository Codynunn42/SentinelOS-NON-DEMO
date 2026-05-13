// Mock Approval Generator
// Purpose: Generate realistic approval scenarios for synthetic pressure testing.
// Simulates bottlenecks, overrides, and escalation patterns.

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const APPROVAL_SCENARIOS = [
  {
    type: 'standard_approval',
    decision: 'review',
    riskLevel: 'medium',
    reason: 'Standard governed execution requires operator approval',
    approvalType: 'task_template_approval',
    expectedOutcome: 'approved'
  },
  {
    type: 'high_risk_block',
    decision: 'block',
    riskLevel: 'high',
    reason: 'High-risk operation detected — human review required before execution',
    approvalType: 'security_approval',
    expectedOutcome: 'pending'
  },
  {
    type: 'compliance_gate',
    decision: 'review',
    riskLevel: 'high',
    reason: 'Compliance framework requires dual approval before asset disposition',
    approvalType: 'compliance_approval',
    expectedOutcome: 'pending'
  },
  {
    type: 'billing_gate',
    decision: 'review',
    riskLevel: 'high',
    reason: 'Billing execution requires configuration approval',
    approvalType: 'billing_checkout_approval',
    expectedOutcome: 'pending'
  },
  {
    type: 'override_request',
    decision: 'review',
    riskLevel: 'medium',
    reason: 'Operator override request requires supervisor approval',
    approvalType: 'operator_override_approval',
    expectedOutcome: 'approved'
  }
];

function buildApprovalScenario(faceplane, options = {}) {
  const scenario = options.forceType
    ? APPROVAL_SCENARIOS.find((s) => s.type === options.forceType) || pick(APPROVAL_SCENARIOS)
    : pick(APPROVAL_SCENARIOS);

  return {
    decision: scenario.decision,
    executionMode: 'approval_required',
    approvalRequired: true,
    riskLevel: scenario.riskLevel,
    reason: scenario.reason,
    context: {
      tenant: `${faceplane}-mock`,
      approvalType: scenario.approvalType,
      mockScenario: scenario.type,
      expectedOutcome: scenario.expectedOutcome,
      source: 'mock_faceplane'
    }
  };
}

function shouldTriggerApproval(approvalRate = 0.3) {
  return Math.random() < approvalRate;
}

function shouldBlock(blockRate = 0.1) {
  return Math.random() < blockRate;
}

module.exports = {
  APPROVAL_SCENARIOS,
  buildApprovalScenario,
  shouldBlock,
  shouldTriggerApproval
};
