const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'api', 'public', 'entity-inquiry-portal.html'),
  'utf8'
);

[
  'SentinelOS Mission Intake Portal',
  'MAIN ENTITY INQUIRY PORTAL',
  'GOVERNMENT ENTITY',
  'CORPORATE ENTITY',
  'Public Outcome Inquiry',
  'Enterprise Outcome Inquiry',
  'Prepare inquiry summary for owner review',
  'does not transmit inquiry data',
  'activate SentinelOS command routing',
  '/sentinel',
  '--government',
  '--enterprise',
  'Sentinel White Glove Executive Envelope',
  'OUTCOME FORECAST',
  'Held until supported evidence and model exist',
  'EXECUTIVE RECOMMENDATION',
  'Prepared for personal review before advancement',
  'Observed, recommended, authorized, and executed remain separate',
  'External submission: held'
].forEach((needle) => assert(html.includes(needle), `Entity inquiry portal missing ${needle}`));

const server = fs.readFileSync(path.join(__dirname, '..', 'apps', 'api', 'server.js'), 'utf8');
assert(server.includes("pathname === '/portal'"), 'Entity inquiry portal route is missing');
assert(server.includes("'entity-inquiry-portal'"), 'Entity inquiry portal audit surface is missing');

console.log('Entity inquiry portal check passed');
