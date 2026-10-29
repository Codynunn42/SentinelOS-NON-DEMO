const assert = require('assert');
const crypto = require('crypto');
const {
  markUnsignedLegacy,
  signReceipt,
  verifySignedReceipt
} = require('../signedReceipt');
const {
  createAzureKeyVaultReceiptSigner,
  parseVersionedKeyId
} = require('../azureKeyVaultSigner');

describe('versioned signed receipts', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
  });
  const signer = {
    keyId: 'https://receipt-test.vault.azure.net/keys/signing/ephemeral-test-version',
    async sign(data) {
      return crypto.sign('sha256', data, {
        key: privateKey,
        dsaEncoding: 'ieee-p1363'
      });
    }
  };
  const baseReceipt = {
    receiptId: 'rcpt-test-001',
    auditId: 'audit-test-001',
    tenantId: 'support',
    command: 'support.ticket.create',
    status: 'executed',
    entity: { type: 'support_ticket', id: 'ticket-test-001' },
    outcome: { status: 'created' },
    timestamp: '2026-10-24T12:00:00.000Z'
  };
  const authority = {
    tenant: 'support',
    actor: 'synthetic-operator',
    apiKeyId: 'key-test-001',
    effectiveRole: 'operator',
    effectiveScopes: ['receipt:read', 'support:write'],
    decision: {
      decisionId: 'decision-test-001',
      result: 'allow',
      state: 'restricted',
      riskLevel: 'low',
      requiredScope: 'support:write',
      approvalId: null,
      policyVersion: 'policy-test-v1',
      decidedAt: '2026-10-24T12:00:00.000Z'
    }
  };

  async function sign(overrides = {}) {
    return signReceipt({ ...baseReceipt, ...overrides }, authority, signer);
  }

  it('signs and verifies the immutable receipt and server-derived authority', async () => {
    const receipt = await sign();
    assert.strictEqual(receipt.schemaVersion, 'sentinel-receipt/v1');
    assert.strictEqual(receipt.verification_status, 'verified');
    assert.strictEqual(receipt.signature.keyId, signer.keyId);
    assert.deepStrictEqual(receipt.authority.effectiveScopes, ['receipt:read', 'support:write']);
    assert.deepStrictEqual(
      await verifySignedReceipt(receipt, async (keyId) => {
        assert.strictEqual(keyId, signer.keyId);
        return publicKey;
      }),
      { ok: true, status: 'verified', verified: true }
    );
    assert.strictEqual(
      (await verifySignedReceipt({ ...receipt, verification_status: 'signature_mismatch', verified: false }, async () => publicKey)).ok,
      true
    );
  });

  it('rejects tampering with receipt and authority fields', async () => {
    const receipt = await sign();
    const mutations = [
      { receiptId: 'rcpt-tampered' },
      { tenantId: 'other-tenant' },
      { command: 'deal.execute' },
      { entity: { type: 'support_ticket', id: 'other' } },
      { outcome: { status: 'approved' } },
      { timestamp: '2026-10-25T12:00:00.000Z' },
      { authority: { ...receipt.authority, actor: 'attacker' } },
      { authority: { ...receipt.authority, apiKeyId: 'other-key' } },
      { authority: { ...receipt.authority, effectiveRole: 'admin' } },
      { authority: { ...receipt.authority, effectiveScopes: ['platform:admin'] } },
      {
        authority: {
          ...receipt.authority,
          decision: { ...receipt.authority.decision, result: 'deny' }
        }
      }
    ];

    for (const mutation of mutations) {
      const tampered = { ...receipt, ...mutation };
      const verification = await verifySignedReceipt(tampered, async () => publicKey);
      assert.strictEqual(verification.ok, false, JSON.stringify(mutation));
    }
  });

  it('fails closed for malformed signatures, unknown versions and unavailable keys', async () => {
    const receipt = await sign();
    assert.strictEqual(
      (await verifySignedReceipt({ ...receipt, signature: { ...receipt.signature, value: 'bad' } }, async () => publicKey)).ok,
      false
    );
    assert.strictEqual(
      (await verifySignedReceipt({ ...receipt, schemaVersion: 'sentinel-receipt/v2' }, async () => publicKey)).status,
      'unsupported_version'
    );
    assert.strictEqual(
      (await verifySignedReceipt(receipt, async () => { throw new Error('key unavailable'); })).status,
      'verification_key_unavailable'
    );
    assert.throws(
      () => parseVersionedKeyId('https://receipt-test.vault.azure.net/keys/signing'),
      /VERSIONED/
    );
    assert.throws(
      () => parseVersionedKeyId('https://user:secret@receipt-test.vault.azure.net/keys/signing/version-1'),
      /VERSIONED/
    );
  });

  it('loads exact retained key versions for receipt verification', async () => {
    const oldKey = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const currentKey = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const versions = new Map([
      ['version-1', oldKey.publicKey.export({ format: 'jwk' })],
      ['version-2', currentKey.publicKey.export({ format: 'jwk' })]
    ]);
    const signer = createAzureKeyVaultReceiptSigner({
      keyId: 'https://receipt-test.vault.azure.net/keys/signing/version-2',
      credential: {},
      keyClient: {
        async getKey(name, options) {
          return {
            id: `https://receipt-test.vault.azure.net/keys/${name}/${options.version}`,
            key: versions.get(options.version)
          };
        }
      },
      cryptoClient: {}
    });

    const oldPublicKey = await signer.getPublicKey(
      'https://receipt-test.vault.azure.net/keys/signing/version-1'
    );
    const data = Buffer.from('retained receipt verification key');
    const signature = crypto.sign('sha256', data, {
      key: oldKey.privateKey,
      dsaEncoding: 'ieee-p1363'
    });
    assert.strictEqual(
      crypto.verify('sha256', data, { key: oldPublicKey, dsaEncoding: 'ieee-p1363' }, signature),
      true
    );
    await assert.rejects(
      signer.getPublicKey('https://receipt-test.vault.azure.net/keys/other/version-1'),
      /OUT_OF_SCOPE/
    );
  });

  it('labels legacy records unsigned without signing or mutating their source', () => {
    const legacy = { ...baseReceipt, verified: true };
    const labeled = markUnsignedLegacy(legacy);
    assert.strictEqual(labeled.verification_status, 'unsigned_legacy');
    assert.strictEqual(labeled.verified, false);
    assert.strictEqual(legacy.verified, true);
    assert.strictEqual(Object.hasOwn(labeled, 'signature'), false);
  });

  it('rejects incomplete authority and duplicate scopes before signing', async () => {
    await assert.rejects(
      signReceipt(baseReceipt, { ...authority, effectiveScopes: ['support:write', 'support:write'] }, signer),
      /DUPLICATE/
    );
    await assert.rejects(
      signReceipt(baseReceipt, { ...authority, decision: { ...authority.decision, result: 'deny' } }, signer),
      /AUTHORITY_INVALID/
    );
  });
});
