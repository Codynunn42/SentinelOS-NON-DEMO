const { analyzeApprovalBottleneck } = require('../../approval/bottleneckAnalysis');
const { getPendingApprovals } = require('../../approval/approval');

async function handleApprovalBottleneckAnalyze(payload = {}, context = {}) {
  const tenant =
    payload.tenant ||
    context.tenant ||
    (context.principal && context.principal.tenant) ||
    null;
  const approvals = Array.isArray(payload.approvals)
    ? payload.approvals
    : await getPendingApprovals(tenant);
  const result = analyzeApprovalBottleneck({
    approvals,
    now: payload.now,
    staleAfterMinutes: payload.staleAfterMinutes
  });

  return {
    success: true,
    statusCode: 200,
    data: {
      result: {
        ...result,
        tenant: tenant || 'all',
        command: 'approval.bottleneck.analyze'
      }
    }
  };
}

module.exports = {
  handleApprovalBottleneckAnalyze
};
