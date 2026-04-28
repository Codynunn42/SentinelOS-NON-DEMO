// Sentinel CDNLUX Integration
// Purpose: Model CDNLUX utility-token and contract signals as governed Sentinel events.

const CDNLUX_EVENT_TYPES = new Set([
  'cdnlux.token.intent',
  'cdnlux.token.transfer_requested',
  'cdnlux.contract.deploy_requested',
  'cdnlux.contract.action_requested',
  'cdnlux.wallet.active_changed'
]);

const RISK_BY_ACTION = {
  observe: 'low',
  quote: 'low',
  balance_check: 'low',
  activate_wallet: 'medium',
  transfer: 'high',
  deploy_contract: 'high',
  update_contract_authority: 'high'
};

function normalizeAddress(address) {
  if (typeof address !== 'string') return null;
  const value = address.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(value) ? value : null;
}

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function getActionRisk(action) {
  return RISK_BY_ACTION[action] || 'medium';
}

function buildCdnluxEvent(input = {}) {
  const eventType = CDNLUX_EVENT_TYPES.has(input.type)
    ? input.type
    : 'cdnlux.token.intent';
  const action = input.action || 'observe';
  const riskLevel = input.riskLevel || getActionRisk(action);
  const amount = normalizeAmount(input.amount);
  const contractAddress = normalizeAddress(input.contractAddress);
  const walletAddress = normalizeAddress(input.walletAddress);

  return {
    type: eventType,
    source: 'cdnlux',
    tenant: input.tenant || 'nunncloud',
    utilityToken: {
      symbol: input.symbol || 'CDNLUX',
      network: input.network || 'base-sepolia',
      contractAddress
    },
    action,
    riskLevel,
    amount,
    walletAddress,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    requestedBy: input.requestedBy || 'sentinel',
    createdAt: input.createdAt || new Date().toISOString()
  };
}

function buildTrustContext(event = {}) {
  const highRisk = event.riskLevel === 'high';
  const unknownActor = !event.requestedBy || event.requestedBy === 'unknown';
  const writeAction = ['transfer', 'deploy_contract', 'update_contract_authority'].includes(event.action);

  return {
    identityRisk: highRisk ? 'medium' : 'low',
    appConsentRisk: 'low',
    unknownActor,
    knownActor: !unknownActor,
    drift: Boolean(highRisk && writeAction),
    stableHistory: !highRisk,
    failedOrBlockedEvents: false,
    securityEvents: highRisk ? 1 : 0,
    cdnlux: {
      action: event.action,
      riskLevel: event.riskLevel,
      network: event.utilityToken && event.utilityToken.network,
      symbol: event.utilityToken && event.utilityToken.symbol
    }
  };
}

function buildSentinelSecurityEvent(input = {}) {
  const event = buildCdnluxEvent(input);
  const trustContext = buildTrustContext(event);

  return {
    type: event.type,
    eventType: event.type,
    source: event.source,
    tenant: event.tenant,
    riskLevel: event.riskLevel,
    reason: `CDNLUX ${event.action} request requires Sentinel governance.`,
    evidence: [
      `utilityToken=${event.utilityToken.symbol}`,
      `network=${event.utilityToken.network}`,
      `action=${event.action}`,
      ...event.evidence
    ],
    trustContext,
    payload: event
  };
}

function requiresApproval(event = {}) {
  return event.riskLevel === 'high' || ['transfer', 'deploy_contract', 'update_contract_authority'].includes(event.action);
}

module.exports = {
  buildCdnluxEvent,
  buildSentinelSecurityEvent,
  buildTrustContext,
  getActionRisk,
  requiresApproval
};
