const assert = require('assert');
const crypto = require('crypto');
const {
  bindDispatchResultHash,
  verifyCompletedResult
} = require('../dispatch');
const { signReceipt } = require('../../receipts/signedReceipt');

describe('durable dispatch result verification', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
  });
  const signer = {
    keyId: 'https://receipt-test.vault.azure.net/keys/signing/dispatch-test-version',
    async sign(data) {
      return crypto.sign('sha256', data, {
        key: privateKey,
        dsaEncoding: 'ieee-p1363'
      });
    },
    async getPublicKey(keyId) {
      assert.strictEqual(keyId, 'https://receipt-test.vault.azure.net/keys/signing/dispatch-test-version');
      return publicKey;
    }
  };
  const authority = {
    tenant: 'test-tenant',
    actor: 'test-operator',
    apiKeyId: 'test-key',
    effectiveRole: 'operator',
    effectiveScopes: ['command:write'],
    decision: {
      decisionId: 'test-decision',
      result: 'allow',
      decidedAt: '2026-10-24T12:00:00.000Z'
    }
  };

  it('binds the persisted command result to the signed receipt for replay', async () => {
    const result = {
      success: true,
      statusCode: 200,
      data: {
        result: { status: 'created', id: 'record-1' },
        receipt: {
          receiptId: 'receipt-1',
          tenantId: 'test-tenant',
          command: 'record.create',
          outcome: { status: 'created' },
          timestamp: '2026-10-24T12:00:00.000Z'
        }
      }
    };
    const boundReceipt = bindDispatchResultHash(result.data.receipt, result);
    const signedReceipt = await signReceipt(boundReceipt, authority, signer);
    const storedResult = {
      ...result,
      data: { ...result.data, receipt: signedReceipt }
    };

    const verified = await verifyCompletedResult(storedResult, signer);
    assert.strictEqual(verified.data.receipt.verified, true);
    assert.strictEqual(verified.data.receipt.verification_status, 'verified');

    await assert.rejects(
      verifyCompletedResult({
        ...storedResult,
        data: {
          ...storedResult.data,
          result: { status: 'created', id: 'tampered-record' }
        }
      }, signer),
      /BINDING_MISMATCH/
    );
  });
});
