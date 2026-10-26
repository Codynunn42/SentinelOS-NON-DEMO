const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const fixtures = path.join(__dirname, 'fixtures/executive-template');
const date = '2031-02-03';
const generator = 'scripts/orchestrate-executive-template.js';
const wrapper = 'scripts/run-governance-flow.js';

function fixture(context) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'executive-report-test-'));
  context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(fixtures, dir, { recursive: true });
  const config = JSON.parse(fs.readFileSync(path.join(dir, 'synthetic-config.json'), 'utf8'));
  const configPath = path.join(dir, 'config.json');
  const output = path.join(dir, 'output');
  const save = () => fs.writeFileSync(configPath, JSON.stringify(config));
  save();
  const run = (extra = [], script = generator) => {
    save();
    const defaults = [`--config=${configPath}`, `--date=${date}`, `--output-dir=${output}`]
      .filter((arg) => !extra.some((override) => override.split('=')[0] === arg.split('=')[0]));
    return spawnSync(process.execPath, [
      path.join(root, script), ...defaults, ...extra
    ], { encoding: 'utf8', cwd: dir });
  };
  const read = (name = 'TEMPLATE') => fs.readFileSync(path.join(output, `EXECUTIVE_${name}_${date}.md`), 'utf8');
  return { dir, config, configPath, output, save, run, read };
}

function passed(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

for (const [sheet, idField] of Object.entries({
  Portfolio: 'Work Item ID', Actions: 'Action ID', Decisions: 'Decision ID',
  Evidence: 'Evidence ID', Risks: 'Risk ID', 'VR Workforce': 'Assignment ID'
})) {
  test(`rejects conflicting and identical duplicate ${sheet} IDs before writing either report`, (context) => {
    const f = fixture(context);
    const file = path.join(f.dir, 'synthetic-register.json');
    const register = JSON.parse(fs.readFileSync(file, 'utf8'));
    const original = register.sheets[sheet][0];
    for (const duplicate of [
      { ...original, Status: 'PASS', Disposition: 'PASS' },
      { ...original },
      { ...original, [idField]: ` ${original[idField]} `, Status: 'Closed' }
    ]) {
      register.sheets[sheet] = [original, duplicate];
      fs.writeFileSync(file, JSON.stringify(register));
      const result = f.run();
      assert.notEqual(result.status, 0);
      assert.ok(result.stderr.includes(`Duplicate controlling ID in ${sheet}: ${idField}`), result.stderr);
      assert.ok(!fs.existsSync(f.output), 'neither report should be written');
    }
  });

  test(`distinguishes missing ${sheet} sheet from a present empty sheet in both reports`, (context) => {
    const f = fixture(context);
    const file = path.join(f.dir, 'synthetic-register.json');
    const register = JSON.parse(fs.readFileSync(file, 'utf8'));
    delete register.sheets[sheet];
    fs.writeFileSync(file, JSON.stringify(register));
    passed(f.run(['--skip-pre-escalation', '--skip-ledger'], wrapper));
    const missing = `UNVERIFIED - ${sheet} sheet is absent`;
    assert.ok(f.read().includes(missing));
    assert.ok(f.read('PACKET').includes(missing));
    assert.doesNotMatch(f.read(), /No matching register records/);
    if (sheet === 'Actions') {
      assert.match(f.read(), /Register cross-check: UNVERIFIED - Actions sheet is absent/);
      assert.doesNotMatch(f.read(), /Register cross-check: no matching row/);
    }
    register.sheets[sheet] = [];
    fs.writeFileSync(file, JSON.stringify(register));
    passed(f.run());
    assert.ok(!f.read().includes(missing));
    assert.ok(!f.read('PACKET').includes(missing));
    assert.match(f.read(), /No matching register records/);
  });
}

test('duplicate controlling Portfolio rows are rejected even with a matching decision control', (context) => {
  const f = fixture(context);
  f.config.controls = [{
    disposition: 'DEMO-001',
    register: { sheet: 'Decisions', fields: ['Decision / Direction'], pattern: 'Retain synthetic hold' },
    requiredValue: 'HOLD', message: 'Synthetic control must inspect unambiguous rows'
  }];
  const file = path.join(f.dir, 'synthetic-register.json');
  const register = JSON.parse(fs.readFileSync(file, 'utf8'));
  register.sheets.Portfolio.push({ ...register.sheets.Portfolio[0], Status: 'PASS' });
  fs.writeFileSync(file, JSON.stringify(register));
  assert.match(f.run().stderr, /Duplicate controlling ID in Portfolio/);
  assert.ok(!fs.existsSync(f.output));
});

test('checks referencing an absent configured sheet are explicitly unverified', (context) => {
  const f = fixture(context);
  f.config.checks = [{
    register: { sheet: 'Synthetic approvals', fields: ['Status'], pattern: 'HOLD' },
    source: { source: 'review', pattern: 'DEMO-001 remains HOLD' },
    message: 'Synthetic approval discrepancy'
  }];
  passed(f.run());
  for (const report of [f.read(), f.read('PACKET')]) {
    assert.match(report, /UNVERIFIED - Synthetic approvals sheet is absent/);
    assert.doesNotMatch(report, /CONFLICT - Synthetic approval discrepancy/);
  }
});

test('generates both external reports using only synthetic inputs and passes the existing gate', (context) => {
  const f = fixture(context);
  passed(f.run(['--skip-pre-escalation', '--skip-ledger'], wrapper));
  const full = f.read();
  const packet = f.read('PACKET');
  assert.match(full, /DEMO-001: Register-recorded: HOLD/);
  assert.match(full, /Runtime verdict: Source-reported: PENDING/);
  assert.match(full, /Fixture coordinator/);
  assert.match(full, /Independent review pending/);
  assert.match(full, /SAMPLE-001/);
  assert.match(full, /example\.invalid/);
  assert.match(full, /CHOICE-001/);
  assert.match(full, /CONCERN-001/);
  assert.match(full, /ROLE-001/);
  assert.match(full, /date passed 1 days ago; recorded status unchanged/);
  assert.match(full, /SHA-256 [a-f0-9]{64}/);
  assert.match(full, /no matching row; this is not a register assignment/);
  assert.match(full, /Preparation is source-reported complete; acceptance remains open/);
  assert.match(full, /\(0 days old|0 days old/);
  assert.match(full, /\(.*source-reported, not independently verified/);
  assert.match(full, /\(.*synthetic|Synthetic review/);
  assert.match(full, /\]\(\.\/EXECUTIVE_PACKET_2031-02-03\.md\)/);
  for (const flag of ['staging', 'commit', 'runtime', 'external_contact']) {
    assert.match(packet, new RegExp(`${flag}_authority: false`));
  }
  assert.doesNotMatch(full + packet, /\{\{[^}]+\}\}/);
  assert.ok(!full.includes(f.dir), 'local source/register paths must not be emitted as provenance');
  assert.equal(fs.statSync(path.join(f.output, `EXECUTIVE_TEMPLATE_${date}.md`)).mode & 0o777, 0o600);
});

test('requires explicit configuration and output without discovering private defaults', (context) => {
  const f = fixture(context);
  const missing = spawnSync(process.execPath, [path.join(root, generator)], { encoding: 'utf8' });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /Explicit --config/);
  f.save();
  const noOutput = spawnSync(process.execPath, [path.join(root, generator), `--config=${f.configPath}`], { encoding: 'utf8' });
  assert.notEqual(noOutput.status, 0);
  assert.match(noOutput.stderr, /outputDir/);
  assert.ok(!fs.existsSync(f.output));
});

test('uses explicit source dates, never source filenames or mtimes, and labels old rows', (context) => {
  const f = fixture(context);
  f.config.sources.review.date = '2031-01-01';
  const result = f.run();
  passed(result);
  assert.match(f.read(), /STALE - last source-reported: HOLD/);
  assert.match(f.read(), /configured summary withheld/);
  assert.doesNotMatch(f.read(), /Preparation is source-reported complete/);
  const register = JSON.parse(fs.readFileSync(path.join(f.dir, 'synthetic-register.json')));
  register.sheets.Portfolio[0]['Last Updated'] = '2031-01-01';
  fs.writeFileSync(path.join(f.dir, 'synthetic-register.json'), JSON.stringify(register));
  passed(f.run());
  assert.match(f.read(), /row 2031-01-01; STALE \(33 days\)/);
});

test('missing latest sources do not cause older assertions to be substituted', (context) => {
  const f = fixture(context);
  delete f.config.register;
  f.config.sources.newer = { path: 'absent.md', label: 'Missing synthetic source', date: '2031-02-04' };
  f.config.dispositionSources.push('newer');
  passed(f.run());
  assert.match(f.read(), /UNVERIFIED - no explicit assertion in latest dated source set/);
  assert.match(f.read(), /MISSING/);
  assert.doesNotMatch(f.read('PACKET'), /DEMO-001: Source-reported: HOLD/);
});

test('future source dates are unverified and summaries withheld', (context) => {
  const f = fixture(context);
  f.config.sources.review.date = '2031-02-04';
  delete f.config.register;
  passed(f.run());
  assert.match(f.read(), /UNVERIFIED - future-dated: HOLD/);
  assert.match(f.read(), /configured summary withheld/);
});

test('flags same-date narrative conflicts and register/narrative disagreement', (context) => {
  const f = fixture(context);
  fs.writeFileSync(path.join(f.dir, 'other.md'), 'DEMO-001 remains PASS.');
  f.config.sources.other = { path: 'other.md', date, label: 'Contradictory synthetic review' };
  f.config.dispositionSources.push('other');
  passed(f.run());
  assert.match(f.read(), /CONFLICT - register\/narrative disagree/);
  assert.match(f.read(), /CONFLICT - HOLD vs PASS/);
});

test('missing controlling register row cannot be replaced by a narrative assertion', (context) => {
  const f = fixture(context);
  const file = path.join(f.dir, 'synthetic-register.json');
  const register = JSON.parse(fs.readFileSync(file));
  register.sheets.Portfolio = [];
  fs.writeFileSync(file, JSON.stringify(register));
  passed(f.run());
  assert.match(f.read(), /UNVERIFIED - no Portfolio row/);
});

test('source checks resolve only from fresh configured evidence and never close actions', (context) => {
  const f = fixture(context);
  f.config.checks = [{
    register: { sheet: 'Actions', fields: ['Action'], pattern: 'acceptance criteria' },
    source: { source: 'review', pattern: 'DEMO-001 remains HOLD' },
    resolution: { source: 'review', pattern: 'Not yet present' },
    message: 'Synthetic acceptance discrepancy'
  }];
  passed(f.run());
  assert.match(f.read(), /CONFLICT - Synthetic acceptance discrepancy/);
  f.config.checks[0].resolution.pattern = 'Preparation reported complete';
  passed(f.run());
  assert.doesNotMatch(f.read(), /CONFLICT - Synthetic acceptance discrepancy/);
  assert.match(f.read(), /In Progress/);
  f.config.sources.review.date = '2031-01-01';
  passed(f.run());
  assert.match(f.read(), /configured summary withheld/);
});

test('decision controls detect a conflicting register change even without narrative support', (context) => {
  const f = fixture(context);
  f.config.controls = [{
    disposition: 'DEMO-001',
    register: { sheet: 'Decisions', fields: ['Decision / Direction'], pattern: 'Retain synthetic hold' },
    requiredValue: 'PASS',
    message: 'Synthetic controlling decision mismatch'
  }];
  passed(f.run());
  assert.match(f.read(), /CONFLICT - Synthetic controlling decision mismatch/);
});

test('a more specific register interpretation cannot hide a changed controlling row status', (context) => {
  const f = fixture(context);
  f.config.dispositions[0].registerPatterns = [{
    status: 'HOLD', field: 'Executive Disposition', pattern: 'Retain hold', value: 'HOLD'
  }];
  const file = path.join(f.dir, 'synthetic-register.json');
  const register = JSON.parse(fs.readFileSync(file));
  register.sheets.Portfolio[0]['Executive Disposition'] = 'Retain hold';
  register.sheets.Portfolio[0].Status = 'PASS';
  fs.writeFileSync(file, JSON.stringify(register));
  passed(f.run());
  assert.match(f.read('PACKET'), /DEMO-001: CONFLICT - register\/narrative disagree/);
});

test('follow-up cross-check renders recorded owner and status without claiming access completion', (context) => {
  const f = fixture(context);
  f.config.followups[0].register.pattern = 'acceptance criteria';
  passed(f.run());
  assert.match(f.read(), /TASK-001: In Progress, owner Fixture coordinator/);
  assert.match(f.read(), /No access changes were tested/);
});

test('invalid dates, source references, regexes, and register shapes fail before writing', (context) => {
  const f = fixture(context);
  assert.notEqual(f.run(['--date=2031-02-30']).status, 0);
  f.config.sections.queue = 'unknown';
  assert.notEqual(f.run().status, 0);
  f.config.sections.queue = 'review';
  f.config.dispositions[0].patterns[0].pattern = '[';
  assert.notEqual(f.run().status, 0);
  f.config.dispositions[0].patterns[0].pattern = 'HOLD';
  fs.writeFileSync(path.join(f.dir, 'synthetic-register.json'), '{"sheets":{"Portfolio":{}}}');
  assert.notEqual(f.run().status, 0);
  assert.ok(!fs.existsSync(f.output));
});

test('explicitly empty options and invalid controls are errors, not silent defaults', (context) => {
  const f = fixture(context);
  assert.match(f.run(['--register=']).stderr, /register must be a nonempty string/);
  assert.match(f.run(['--date=']).stderr, /Invalid date/);
  assert.match(f.run(['--output-dir=']).stderr, /must be a nonempty string/);
  f.config.controls = [{
    disposition: 'DEMO-001', message: 'Synthetic invalid control',
    register: { sheet: 'Decisions', fields: ['Disposition'], pattern: 'will not match' }
  }];
  assert.match(f.run().stderr, /Required value must be a nonempty string/);
  assert.ok(!fs.existsSync(f.output));
});

test('both templates must validate before either report is written', (context) => {
  const f = fixture(context);
  const checkout = path.join(f.dir, 'synthetic-checkout');
  fs.mkdirSync(path.join(checkout, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(checkout, 'docs/governance'), { recursive: true });
  fs.copyFileSync(path.join(root, generator), path.join(checkout, generator));
  fs.copyFileSync(path.join(root, 'docs/governance/EXECUTIVE_TEMPLATE_CANONICAL.md'),
    path.join(checkout, 'docs/governance/EXECUTIVE_TEMPLATE_CANONICAL.md'));
  passed(spawnSync('git', ['init', '--quiet', checkout], { encoding: 'utf8' }));
  const result = spawnSync(process.execPath, [
    path.join(checkout, generator), `--config=${f.configPath}`, `--date=${date}`, `--output-dir=${f.output}`
  ], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Cannot read template/);
  assert.ok(!fs.existsSync(f.output));
});

test('external output cannot target this worktree directly or through symlinks', (context) => {
  const f = fixture(context);
  assert.match(f.run([`--output-dir=${path.join(root, 'private-output')}`]).stderr, /outside every registered/);
  fs.symlinkSync(root, path.join(f.dir, 'repository-link'), 'dir');
  assert.match(f.run([`--output-dir=${path.join(f.dir, 'repository-link/nested/output')}`]).stderr, /outside every registered/);
  assert.ok(!fs.existsSync(f.output));
});

test('external output cannot target a different repository through nonexistent subdirectories', (context) => {
  const f = fixture(context);
  const other = path.join(f.dir, 'other-repository');
  fs.mkdirSync(other);
  passed(spawnSync('git', ['init', '--quiet', other], { encoding: 'utf8' }));
  assert.match(f.run([`--output-dir=${path.join(other, 'not-created/reports')}`]).stderr, /inside another repository/);
});

test('report file symlinks are refused without modifying their targets', (context) => {
  const f = fixture(context);
  fs.mkdirSync(f.output);
  const target = path.join(f.dir, 'do-not-change.txt');
  fs.writeFileSync(target, 'unchanged');
  fs.symlinkSync(target, path.join(f.output, `EXECUTIVE_TEMPLATE_${date}.md`));
  assert.match(f.run().stderr, /Refusing non-regular report destination/);
  assert.equal(fs.readFileSync(target, 'utf8'), 'unchanged');
  assert.ok(!fs.existsSync(path.join(f.output, `EXECUTIVE_PACKET_${date}.md`)));
});

test('dangling report symlinks are refused without creating their targets', (context) => {
  const f = fixture(context);
  fs.mkdirSync(f.output);
  const target = path.join(f.dir, 'not-created.txt');
  fs.symlinkSync(target, path.join(f.output, `EXECUTIVE_TEMPLATE_${date}.md`));
  assert.match(f.run().stderr, /Refusing non-regular report destination/);
  assert.ok(!fs.existsSync(target));
});

test('template-looking input text is preserved literally, not evaluated as a placeholder', (context) => {
  const f = fixture(context);
  fs.appendFileSync(path.join(f.dir, 'synthetic-review.md'), '\nLiteral {{SOURCE_NOTE}} and $& are source text.\n');
  passed(f.run());
  assert.match(f.read(), /Literal \{\{SOURCE_NOTE\}\} and \$& are source text/);
});

test('reporting wrapper rejects repository-writing escalation and ledger steps', (context) => {
  const f = fixture(context);
  assert.match(f.run([], wrapper).stderr, /side effects are disabled/);
  assert.ok(!fs.existsSync(f.output));
});

test('reads synthetic XLSX rows with the standard-library reader and validates the generated packet', (context) => {
  const f = fixture(context);
  const xlsx = path.join(f.dir, 'synthetic.xlsx');
  const build = spawnSync('python3', ['-c', `
import sys, zipfile
with zipfile.ZipFile(sys.argv[1], 'w') as z:
    z.writestr('xl/workbook.xml', '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Portfolio" sheetId="1" r:id="r1"/></sheets></workbook>')
    z.writestr('xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>')
    rows = [['Work Item ID','Status','Last Updated'],['DEMO-001','HOLD','2031-02-03']]
    data = ''.join('<row>' + ''.join('<c r="%s%d" t="inlineStr"><is><t>%s</t></is></c>' % (chr(65+c),r+1,v) for c,v in enumerate(row)) + '</row>' for r,row in enumerate(rows))
    z.writestr('xl/worksheets/sheet1.xml', '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+data+'</sheetData></worksheet>')
`, xlsx], { encoding: 'utf8' });
  passed(build);
  f.config.register = xlsx;
  passed(f.run(['--skip-pre-escalation', '--skip-ledger'], wrapper));
  assert.match(f.read('PACKET'), /Register-recorded: HOLD/);
  assert.match(f.read('PACKET'), /synthetic\.xlsx/);
});
