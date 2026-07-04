const assert = require('assert');
const { server } = require('../apps/api/server');

const original = {
  enabled: process.env.SENTINEL_STRIPE_CHECKOUT_ENABLED,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  priceId: process.env.STRIPE_PRICE_ID
};

process.env.SENTINEL_STRIPE_CHECKOUT_ENABLED = '0';
process.env.STRIPE_PUBLISHABLE_KEY = '';
process.env.STRIPE_SECRET_KEY = '';
process.env.STRIPE_PRICE_ID = '';

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function main() {
  const port = await listen();
  const base = `http://127.0.0.1:${port}`;

  try {
    const response = await fetch(`${base}/billing/revenue-readiness`);
    const readiness = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(readiness.status, 'scaffolded_held');
    assert.strictEqual(readiness.mode, 'ready_to_turn_on_when_approved');
    assert.strictEqual(readiness.verifiedFacts.billingSurfacePresent, true);
    assert.strictEqual(readiness.ownerDecisions.liveCheckoutActivation, 'held_pending_configuration');
    assert.strictEqual(readiness.authorizations.livePaymentCollection, false);
    assert.strictEqual(readiness.authorizations.productionCustomerDealExecution, false);
    assert.strictEqual(readiness.activationReadiness.liveCheckout, false);
    assert(readiness.activationReadiness.requiredConfig.includes('SENTINEL_STRIPE_CHECKOUT_ENABLED'));
    assert(readiness.activationReadiness.requiredConfig.includes('STRIPE_PUBLISHABLE_KEY'));
    assert(readiness.activationReadiness.requiredConfig.includes('STRIPE_PRICE_ID'));
    assert(readiness.nonAuthorization.includes('live_payment_collection'));
    assert(readiness.recommendedNextGates.some((gate) => gate.gate === 'COMMERCIAL_LAUNCH_APPROVAL'));

    const session = await fetch(`${base}/billing/checkout/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'buyer@example.com', tenant: 'ownerfi' })
    });
    const sessionBody = await session.json();

    assert.strictEqual(session.status, 503);
    assert.strictEqual(sessionBody.status, 'BLOCKED');
    assert.strictEqual(sessionBody.approval.type, 'billing_checkout_approval');

    console.log('Revenue readiness held contract check passed');
  } finally {
    server.close();

    for (const [key, value] of Object.entries(original)) {
      const envKey = {
        enabled: 'SENTINEL_STRIPE_CHECKOUT_ENABLED',
        publishableKey: 'STRIPE_PUBLISHABLE_KEY',
        secretKey: 'STRIPE_SECRET_KEY',
        priceId: 'STRIPE_PRICE_ID'
      }[key];

      if (value === undefined) {
        delete process.env[envKey];
      } else {
        process.env[envKey] = value;
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
