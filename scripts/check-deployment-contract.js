const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd();
const workflowPath = path.join(repoRoot, '.github/workflows/deploy.yml');
const ciWorkflowPath = path.join(repoRoot, '.github/workflows/ci.yml');
const healthFixPath = path.join(repoRoot, 'azure/container-app-healthfix.yaml');
const packagePath = path.join(repoRoot, 'package.json');
const validatorPath = path.join(repoRoot, 'scripts/validate-live-azure-deployment-contract.js');

const checks = [
  {
    file: workflowPath,
    required: [
      'uses: ./.github/workflows/ci.yml',
      'needs: validate',
      "'configuration': {'ingress': {'targetPort': 3000}}",
      'node scripts/validate-live-azure-deployment-contract.js',
      'az containerapp revision show --name',
      'curl --fail --show-error --silent --max-time 30 "https://${FQDN}/health"',
      'curl --fail --show-error --silent --max-time 30 "https://${FQDN}/approvals"'
    ],
    forbidden: [
      'az containerapp ingress update'
    ],
    message: 'Deploy workflow must validate the exact SHA, coordinate ingress with the revision patch, and verify the live health/auth boundary.'
  },
  {
    file: ciWorkflowPath,
    required: [
      'workflow_call:',
      'pnpm run check:deployment-gate'
    ],
    forbidden: [],
    message: 'CI must expose and run the reusable executable deployment gate.'
  },
  {
    file: packagePath,
    required: [
      '"check:deployment-gate": "pnpm run test:deployment-contract && pnpm run check:deployment-contract"'
    ],
    forbidden: [],
    message: 'Package scripts must bind regression tests and wiring verification into one gate.'
  },
  {
    file: validatorPath,
    required: [
      'Exact revision name is missing; provenance cannot be verified.',
      'exactRevisionName.endsWith(`--${expectedSuffix}`)'
    ],
    forbidden: [],
    message: 'The live validator must reject missing or mismatched exact-revision provenance.'
  },
  {
    file: healthFixPath,
    required: [
      'NON-APPLICABLE REFERENCE ONLY',
      '- type: Startup',
      '- type: Readiness',
      '- type: Liveness',
      'path: /health',
      'port: 3000'
    ],
    forbidden: [
      '/subscriptions/',
      'InstrumentationKey=',
      'image:',
      'SENTINEL_AUTH_MODE',
      'SENTINEL_SMOKE_AUTH'
    ],
    message: 'The reference manifest must describe probes without executable live-resource or mutable-image drift.'
  }
];

function hasMalformedPythonHeredoc(content) {
  const lines = content.split('\n');
  let requiredIndent = null;
  for (const line of lines) {
    if (requiredIndent === null && line.includes("<<'PY'")) {
      requiredIndent = (line.match(/^ */) || [''])[0];
      continue;
    }
    if (requiredIndent !== null) {
      if (line && !line.startsWith(requiredIndent)) return true;
      if (line.trim() === 'PY') requiredIndent = null;
    }
  }
  return requiredIndent !== null;
}

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
      console.error(`Missing deployment evidence: ${check.message} (${check.file} missing: ${required})`);
      failed = true;
    }
  }
  for (const forbidden of check.forbidden) {
    if (content.includes(forbidden)) {
      console.error(`Forbidden deployment drift: ${check.message} (${check.file} contains: ${forbidden})`);
      failed = true;
    }
  }
  if (check.file === workflowPath && hasMalformedPythonHeredoc(content)) {
    console.error('Malformed deployment workflow: embedded Python heredocs must remain inside the YAML run block.');
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('Deployment gate wiring, provenance, and reference-manifest boundaries are present.');
