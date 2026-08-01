const assert = require('assert');
const { auditLogger, verifyAuditChain } = require('../apps/sentinel/src/audit/auditLogger');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { buildGovernanceDecision } = require('../apps/sentinel/src/governance/preflight');
const { verifyDecision } = require('../apps/sentinel/src/security/signing');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

async function main() {
  process.env.SENTINEL_SIGNING_KEY = 'execution-integrity-signing-key';
  resetLocalPassportState();

  const policyContext = {
    tenant: 'ownerfi',
    command: 'application.submit',
    actor: 'integrity-check@example.com',
    role: 'approver',
    requiredScope: 'application:submit'
  };
  const policy = {
    allowed: true,
    state: 'clean',
    riskLevel: 'low',
    decision: 'allow',
    approvalRequired: false,
    receiptRequired: true
  };
  const signedDecision = buildGovernanceDecision(policy, policyContext);

  assert.strictEqual(verifyDecision(signedDecision, process.env.SENTINEL_SIGNING_KEY), true);
  assert.strictEqual(
    verifyDecision({ ...signedDecision, decision: 'allow_tampered' }, process.env.SENTINEL_SIGNING_KEY),
    false
  );

  const result = await dispatchCommand(signLocalCommand({
    tenant: 'ownerfi',
    command: 'application.submit',
    source: 'sentinel',
    payload: {
      name: 'Execution Integrity Check',
      vehicle: '2022 Toyota Camry',
      amount: 19000,
      creditScore: 710
    },
    metadata: {
      source: 'sentinel',
      actor: 'integrity-check@example.com',
      role: 'approver',
      scopes: ['application:submit']
    }
  }), {
    buildReceipt: (command, entity, outcome, tenantId = 'ownerfi') => ({
      receiptId: 'rcpt_execution_integrity_check',
      auditId: 'audit_execution_integrity_check',
      command,
      tenantId,
      status: 'executed',
      verified: true,
      entity,
      outcome,
      timestamp: new Date().toISOString()
    }),
    emitSecurityEvent: () => {},
    principal: {
      tenant: 'ownerfi',
      actor: 'integrity-check@example.com',
      role: 'approver',
      scopes: ['application:submit']
    },
    source: 'sentinel'
  });

  assert.strictEqual(result.success, true);

  const entries = auditLogger.getAll();
  const policyEntry = entries.find((entry) => entry.command === 'policy.preflight');
  assert(policyEntry, 'policy.preflight audit entry required');
  assert.strictEqual(policyEntry.signatureVersion, 'hmac-sha256:v1');
  assert.strictEqual(policyEntry.result.signatureVersion, 'hmac-sha256:v1');
  assert(policyEntry.result.signature, 'signed policy decision required');

  const chain = auditLogger.verifyChain();
  assert.strictEqual(chain.valid, true);
  assert(chain.checked >= 2);

  const tampered = entries.map((entry) => ({ ...entry }));
  tampered[0] = {
    ...tampered[0],
    result: {
      ...(tampered[0].result || {}),
      success: !tampered[0].result.success
    }
  };
  const tamperedChain = verifyAuditChain(tampered);
  assert.strictEqual(tamperedChain.valid, false);
  assert.strictEqual(tamperedChain.reason, 'audit_hash_mismatch');

  console.log('Execution integrity check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
