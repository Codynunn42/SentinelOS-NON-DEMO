#!/usr/bin/env node
// check:faceplane-pr — read-only PR Governance FacePlane report.
// Consumes a JSON PR snapshot (--snapshot) or performs a local-only Git preflight (--local-git).
// Never merges, approves, deploys, resolves threads, closes issues/PRs, or changes governance status.

const fs = require('fs');
const path = require('path');
const { evaluatePrGovernance } = require('../apps/sentinel/src/faceplanes/prGovernance/prGovernanceEvaluator');
const { renderReport } = require('../apps/sentinel/src/faceplanes/prGovernance/prGovernanceReport');
const { buildLocalGitSnapshot } = require('../apps/sentinel/src/faceplanes/prGovernance/localGitPreflight');

const USAGE = `Usage: pnpm check:faceplane-pr -- (--snapshot <file.json> | --local-git [--base <ref>]) [options]

Options:
  --policy <file.json>           Policy overrides (requiredChecks, minApprovals, ...)
  --require-check <name>         Required check name at exact head (repeatable)
  --min-approvals <n>            Minimum exact-head approvals
  --require-independent-review   Require an independent human approval
  --expect-repo <owner/name>     Expected repository identity
  --expect-pr <number>           Expected pull request number
  --expect-head <sha>            Expected exact 40-char head SHA
  --expect-base <sha>            Expected exact 40-char base SHA
  --format <markdown|json>       Output format (default: markdown)
  --out <file>                   Also write the report to a file
  --exit-zero                    Exit 0 even when BLOCKED (report-only)

Exit codes: 0 READY, 1 BLOCKED, 2 usage/input error.
Report-only: grants no merge, approval, deployment, or thread-resolution authority.`;

class UsageError extends Error {}

function parseArgs(argv) {
  const options = { format: 'markdown', policy: {}, requireChecks: [] };
  const takeValue = (index, flag) => {
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new UsageError(`${flag} requires a value`);
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--':
        break;
      case '--snapshot':
        options.snapshot = takeValue(index, arg);
        index += 1;
        break;
      case '--local-git':
        options.localGit = true;
        break;
      case '--base':
        options.baseRef = takeValue(index, arg);
        index += 1;
        break;
      case '--policy':
        options.policyFile = takeValue(index, arg);
        index += 1;
        break;
      case '--require-check':
        options.requireChecks.push(takeValue(index, arg));
        index += 1;
        break;
      case '--min-approvals': {
        const value = Number.parseInt(takeValue(index, arg), 10);
        if (!Number.isInteger(value) || value < 0) throw new UsageError('--min-approvals must be a non-negative integer');
        options.policy.minApprovals = value;
        index += 1;
        break;
      }
      case '--require-independent-review':
        options.policy.requireIndependentHumanReview = true;
        break;
      case '--expect-repo':
        options.policy.expectedRepository = takeValue(index, arg);
        index += 1;
        break;
      case '--expect-pr': {
        const value = Number.parseInt(takeValue(index, arg), 10);
        if (!Number.isInteger(value) || value <= 0) throw new UsageError('--expect-pr must be a positive integer');
        options.policy.expectedPrNumber = value;
        index += 1;
        break;
      }
      case '--expect-head':
        options.policy.expectedHeadSha = takeValue(index, arg);
        index += 1;
        break;
      case '--expect-base':
        options.policy.expectedBaseSha = takeValue(index, arg);
        index += 1;
        break;
      case '--format':
        options.format = takeValue(index, arg);
        index += 1;
        if (!['markdown', 'json'].includes(options.format)) throw new UsageError('--format must be markdown or json');
        break;
      case '--out':
        options.out = takeValue(index, arg);
        index += 1;
        break;
      case '--exit-zero':
        options.exitZero = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new UsageError(`Unknown argument: ${arg}`);
    }
  }

  if (!options.help) {
    if (Boolean(options.snapshot) === Boolean(options.localGit)) {
      throw new UsageError('Provide exactly one of --snapshot <file.json> or --local-git');
    }
    if (options.baseRef && !options.localGit) {
      throw new UsageError('--base is only valid with --local-git');
    }
  }

  return options;
}

function readJsonFile(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new UsageError(`Unable to read ${label} JSON from ${filePath}: ${error.message}`);
  }
}

function run(argv, io = {}) {
  const stdout = io.stdout || process.stdout;
  const stderr = io.stderr || process.stderr;
  const cwd = io.cwd || process.cwd();

  let options;
  try {
    options = parseArgs(argv);
    if (options.help) {
      stdout.write(`${USAGE}\n`);
      return { exitCode: 0 };
    }

    const filePolicy = options.policyFile ? readJsonFile(path.resolve(cwd, options.policyFile), 'policy') : {};
    const policy = { ...filePolicy, ...options.policy };
    if (options.requireChecks.length) policy.requiredChecks = options.requireChecks;

    const snapshot = options.localGit
      ? buildLocalGitSnapshot({ cwd, baseRef: options.baseRef })
      : readJsonFile(path.resolve(cwd, options.snapshot), 'snapshot');

    const report = evaluatePrGovernance(snapshot, { policy, now: io.now });
    const output = renderReport(report, options.format);
    stdout.write(output);

    if (options.out) {
      fs.writeFileSync(path.resolve(cwd, options.out), output);
    }
    if (options.localGit && Array.isArray(snapshot.preflightErrors) && snapshot.preflightErrors.length) {
      stderr.write(`Local-only Git preflight incomplete: ${snapshot.preflightErrors.join('; ')}\n`);
    }

    const exitCode = report.readiness === 'READY' || options.exitZero ? 0 : 1;
    return { exitCode, report };
  } catch (error) {
    stderr.write(`${error instanceof UsageError ? error.message : `check:faceplane-pr failed: ${error.message}`}\n\n${USAGE}\n`);
    return { exitCode: 2 };
  }
}

if (require.main === module) {
  process.exitCode = run(process.argv.slice(2)).exitCode;
}

module.exports = {
  parseArgs,
  run
};
