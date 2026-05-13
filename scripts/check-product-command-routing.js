const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { server } = require('../apps/api/server');

const TEST_KEY = 'product-command-test-secret';
const PRODUCT_DOC = 'docs/DEAL_EXECUTION_ENGINE_POSITIONING.md';
const STATEFUL_FILES = [
  'config/product.json',
  'config/uiLabels.json',
  PRODUCT_DOC
];

process.env.SENTINEL_API_KEY = TEST_KEY;
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'product-command-passport-secret';
process.env.SENTINEL_API_KEY_TENANT = 'nunncloud';
process.env.SENTINEL_API_KEY_ACTOR = 'product-operator@nunncloud.local';
process.env.SENTINEL_API_KEY_ROLE = 'platform';

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function postCommand(base, command, payload = {}) {
  const response = await fetch(`${base}/v1/command`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${TEST_KEY}`
    },
    body: JSON.stringify({
      tenant: 'nunncloud',
      command,
      payload
    })
  });
  const body = await response.json();
  return { response, body };
}

function snapshotFiles(files) {
  return Object.fromEntries(files.map((file) => {
    const fullPath = path.join(process.cwd(), file);
    return [
      file,
      fs.existsSync(fullPath)
        ? { existed: true, content: fs.readFileSync(fullPath, 'utf8') }
        : { existed: false, content: null }
    ];
  }));
}

function restoreFiles(snapshot) {
  for (const [file, state] of Object.entries(snapshot)) {
    const fullPath = path.join(process.cwd(), file);

    if (!state.existed) {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      continue;
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, state.content, 'utf8');
  }
}

async function main() {
  const fileSnapshot = snapshotFiles(STATEFUL_FILES);
  const port = await listen();
  const base = `http://127.0.0.1:${port}`;

  try {
    const reframe = await postCommand(base, 'system.reframe.product', {
      productName: 'SentinelOS Deal Execution Engine',
      positioning: 'We ensure deals only execute when they are valid, approved, and safe.',
      languageMap: {
        'Trust Score': 'Decision Score',
        'Governance Signals': 'Risk Alerts',
        'Audit Feed': 'Activity Feed',
        Workflow: 'Deal Flow'
      }
    });
    assert.strictEqual(reframe.response.status, 200);
    assert.strictEqual(reframe.body.status, 'executed');
    assert.strictEqual(reframe.body.product.productName, 'SentinelOS Deal Execution Engine');

    const ui = await postCommand(base, 'ui.sync.labels', {
      labelMap: {
        trustScore: 'Decision Score',
        governanceSignals: 'Risk Alerts',
        auditFeed: 'Activity Feed',
        workflowBoard: 'Deal Flow'
      }
    });
    assert.strictEqual(ui.response.status, 200);
    assert.strictEqual(ui.body.result.status, 'success');
    assert.strictEqual(ui.body.result.labelCount, 4);

    const repo = await postCommand(base, 'repo.update.structure', {
      actions: [
        {
          type: 'create_file',
          path: PRODUCT_DOC,
          content: [
            '# SentinelOS Deal Execution Engine',
            '',
            '## Product Focus',
            '',
            'We ensure deals only execute when they are valid, approved, and safe.',
            '',
            '## Demo Loop',
            '',
            '1. Submit deal',
            '2. Attempt execution',
            '3. Deal blocked',
            '4. Show why',
            '5. Show Decision Score',
            '6. Show Risk Alert',
            '7. Approve',
            '8. Execute',
            '9. Show Activity Feed and Audit',
            ''
          ].join('\n')
        }
      ]
    });
    assert.strictEqual(repo.response.status, 200);
    assert.strictEqual(repo.body.result.status, 'success');
    assert(fs.existsSync(path.join(process.cwd(), PRODUCT_DOC)));

    const demo = await postCommand(base, 'dealFlow.run.demo');
    assert.strictEqual(demo.response.status, 200);
    assert.strictEqual(demo.body.result.product, 'SentinelOS Deal Execution Engine');
    assert(demo.body.flow.some((step) => step.label === 'Decision Score'));
    assert(demo.body.flow.some((step) => step.label === 'Risk Alert'));

    const validate = await postCommand(base, 'system.validate.integrity', {
      checks: ['trust-score']
    });
    assert.strictEqual(validate.response.status, 200);
    assert.strictEqual(validate.body.result.status, 'success');
    assert.strictEqual(validate.body.result.results['trust-score'].status, 'passed');

    const audit = await fetch(`${base}/v1/audit?tenant=nunncloud`, {
      headers: {
        authorization: `Bearer ${TEST_KEY}`
      }
    });
    const auditBody = await audit.json();
    assert.strictEqual(audit.status, 200);
    assert(auditBody.entries.some((entry) => entry.command === 'system.reframe.product'));
    assert(auditBody.entries.some((entry) => entry.command === 'dealFlow.run.demo'));

    console.log('Product command routing check passed');
  } finally {
    server.close();
    restoreFiles(fileSnapshot);
  }
}

main().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
