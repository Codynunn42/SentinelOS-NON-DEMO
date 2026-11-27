// Sentinel PR Governance FacePlane local-only Git preflight.
// Uses read-only git plumbing against the local checkout. The resulting snapshot is labeled
// local-git-preflight and can never evaluate as READY: it is not GitHub pull request evidence.

const { execFileSync } = require('child_process');
const { LOCAL_GIT_SOURCE, SNAPSHOT_SCHEMA } = require('./prGovernanceEvaluator');

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
  'overrides',
  'resolutions',
  'pnpm'
];

function runGit(cwd, args) {
  return execFileSync('git', ['--no-optional-locks', ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 32 * 1024 * 1024
  });
}

function tryGit(cwd, args, errors, label) {
  try {
    return runGit(cwd, args);
  } catch (error) {
    errors.push(`${label}: git ${args[0]} failed`);
    return null;
  }
}

function parseRepositoryFromRemote(url) {
  if (typeof url !== 'string') return null;
  const match = url.trim().match(/[:/]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/);
  return match ? `${match[1]}/${match[2]}` : null;
}

function parseNumstat(output) {
  if (!output) return [];
  return output
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const [additions, deletions, ...rest] = entry.split('\t');
      return {
        path: rest.join('\t'),
        additions: additions === '-' ? 0 : Number.parseInt(additions, 10),
        deletions: deletions === '-' ? 0 : Number.parseInt(deletions, 10)
      };
    })
    .filter((file) => file.path && Number.isInteger(file.additions) && Number.isInteger(file.deletions));
}

function readJsonAt(cwd, revision, filePath) {
  try {
    return JSON.parse(runGit(cwd, ['show', `${revision}:${filePath}`]));
  } catch (error) {
    return null;
  }
}

function dependencyFieldsChanged(before, after) {
  return DEPENDENCY_FIELDS.some((field) => {
    return JSON.stringify((before || {})[field] || null) !== JSON.stringify((after || {})[field] || null);
  });
}

function buildLocalGitSnapshot(options = {}) {
  const cwd = options.cwd || process.cwd();
  const baseRef = options.baseRef || 'origin/main';
  const errors = [];

  if (!/^[A-Za-z0-9._/][A-Za-z0-9._/~^-]*$/.test(baseRef)) {
    throw new Error(`INVALID_BASE_REF: ${JSON.stringify(baseRef)}`);
  }

  const head = (tryGit(cwd, ['rev-parse', '--verify', 'HEAD^{commit}'], errors, 'head') || '').trim();
  const base = (tryGit(cwd, ['rev-parse', '--verify', `${baseRef}^{commit}`], errors, `base ${baseRef}`) || '').trim();
  const remote = tryGit(cwd, ['remote', 'get-url', 'origin'], errors, 'repository');
  const repository = parseRepositoryFromRemote(remote);
  const branch = (tryGit(cwd, ['rev-parse', '--abbrev-ref', 'HEAD'], errors, 'branch') || '').trim();

  let behindBy;
  let files;
  if (head && base) {
    const behind = tryGit(cwd, ['rev-list', '--count', `${head}..${base}`], errors, 'behind count');
    behindBy = behind === null ? undefined : Number.parseInt(behind.trim(), 10);

    const mergeBase = (tryGit(cwd, ['merge-base', base, head], errors, 'merge base') || '').trim();
    if (mergeBase) {
      const numstat = tryGit(cwd, ['diff', '--numstat', '--no-renames', '-z', mergeBase, head], errors, 'changed files');
      if (numstat !== null) {
        files = parseNumstat(numstat).map((file) => {
          if (!/(^|\/)package\.json$/.test(file.path)) return file;
          return {
            ...file,
            dependencyChange: dependencyFieldsChanged(
              readJsonAt(cwd, mergeBase, file.path),
              readJsonAt(cwd, head, file.path)
            )
          };
        });
      }
    }
  }

  return {
    schema: SNAPSHOT_SCHEMA,
    source: LOCAL_GIT_SOURCE,
    localOnly: true,
    label: 'LOCAL-ONLY GIT PREFLIGHT: no GitHub pull request, check, review, or scan evidence is included.',
    repository: options.repository || repository || undefined,
    pullRequest: {
      headSha: head || undefined,
      baseSha: base || undefined,
      headRefName: branch || undefined,
      baseRefName: baseRef,
      behindBy
    },
    files,
    preflightErrors: errors
  };
}

module.exports = {
  buildLocalGitSnapshot,
  dependencyFieldsChanged,
  parseNumstat,
  parseRepositoryFromRemote
};
