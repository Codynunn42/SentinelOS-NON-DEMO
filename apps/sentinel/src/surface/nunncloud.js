const {
  buildCdnluxEvent,
  buildSentinelSecurityEvent,
  requiresApproval
} = require('../integrations/cdnlux/cdnlux');
const {
  buildSentinelDockingEvent,
  evaluateDocking
} = require('../integrations/docking/protocol');
const { handleDealFlowDemo } = require('../commands/dealFlow/runDemo');
const { handleRepoUpdate } = require('../commands/repo/updateStructure');
const { handleProductReframe } = require('../commands/system/productReframe');
const { handleSystemValidate } = require('../commands/system/validateIntegrity');
const { handleUiSync } = require('../commands/ui/syncLabels');

async function evaluateCdnluxToken(payload = {}) {
  const cdnluxEvent = buildCdnluxEvent(payload);
  const securityEvent = buildSentinelSecurityEvent(cdnluxEvent);

  return {
    success: true,
    data: {
      integration: 'cdnlux',
      event: cdnluxEvent,
      securityEvent,
      approvalRequired: requiresApproval(cdnluxEvent),
      executionMode: requiresApproval(cdnluxEvent) ? 'approval_required' : 'read_only'
    }
  };
}

const nunncloudHandlers = {
  'system.reframe.product': handleProductReframe,
  'repo.update.structure': handleRepoUpdate,
  'system.validate.integrity': handleSystemValidate,
  'dealFlow.run.demo': handleDealFlowDemo,
  'ui.sync.labels': handleUiSync,

  'cdnlux.token.evaluate': evaluateCdnluxToken,
  'cdnlux.contract.evaluate': evaluateCdnluxToken,
  'docking.evaluate': async (payload = {}) => {
    const docking = evaluateDocking(payload);

    return {
      success: true,
      data: {
        integration: 'docking',
        docking,
        securityEvent: buildSentinelDockingEvent(payload),
        approvalRequired: docking.approvalRequired,
        executionMode: docking.executionMode
      }
    };
  }
};

module.exports = {
  nunncloudHandlers
};
