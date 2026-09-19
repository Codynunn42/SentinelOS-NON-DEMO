const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd();
const workflowPath = path.join(repoRoot, '.github/workflows/deploy.yml');
const healthFixPath = path.join(repoRoot, 'azure/container-app-healthfix.yaml');

const requiredEntries = [
  {
    file: workflowPath,
    check: "--target-port 3000",
    message: 'Deploy workflow must target port 3000.'
  },
  {
    file: workflowPath,
    check: "containers[?name=='sentinel']",
    message: 'Deploy workflow must validate the named sentinel container.'
  },
  {
    file: workflowPath,
    check: "healthState",
    message: 'Deploy workflow must assert revision healthState.'
  },
  {
    file: workflowPath,
    check: "provisioningState",
    message: 'Deploy workflow must assert revision provisioningState.'
  },
  {
    file: workflowPath,
    check: "trafficWeight",
    message: 'Deploy workflow must assert revision trafficWeight.'
  },
  {
    file: workflowPath,
    check: "curl --fail --show-error --silent --max-time 30 \"https://${FQDN}/health\"",
    message: 'Deployment workflow must verify live /health endpoint.'
  },
  {
    file: workflowPath,
    check: "curl --fail --show-error --silent --max-time 30 \"https://${FQDN}/approvals\" \\\n              -H \"x-api-key: ${{ secrets.SENTINEL_API_KEY }}\"",
    message: 'Deployment workflow must verify authenticated approvals access.'
  },
  {
    file: healthFixPath,
    check: "- type: Startup",
    message: 'Health fix manifest must include a Startup probe.'
  },
  {
    file: healthFixPath,
    check: "- type: Readiness",
    message: 'Health fix manifest must include a Readiness probe.'
  },
  {
    file: healthFixPath,
    check: "- type: Liveness",
    message: 'Health fix manifest must include a Liveness probe.'
  },
  {
    file: healthFixPath,
    check: "path: /health",
    message: 'Health fix manifest must probe the /health route.'
  },
  {
    file: healthFixPath,
    check: "port: 3000",
    message: 'Health fix manifest must probe port 3000.'
  }
];

let failed = false;
for (const entry of requiredEntries) {
  if (!fs.existsSync(entry.file)) {
    console.error(`Missing required file: ${entry.file}`);
    failed = true;
    continue;
  }

  const content = fs.readFileSync(entry.file, 'utf8');
  if (!content.includes(entry.check)) {
    console.error(`Missing contract assertion: ${entry.message} (${entry.file})`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('Deployment contract assertions are present for the PR-safe verification gate.');
