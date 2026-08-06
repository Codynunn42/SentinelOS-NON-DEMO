const handler = require('./signing-proxy').handler;

const tests = [
  {
    name: 'Test 2.2: Health Endpoint',
    event: { httpMethod: 'GET', path: '/health', body: null },
    expectStatus: 200,
    expectBody: (body) => body.status === 'ok'
  },
  {
    name: 'Test 2.3: Ready Endpoint',
    event: { httpMethod: 'GET', path: '/ready', body: null },
    expectStatus: 200,
    expectBody: (body) => body.ready === true || body.status === 'ok'
  },
  {
    name: 'Test 2.4: Authenticated Command',
    event: {
      httpMethod: 'POST',
      path: '/v1/command',
      body: JSON.stringify({
        tenant: 'sentinelos',
        command: 'architecture.reconstruction.begin',
        payload: { scope: 'full' }
      })
    },
    expectStatus: 200,
    expectBody: (body) => body.status === 'executed' && body.trustScore === 100
  }
];

async function runTests() {
  console.log('=== SentinelOS Proxy Phase 2 Tests ===\n');
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`Running: ${test.name}`);
    
    try {
      const result = await handler(test.event);
      const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      
      const statusOk = result.statusCode === test.expectStatus;
      const bodyOk = test.expectBody(body);
      
      if (statusOk && bodyOk) {
        console.log(`  ✅ PASS\n`);
        passed++;
      } else {
        console.log(`  ❌ FAIL`);
        if (!statusOk) console.log(`    Status: expected ${test.expectStatus}, got ${result.statusCode}`);
        if (!bodyOk) console.log(`    Body validation failed: ${JSON.stringify(body).substring(0, 100)}`);
        console.log();
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`=== Summary ===`);
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Failed: ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log(`\n✅ Phase 2 Ready: All tests passed`);
    console.log(`Ready to deploy proxy to AWS Lambda`);
  } else {
    console.log(`\n❌ Phase 2 Blocked: Fix failures before deploying`);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
