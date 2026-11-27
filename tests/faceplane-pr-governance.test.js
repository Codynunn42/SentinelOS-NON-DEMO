const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  AUTHORITY,
  CONTROL_DEFINITIONS,
  evaluatePrGovernance
} = require('../apps/sentinel/src/faceplanes/prGovernance/prGovernanceEvaluator');
const { renderMarkdownReport } = require('../apps/sentinel/src/faceplanes/prGovernance/prGovernanceReport');
const {
  buildPrGovernanceManifest,
  validatePrGovernanceManifest
} = require('../apps/sentinel/src/faceplanes/prGovernance/prGovernanceManifest');
const { parseNumstat, parseRepositoryFromRemote } = require('../apps/sentinel/src/faceplanes/prGovernance/localGitPreflight');
const { handleFaceplanePrAudit } = require('../apps/sentinel/src/commands/faceplane/prAudit');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { evaluatePolicy } = require('../apps/sentinel/src/governance/policyEngine');
const { resetLocalPassportState, signLocalCommand } = require('../scripts/lib/sentinelPassport');
const { parseArgs, run } = require('../scripts/check-faceplane-pr');

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'faceplanes', 'pr-governance-ready-snapshot.json');
const HEAD = '1111111111111111111111111111111111111111';
const STALE = '3333333333333333333333333333333333333333';
const NOW = '2026-11-27T00:00:00.000Z';

function readySnapshot() {
  return JSON.parse(JSON.stringify(require(FIXTURE)));
}

function evaluate(mutate, options = {}) {
  const snapshot = readySnapshot();
  if (mutate) mutate(snapshot);
  return evaluatePrGovernance(snapshot, { now: NOW, ...options });
}

function codes(report) {
  return report.findings.map((finding) => finding.id);
}

function assertBlocked(report, findingId) {
  assert.equal(report.readiness, 'BLOCKED');
  assert.ok(codes(report).includes(findingId), `expected ${findingId} in ${codes(report).join(', ')}`);
  const finding = report.findings.find((item) => item.id === findingId);
  assert.equal(finding.severity, 'blocker');
  assert.ok(finding.missingEvidence, 'finding must report exact missing evidence');
}

function captureIo() {
  const out = [];
  const err = [];
  return {
    io: {
      stdout: { write: (chunk) => out.push(chunk) },
      stderr: { write: (chunk) => err.push(chunk) },
      cwd: path.join(__dirname, '..'),
      now: NOW
    },
    stdout: () => out.join(''),
    stderr: () => err.join('')
  };
}

test('ready snapshot evaluates READY with full score and no authority granted', () => {
  const report = evaluate();
  assert.equal(report.readiness, 'READY');
  assert.equal(report.score, 100);
  assert.deepEqual(report.findings, []);
  assert.equal(report.executionMode, 'report_only');
  assert.equal(report.controls.length, CONTROL_DEFINITIONS.length);
  for (const value of Object.values(report.authority)) assert.equal(value, false);
  assert.deepEqual(report.authority, { ...AUTHORITY });
  assert.match(report.notice, /not an approval/);
});

test('pull request state blockers', () => {
  assertBlocked(evaluate((s) => { s.pullRequest.isDraft = true; }), 'non_draft:PR_IS_DRAFT');
  assertBlocked(evaluate((s) => { s.pullRequest.mergeStateStatus = 'DIRTY'; }), 'merge_state_clean:MERGE_STATE_NOT_CLEAN');
  assertBlocked(evaluate((s) => { s.pullRequest.behindBy = 3; }), 'base_current:BEHIND_BASE');
  assertBlocked(evaluate((s) => { s.pullRequest.body = ''; }), 'description:DESCRIPTION_MISSING');
  assertBlocked(evaluate((s) => { delete s.pullRequest.number; }), 'pr_identity:PR_NUMBER_MISSING');
});

test('exact head/base pins and repository identity are enforced', () => {
  assertBlocked(evaluate((s) => { s.pullRequest.headSha = '1111111'; }), 'head_pin:HEAD_SHA_NOT_EXACT');
  assertBlocked(evaluate((s) => { s.pullRequest.baseSha = 'ABC'; }), 'base_pin:BASE_SHA_NOT_EXACT');
  assertBlocked(evaluate(null, { policy: { expectedHeadSha: STALE } }), 'head_pin:HEAD_SHA_MISMATCH');
  assertBlocked(evaluate(null, { policy: { expectedBaseSha: STALE } }), 'base_pin:BASE_SHA_MISMATCH');
  assertBlocked(evaluate(null, { policy: { expectedRepository: 'someone/else' } }), 'repository_identity:REPOSITORY_MISMATCH');
});

test('review threads, approvals, and independent human review are enforced', () => {
  assertBlocked(evaluate((s) => { s.reviewThreads.push({ id: 't2', isResolved: false }); }), 'review_threads:UNRESOLVED_REVIEW_THREADS');
  assertBlocked(evaluate((s) => { s.reviews[0].commitId = STALE; }), 'approvals:APPROVALS_INSUFFICIENT');
  assertBlocked(
    evaluate((s) => { s.reviews.push({ author: 'other', authorType: 'User', state: 'CHANGES_REQUESTED', commitId: HEAD }); }),
    'approvals:CHANGES_REQUESTED'
  );
  assertBlocked(
    evaluate((s) => { s.reviews = [{ author: 'copilot-pull-request-reviewer[bot]', authorType: 'Bot', state: 'APPROVED', commitId: HEAD }]; }),
    'independent_human_review:INDEPENDENT_HUMAN_REVIEW_MISSING'
  );
  assertBlocked(
    evaluate((s) => { s.reviews = [{ author: 'Codynunn42', authorType: 'User', state: 'APPROVED', commitId: HEAD }]; }),
    'approvals:APPROVALS_INSUFFICIENT'
  );

  const optional = evaluate((s) => { s.policy.requireIndependentHumanReview = false; });
  assert.equal(optional.controls.find((control) => control.id === 'independent_human_review').status, 'not_applicable');
});

test('evidence blockers: secret scan, rollback, validation, dispositions, authority requests', () => {
  assertBlocked(evaluate((s) => { delete s.evidence.secretScan; }), 'secret_scan:SECRET_SCAN_MISSING');
  assertBlocked(evaluate((s) => { s.evidence.secretScan.headSha = STALE; }), 'secret_scan:SECRET_SCAN_NOT_EXACT_HEAD');
  assertBlocked(evaluate((s) => { delete s.evidence.rollback; }), 'rollback_evidence:ROLLBACK_EVIDENCE_MISSING');
  assertBlocked(evaluate((s) => { s.evidence.validation[0].headSha = STALE; }), 'validation_records:VALIDATION_NOT_EXACT_HEAD');
  assertBlocked(evaluate((s) => { delete s.evidence.dependencyScan; }), 'dependency_scan:DEPENDENCY_SCAN_MISSING');
  assertBlocked(evaluate((s) => { delete s.evidence.policyDisposition; }), 'policy_disposition:POLICY_DISPOSITION_MISSING');
  assertBlocked(evaluate((s) => { delete s.evidence.deploymentImpact; }), 'deployment_impact:DEPLOYMENT_IMPACT_MISSING');

  const authorityRequest = evaluate((s) => { s.requestedActions = ['merge', 'approve']; });
  assertBlocked(authorityRequest, 'authority_boundary:AUTHORITY_REQUEST_REFUSED');
  for (const value of Object.values(authorityRequest.authority)) assert.equal(value, false);

  const docsOnly = evaluate((s) => {
    s.files = [{ path: 'docs/notes.md', additions: 5, deletions: 0 }];
    delete s.evidence.rollback;
    delete s.evidence.dependencyScan;
  });
  assert.equal(docsOnly.readiness, 'READY');
  assert.equal(docsOnly.controls.find((control) => control.id === 'rollback_evidence').status, 'not_applicable');
  assert.equal(docsOnly.controls.find((control) => control.id === 'dependency_scan').status, 'not_applicable');
});

test('missing PR author blocks and never lets approvals count', () => {
  const report = evaluate((s) => {
    delete s.pullRequest.author;
    s.policy.requireIndependentHumanReview = false;
    s.reviews = [{ author: 'Codynunn42', authorType: 'User', state: 'APPROVED', commitId: HEAD }];
  });
  assertBlocked(report, 'pr_identity:PR_AUTHOR_MISSING');
  assertBlocked(report, 'approvals:APPROVALS_INSUFFICIENT');
});

test('snapshot-embedded policy can only tighten the caller policy', () => {
  const loosened = evaluate((s) => {
    s.reviews = [];
    s.policy = { minApprovals: 0, requiredChecks: ['validate'], maxChangedFiles: 500, packageManager: 'npm' };
  }, { policy: { requiredChecks: ['validate', 'CodeQL'] } });
  assertBlocked(loosened, 'approvals:APPROVALS_INSUFFICIENT');
  assert.equal(loosened.policy.minApprovals, 1);
  assert.equal(loosened.policy.maxChangedFiles, 50);
  assert.equal(loosened.policy.packageManager, 'pnpm');
  assert.deepEqual(loosened.policy.requiredChecks, ['validate', 'CodeQL']);

  const tightened = evaluate((s) => { s.policy.minApprovals = 2; }, { policy: { minApprovals: 1 } });
  assertBlocked(tightened, 'approvals:APPROVALS_INSUFFICIENT');
  assert.equal(tightened.policy.minApprovals, 2);
});

test('bounded scope limits are enforced', () => {
  assertBlocked(evaluate(null, { policy: { maxChangedFiles: 2 } }), 'bounded_scope:TOO_MANY_FILES');
  assertBlocked(evaluate(null, { policy: { maxChangedLines: 10 } }), 'bounded_scope:TOO_MANY_LINES');
});

test('lockfile alignment and restricted generated/runtime/secret paths', () => {
  assertBlocked(
    evaluate((s) => { s.files[2].dependencyChange = true; }),
    'lockfile_alignment:LOCKFILE_NOT_ALIGNED'
  );

  const aligned = evaluate((s) => {
    s.files[2].dependencyChange = true;
    s.files.push({ path: 'pnpm-lock.yaml', additions: 12, deletions: 3 });
  });
  assert.equal(aligned.readiness, 'READY');

  assertBlocked(
    evaluate((s) => { s.files.push({ path: 'package-lock.json', additions: 100, deletions: 0 }); }),
    'lockfile_alignment:FOREIGN_LOCKFILE'
  );

  for (const [filePath, code] of [
    ['node_modules/left-pad/index.js', 'restricted_paths:RESTRICTED_GENERATED_PATH'],
    ['dist/bundle.min.js', 'restricted_paths:RESTRICTED_GENERATED_PATH'],
    ['runtime/session.sqlite', 'restricted_paths:RESTRICTED_RUNTIME_PATH'],
    ['.env', 'restricted_paths:RESTRICTED_SECRET_PATH'],
    ['config/service.pem', 'restricted_paths:RESTRICTED_SECRET_PATH']
  ]) {
    assertBlocked(evaluate((s) => { s.files.push({ path: filePath, additions: 1, deletions: 0 }); }), code);
  }

  const example = evaluate((s) => { s.files.push({ path: '.env.example', additions: 1, deletions: 0 }); });
  assert.ok(!codes(example).some((id) => id.startsWith('restricted_paths:')));
});

test('required checks: missing, failed, stale head, undeclared, and in-progress', () => {
  assertBlocked(evaluate((s) => { s.checks = s.checks.filter((check) => check.name !== 'CodeQL'); }), 'required_checks:REQUIRED_CHECKS_NOT_PASSED');
  const failed = evaluate((s) => { s.checks[0].conclusion = 'FAILURE'; });
  assertBlocked(failed, 'required_checks:REQUIRED_CHECKS_NOT_PASSED');
  assertBlocked(failed, 'check_inventory:CHECKS_FAILED');
  const stale = evaluate((s) => { s.checks.forEach((check) => { check.headSha = STALE; }); });
  assertBlocked(stale, 'required_checks:REQUIRED_CHECKS_NOT_PASSED');
  assertBlocked(stale, 'check_inventory:NO_EXACT_HEAD_CHECKS');
  assertBlocked(evaluate((s) => { s.policy.requiredChecks = []; }), 'required_checks:REQUIRED_CHECKS_UNDECLARED');
  assertBlocked(
    evaluate((s) => { s.checks[1].status = 'IN_PROGRESS'; s.checks[1].conclusion = null; }),
    'check_inventory:CHECKS_PENDING'
  );
  assertBlocked(evaluate(null, { policy: { requiredChecks: ['validate', 'deploy-preview'] } }), 'required_checks:REQUIRED_CHECKS_NOT_PASSED');
});

test('local-only Git preflight snapshots can never be READY', () => {
  const report = evaluate((s) => { s.source = 'local-git-preflight'; s.localOnly = true; });
  assertBlocked(report, 'pr_identity:LOCAL_ONLY_PREFLIGHT');
  assert.equal(report.localOnly, true);
  assert.match(renderMarkdownReport(report), /LOCAL-ONLY GIT PREFLIGHT/);
  assert.equal(parseRepositoryFromRemote('git@github.com:owner/repo.git'), 'owner/repo');
  assert.deepEqual(parseNumstat('3\t1\tsrc/a.js\0-\t-\timg.png\0'), [
    { path: 'src/a.js', additions: 3, deletions: 1 },
    { path: 'img.png', additions: 0, deletions: 0 }
  ]);
});

test('FacePlane manifest is valid, read-only, and requests no write/execute capability', () => {
  const manifest = buildPrGovernanceManifest();
  const result = validatePrGovernanceManifest(manifest);
  assert.equal(result.valid, true, result.violations.join(', '));
  assert.equal(result.evaluation.status, 'REGISTERABLE');
  assert.equal(result.evaluation.executionMode, 'read_only');
  assert.equal(result.evaluation.approvalRequired, false);
  assert.deepEqual(manifest.requestedCapabilities, ['FACEPLANE_READ', 'READ_STATUS']);
  assert.equal(manifest.approvalModel, 'read_only');
  assert.deepEqual(manifest.metadata.commands, ['faceplane.pr.audit']);
  assert.equal(manifest.metadata.requiredScope, 'repo:read');

  const escalated = validatePrGovernanceManifest({ ...manifest, requestedCapabilities: ['FACEPLANE_READ', 'DEPLOYMENT_EXECUTE'] });
  assert.equal(escalated.valid, false);
  assert.ok(escalated.violations.includes('CAPABILITY_NOT_PERMITTED:DEPLOYMENT_EXECUTE'));
});

test('faceplane.pr.audit command is report-only and requires repo:read', async () => {
  const direct = await handleFaceplanePrAudit({ snapshot: readySnapshot(), format: 'markdown' });
  assert.equal(direct.success, true);
  assert.equal(direct.data.executionMode, 'report_only');
  assert.equal(direct.data.readiness, 'READY');
  assert.match(direct.data.markdown, /grants no merge, approval, deployment, or thread-resolution authority/);
  for (const value of Object.values(direct.data.authority)) assert.equal(value, false);

  const rejected = await handleFaceplanePrAudit({ snapshot: readySnapshot(), merge: true });
  assert.equal(rejected.error, 'UNSUPPORTED_PAYLOAD_FIELDS');
  assert.deepEqual(rejected.details.fields, ['merge']);
  assert.equal((await handleFaceplanePrAudit({})).error, 'INVALID_PAYLOAD');

  const policyInput = { tenant: 'nunncloud', command: 'faceplane.pr.audit', actor: 'pr-auditor@nunncloud.local', role: 'platform' };
  const deniedPolicy = evaluatePolicy({ ...policyInput, scopes: ['audit:read'] });
  assert.equal(deniedPolicy.allowed, false);
  assert.equal(deniedPolicy.reason, 'SCOPE_REQUIRED');
  assert.equal(deniedPolicy.details.requiredScope, 'repo:read');
  assert.equal(evaluatePolicy({ ...policyInput, scopes: ['repo:read'] }).allowed, true);

  resetLocalPassportState();
  const dispatch = (scopes) => dispatchCommand(
    signLocalCommand({
      tenant: 'nunncloud',
      command: 'faceplane.pr.audit',
      source: 'sentinel',
      payload: { snapshot: readySnapshot() }
    }),
    {
      principal: { tenant: 'nunncloud', actor: 'pr-auditor@nunncloud.local', role: 'platform', scopes },
      source: 'sentinel'
    }
  );

  const governed = await dispatch(['repo:read']);
  assert.equal(governed.success, true);
  assert.equal(governed.data.executionMode, 'report_only');
  assert.equal(governed.data.report.readiness, 'READY');

  const denied = await dispatch(['audit:read']);
  assert.equal(denied.success, false);
  assert.equal(denied.error, 'SCOPE_REQUIRED');
});

test('check:faceplane-pr CLI renders JSON/Markdown and exits by readiness', () => {
  assert.throws(() => parseArgs([]), /exactly one of --snapshot/);
  assert.throws(() => parseArgs(['--snapshot', 'a.json', '--local-git']), /exactly one of --snapshot/);
  assert.deepEqual(parseArgs(['--snapshot', 'a.json', '--require-check', 'x', '--require-check', 'y']).requireChecks, ['x', 'y']);

  const json = captureIo();
  const ready = run(['--snapshot', FIXTURE, '--format', 'json'], json.io);
  assert.equal(ready.exitCode, 0);
  const parsed = JSON.parse(json.stdout());
  assert.equal(parsed.readiness, 'READY');
  assert.equal(parsed.score, 100);
  assert.ok(Array.isArray(parsed.findings));
  assert.equal(parsed.controls.length, CONTROL_DEFINITIONS.length);

  const markdown = captureIo();
  const blocked = run(['--snapshot', FIXTURE, '--require-check', 'missing-check'], markdown.io);
  assert.equal(blocked.exitCode, 1);
  assert.match(markdown.stdout(), /Readiness: \*\*BLOCKED\*\*/);
  assert.match(markdown.stdout(), /REQUIRED_CHECKS_NOT_PASSED/);
  assert.match(markdown.stdout(), /missing-check \(not reported at exact head\)/);
  assert.match(markdown.stdout(), /## Controls/);

  const reportOnly = captureIo();
  assert.equal(run(['--snapshot', FIXTURE, '--require-check', 'missing-check', '--exit-zero'], reportOnly.io).exitCode, 0);

  const usage = captureIo();
  assert.equal(run(['--bogus'], usage.io).exitCode, 2);
  assert.match(usage.stderr(), /Unknown argument/);
});
