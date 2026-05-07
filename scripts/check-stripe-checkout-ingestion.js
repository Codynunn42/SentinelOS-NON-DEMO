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
    const checkout = await fetch(`${base}/billing/checkout`);
    assert.strictEqual(checkout.status, 200);
    const checkoutHtml = await checkout.text();
    assert(checkoutHtml.includes('Governed Checkout'));
    assert(!checkoutHtml.includes('sk_test_'));

    const complete = await fetch(`${base}/billing/complete`);
    assert.strictEqual(complete.status, 200);
    const completeHtml = await complete.text();
    assert(completeHtml.includes('Checkout Status'));

    const config = await fetch(`${base}/billing/checkout/config`);
    assert.strictEqual(config.status, 200);
    const configBody = await config.json();
    assert.strictEqual(configBody.status, 'not_ready');
    assert.strictEqual(configBody.enabled, false);
    assert(configBody.missing.includes('STRIPE_PUBLISHABLE_KEY'));
    assert(configBody.missing.includes('STRIPE_SECRET_KEY'));
    assert(configBody.missing.includes('STRIPE_PRICE_ID'));
    assert.strictEqual(configBody.publishableKey, null);

    const session = await fetch(`${base}/billing/checkout/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'buyer@example.com' })
    });
    assert.strictEqual(session.status, 503);
    const sessionBody = await session.json();
    assert.strictEqual(sessionBody.status, 'BLOCKED');
    assert.strictEqual(sessionBody.reason, 'Checkout not enabled');
    assert(sessionBody.requiredConfig.includes('SENTINEL_STRIPE_CHECKOUT_ENABLED'));
    assert(sessionBody.requiredConfig.includes('STRIPE_PRICE_ID'));
    assert(sessionBody.approval);
    assert.strictEqual(sessionBody.approval.type, 'billing_checkout_approval');

    console.log('Stripe checkout ingestion check passed');
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
