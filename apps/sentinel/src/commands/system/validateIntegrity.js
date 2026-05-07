const { spawnSync } = require('child_process');

const CHECK_SCRIPT_MAP = {
  'audit-stream': 'check:audit-stream',
  'mission-control': 'check:mission-control',
  'trust-score': 'check:trust-score',
  ready: 'check:ready',
  'ownerfi-pilot-api': 'check:ownerfi-pilot-api',
  'task-templates': 'check:task-templates',
  'faceplane-sdk': 'check:faceplane-sdk',
  docking: 'check:docking',
  policy: 'check:policy',
  approvals: 'check:approvals'
};

function normalizeChecks(value) {
  if (!Array.isArray(value)) {
    return ['trust-score'];
  }

  return value
    .map((check) => (typeof check === 'string' ? check.trim() : ''))
    .filter(Boolean);
}

async function handleSystemValidate(payload = {}) {
  const checks = normalizeChecks(payload.checks);
  const results = {};

  for (const check of checks) {
    const script = CHECK_SCRIPT_MAP[check];
    if (!script) {
      results[check] = {
        status: 'blocked',
        reason: 'CHECK_NOT_ALLOWED'
      };
      continue;
    }

    const run = spawnSync('npm', ['run', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });

    results[check] = {
      status: run.status === 0 ? 'passed' : 'failed',
      script,
      exitCode: run.status,
      output: `${run.stdout || ''}${run.stderr || ''}`.trim().slice(-2000)
    };
  }

  const passed = Object.values(results).every((result) => result.status === 'passed');

  return {
    success: true,
    statusCode: passed ? 200 : 207,
    data: {
      result: {
        status: passed ? 'success' : 'partial',
        results
      }
    }
  };
}

module.exports = {
  handleSystemValidate
};
