const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'api', 'public', 'mission-control.html'),
  'utf8'
);

[
  'Command Console',
  'Workflow Board',
  'Approval Queue',
  'Telemetry Harmonizer',
  'Billing Controls',
  'Audit Timeline',
  'Trust Dashboard',
  'Governance Signals',
  'Live Audit Feed',
  'Anchored States',
  'initializeWorkflowFromConsole',
  '/v1/workflow/init',
  '/v1/workflow/execute',
  '/v1/telemetry/harmonize',
  '/billing/checkout/session',
  '/v1/audit?tenant=',
  '/v1/metrics?tenant=',
  '/v1/alerts?tenant=',
  '/v1/signals/stream?tenant=',
  '/v1/audit/stream?tenant=',
  '/v1/anchors'
].forEach((needle) => {
  assert(html.includes(needle), `Mission Control missing ${needle}`);
});

const operatingModel = fs.readFileSync(
  path.join(__dirname, '..', 'docs', 'NUNN_CLOUD_CONTROL_SURFACE_OPERATING_MODEL.md'),
  'utf8'
);

[
  'standardizing operations under one model',
  'Existing Users',
  'New Users',
  'Renewals',
  'no mid-contract pricing changes',
  'We standardized the operating model under Nunn Cloud OS'
].forEach((needle) => {
  assert(operatingModel.includes(needle), `Operating model missing ${needle}`);
});

console.log('Mission Control surface check passed');
