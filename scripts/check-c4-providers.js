'use strict';

// C4 — Provider Docking and Capability Registration Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates C4.2, C4.3, C4.4, and C4.5 deliverables:
//
//   C4.2 — TILDA:
//     - tilda-faceplane.json exists and validates against dock manifest schema
//     - TILDA-READ-001 and TILDA-EXECUTE-001 registered in capability registry
//     - tilda surface plane exists
//     - tilda policy scopes added to policyEngine.js
//
//   C4.3 — Microsoft 365:
//     - microsoft365-faceplane.json exists and validates
//     - M365-READ-001 and M365-REPORT-001 registered
//     - microsoft365 surface plane exists
//     - m365 policy scopes added
//
//   C4.4 — GitHub:
//     - github-faceplane.json exists and validates
//     - GITHUB-READ-001 and GITHUB-EXECUTE-001 registered
//     - github surface plane exists
//     - github policy scopes added
//
//   C4.5 — Drift Monitor:
//     - capabilityDriftMonitor.js exists and exports runCapabilityDriftMonitor
//     - runCapabilityDriftMonitor returns all C4 providers
//     - server.js has /api/v1/drift/capabilities route
//
//   C4.6 — Cross-Provider Executive Desk:
//     - executive.ts has crossProviderDashboard flag
//     - executive.ts builds crossProviderDrift
//     - nexus-executive.html has Provider Health panel
//     - nexus-executive.html has loadProviderDashboard() function

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const {
  validateDockManifest
} = require('../apps/sentinel/src/integrations/docking/manifest-schema');

const {
  listCapabilities,
  CAPABILITY_TYPE,
  LIFECYCLE
} = require('../apps/sentinel/src/capabilities/registry');

// -------------------------------------------------------------------------
// C4.2 — TILDA
// -------------------------------------------------------------------------

const tildaFacePlanePath = path.join(ROOT, 'fixtures', 'faceplanes', 'tilda-faceplane.json');
assert(fs.existsSync(tildaFacePlanePath), 'tilda-faceplane.json missing');

const tildaFacePlane = JSON.parse(fs.readFileSync(tildaFacePlanePath, 'utf8'));
assert(tildaFacePlane.dockManifest, 'tilda-faceplane.json missing dockManifest block');

const tildaManifestResult = validateDockManifest(tildaFacePlane.dockManifest);
assert(
  tildaManifestResult.valid,
  `tilda dockManifest failed validation: ${JSON.stringify(tildaManifestResult.errors)}`
);

console.log('  - tilda-faceplane.json dockManifest validates ✓');

const tildaCaps = listCapabilities({ provider: 'tilda' });
assert(tildaCaps.length >= 2, `Expected at least 2 TILDA capabilities, got ${tildaCaps.length}`);

const tildaTypes = tildaCaps.map((c) => c.type);
assert(tildaTypes.includes(CAPABILITY_TYPE.READ), 'TILDA missing READ capability');
assert(tildaTypes.includes(CAPABILITY_TYPE.EXECUTE), 'TILDA missing EXECUTE capability');

console.log('  - TILDA-READ-001 and TILDA-EXECUTE-001 registered ✓');

const tildaSurfacePath = path.join(ROOT, 'apps', 'sentinel', 'src', 'surface', 'tilda.js');
assert(fs.existsSync(tildaSurfacePath), 'tilda.js surface plane missing');
console.log('  - tilda.js surface plane present ✓');

const policyPath = path.join(ROOT, 'apps', 'sentinel', 'src', 'governance', 'policyEngine.js');
const policySource = fs.readFileSync(policyPath, 'utf8');
assert(policySource.includes("'tilda.status.read'"), 'policyEngine missing tilda.status.read');
assert(policySource.includes("'tilda.action.execute'"), 'policyEngine missing tilda.action.execute');
console.log('  - TILDA policy scopes registered in policyEngine.js ✓');

// -------------------------------------------------------------------------
// C4.3 — Microsoft 365
// -------------------------------------------------------------------------

const m365FacePlanePath = path.join(ROOT, 'fixtures', 'faceplanes', 'microsoft365-faceplane.json');
assert(fs.existsSync(m365FacePlanePath), 'microsoft365-faceplane.json missing');

const m365FacePlane = JSON.parse(fs.readFileSync(m365FacePlanePath, 'utf8'));
assert(m365FacePlane.dockManifest, 'microsoft365-faceplane.json missing dockManifest block');

const m365ManifestResult = validateDockManifest(m365FacePlane.dockManifest);
assert(
  m365ManifestResult.valid,
  `microsoft365 dockManifest failed validation: ${JSON.stringify(m365ManifestResult.errors)}`
);

console.log('  - microsoft365-faceplane.json dockManifest validates ✓');

const m365Caps = listCapabilities({ provider: 'microsoft365' });
assert(m365Caps.length >= 2, `Expected at least 2 M365 capabilities, got ${m365Caps.length}`);

const m365Types = m365Caps.map((c) => c.type);
assert(m365Types.includes(CAPABILITY_TYPE.READ), 'M365 missing READ capability');
assert(m365Types.includes(CAPABILITY_TYPE.REPORT), 'M365 missing REPORT capability');

console.log('  - M365-READ-001 and M365-REPORT-001 registered ✓');

const m365SurfacePath = path.join(ROOT, 'apps', 'sentinel', 'src', 'surface', 'microsoft365.js');
assert(fs.existsSync(m365SurfacePath), 'microsoft365.js surface plane missing');
console.log('  - microsoft365.js surface plane present ✓');

assert(policySource.includes("'m365.calendar.read'"), 'policyEngine missing m365.calendar.read');
assert(policySource.includes("'m365.report.generate'"), 'policyEngine missing m365.report.generate');
console.log('  - M365 policy scopes registered in policyEngine.js ✓');

// -------------------------------------------------------------------------
// C4.4 — GitHub
// -------------------------------------------------------------------------

const githubFacePlanePath = path.join(ROOT, 'fixtures', 'faceplanes', 'github-faceplane.json');
assert(fs.existsSync(githubFacePlanePath), 'github-faceplane.json missing');

const githubFacePlane = JSON.parse(fs.readFileSync(githubFacePlanePath, 'utf8'));
assert(githubFacePlane.dockManifest, 'github-faceplane.json missing dockManifest block');

const githubManifestResult = validateDockManifest(githubFacePlane.dockManifest);
assert(
  githubManifestResult.valid,
  `github dockManifest failed validation: ${JSON.stringify(githubManifestResult.errors)}`
);

console.log('  - github-faceplane.json dockManifest validates ✓');

const githubCaps = listCapabilities({ provider: 'github' });
assert(githubCaps.length >= 2, `Expected at least 2 GitHub capabilities, got ${githubCaps.length}`);

const githubTypes = githubCaps.map((c) => c.type);
assert(githubTypes.includes(CAPABILITY_TYPE.READ), 'GitHub missing READ capability');
assert(githubTypes.includes(CAPABILITY_TYPE.EXECUTE), 'GitHub missing EXECUTE capability');

console.log('  - GITHUB-READ-001 and GITHUB-EXECUTE-001 registered ✓');

const githubSurfacePath = path.join(ROOT, 'apps', 'sentinel', 'src', 'surface', 'github.js');
assert(fs.existsSync(githubSurfacePath), 'github.js surface plane missing');
console.log('  - github.js surface plane present ✓');

assert(policySource.includes("'github.repo.read'"), 'policyEngine missing github.repo.read');
assert(policySource.includes("'github.action.execute'"), 'policyEngine missing github.action.execute');
console.log('  - GitHub policy scopes registered in policyEngine.js ✓');

// -------------------------------------------------------------------------
// C4.5 — Capability Drift Monitor
// -------------------------------------------------------------------------

const driftMonitorPath = path.join(ROOT, 'apps', 'sentinel', 'src', 'drift', 'capabilityDriftMonitor.js');
assert(fs.existsSync(driftMonitorPath), 'capabilityDriftMonitor.js missing');
console.log('  - capabilityDriftMonitor.js present ✓');

const {
  runCapabilityDriftMonitor
} = require('../apps/sentinel/src/drift/capabilityDriftMonitor');

assert(typeof runCapabilityDriftMonitor === 'function', 'must export runCapabilityDriftMonitor');

const driftReport = runCapabilityDriftMonitor();
assert(driftReport, 'runCapabilityDriftMonitor should return a report');
assert(Array.isArray(driftReport.providers), 'report must have providers array');
assert(typeof driftReport.totalProviders === 'number');
assert(typeof driftReport.totalCapabilities === 'number');
assert(typeof driftReport.totalDrifted === 'number');

console.log('  - runCapabilityDriftMonitor returns a valid report ✓');

// All C4 providers present in drift report
const reportProviders = driftReport.providers.map((p) => p.provider);
['nexus', 'ownerfi', 'tilda', 'microsoft365', 'github'].forEach((expectedProvider) => {
  assert(
    reportProviders.includes(expectedProvider),
    `Drift report missing provider: ${expectedProvider}`
  );
});

console.log('  - Drift report includes all C4 providers (nexus, ownerfi, tilda, m365, github) ✓');

// All providers are clean by default (healthy providerHealth)
const driftedProviders = driftReport.providers.filter((p) => !p.clean);
assert.strictEqual(driftedProviders.length, 0, `Expected 0 drifted providers at baseline, got: ${driftedProviders.map((p) => p.provider)}`);

console.log('  - All providers clean at baseline (no drift signals) ✓');

// server.js has /api/v1/drift/capabilities route
const serverPath = path.join(ROOT, 'apps', 'api', 'server.js');
const serverSource = fs.readFileSync(serverPath, 'utf8');
assert(
  serverSource.includes("pathname === '/api/v1/drift/capabilities'"),
  "server.js missing /api/v1/drift/capabilities route"
);
assert(
  serverSource.includes('runCapabilityDriftMonitor'),
  "server.js /api/v1/drift/capabilities must call runCapabilityDriftMonitor"
);

console.log('  - /api/v1/drift/capabilities route registered in server.js ✓');

// -------------------------------------------------------------------------
// C4.6 — Cross-Provider Executive Desk
// -------------------------------------------------------------------------

const execTsPath = path.join(ROOT, 'apps', 'sentinel', 'src', 'planes', 'executive.ts');
const execTs = fs.readFileSync(execTsPath, 'utf8');

assert(execTs.includes('crossProviderDashboard'), 'executive.ts missing crossProviderDashboard');
assert(execTs.includes('crossProviderDrift'), 'executive.ts missing crossProviderDrift');
assert(execTs.includes('ProviderDriftSummary'), 'executive.ts missing ProviderDriftSummary interface');

console.log('  - executive.ts crossProviderDashboard and crossProviderDrift confirmed ✓');

const execHtmlPath = path.join(ROOT, 'apps', 'nexus', 'public', 'nexus-executive.html');
const execHtml = fs.readFileSync(execHtmlPath, 'utf8');

[
  'Provider Health',
  'providerHealthPanel',
  'loadProviderDashboard',
  '/api/v1/drift/capabilities',
  'provider-name',
  'provider-card'
].forEach((needle) => {
  assert(execHtml.includes(needle), `nexus-executive.html missing: ${needle}`);
});

console.log('  - nexus-executive.html Provider Health panel and loadProviderDashboard() confirmed ✓');

// -------------------------------------------------------------------------
// Surface registry includes all C4 providers
// -------------------------------------------------------------------------

const registryPath = path.join(ROOT, 'apps', 'sentinel', 'src', 'surface', 'registry.js');
const registrySource = fs.readFileSync(registryPath, 'utf8');

['tilda', 'microsoft365', 'github'].forEach((provider) => {
  assert(registrySource.includes(`${provider}:`), `surface registry missing '${provider}' entry`);
});

console.log('  - Surface registry includes tilda, microsoft365, github ✓');

console.log('\nALL C4 PROVIDER CHECKS PASSED ✓');
