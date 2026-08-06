const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'api', 'public', 'government-outcomes.html'),
  'utf8'
);

[
  'Government Outcomes',
  'Public outcome command',
  'Government deployment: roadmap only',
  'OWNER DIRECTION RECORDED · ILLUSTRATIVE DISCUSSION SURFACE',
  'Internal category: Outcome Operating System',
  'WHITE-GLOVE OUTCOME ENGINEERING',
  'AUTHORITATIVE INTAKE',
  'Worksheet prepared; no entity data collected or transmitted.',
  'Entity & authority',
  'Evidence & policy',
  'Authoritative inventory needed',
  'No authoritative baseline or target has been provided',
  'No authoritative entity evidence set has been provided',
  'Mission layer',
  'Outcome layer',
  'Execution layer',
  'Governance layer',
  'Prepared summary queue',
  'PERSONAL REVIEW',
  'YOUR ADDITIONS AND SUPPORT NOTES',
  'Updated summary prepared for your review',
  'local surface only',
  'creates no approval or execution authority'
].forEach((needle) => assert(html.includes(needle), `Government outcomes surface missing ${needle}`));

const server = fs.readFileSync(path.join(__dirname, '..', 'apps', 'api', 'server.js'), 'utf8');
assert(server.includes("pathname === '/government-outcomes'"), 'Government outcomes route is missing');
assert(server.includes("'government-outcomes'"), 'Government outcomes audit surface is missing');

console.log('Government outcomes surface check passed');
