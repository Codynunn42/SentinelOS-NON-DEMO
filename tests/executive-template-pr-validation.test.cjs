const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/executive-template-pr-validation.yml'), 'utf8');
const shell = workflow.match(/        run: \|\n([\s\S]*?)\n      - name:/)[1]
  .split('\n').map(line => line.slice(10)).join('\n');
const script = workflow.match(/          node <<'NODE'\n([\s\S]*?)\n          NODE/)[1]
  .split('\n').map(line => line.slice(10)).join('\n');
const sha = 'a'.repeat(40);
const workflowSha = 'b'.repeat(40);
const target = { state: 'open', base: { ref: 'main' }, head: { sha, repo: { full_name: 'owner/repo' } }, html_url: 'https://github.com/owner/repo/pull/48' };
const inventory = { total_count: 1, check_runs: [{ name: 'CI', status: 'completed', conclusion: 'success' }] };

function run({ first = target, final = target, pages = [inventory], env = {}, failFinal = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr49-regression-'));
  try {
    const preload = path.join(dir, 'mock.cjs');
    const output = path.join(dir, 'output');
    const summary = path.join(dir, 'summary');
    const calls = path.join(dir, 'calls');
    fs.writeFileSync(preload, `
      const fs = require('node:fs');
      const fixture = JSON.parse(process.env.FIXTURE);
      let prReads = 0;
      global.fetch = async (url, options) => {
        fs.appendFileSync(process.env.CALLS, url + '\\n');
        if (!url.startsWith('https://mock.invalid/repos/owner/repo/')) throw new Error('Unexpected URL');
        if (options.headers.get('authorization') !== 'Bearer mock-token') throw new Error('Missing authorization');
        if (url.endsWith('/pulls/48')) {
          prReads++;
          if (prReads === 2 && fixture.failFinal) return { ok: false, status: 503 };
          return { ok: true, json: async () => prReads === 1 ? fixture.first : fixture.final };
        }
        const page = Number(new URL(url).searchParams.get('page'));
        if (!url.includes('/commits/' + '${sha}' + '/check-runs?')) throw new Error('Wrong pinned SHA');
        return { ok: true, json: async () => fixture.pages[page - 1] || fixture.pages.at(-1) };
      };
    `);
    const result = spawnSync(process.execPath, ['--require', preload, '-e', script], {
      encoding: 'utf8', timeout: 10000,
      env: { ...process.env, GH_TOKEN: 'mock-token', EXPECTED_HEAD_SHA: sha,
        WORKFLOW_SHA: workflowSha, VALIDATION_SCOPE: 'current-pr-checks',
        GITHUB_API_URL: 'https://mock.invalid', GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary, CALLS: calls,
        FIXTURE: JSON.stringify({ first, final, pages, failFinal }), ...env }
    });
    const read = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    return { ...result, output: read(output), summary: read(summary), calls: read(calls).trim().split('\n').filter(Boolean) };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
function rejected(options, message) {
  const r = run(options);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, message);
  assert.equal(r.output, '');
  assert.equal(r.summary, '');
  return r;
}

test('shell permits only main plus explicit confirmation', () => {
  for (const [ref, confirmation, status] of [
    ['refs/heads/main', 'true', 0], ['refs/heads/other', 'true', 1],
    ['refs/heads/main', 'false', 1], ['refs/heads/main', '', 1]
  ]) {
    const r = spawnSync('bash', ['-c', shell], { encoding: 'utf8', env: { ...process.env, WORKFLOW_REF: ref, CONFIRM_READ_ONLY: confirmation } });
    assert.equal(r.status, status, r.stderr);
  }
});

test('stable target publishes both SHAs with bounded snapshot and provenance claims', () => {
  const r = run();
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.calls.length, 3);
  assert.ok(r.calls[0].endsWith('/pulls/48'));
  assert.ok(r.calls[2].endsWith('/pulls/48'));
  assert.equal(r.output, `head_sha=${sha}\nworkflow_sha=${workflowSha}\n`);
  assert.ok(r.summary.includes(workflowSha));
  assert.match(r.summary, /snapshot; recheck before any later action/);
  assert.match(r.summary, /do not prove review or branch protection/);
  assert.match(r.summary, /existing check results only/);
});

for (const [name, changed, error] of [
  ['head changes', { head: { ...target.head, sha: 'c'.repeat(40) } }, /head moved/],
  ['PR closes', { state: 'closed' }, /not open/],
  ['base changes', { base: { ref: 'other' } }, /no longer targets main/],
  ['repository changes', { head: { ...target.head, repo: { full_name: 'fork/repo' } } }, /not in this repository/]
]) {
  test(`rejects ${name} during inventory before publishing`, () => {
    const r = rejected({ final: { ...target, ...changed } }, error);
    assert.equal(r.calls.length, 3);
  });
  test(`rejects initial invalid target: ${name}`, () => {
    const r = rejected({ first: { ...target, ...changed } }, error);
    assert.equal(r.calls.length, 1);
  });
}

test('failed final metadata read publishes nothing', () => rejected({ failFinal: true }, /final metadata \(HTTP 503\)/));
test('malformed inputs fail before API access', () => {
  for (const env of [{ EXPECTED_HEAD_SHA: 'invalid' }, { WORKFLOW_SHA: '' }, { VALIDATION_SCOPE: 'execute' }]) {
    assert.equal(rejected({ env }, /SHA|scope/).calls.length, 0);
  }
});
test('empty, malformed and incomplete inventories publish nothing', () => {
  rejected({ pages: [{ total_count: 0, check_runs: [] }] }, /No checks/);
  rejected({ pages: [{ total_count: '1', check_runs: [] }] }, /invalid check-run response/);
  rejected({ pages: [{ total_count: 1, check_runs: [] }] }, /complete check set/);
});
test('pagination completes before the final metadata read', () => {
  const r = run({ pages: [{ total_count: 2, check_runs: inventory.check_runs }, { total_count: 2, check_runs: inventory.check_runs }] });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.calls.length, 4);
  assert.ok(r.calls[2].endsWith('page=2'));
  assert.ok(r.calls[3].endsWith('/pulls/48'));
  assert.match(r.summary, /Checks found: 2/);
});
test('reports failed and pending checks as inventory without implying acceptance', () => {
  const r = run({ pages: [{ total_count: 2, check_runs: [
    { name: 'failed', status: 'completed', conclusion: 'failure' },
    { name: 'pending', status: 'queued', conclusion: null }
  ] }] });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.summary, /"failure"/);
  assert.match(r.summary, /"pending"/);
  assert.match(r.summary, /do not constitute review acceptance/);
});
