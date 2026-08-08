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
const {
  handleRepoWorkflowDiagnose,
  handleRepoWorkflowRetry
} = require('../commands/repo/control');
const { handleRepoRead } = require('../commands/repo/read');
const { handleRepoUpdate } = require('../commands/repo/updateStructure');
const { handleProductReframe } = require('../commands/system/productReframe');
const { handleSystemValidate } = require('../commands/system/validateIntegrity');
const { handleUiSync } = require('../commands/ui/syncLabels');
const { handleVaultRetrieveFixture } = require('../commands/retrieval/vaultRetrieveFixture');

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
  'repo.read': handleRepoRead,
  'repo.update.structure': handleRepoUpdate,
  'repo.control.workflow.diagnose': handleRepoWorkflowDiagnose,
  'repo.control.workflow.retry': handleRepoWorkflowRetry,
  'system.validate.integrity': handleSystemValidate,
  'dealFlow.run.demo': handleDealFlowDemo,
  'ui.sync.labels': handleUiSync,
  'vault.retrieve': handleVaultRetrieveFixture,

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
