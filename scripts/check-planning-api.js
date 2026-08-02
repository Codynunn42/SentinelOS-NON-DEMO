'use strict';

// C3.1 — Command Envelope API Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all C3.1 deliverables:
//   - POST /api/v1/command-envelope registered in server.js
//   - POST /api/v1/planning registered in server.js
//   - POST /api/v1/execution registered in server.js
//   - POST /api/v1/evidence registered in server.js
//   - Governance preflight enforced on all execution paths
//   - Idempotency enforced on command-envelope and execution
//   - Evidence endpoint does not trigger dispatch
//   - All endpoints require authentication
//   - Missing field validation on each endpoint

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const serverPath = path.join(ROOT, 'apps', 'api', 'server.js');

assert(fs.existsSync(serverPath), 'server.js missing: ' + serverPath);

const server = fs.readFileSync(serverPath, 'utf8');

// --- 1. Route registration ---

const routes = [
  '/api/v1/command-envelope',
  '/api/v1/planning',
  '/api/v1/execution',
  '/api/v1/evidence'
];

routes.forEach((route) => {
  assert(
    server.includes(`pathname === '${route}'`),
    `Route not registered in server.js: ${route}`
  );
});

console.log('  - All 4 Command Envelope API routes registered ✓');

// --- 2. Authentication enforced ---

routes.forEach((route) => {
  const routeStart = server.indexOf(`pathname === '${route}'`);
  assert(routeStart !== -1, `Route block not found: ${route}`);
  const routeBlock = server.slice(routeStart, routeStart + 800);
  assert(
    routeBlock.includes('authenticateCommand'),
    `Route ${route} missing authenticateCommand call`
  );
});

console.log('  - Authentication enforced on all routes ✓');

// --- 3. Governance preflight on execution paths ---

['/api/v1/command-envelope', '/api/v1/execution'].forEach((route) => {
  const routeStart = server.indexOf(`pathname === '${route}'`);
  const routeBlock = server.slice(routeStart, routeStart + 3000);
  assert(
    routeBlock.includes('governanceCheck'),
    `Route ${route} missing governanceCheck call`
  );
});

// planning evaluates governance and reports it
const planningStart = server.indexOf("pathname === '/api/v1/planning'");
const planningBlock = server.slice(planningStart, planningStart + 3000);
assert(planningBlock.includes('governanceCheck'), '/api/v1/planning missing governanceCheck');

console.log('  - Governance preflight enforced on command-envelope, planning, execution ✓');

// --- 4. Idempotency on command-envelope and execution ---

['/api/v1/command-envelope', '/api/v1/execution'].forEach((route) => {
  const routeStart = server.indexOf(`pathname === '${route}'`);
  const routeBlock = server.slice(routeStart, routeStart + 4500);
  assert(routeBlock.includes('checkIdempotency'), `Route ${route} missing checkIdempotency`);
  assert(routeBlock.includes('rememberIdempotency'), `Route ${route} missing rememberIdempotency`);
  assert(routeBlock.includes('IDEMPOTENCY_CONFLICT'), `Route ${route} missing IDEMPOTENCY_CONFLICT handling`);
});

console.log('  - Idempotency enforced on command-envelope and execution ✓');

// --- 5. Envelope field validation ---

const envelopeStart = server.indexOf("pathname === '/api/v1/command-envelope'");
const envelopeBlock = server.slice(envelopeStart, envelopeStart + 2000);
[
  'commandId',
  'tenant',
  'metadata.actor',
  'metadata.role',
  'metadata.scopes',
  'executionPolicy',
  'ENVELOPE_INCOMPLETE'
].forEach((field) => {
  assert(envelopeBlock.includes(field), `/api/v1/command-envelope missing field validation: ${field}`);
});

console.log('  - command-envelope field validation complete ✓');

// --- 6. Planning envelope field validation ---

const planStart = server.indexOf("pathname === '/api/v1/planning'");
const planBlock = server.slice(planStart, planStart + 2000);
[
  'commandId',
  'tenant',
  'intent',
  'metadata.actor',
  'metadata.role',
  'metadata.scopes',
  'PLANNING_ENVELOPE_INCOMPLETE'
].forEach((field) => {
  assert(planBlock.includes(field), `/api/v1/planning missing field validation: ${field}`);
});

console.log('  - planning envelope field validation complete ✓');

// --- 7. Execution envelope field validation ---

const execStart = server.indexOf("pathname === '/api/v1/execution'");
const execBlock = server.slice(execStart, execStart + 4000);
[
  'commandId',
  'tenant',
  'command',
  'executionPolicy',
  'metadata.actor',
  'metadata.role',
  'metadata.scopes',
  'EXECUTION_ENVELOPE_INCOMPLETE'
].forEach((field) => {
  assert(execBlock.includes(field), `/api/v1/execution missing field validation: ${field}`);
});

// Execution must use dispatchCommand — it is an execution path
assert(execBlock.includes('dispatchCommand'), '/api/v1/execution must call dispatchCommand');

console.log('  - execution envelope field validation and dispatch confirmed ✓');

// --- 8. Evidence does not call dispatchCommand ---

const evidStart = server.indexOf("pathname === '/api/v1/evidence'");
const evidBlock = server.slice(evidStart, evidStart + 2000);
[
  'commandId',
  'tenant',
  'evidenceType',
  'actor',
  'timestamp',
  'EVIDENCE_ENVELOPE_INCOMPLETE'
].forEach((field) => {
  assert(evidBlock.includes(field), `/api/v1/evidence missing field validation: ${field}`);
});

// Evidence must NOT call dispatchCommand — it is write-only audit
assert(
  !evidBlock.includes('dispatchCommand'),
  '/api/v1/evidence MUST NOT call dispatchCommand — evidence is a write-only audit path'
);
assert(evidBlock.includes('auditLogger'), '/api/v1/evidence must write to auditLogger');

console.log('  - evidence write-only audit path confirmed (no dispatch) ✓');

// --- 9. All receipt IDs generated ---

['rcpt_env_', 'rcpt_plan_', 'rcpt_ev_'].forEach((prefix) => {
  assert(server.includes(prefix), `Missing receipt ID prefix: ${prefix}`);
});

console.log('  - Receipt IDs generated on all three write paths ✓');

// --- 10. Audit logging on all endpoints ---

['/api/v1/command-envelope', '/api/v1/planning', '/api/v1/evidence'].forEach((route) => {
  const routeStart = server.indexOf(`pathname === '${route}'`);
  const routeBlock = server.slice(routeStart, routeStart + 4500);
  assert(routeBlock.includes('auditLogger.log'), `Route ${route} missing auditLogger.log`);
});

console.log('  - Audit logging on command-envelope, planning, and evidence ✓');

console.log('\nALL C3.1 COMMAND ENVELOPE API CHECKS PASSED ✓');
