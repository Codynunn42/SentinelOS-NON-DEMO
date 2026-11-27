// Sentinel PR Governance FacePlane evaluator
// Purpose: Report exact missing governance/compliance evidence for a pull request snapshot.
// Boundary: Read-only. This module never grants merge, approval, deployment, or thread-resolution authority.

const REPORT_SCHEMA = 'sentinel.faceplane.pr-governance.report.v1';
const SNAPSHOT_SCHEMA = 'sentinel.faceplane.pr-snapshot.v1';
const LOCAL_GIT_SOURCE = 'local-git-preflight';

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

const AUTHORITY = Object.freeze({
  mergeGranted: false,
  approvalGranted: false,
  deploymentGranted: false,
  threadResolutionGranted: false,
  issueOrPrClosureGranted: false,
  governanceStatusChangeGranted: false
});

const PERMITTED_ACTIONS = Object.freeze(['read', 'status', 'report']);

const PROHIBITED_ACTIONS = Object.freeze([
  'merge',
  'approve',
  'deploy',
  'resolve_threads',
  'close_issue',
  'close_pr',
  'change_governance_status'
]);

const DEFAULT_POLICY = Object.freeze({
  expectedRepository: null,
  expectedPrNumber: null,
  expectedHeadSha: null,
  expectedBaseSha: null,
  requiredChecks: [],
  minApprovals: 1,
  requireIndependentHumanReview: false,
  nonIndependentReviewers: [],
  maxChangedFiles: 50,
  maxChangedLines: 2000,
  minDescriptionLength: 20,
  packageManager: 'pnpm'
});

const CONTROL_DEFINITIONS = [
  ['pr_identity', 'Pull request identity'],
  ['head_pin', 'Exact 40-char head SHA pin'],
  ['base_pin', 'Exact 40-char base SHA pin'],
  ['repository_identity', 'Repository identity'],
  ['non_draft', 'Pull request is not a draft'],
  ['merge_state_clean', 'Clean merge state'],
  ['base_current', 'Zero commits behind base'],
  ['description', 'Pull request description'],
  ['check_inventory', 'Exact-head check inventory'],
  ['required_checks', 'Required checks passed at exact head'],
  ['review_threads', 'No unresolved review threads'],
  ['approvals', 'Approvals at exact head'],
  ['independent_human_review', 'Independent human review'],
  ['authority_boundary', 'Authority boundary (report-only)'],
  ['bounded_scope', 'Bounded change scope'],
  ['rollback_evidence', 'Rollback evidence for runtime changes'],
  ['validation_records', 'Validation records at exact head'],
  ['secret_scan', 'Exact-head secret scan evidence'],
  ['dependency_scan', 'Exact-head dependency scan for dependency-manifest changes'],
  ['policy_disposition', 'Policy disposition'],
  ['deployment_impact', 'Deployment-impact disposition'],
  ['restricted_paths', 'No restricted generated/runtime/secret paths'],
  ['lockfile_alignment', 'Package manifest and lockfile alignment']
];

const FAILING_CHECK_CONCLUSIONS = new Set([
  'failure',
  'cancelled',
  'timed_out',
  'action_required',
  'startup_failure',
  'stale',
  'error'
]);

const PASSING_RESULTS = new Set(['pass', 'passed', 'success', 'clean', 'no_findings']);
const POLICY_DISPOSITIONS = new Set(['compliant', 'exception_approved']);
const DEPLOYMENT_DISPOSITIONS = new Set(['none', 'separate_governed_deployment', 'held']);

const DEPENDENCY_MANIFEST_NAMES = new Set([
  'package.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-workspace.yaml',
  'requirements.txt',
  'pyproject.toml',
  'poetry.lock',
  'Pipfile',
  'Pipfile.lock',
  'go.mod',
  'go.sum',
  'Cargo.toml',
  'Cargo.lock',
  'Gemfile',
  'Gemfile.lock',
  'composer.json',
  'composer.lock',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts'
]);

const LOCKFILES_BY_MANAGER = {
  pnpm: 'pnpm-lock.yaml',
  npm: 'package-lock.json',
  yarn: 'yarn.lock'
};

const RESTRICTED_PATH_RULES = [
  { category: 'generated', pattern: /(^|\/)node_modules\// },
  { category: 'generated', pattern: /(^|\/)coverage\// },
  { category: 'generated', pattern: /(^|\/)(dist|build|\.next|\.turbo)\// },
  { category: 'generated', pattern: /\.min\.(js|css)$/ },
  { category: 'generated', pattern: /\.tsbuildinfo$/ },
  { category: 'runtime', pattern: /^runtime\// },
  { category: 'runtime', pattern: /(^|\/)mock-results\// },
  { category: 'runtime', pattern: /(^|\/)\.sentinel\// },
  { category: 'runtime', pattern: /\.(pid|sqlite|sqlite3|db)$/ },
  { category: 'secret', pattern: /(^|\/)\.env(\.(?!example$|sample$|template$)[^/]+)?$/ },
  { category: 'secret', pattern: /\.(pem|key|p12|pfx|jks|keystore|kdbx)$/ },
  { category: 'secret', pattern: /(^|\/)id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/ },
  { category: 'secret', pattern: /(^|\/)(credentials|secrets?)\.(json|ya?ml|txt|env)$/ },
  { category: 'secret', pattern: /(^|\/)\.(npmrc|pypirc|netrc)$/ }
];

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function lower(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isExactSha(value) {
  return typeof value === 'string' && SHA_PATTERN.test(value);
}

function headLabel(head) {
  return isExactSha(head) ? head : '<exact head SHA>';
}

function basename(filePath) {
  const parts = filePath.split('/');
  return parts[parts.length - 1];
}

function dirname(filePath) {
  const index = filePath.lastIndexOf('/');
  return index === -1 ? '' : filePath.slice(0, index);
}

function positiveIntegerOr(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function normalizePolicy(snapshotPolicy, options) {
  // The caller's policy is authoritative. A snapshot-embedded policy may only tighten it:
  // it can never lower minimums, raise limits, drop required checks, or swap the package manager.
  const caller = { ...DEFAULT_POLICY, ...(isRecord(options.policy) ? options.policy : {}) };
  const embedded = isRecord(snapshotPolicy) ? snapshotPolicy : {};
  const pick = (key) => (caller[key] !== undefined && caller[key] !== null ? caller[key] : embedded[key]);
  const listOf = (value) => (Array.isArray(value) ? value : []);
  const stricterMin = (key) => {
    const base = Number.isInteger(caller[key]) && caller[key] >= 0 ? caller[key] : DEFAULT_POLICY[key];
    return Number.isInteger(embedded[key]) && embedded[key] > base ? embedded[key] : base;
  };
  const stricterMax = (key) => {
    const base = positiveIntegerOr(caller[key], DEFAULT_POLICY[key]);
    return Number.isInteger(embedded[key]) && embedded[key] > 0 && embedded[key] < base ? embedded[key] : base;
  };
  const merged = {
    expectedRepository: pick('expectedRepository'),
    expectedPrNumber: pick('expectedPrNumber'),
    expectedHeadSha: pick('expectedHeadSha'),
    expectedBaseSha: pick('expectedBaseSha'),
    requiredChecks: [...listOf(caller.requiredChecks), ...listOf(embedded.requiredChecks)],
    minApprovals: stricterMin('minApprovals'),
    requireIndependentHumanReview: caller.requireIndependentHumanReview === true || embedded.requireIndependentHumanReview === true,
    nonIndependentReviewers: [...listOf(caller.nonIndependentReviewers), ...listOf(embedded.nonIndependentReviewers)],
    maxChangedFiles: stricterMax('maxChangedFiles'),
    maxChangedLines: stricterMax('maxChangedLines'),
    minDescriptionLength: stricterMin('minDescriptionLength'),
    packageManager: caller.packageManager
  };

  return {
    expectedRepository: hasText(merged.expectedRepository) ? merged.expectedRepository.trim() : null,
    expectedPrNumber: Number.isInteger(merged.expectedPrNumber) ? merged.expectedPrNumber : null,
    expectedHeadSha: hasText(merged.expectedHeadSha) ? merged.expectedHeadSha.trim() : null,
    expectedBaseSha: hasText(merged.expectedBaseSha) ? merged.expectedBaseSha.trim() : null,
    requiredChecks: Array.isArray(merged.requiredChecks)
      ? [...new Set(merged.requiredChecks.filter(hasText).map((name) => name.trim()))]
      : [],
    minApprovals: Number.isInteger(merged.minApprovals) && merged.minApprovals >= 0 ? merged.minApprovals : DEFAULT_POLICY.minApprovals,
    requireIndependentHumanReview: merged.requireIndependentHumanReview === true,
    nonIndependentReviewers: Array.isArray(merged.nonIndependentReviewers)
      ? merged.nonIndependentReviewers.filter(hasText).map(lower)
      : [],
    maxChangedFiles: positiveIntegerOr(merged.maxChangedFiles, DEFAULT_POLICY.maxChangedFiles),
    maxChangedLines: positiveIntegerOr(merged.maxChangedLines, DEFAULT_POLICY.maxChangedLines),
    minDescriptionLength: positiveIntegerOr(merged.minDescriptionLength, DEFAULT_POLICY.minDescriptionLength),
    packageManager: LOCKFILES_BY_MANAGER[lower(merged.packageManager)] ? lower(merged.packageManager) : DEFAULT_POLICY.packageManager
  };
}

function normalizeFiles(files) {
  if (!Array.isArray(files)) return null;

  return files
    .map((file) => {
      if (typeof file === 'string') {
        return { path: file.trim().replace(/\\/g, '/').replace(/^\.\//, ''), additions: null, deletions: null, dependencyChange: null };
      }
      if (!isRecord(file)) return null;
      const filePath = hasText(file.path) ? file.path : hasText(file.filename) ? file.filename : '';
      return {
        path: filePath.trim().replace(/\\/g, '/').replace(/^\.\//, ''),
        additions: Number.isInteger(file.additions) && file.additions >= 0 ? file.additions : null,
        deletions: Number.isInteger(file.deletions) && file.deletions >= 0 ? file.deletions : null,
        dependencyChange: typeof file.dependencyChange === 'boolean' ? file.dependencyChange : null
      };
    })
    .filter((file) => file && hasText(file.path));
}

function isDocumentationPath(filePath) {
  return /\.(md|mdx|txt|rst)$/i.test(filePath) || /^docs\//.test(filePath);
}

function isTestPath(filePath) {
  return /(^|\/)__tests__\//.test(filePath) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(filePath) || /^tests\//.test(filePath);
}

function isRuntimePath(filePath) {
  if (isDocumentationPath(filePath) || isTestPath(filePath)) return false;

  return (
    /^(apps|services|lambda|infrastructure|deploy|azure|config|configs)\//.test(filePath) ||
    /^\.github\/workflows\//.test(filePath) ||
    /(^|\/)Dockerfile[^/]*$/.test(filePath) ||
    /(^|\/)(docker-)?compose[^/]*\.ya?ml$/.test(filePath) ||
    ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'netlify.toml'].includes(filePath)
  );
}

function isDependencyManifest(filePath) {
  const name = basename(filePath);
  return DEPENDENCY_MANIFEST_NAMES.has(name) || /^requirements[^/]*\.txt$/.test(name);
}

function createCollector() {
  const findings = [];
  const controls = new Map();

  for (const [id, title] of CONTROL_DEFINITIONS) {
    controls.set(id, { id, title, status: 'pass', detail: '', findings: [] });
  }

  function record(control, severity, code, message, missingEvidence) {
    controls.get(control).findings.push(code);
    findings.push({
      id: `${control}:${code}`,
      control,
      severity,
      code,
      message,
      missingEvidence
    });
  }

  return {
    controls,
    findings,
    fail(control, code, message, missingEvidence) {
      controls.get(control).status = 'fail';
      record(control, 'blocker', code, message, missingEvidence);
    },
    warn(control, code, message, missingEvidence) {
      record(control, 'warning', code, message, missingEvidence);
    },
    passing(control) {
      return controls.get(control).status === 'pass';
    },
    detail(control, text) {
      controls.get(control).detail = text;
    },
    notApplicable(control, text) {
      const entry = controls.get(control);
      if (entry.status === 'pass') entry.status = 'not_applicable';
      entry.detail = text;
    }
  };
}

function evaluateIdentity(c, pr, snapshot, policy) {
  if (!pr) {
    c.fail('pr_identity', 'PR_METADATA_MISSING', 'Pull request metadata is missing.', 'pullRequest object with number, title, headSha, and baseSha');
  } else {
    if (!Number.isInteger(pr.number) || pr.number <= 0) {
      c.fail('pr_identity', 'PR_NUMBER_MISSING', 'Pull request number is missing or invalid.', 'pullRequest.number (positive integer)');
    } else if (policy.expectedPrNumber !== null && pr.number !== policy.expectedPrNumber) {
      c.fail('pr_identity', 'PR_NUMBER_MISMATCH', `Pull request #${pr.number} does not match expected #${policy.expectedPrNumber}.`, `snapshot for pull request #${policy.expectedPrNumber}`);
    }

    if (!hasText(pr.title)) {
      c.fail('pr_identity', 'PR_TITLE_MISSING', 'Pull request title is missing.', 'pullRequest.title');
    }

    if (!hasText(pr.author)) {
      c.fail('pr_identity', 'PR_AUTHOR_MISSING', 'Pull request author is missing; self-approval cannot be excluded.', 'pullRequest.author (login)');
    }
  }

  if (snapshot.localOnly === true || snapshot.source === LOCAL_GIT_SOURCE) {
    c.fail('pr_identity', 'LOCAL_ONLY_PREFLIGHT', 'Snapshot is a local-only Git preflight; it is not GitHub pull request evidence.', 'GitHub pull request snapshot (JSON) for the exact PR head');
  }

  if (c.passing('pr_identity')) {
    c.detail('pr_identity', `PR #${pr.number}: ${pr.title.trim()}`);
  }

  const head = pr ? pr.headSha : undefined;
  const base = pr ? pr.baseSha : undefined;

  for (const [control, label, value, expected, field] of [
    ['head_pin', 'Head', head, policy.expectedHeadSha, 'pullRequest.headSha'],
    ['base_pin', 'Base', base, policy.expectedBaseSha, 'pullRequest.baseSha']
  ]) {
    const prefix = label.toUpperCase();
    if (!isExactSha(value)) {
      c.fail(control, `${prefix}_SHA_NOT_EXACT`, `${label} SHA is missing or is not an exact 40-char lowercase hex SHA.`, `${field} (exact 40-char lowercase hex SHA)`);
    } else if (expected && value !== expected) {
      c.fail(control, `${prefix}_SHA_MISMATCH`, `${label} SHA ${value} does not match pinned ${expected}.`, `${field} equal to pinned ${expected}`);
    } else {
      c.detail(control, expected ? `${value} (matches pin)` : value);
    }
  }

  if (isExactSha(head) && head === base) {
    c.fail('head_pin', 'HEAD_EQUALS_BASE', 'Head SHA equals base SHA; there is no change to govern.', 'distinct head and base SHAs');
  }

  const repository = snapshot.repository;
  if (!hasText(repository) || !REPOSITORY_PATTERN.test(repository.trim())) {
    c.fail('repository_identity', 'REPOSITORY_MISSING', 'Repository identity is missing or not in owner/name form.', 'repository ("owner/name")');
  } else if (policy.expectedRepository && lower(repository) !== lower(policy.expectedRepository)) {
    c.fail('repository_identity', 'REPOSITORY_MISMATCH', `Repository ${repository.trim()} does not match expected ${policy.expectedRepository}.`, `snapshot for repository ${policy.expectedRepository}`);
  } else {
    c.detail('repository_identity', repository.trim());
  }
}

function evaluatePullRequestState(c, pr, policy) {
  const prRecord = pr || {};
  const isDraft = typeof prRecord.isDraft === 'boolean' ? prRecord.isDraft : prRecord.draft;

  if (typeof isDraft !== 'boolean') {
    c.fail('non_draft', 'DRAFT_STATE_MISSING', 'Draft state is not reported.', 'pullRequest.isDraft (boolean)');
  } else if (isDraft) {
    c.fail('non_draft', 'PR_IS_DRAFT', 'Pull request is a draft.', 'pull request marked ready for review by its author');
  } else {
    c.detail('non_draft', 'ready for review');
  }

  const mergeState = hasText(prRecord.mergeStateStatus) ? prRecord.mergeStateStatus.trim().toUpperCase() : '';
  if (!mergeState) {
    c.fail('merge_state_clean', 'MERGE_STATE_MISSING', 'Merge state is not reported.', 'pullRequest.mergeStateStatus');
  } else if (mergeState !== 'CLEAN') {
    c.fail('merge_state_clean', 'MERGE_STATE_NOT_CLEAN', `Merge state is ${mergeState}, not CLEAN.`, 'pullRequest.mergeStateStatus = CLEAN');
  } else {
    c.detail('merge_state_clean', 'CLEAN');
  }

  if (!Number.isInteger(prRecord.behindBy) || prRecord.behindBy < 0) {
    c.fail('base_current', 'BEHIND_COUNT_MISSING', 'Commits-behind-base count is not reported.', 'pullRequest.behindBy (integer)');
  } else if (prRecord.behindBy > 0) {
    c.fail('base_current', 'BEHIND_BASE', `Head is ${prRecord.behindBy} commit(s) behind base.`, 'pullRequest.behindBy = 0');
  } else {
    c.detail('base_current', '0 commits behind base');
  }

  const body = typeof prRecord.body === 'string' ? prRecord.body.replace(/<!--[\s\S]*?-->/g, '').trim() : '';
  if (!body) {
    c.fail('description', 'DESCRIPTION_MISSING', 'Pull request description is empty.', 'pullRequest.body (non-empty description)');
  } else if (body.length < policy.minDescriptionLength) {
    c.fail('description', 'DESCRIPTION_TOO_SHORT', `Pull request description has ${body.length} characters; minimum is ${policy.minDescriptionLength}.`, `pullRequest.body with at least ${policy.minDescriptionLength} characters`);
  } else {
    c.detail('description', `${body.length} characters`);
  }
}

function evaluateChecks(c, checks, head, policy) {
  if (!Array.isArray(checks)) {
    c.fail('check_inventory', 'CHECK_INVENTORY_MISSING', 'Check inventory is not reported.', `checks[] for head ${headLabel(head)}`);
    c.fail('required_checks', 'CHECK_INVENTORY_MISSING', 'Required checks cannot be verified without a check inventory.', `checks[] for head ${headLabel(head)}`);
    return;
  }

  const normalized = checks.filter(isRecord).map((check) => ({
    name: hasText(check.name) ? check.name.trim() : '(unnamed)',
    headSha: check.headSha,
    status: lower(check.status),
    conclusion: lower(check.conclusion)
  }));
  const unattributed = normalized.filter((check) => !isExactSha(check.headSha));
  const headChecks = isExactSha(head) ? normalized.filter((check) => check.headSha === head) : [];
  const nonHeadCount = normalized.length - headChecks.length - unattributed.length;

  if (unattributed.length) {
    c.fail('check_inventory', 'CHECK_SHA_MISSING', `${unattributed.length} check(s) lack an exact 40-char headSha: ${unattributed.map((check) => check.name).join(', ')}.`, 'checks[].headSha (exact 40-char SHA) for every check');
  }

  if (!headChecks.length) {
    c.fail('check_inventory', 'NO_EXACT_HEAD_CHECKS', 'No checks were reported for the exact head SHA.', `checks[] with headSha = ${headLabel(head)}`);
  }

  const pending = headChecks.filter((check) => check.status !== 'completed');
  if (pending.length) {
    c.fail('check_inventory', 'CHECKS_PENDING', `Checks not completed at exact head: ${pending.map((check) => check.name).join(', ')}.`, 'completed status for every exact-head check');
  }

  const failed = headChecks.filter((check) => check.status === 'completed' && FAILING_CHECK_CONCLUSIONS.has(check.conclusion));
  if (failed.length) {
    c.fail('check_inventory', 'CHECKS_FAILED', `Checks failed at exact head: ${failed.map((check) => `${check.name} (${check.conclusion})`).join(', ')}.`, 'non-failing conclusion for every exact-head check');
  }

  if (c.passing('check_inventory')) {
    c.detail('check_inventory', `${headChecks.length} exact-head check(s) completed${nonHeadCount ? `; ${nonHeadCount} non-head check(s) ignored` : ''}`);
  }

  if (!policy.requiredChecks.length) {
    c.fail('required_checks', 'REQUIRED_CHECKS_UNDECLARED', 'No required checks are declared for this evaluation.', 'policy.requiredChecks[] (names of required checks)');
    return;
  }

  const missing = [];
  for (const name of policy.requiredChecks) {
    const matches = headChecks.filter((check) => check.name === name);
    const latest = matches[matches.length - 1];
    if (!latest) {
      missing.push(`${name} (not reported at exact head)`);
    } else if (latest.status !== 'completed') {
      missing.push(`${name} (${latest.status || 'unknown status'})`);
    } else if (latest.conclusion !== 'success') {
      missing.push(`${name} (${latest.conclusion || 'no conclusion'})`);
    }
  }

  if (missing.length) {
    c.fail('required_checks', 'REQUIRED_CHECKS_NOT_PASSED', `Required checks not passed at exact head: ${missing.join(', ')}.`, `success conclusion at head ${headLabel(head)} for: ${policy.requiredChecks.join(', ')}`);
  } else {
    c.detail('required_checks', `${policy.requiredChecks.length} required check(s) succeeded at exact head`);
  }
}

function evaluateReviewThreads(c, threads) {
  if (!Array.isArray(threads)) {
    c.fail('review_threads', 'REVIEW_THREADS_MISSING', 'Review thread inventory is not reported.', 'reviewThreads[] with isResolved state');
    return;
  }

  const unresolved = threads.filter((thread) => !isRecord(thread) || thread.isResolved !== true);
  if (unresolved.length) {
    const ids = unresolved.map((thread) => (isRecord(thread) && thread.id !== undefined && thread.id !== null ? String(thread.id) : '(unidentified)'));
    c.fail('review_threads', 'UNRESOLVED_REVIEW_THREADS', `${unresolved.length} unresolved review thread(s): ${ids.join(', ')}.`, 'resolution of every review thread by an authorized human (this FacePlane does not resolve threads)');
  } else {
    c.detail('review_threads', `${threads.length} thread(s), all resolved`);
  }
}

function isBotReviewer(review) {
  const login = lower(review.author);
  return (
    lower(review.authorType) === 'bot' ||
    /\[bot\]$/.test(login) ||
    login === 'copilot' ||
    login.startsWith('copilot-')
  );
}

function evaluateReviews(c, reviews, pr, head, policy) {
  if (!Array.isArray(reviews)) {
    c.fail('approvals', 'REVIEWS_MISSING', 'Review inventory is not reported.', 'reviews[] with author, state, and commitId');
    if (policy.requireIndependentHumanReview) {
      c.fail('independent_human_review', 'REVIEWS_MISSING', 'Independent human review cannot be verified without a review inventory.', 'reviews[] with author, authorType, state, and commitId');
    } else {
      c.notApplicable('independent_human_review', 'not required by policy');
    }
    return;
  }

  const prAuthor = pr ? lower(pr.author) : '';
  const latestByAuthor = new Map();
  for (const review of reviews.filter(isRecord)) {
    const author = lower(review.author);
    const state = hasText(review.state) ? review.state.trim().toUpperCase() : '';
    if (!author || !['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(state)) continue;
    latestByAuthor.set(author, { ...review, author, state });
  }

  const latest = [...latestByAuthor.values()];
  const changesRequested = latest.filter((review) => review.state === 'CHANGES_REQUESTED');
  if (changesRequested.length) {
    c.fail('approvals', 'CHANGES_REQUESTED', `Outstanding change requests from: ${changesRequested.map((review) => review.author).join(', ')}.`, 'change requests addressed and re-reviewed by the requesting reviewer');
  }

  const approvals = latest.filter((review) => review.state === 'APPROVED');
  const selfApprovals = approvals.filter((review) => prAuthor && review.author === prAuthor);
  const nonAuthorApprovals = prAuthor ? approvals.filter((review) => review.author !== prAuthor) : [];
  const headApprovals = nonAuthorApprovals.filter((review) => isExactSha(head) && review.commitId === head);
  const staleApprovals = nonAuthorApprovals.length - headApprovals.length;

  if (headApprovals.length < policy.minApprovals) {
    const notes = [];
    if (staleApprovals) notes.push(`${staleApprovals} approval(s) on a non-head commit`);
    if (selfApprovals.length) notes.push('author self-approval not counted');
    if (!prAuthor && approvals.length) notes.push('approvals not counted while the PR author is unknown');
    c.fail('approvals', 'APPROVALS_INSUFFICIENT', `${headApprovals.length} approval(s) at exact head; ${policy.minApprovals} required${notes.length ? ` (${notes.join('; ')})` : ''}.`, `${policy.minApprovals} approval(s) with commitId = ${headLabel(head)} from non-author reviewers`);
  }

  if (c.passing('approvals')) {
    c.detail('approvals', `${headApprovals.length} approval(s) at exact head (minimum ${policy.minApprovals})`);
  }

  if (!policy.requireIndependentHumanReview) {
    c.notApplicable('independent_human_review', 'not required by policy');
    return;
  }

  const independent = headApprovals.filter((review) => {
    return (
      lower(review.authorType) === 'user' &&
      !isBotReviewer(review) &&
      !policy.nonIndependentReviewers.includes(review.author)
    );
  });

  if (!independent.length) {
    c.fail('independent_human_review', 'INDEPENDENT_HUMAN_REVIEW_MISSING', 'No independent human approval at exact head.', `approval with commitId = ${headLabel(head)} from a human reviewer (authorType User) who is not the PR author, a bot, or a listed non-independent reviewer`);
  } else {
    c.detail('independent_human_review', `independent approval by ${independent.map((review) => review.author).join(', ')}`);
  }
}

function evaluateAuthorityBoundary(c, snapshot) {
  const requested = Array.isArray(snapshot.requestedActions)
    ? snapshot.requestedActions.filter(hasText).map(lower)
    : [];
  const refused = requested.filter((action) => !PERMITTED_ACTIONS.includes(action));

  if (refused.length) {
    c.fail('authority_boundary', 'AUTHORITY_REQUEST_REFUSED', `Requested actions exceed the report-only boundary: ${refused.join(', ')}.`, `removal of requestedActions beyond ${PERMITTED_ACTIONS.join('/')}; merge, approval, deployment, and thread resolution remain with authorized humans`);
  } else {
    c.detail('authority_boundary', 'report-only; no merge, approval, deployment, or thread-resolution authority granted');
  }
}

function evaluateScope(c, files, policy) {
  if (!files) {
    c.fail('bounded_scope', 'CHANGED_FILES_MISSING', 'Changed-file inventory is not reported.', 'files[] with path, additions, and deletions');
    return;
  }

  if (!files.length) {
    c.fail('bounded_scope', 'CHANGED_FILES_EMPTY', 'Changed-file inventory is empty.', 'files[] listing every changed path');
    return;
  }

  if (files.length > policy.maxChangedFiles) {
    c.fail('bounded_scope', 'TOO_MANY_FILES', `${files.length} files changed; limit is ${policy.maxChangedFiles}.`, `change split to at most ${policy.maxChangedFiles} files or an explicit policy.maxChangedFiles`);
  }

  const missingCounts = files.filter((file) => file.additions === null || file.deletions === null);
  if (missingCounts.length) {
    c.fail('bounded_scope', 'LINE_COUNTS_MISSING', `Line counts missing for: ${missingCounts.map((file) => file.path).join(', ')}.`, 'files[].additions and files[].deletions (integers)');
    return;
  }

  const lines = files.reduce((total, file) => total + file.additions + file.deletions, 0);
  if (lines > policy.maxChangedLines) {
    c.fail('bounded_scope', 'TOO_MANY_LINES', `${lines} lines changed; limit is ${policy.maxChangedLines}.`, `change split to at most ${policy.maxChangedLines} changed lines or an explicit policy.maxChangedLines`);
  }

  if (c.passing('bounded_scope')) {
    c.detail('bounded_scope', `${files.length} file(s), ${lines} line(s) changed`);
  }
}

function evaluateHeadEvidence(c, control, code, record, head, label, field) {
  if (!isRecord(record)) {
    c.fail(control, `${code}_MISSING`, `${label} evidence is missing.`, `${field} with tool, headSha = ${headLabel(head)}, and result = clean`);
    return;
  }

  if (!isExactSha(record.headSha) || record.headSha !== head) {
    c.fail(control, `${code}_NOT_EXACT_HEAD`, `${label} evidence is not recorded at the exact head SHA (recorded: ${hasText(record.headSha) ? record.headSha : 'none'}).`, `${field}.headSha = ${headLabel(head)}`);
  }

  const findingCount = Number.isInteger(record.findings) ? record.findings : 0;
  if (!PASSING_RESULTS.has(lower(record.result)) || findingCount > 0) {
    c.fail(control, `${code}_NOT_CLEAN`, `${label} result is ${hasText(record.result) ? record.result : 'unreported'}${findingCount ? ` with ${findingCount} finding(s)` : ''}.`, `${field}.result = clean with zero findings`);
  }

  if (c.passing(control)) {
    c.detail(control, `${hasText(record.tool) ? record.tool.trim() : 'scan'} clean at exact head`);
  }
}

function evaluateRollback(c, files, evidence) {
  if (!files) {
    c.fail('rollback_evidence', 'CHANGED_FILES_MISSING', 'Runtime impact cannot be classified without a changed-file inventory.', 'files[] with every changed path');
    return;
  }

  const runtimeFiles = files.filter((file) => isRuntimePath(file.path));
  if (!runtimeFiles.length) {
    c.notApplicable('rollback_evidence', 'no runtime paths changed');
  } else if (!isRecord(evidence.rollback) || !hasText(evidence.rollback.plan)) {
    c.fail('rollback_evidence', 'ROLLBACK_EVIDENCE_MISSING', `Runtime paths changed without rollback evidence: ${runtimeFiles.map((file) => file.path).join(', ')}.`, 'evidence.rollback.plan describing how to revert the runtime change');
  } else {
    c.detail('rollback_evidence', `rollback plan recorded for ${runtimeFiles.length} runtime path(s)`);
  }
}

function evaluateValidation(c, validation, head) {
  if (!Array.isArray(validation) || !validation.length) {
    c.fail('validation_records', 'VALIDATION_RECORDS_MISSING', 'No validation records are reported.', `evidence.validation[] with command, result = pass, and headSha = ${headLabel(head)}`);
    return;
  }

  const records = validation.map((entry) => (isRecord(entry) ? entry : {}));
  const name = (entry) => (hasText(entry.command) ? entry.command.trim() : '(unnamed)');
  const incomplete = records.filter((entry) => !hasText(entry.command));
  const stale = records.filter((entry) => !isExactSha(entry.headSha) || entry.headSha !== head);
  const failed = records.filter((entry) => !PASSING_RESULTS.has(lower(entry.result)));

  if (incomplete.length) {
    c.fail('validation_records', 'VALIDATION_COMMAND_MISSING', `${incomplete.length} validation record(s) lack the command that was run.`, 'evidence.validation[].command');
  }
  if (stale.length) {
    c.fail('validation_records', 'VALIDATION_NOT_EXACT_HEAD', `Validation not recorded at exact head: ${stale.map(name).join(', ')}.`, `evidence.validation[].headSha = ${headLabel(head)}`);
  }
  if (failed.length) {
    c.fail('validation_records', 'VALIDATION_FAILED', `Validation not passing: ${failed.map((entry) => `${name(entry)} (${hasText(entry.result) ? entry.result : 'unreported'})`).join(', ')}.`, 'evidence.validation[].result = pass');
  }
  if (c.passing('validation_records')) {
    c.detail('validation_records', `${records.length} validation record(s) passed at exact head`);
  }
}

function evaluateDependencyScan(c, files, evidence, head) {
  if (!files) {
    c.fail('dependency_scan', 'CHANGED_FILES_MISSING', 'Dependency-manifest changes cannot be classified without a changed-file inventory.', 'files[] with every changed path');
    return;
  }

  const dependencyFiles = files.filter((file) => isDependencyManifest(file.path));
  if (!dependencyFiles.length) {
    c.notApplicable('dependency_scan', 'no dependency manifests changed');
    return;
  }

  evaluateHeadEvidence(
    c,
    'dependency_scan',
    'DEPENDENCY_SCAN',
    evidence.dependencyScan,
    head,
    `Dependency scan (manifests changed: ${dependencyFiles.map((file) => file.path).join(', ')})`,
    'evidence.dependencyScan'
  );
}

function evaluateDispositions(c, evidence) {
  const disposition = isRecord(evidence.policyDisposition) ? evidence.policyDisposition : null;
  const dispositionStatus = disposition ? lower(disposition.status) : '';
  if (!dispositionStatus) {
    c.fail('policy_disposition', 'POLICY_DISPOSITION_MISSING', 'Policy disposition is not recorded.', 'evidence.policyDisposition.status (compliant | exception_approved)');
  } else if (!POLICY_DISPOSITIONS.has(dispositionStatus)) {
    c.fail('policy_disposition', 'POLICY_DISPOSITION_NOT_COMPLIANT', `Policy disposition is ${dispositionStatus}.`, 'evidence.policyDisposition.status = compliant, or exception_approved with a reference');
  } else if (dispositionStatus === 'exception_approved' && !hasText(disposition.reference)) {
    c.fail('policy_disposition', 'POLICY_EXCEPTION_REFERENCE_MISSING', 'Policy exception has no approval reference.', 'evidence.policyDisposition.reference to the recorded exception approval');
  } else {
    c.detail('policy_disposition', dispositionStatus);
  }

  const impact = isRecord(evidence.deploymentImpact) ? evidence.deploymentImpact : null;
  const impactDisposition = impact ? lower(impact.disposition) : '';
  if (!impactDisposition) {
    c.fail('deployment_impact', 'DEPLOYMENT_IMPACT_MISSING', 'Deployment-impact disposition is not recorded.', 'evidence.deploymentImpact.disposition (none | separate_governed_deployment | held) with rationale');
  } else if (!DEPLOYMENT_DISPOSITIONS.has(impactDisposition)) {
    c.fail('deployment_impact', 'DEPLOYMENT_IMPACT_INVALID', `Deployment-impact disposition ${impactDisposition} is not recognized.`, 'evidence.deploymentImpact.disposition = none | separate_governed_deployment | held');
  } else if (!hasText(impact.rationale)) {
    c.fail('deployment_impact', 'DEPLOYMENT_IMPACT_RATIONALE_MISSING', 'Deployment-impact disposition has no rationale.', 'evidence.deploymentImpact.rationale');
  } else {
    c.detail('deployment_impact', impactDisposition);
  }
}

function evaluateRestrictedPaths(c, files) {
  if (!files) {
    c.fail('restricted_paths', 'CHANGED_FILES_MISSING', 'Restricted paths cannot be screened without a changed-file inventory.', 'files[] with every changed path');
    return;
  }

  const hits = {};
  for (const file of files) {
    const rule = RESTRICTED_PATH_RULES.find((candidate) => candidate.pattern.test(file.path));
    if (rule) {
      hits[rule.category] = hits[rule.category] || [];
      hits[rule.category].push(file.path);
    }
  }

  for (const category of Object.keys(hits)) {
    c.fail('restricted_paths', `RESTRICTED_${category.toUpperCase()}_PATH`, `Restricted ${category} path(s) changed: ${hits[category].join(', ')}.`, `removal of ${category} paths from the change set`);
  }

  if (c.passing('restricted_paths')) {
    c.detail('restricted_paths', 'no restricted paths changed');
  }
}

function evaluateLockfileAlignment(c, files, evidence, head, policy) {
  if (!files) {
    c.fail('lockfile_alignment', 'CHANGED_FILES_MISSING', 'Lockfile alignment cannot be checked without a changed-file inventory.', 'files[] with every changed path');
    return;
  }

  const expectedLockfile = LOCKFILES_BY_MANAGER[policy.packageManager];
  const knownLockfiles = Object.values(LOCKFILES_BY_MANAGER);
  const changed = new Set(files.map((file) => file.path));
  const foreign = files.filter((file) => knownLockfiles.includes(basename(file.path)) && basename(file.path) !== expectedLockfile);

  if (foreign.length) {
    c.fail('lockfile_alignment', 'FOREIGN_LOCKFILE', `Lockfile(s) for a different package manager changed: ${foreign.map((file) => file.path).join(', ')}.`, `only ${expectedLockfile} for package manager ${policy.packageManager}`);
  }

  const manifests = files.filter((file) => basename(file.path) === 'package.json');
  const alignment = isRecord(evidence.lockfileAlignment) ? evidence.lockfileAlignment : null;
  const alignmentVerified = Boolean(
    alignment &&
    isExactSha(alignment.headSha) &&
    alignment.headSha === head &&
    PASSING_RESULTS.has(lower(alignment.result))
  );
  const unaligned = manifests.filter((manifest) => {
    if (manifest.dependencyChange === false) return false;
    const dir = dirname(manifest.path);
    const lockfileChanged = [dir ? `${dir}/${expectedLockfile}` : expectedLockfile, expectedLockfile].some((candidate) => changed.has(candidate));
    if (lockfileChanged) return false;
    return !(manifest.dependencyChange === null && alignmentVerified);
  });

  if (unaligned.length) {
    c.fail(
      'lockfile_alignment',
      'LOCKFILE_NOT_ALIGNED',
      `Package manifest(s) changed without a matching ${expectedLockfile} change: ${unaligned.map((file) => `${file.path} (${file.dependencyChange === true ? 'dependency fields changed' : 'dependency impact unknown'})`).join(', ')}.`,
      `${expectedLockfile} updated alongside dependency changes, files[].dependencyChange = false for non-dependency edits, or evidence.lockfileAlignment with result = pass at head ${headLabel(head)} (e.g. ${policy.packageManager} install --frozen-lockfile)`
    );
  }

  const lockfiles = files.filter((file) => basename(file.path) === expectedLockfile);
  if (lockfiles.length && !manifests.length) {
    c.warn('lockfile_alignment', 'LOCKFILE_ONLY_CHANGE', `${expectedLockfile} changed without a package manifest change.`, 'confirmation that lockfile-only resolution changes are intended');
  }

  if (c.passing('lockfile_alignment')) {
    if (!manifests.length && !lockfiles.length) {
      c.notApplicable('lockfile_alignment', 'no package manifests or lockfiles changed');
    } else {
      c.detail('lockfile_alignment', 'package manifests and lockfiles aligned');
    }
  }
}

function evaluatePrGovernance(snapshot, options = {}) {
  const input = isRecord(snapshot) ? snapshot : {};
  const evidence = isRecord(input.evidence) ? input.evidence : {};
  const pr = isRecord(input.pullRequest) ? input.pullRequest : null;
  const policy = normalizePolicy(input.policy, isRecord(options) ? options : {});
  const files = normalizeFiles(input.files);
  const head = pr ? pr.headSha : undefined;
  const c = createCollector();

  evaluateIdentity(c, pr, input, policy);
  evaluatePullRequestState(c, pr, policy);
  evaluateChecks(c, input.checks, head, policy);
  evaluateReviewThreads(c, input.reviewThreads);
  evaluateReviews(c, input.reviews, pr, head, policy);
  evaluateAuthorityBoundary(c, input);
  evaluateScope(c, files, policy);
  evaluateRollback(c, files, evidence);
  evaluateValidation(c, evidence.validation, head);
  evaluateHeadEvidence(c, 'secret_scan', 'SECRET_SCAN', evidence.secretScan, head, 'Secret scan', 'evidence.secretScan');
  evaluateDependencyScan(c, files, evidence, head);
  evaluateDispositions(c, evidence);
  evaluateRestrictedPaths(c, files);
  evaluateLockfileAlignment(c, files, evidence, head, policy);

  const controls = [...c.controls.values()];
  const applicable = controls.filter((control) => control.status !== 'not_applicable');
  const passed = applicable.filter((control) => control.status === 'pass');
  const blockers = c.findings.filter((finding) => finding.severity === 'blocker');
  const localOnly = input.localOnly === true || input.source === LOCAL_GIT_SOURCE;

  return {
    schema: REPORT_SCHEMA,
    facePlaneId: 'pr-governance',
    executionMode: 'report_only',
    evidenceSource: localOnly ? LOCAL_GIT_SOURCE : hasText(input.source) ? input.source.trim() : 'snapshot',
    localOnly,
    generatedAt: hasText(options.now) ? options.now : new Date().toISOString(),
    repository: hasText(input.repository) ? input.repository.trim() : null,
    pullRequest: {
      number: pr && Number.isInteger(pr.number) ? pr.number : null,
      title: pr && hasText(pr.title) ? pr.title.trim() : null,
      headSha: pr && hasText(pr.headSha) ? pr.headSha : null,
      baseSha: pr && hasText(pr.baseSha) ? pr.baseSha : null
    },
    readiness: blockers.length === 0 && !localOnly ? 'READY' : 'BLOCKED',
    score: applicable.length ? Math.round((passed.length / applicable.length) * 100) : 0,
    summary: {
      controls: controls.length,
      applicable: applicable.length,
      passed: passed.length,
      failed: applicable.length - passed.length,
      notApplicable: controls.length - applicable.length,
      blockers: blockers.length,
      warnings: c.findings.length - blockers.length
    },
    findings: c.findings,
    controls,
    policy,
    authority: { ...AUTHORITY },
    notice: 'Report-only evaluation. READY means no governance evidence is missing; it is not an approval and grants no merge, approval, deployment, or thread-resolution authority.'
  };
}

module.exports = {
  AUTHORITY,
  CONTROL_DEFINITIONS,
  DEFAULT_POLICY,
  LOCAL_GIT_SOURCE,
  PERMITTED_ACTIONS,
  PROHIBITED_ACTIONS,
  REPORT_SCHEMA,
  SNAPSHOT_SCHEMA,
  evaluatePrGovernance,
  isDependencyManifest,
  isExactSha,
  isRuntimePath
};
