const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd();
const workflowPath = path.join(repoRoot, '.github/workflows/deploy.yml');
const ciWorkflowPath = path.join(repoRoot, '.github/workflows/ci.yml');
const healthFixPath = path.join(repoRoot, 'azure/container-app-healthfix.yaml');

const checks = [
  {
    file: workflowPath,
    required: [
      'node scripts/validate-live-azure-deployment-contract.js',
      '--target-port 3000',
      'az containerapp revision list --name',
      'curl --fail --show-error --silent --max-time 30 "https://${FQDN}/health"',
      'curl --fail --show-error --silent --max-time 30 "https://${FQDN}/approvals"'
    ],
    message: 'Deploy workflow must invoke the executable validator and verify the live health/auth boundary.'
  },
  {
    file: ciWorkflowPath,
    required: ['pnpm run test:deployment-contract'],
    message: 'CI workflow must run the executable deployment-contract test suite.'
  },
  {
    file: healthFixPath,
    required: [
      '- type: Startup',
      '- type: Readiness',
      '- type: Liveness',
      'path: /health',
      'port: 3000'
    ],
    message: 'Health fix manifest must include the governed port-3000 probe configuration.'
  }
];

let failed = false;
for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    console.error(`Missing required file: ${check.file}`);
    failed = true;
    continue;
  }

  const content = fs.readFileSync(check.file, 'utf8');
  for (const required of check.required) {
    if (!content.includes(required)) {
      console.error(`Missing deployment wiring: ${check.message} (${check.file} missing: ${required})`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('Deployment wiring is present and points to the executable deployment contract validator.');
