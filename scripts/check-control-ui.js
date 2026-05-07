const assert = require('assert');
const fs = require('fs');
const path = require('path');

const server = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'api', 'server.js'),
  'utf8'
);
const proof = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'api', 'public', 'proof.html'),
  'utf8'
);
const landing = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'api', 'public', 'index.html'),
  'utf8'
);

assert(server.includes("require('../sentinel/src/controlPlane')"));
assert(server.includes("pathname === '/api/control/execute'"));
assert(server.includes("endpoint: `${getRequestOrigin(req)}/v1/command`"));
assert(server.includes('normalizeDemoControlResult'));
assert(server.includes('return sendJson(res, 200'));
assert(server.includes("pathname === '/'"));

assert(proof.includes("fetch('/api/control/execute'"));
assert(proof.includes('async function runIntent'));
assert(proof.includes('async function runDemo'));
assert(proof.includes('function resetDemo'));
assert(proof.includes('id="roleSelect"'));
assert(proof.includes('new EventSource'));
assert(proof.includes('intent,'));
assert(proof.includes("tenantId: 'ownerfi'"));
assert(proof.includes('Bad deals do not get through'));
assert(proof.includes('Decision Panel'));
assert(proof.includes('activityFeed'));
assert(proof.includes('XE Command Plane'));
assert(proof.includes('parseXEIntent'));
assert(proof.includes('executeXECommand'));
assert(proof.includes("event.ctrlKey || event.metaKey"));
assert(proof.includes("logActivity(`XE -> ${intent}`"));
assert(!proof.includes("fetch('/v1/command'"));

assert(landing.includes('Bad deals do not get through.'));
assert(landing.includes('href="/proof"'));
assert(landing.includes('Book Demo'));

console.log('Control UI check passed');
