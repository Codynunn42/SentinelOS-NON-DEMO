const assert = require('node:assert/strict');
const { normalizeControlInput, validateControlInput } = require('../validate');
const { executeIntent } = require('../execute');

describe('control-plane validation contract', () => {
  const valid = () => ({ command: 'status', tenantId: 't', actor: { role: 'operator' } });

  for (const field of ['context', 'payload', 'metadata']) {
    for (const value of [null, [], 'invalid', 42, false]) {
      it(`rejects ${field}: ${JSON.stringify(value)} before fallback or mutation`, () => {
        const input = { ...valid(), [field]: value };
        const expected = field === 'metadata' ? /Metadata must be an object/ : /Context must be an object/;
        assert.throws(() => normalizeControlInput(input), expected);
        assert.throws(() => validateControlInput(input), expected);
        assert.equal(input[field], value);
        assert.equal(input.intent, undefined);
      });
    }
  }

  it('keeps omitted objects optional and accepts object payloads', () => {
    const input = { ...valid(), payload: { id: 'example' }, metadata: { sessionId: 's' } };
    assert.equal(validateControlInput(input), true);
    assert.deepEqual(input.context, { id: 'example' });
    assert.equal(input.metadata.sessionId, 's');
    const omitted = valid();
    assert.equal(validateControlInput(omitted), true);
    assert.deepEqual(omitted.context, {});
  });

  for (const shape of [
    { command: 'status', actor: { role: 'operator' } },
    { command: 'status', metadata: { role: 'operator', actor: 'u' } },
    { intent: 'status', actor: { role: 'operator' } },
    { intent: 'deal.execute', actor: { role: 'operator' } }
  ]) {
    it(`executes normalized ${JSON.stringify(shape)} through a signed envelope`, async () => {
      const previous = process.env.SENTINEL_HMAC_SECRET;
      process.env.SENTINEL_HMAC_SECRET = 'validation-regression-test';
      try {
        const input = { ...shape, tenant: ' t ', payload: { id: 'example' } };
        let submitted;
        const result = await executeIntent(input, { fetch: async (url, options) => {
          submitted = JSON.parse(options.body);
          return { ok: true, status: 200, text: async () => '{}' };
        } });
        assert.equal(result.ok, true);
        assert.equal(submitted.command, shape.intent === 'deal.execute' ? 'deal.execute' : 'system.status');
        assert.equal(submitted.tenant, 't');
        assert.deepEqual(submitted.payload, { id: 'example' });
        assert.equal(submitted.metadata.role, 'operator');
        assert.ok(submitted.sig);
        assert.equal(input.intent, submitted.command);
      } finally {
        if (previous === undefined) delete process.env.SENTINEL_HMAC_SECRET;
        else process.env.SENTINEL_HMAC_SECRET = previous;
      }
    });
  }

  for (const extra of [{ entity: 'application' }, { action: 'approve' }]) {
    it(`rejects partial qualified-command mismatch ${JSON.stringify(extra)}`, () => {
      assert.throws(() => validateControlInput({ ...valid(), command: 'deal.execute', ...extra }), /Intent contract mismatch/);
    });
  }

  it('rejects empty path segments and malformed actors', () => {
    assert.throws(() => validateControlInput({ ...valid(), command: 'deal..execute' }), /empty path segments/);
    assert.throws(() => validateControlInput({ ...valid(), actor: 'operator' }), /Malformed actor payload/);
  });
});
