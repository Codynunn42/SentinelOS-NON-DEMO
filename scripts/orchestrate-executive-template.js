#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const date = option('date') ?? new Date().toISOString().slice(0, 10);

function fail(message) {
  console.error(`Executive Template: ${message}`);
  process.exit(1);
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function daysBetween(first, second) {
  return Math.round((Date.parse(`${second}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / 86400000);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`Cannot read JSON ${file}: ${error.message}`);
  }
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredString(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a nonempty string`);
  return value;
}

function list(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function pattern(value) {
  requiredString(value, 'pattern');
  try {
    return new RegExp(value, 'i');
  } catch (error) {
    fail(`Invalid pattern: ${error.message}`);
  }
}

function canonicalPath(file) {
  if (fs.existsSync(file)) return fs.realpathSync(file);
  const parent = path.dirname(file);
  if (parent === file) fail(`Cannot resolve path: ${file}`);
  return path.join(canonicalPath(parent), path.basename(file));
}

function within(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

if (!validDate(date)) fail(`Invalid date "${date}"; expected YYYY-MM-DD`);
const configFile = option('config');
if (!configFile) fail('Explicit --config=<JSON file> is required; no operational sources are discovered automatically');
const configPath = path.resolve(configFile);
const config = readJson(configPath);
if (!object(config) || config.version !== 1) fail('Configuration must be an object with version: 1');
const configDir = path.dirname(configPath);
if (!object(config.sources)) fail('sources must be an object');
const maxAge = config.maximumAgeDays ?? 7;
if (!Number.isInteger(maxAge) || maxAge < 0) fail('maximumAgeDays must be a nonnegative integer');
const outputOption = option('output-dir') ?? config.outputDir;
requiredString(outputOption, 'outputDir or --output-dir');
const outputDir = canonicalPath(path.resolve(option('output-dir') ? process.cwd() : configDir, outputOption));
const worktrees = spawnSync('git', ['-C', root, 'worktree', 'list', '--porcelain'], { encoding: 'utf8' });
if (worktrees.error || worktrees.status !== 0) fail('Cannot establish Git worktree boundaries for report output');
const repositoryRoots = worktrees.stdout.split('\n')
  .filter((line) => line.startsWith('worktree '))
  .map((line) => canonicalPath(line.slice(9)));
repositoryRoots.push(canonicalPath(root));
if (repositoryRoots.some((repository) => within(repository, outputDir))) {
  fail('Report output must be outside every registered repository worktree');
}
let outputAncestor = outputDir;
while (!fs.existsSync(outputAncestor)) outputAncestor = path.dirname(outputAncestor);
const containingRepository = spawnSync('git', ['-C', outputAncestor, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
if (containingRepository.status === 0 && within(canonicalPath(containingRepository.stdout.trim()), outputDir)) {
  fail('Report output must not be inside another repository');
}

const sources = new Map();
for (const [id, descriptor] of Object.entries(config.sources)) {
  if (!object(descriptor)) fail(`Source ${id} must be an object`);
  requiredString(descriptor.path, `Source ${id} path`);
  requiredString(descriptor.label, `Source ${id} label`);
  if (!validDate(descriptor.date)) fail(`Source ${id} needs an explicit valid date`);
  const file = path.resolve(configDir, descriptor.path);
  let bytes;
  try {
    bytes = fs.readFileSync(file);
  } catch (error) {
    if (error.code !== 'ENOENT') fail(`Cannot read source ${id}: ${error.message}`);
  }
  sources.set(id, {
    ...descriptor,
    present: bytes !== undefined,
    text: bytes?.toString('utf8') || '',
    sha256: bytes ? crypto.createHash('sha256').update(bytes).digest('hex') : '',
    age: daysBetween(descriptor.date, date)
  });
}

function source(id) {
  if (!sources.has(id)) fail(`Unknown configured source: ${id}`);
  return sources.get(id);
}

function fresh(record) {
  return record.present && record.age >= 0 && record.age <= maxAge;
}

function sourceStatus(record) {
  if (!record.present) return 'MISSING';
  if (record.age < 0) return `UNVERIFIED - future-dated (${record.date})`;
  if (record.age > maxAge) return `STALE (${record.age} days old); current assertions require refresh`;
  return `${record.date}; ${record.age} days old; source-reported, not independently verified`;
}

function sourceReference(id) {
  const record = source(id);
  return `${record.label} (${sourceStatus(record)})`;
}

const dispositionSources = list(config.dispositionSources, 'dispositionSources');
dispositionSources.forEach(source);
const latestDate = dispositionSources.map((id) => source(id).date).sort().at(-1);
const latestSources = dispositionSources.filter((id) => source(id).date === latestDate);
const dispositionRules = list(config.dispositions, 'dispositions');
if (!dispositionRules.length) fail('At least one disposition rule is required');
const dispositionIds = new Set();
for (const rule of dispositionRules) {
  if (!object(rule)) fail('Disposition rules must be objects');
  requiredString(rule.id, 'Disposition id');
  if (dispositionIds.has(rule.id)) fail(`Duplicate disposition id: ${rule.id}`);
  dispositionIds.add(rule.id);
  for (const assertion of list(rule.patterns, `Disposition ${rule.id} patterns`)) {
    requiredString(assertion.value, 'Assertion value');
    pattern(assertion.pattern);
  }
  for (const override of rule.registerPatterns || []) {
    requiredString(override.status, 'Register pattern status');
    requiredString(override.field, 'Register pattern field');
    requiredString(override.value, 'Register pattern value');
    pattern(override.pattern);
  }
}

let register = null;
const registerOption = option('register') ?? config.register;
if (registerOption !== undefined) {
  requiredString(registerOption, 'register');
  const registerPath = path.resolve(option('register') ? process.cwd() : configDir, registerOption);
  let bytes;
  try {
    bytes = fs.readFileSync(registerPath);
  } catch (error) {
    fail(`Cannot read Operations Register: ${error.message}`);
  }
  if (path.extname(registerPath).toLowerCase() === '.json') {
    register = readJson(registerPath);
  } else if (path.extname(registerPath).toLowerCase() === '.xlsx') {
    const result = spawnSync('python3', [path.join(__dirname, 'read-executive-register.py'), registerPath], {
      encoding: 'utf8', maxBuffer: 8 * 1024 * 1024
    });
    if (result.error || result.status !== 0) fail(`Cannot read workbook: ${result.error?.message || result.stderr}`);
    try {
      register = JSON.parse(result.stdout);
    } catch (error) {
      fail(`Invalid workbook reader response: ${error.message}`);
    }
  } else {
    fail('Unsupported register format; use .json or .xlsx');
  }
  if (!object(register) || !object(register.sheets)) fail('Operations Register must contain a sheets object');
  for (const [sheet, rows] of Object.entries(register.sheets)) {
    if (!Array.isArray(rows) || rows.some((row) => !object(row))) fail(`Register sheet ${sheet} must contain record objects`);
  }
  const identifierFields = {
    Portfolio: 'Work Item ID', Actions: 'Action ID', Decisions: 'Decision ID',
    Evidence: 'Evidence ID', Risks: 'Risk ID', 'VR Workforce': 'Assignment ID'
  };
  for (const [sheet, field] of Object.entries(identifierFields)) {
    const seen = new Set();
    for (const row of register.sheets[sheet] || []) {
      const id = String(row[field] ?? '').trim();
      if (!id) continue;
      if (seen.has(id)) fail(`Duplicate controlling ID in ${sheet}: ${field} "${id}"; reports were not written`);
      seen.add(id);
    }
  }
  register.source = {
    fileName: path.basename(registerPath),
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    modifiedAt: fs.statSync(registerPath).mtime.toISOString()
  };
}
const hasSheet = (sheet) => register !== null && Object.hasOwn(register.sheets, sheet);
const missingSheets = new Set(
  ['Portfolio', 'Actions', 'Decisions', 'Evidence', 'Risks', 'VR Workforce'].filter((sheet) => !hasSheet(sheet))
);
const missingSheetMessage = (sheet) => `UNVERIFIED - ${sheet} sheet is absent; its records and checks cannot be established from this input.`;
const records = (sheet) => register?.sheets[sheet] || [];
const active = (record) => !/^(verified complete|complete|closed|superseded|cancelled|canceled|resolved|mitigated)$/i
  .test(String(record.Status || '').trim());

function rowAge(row, dateField = 'Last Updated') {
  const updated = String(row[dateField] || '').slice(0, 10);
  if (!validDate(updated)) return 'UNVERIFIED - date missing/invalid';
  const age = daysBetween(updated, date);
  return `${updated}; ${age < 0 ? 'UNVERIFIED - future-dated' : age > maxAge ? `STALE (${age} days)` : `${age} days old`}`;
}

function narrative(rule) {
  const found = latestSources.flatMap((id) => {
    const record = source(id);
    return rule.patterns.filter((assertion) => record.present && pattern(assertion.pattern).test(record.text))
      .map((assertion) => ({ id, value: assertion.value }));
  });
  const values = [...new Set(found.map((entry) => entry.value))];
  const evidence = [...new Set(found.map((entry) => sourceReference(entry.id)))].join('; ') || 'no matching assertion';
  if (values.length > 1) return { values, status: `CONFLICT - ${values.join(' vs ')}`, evidence };
  if (!values.length) return { values, status: 'UNVERIFIED - no explicit assertion in latest dated source set', evidence };
  const age = daysBetween(latestDate, date);
  const prefix = age < 0 ? 'UNVERIFIED - future-dated' : age > maxAge ? 'STALE - last source-reported' : 'Source-reported';
  return { values, status: `${prefix}: ${values[0]} (${latestDate}; ${age} days old)`, evidence };
}

function registerValue(rule, row) {
  const override = (rule.registerPatterns || []).find((entry) =>
    entry.status.toLowerCase() === String(row.Status || '').trim().toLowerCase() &&
    pattern(entry.pattern).test(String(row[entry.field] || '')));
  return override?.value || String(row.Status || '').trim();
}

function predicateRows(predicate) {
  if (!object(predicate)) fail('Register predicate must be an object');
  requiredString(predicate.sheet, 'Predicate sheet');
  const fields = list(predicate.fields, 'Predicate fields');
  if (!fields.length) fail('Predicate fields must not be empty');
  fields.forEach((field) => requiredString(field, 'Predicate field'));
  if (predicate.id !== undefined) {
    requiredString(predicate.id, 'Predicate id');
    requiredString(predicate.idField, 'Predicate idField');
  }
  const expression = pattern(predicate.pattern);
  if (!hasSheet(predicate.sheet)) missingSheets.add(predicate.sheet);
  return records(predicate.sheet).filter((row) =>
    (!predicate.id || String(row[predicate.idField]) === predicate.id) &&
    expression.test(fields.map((field) => String(row[field] || '')).join(' ')));
}

function assertionMatches(assertion) {
  if (!object(assertion)) fail('Source assertion must be an object');
  const record = source(assertion.source);
  const expression = pattern(assertion.pattern);
  return fresh(record) && expression.test(record.text);
}

const conflicts = [];
for (const check of config.checks || []) {
  requiredString(check.message, 'Check message');
  const matched = predicateRows(check.register).length > 0;
  const supported = assertionMatches(check.source);
  const resolved = check.resolution ? assertionMatches(check.resolution) : false;
  if (matched && supported && !resolved) conflicts.push(`CONFLICT - ${check.message}; evidence: ${sourceReference(check.source.source)}`);
}
for (const control of config.controls || []) {
  requiredString(control.message, 'Control message');
  const requiredValue = requiredString(control.requiredValue, 'Required value');
  if (!dispositionIds.has(control.disposition)) fail(`Unknown disposition in control: ${control.disposition}`);
  const rule = dispositionRules.find((item) => item.id === control.disposition);
  const row = records('Portfolio').find((item) => item['Work Item ID'] === rule.id);
  if (predicateRows(control.register).length && (!row || registerValue(rule, row).toLowerCase() !== requiredValue.toLowerCase())) {
    conflicts.push(`CONFLICT - ${control.message}`);
  }
}

const dispositions = dispositionRules.map((rule) => {
  const reported = narrative(rule);
  if (!register) return `- ${rule.id}: ${reported.status}; evidence: ${reported.evidence}.`;
  if (!hasSheet('Portfolio')) return `- ${rule.id}: ${missingSheetMessage('Portfolio')} Narrative: ${reported.status}.`;
  const row = records('Portfolio').find((item) => item['Work Item ID'] === rule.id);
  if (!row) return `- ${rule.id}: UNVERIFIED - no Portfolio row in supplied register; narrative: ${reported.status}.`;
  const value = registerValue(rule, row);
  const differs = reported.values.some((item) => item.toLowerCase() !== value.toLowerCase());
  const status = differs || reported.values.length > 1 ? 'CONFLICT - register/narrative disagree'
    : !value ? 'UNVERIFIED - register status missing' : `Register-recorded: ${value}`;
  return `- ${rule.id}: ${status}; row ${rowAge(row)}; narrative: ${reported.status}; evidence: ${reported.evidence}.`;
});

function cell(value) {
  const text = String(value ?? '').trim();
  if (!text) return '-';

  return text
    .replace(/\0/g, '')
    .replace(/\r?\n/g, '<br>')
    .replace(/\t/g, '    ')
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .slice(0, 4000);
}

function table(headers, rows) {
  if (!rows.length) return 'No matching register records.';
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`)
  ].join('\n');
}

function annotatedDate(value) {
  const text = String(value || '').trim();
  const match = text.match(/\d{4}-\d{2}-\d{2}/g)?.at(-1);
  if (!validDate(match)) return text;
  const delta = daysBetween(match, date);
  return delta > 0 ? `${text}; date passed ${delta} days ago; recorded status unchanged`
    : delta === 0 ? `${text}; date is today` : `${text}; in ${-delta} days`;
}

function sheetTable(sheet, fields, onlyActive = false, dateField = 'Last Updated') {
  if (!hasSheet(sheet)) return missingSheetMessage(sheet);
  return table([...fields, 'Row freshness'], records(sheet).filter((row) => !onlyActive || active(row))
    .map((row) => [...fields.map((field) => /Due Date|Deadline \/ Review Date|Review \/ Expiry Date|Review Date/.test(field)
      ? annotatedDate(row[field]) : row[field]), rowAge(row, dateField)]));
}

function sourceSection(id) {
  if (!id) return 'UNVERIFIED - no source configured for this section.';
  const record = source(id);
  return `### ${record.label}\n\n**Source freshness:** ${sourceStatus(record)}.\n\n${record.present ? record.text.trim() : 'UNVERIFIED - configured source is missing.'}`;
}

const sections = config.sections || {};
if (!object(sections)) fail('sections must be an object');
const summaries = (config.summaries || []).map((entry) => {
  requiredString(entry.text, 'Summary text');
  const matched = assertionMatches(entry);
  return matched ? `- ${entry.text}\n  Source: ${sourceReference(entry.source)}.`
    : `- UNVERIFIED - configured summary withheld: supporting assertion absent, stale, future-dated, or missing (${sourceReference(entry.source)}).`;
});
const followups = (config.followups || []).map((entry) => {
  requiredString(entry.text, 'Follow-up text');
  const matches = predicateRows(entry.register);
  if (!assertionMatches(entry)) return `- UNVERIFIED - follow-up assertion requires refresh (${sourceReference(entry.source)}).`;
  return `- ${entry.text} Source: ${sourceReference(entry.source)}. ${
    !hasSheet(entry.register.sheet) ? `Register cross-check: ${missingSheetMessage(entry.register.sheet)} This is not a register assignment or verified completion.`
      : matches.length ? `Register cross-check: ${matches.map((row) => `${row['Action ID'] || row['Work Item ID'] || 'row'}: ${row.Status || 'status missing'}, owner ${row.Owner || row['Accountable Owner'] || 'unassigned'}`).join('; ')}.`
      : 'Register cross-check: no matching row; this is not a register assignment or verified completion.'}`;
});
if (config.verdict) {
  for (const entry of list(config.verdict.patterns, 'Verdict patterns')) {
    requiredString(entry.value, 'Verdict value');
    pattern(entry.pattern);
  }
}
const verdict = config.verdict ? narrative(config.verdict) : null;
const provenance = register
  ? `Operations Register snapshot: ${register.source.fileName}; file modified ${register.source.modifiedAt}; SHA-256 ${register.source.sha256}.`
  : 'UNVERIFIED - no Operations Register configured; narrative assertions do not establish current controlling dispositions.';
const inputStatus = [...sources].map(([id, record]) => `- ${id}: ${sourceReference(id)}; ${record.present ? 'present (file presence only)' : 'MISSING'}`).join('\n');
const evidenceIndex = [...sources].map(([id, record]) =>
  `- ${sourceReference(id)}; SHA-256 ${record.sha256 || 'unavailable'}.`).join('\n');
const sourceQuality = [
  provenance,
  `Row dates, not workbook modification time, control the ${maxAge}-day freshness threshold.`,
  'All source assertions are attributed, not independently reopened or verified by this build. Missing, stale, future-dated, or conflicting evidence does not authorize a change.',
  `Latest configured disposition source date: ${latestDate || 'none'}.`,
  `Missing sources: ${[...sources].filter(([, record]) => !record.present).map(([id]) => id).join(', ') || 'none'}.`,
  ...[...missingSheets].map(missingSheetMessage)
].map((line) => `- ${line}`).join('\n');
const summary = `${provenance} This report is not a live-register query. Preserve existing holds; no approval, execution, access change, or action closure is created.${verdict ? ` Runtime verdict: ${verdict.status}; evidence: ${verdict.evidence}.` : ''}`;
const gaps = [
  '- Reconfirm stale or conflicting rows against controlling records; expired dates do not imply failure or completion.',
  ...conflicts.map((item) => `- ${item}`),
  ...summaries,
  ...followups
].join('\n');
const decisions = sheetTable('Decisions', [
  'Decision ID', 'Disposition', 'Authority', 'Decision / Direction', 'Conditions', 'Review / Expiry Date', 'Owner / Next Action'
]);
const queue = [
  sheetTable('Actions', ['Action ID', 'Work Item ID', 'Status', 'Owner', 'Due Date', 'Action', 'Dependency', 'Evidence Required', 'Source Link'], true),
  ...conflicts.map((item) => `- ${item}`),
  ...summaries,
  ...followups,
  sections.historicalQueue ? `Historical source, not a refreshed register:\n\n${sourceSection(sections.historicalQueue)}` : '',
  sourceSection(sections.queue)
].filter(Boolean).join('\n\n');
const nextActions = [
  '- Reconfirm stale Portfolio/Actions rows and resolve conflicts against primary evidence before changing status or closing work.',
  '- Apply recorded decisions only. Owner fields do not establish reviewer eligibility or execution authority.',
  ...dispositionRules.map((rule) => `- ${rule.id}: retain the recorded disposition; change only through an authorized, attributable controlling-record update.`),
  ...followups
].join('\n');

function render(templateFile, replacements) {
  let output;
  try {
    output = fs.readFileSync(path.join(root, templateFile), 'utf8');
  } catch (error) {
    fail(`Cannot read template ${templateFile}: ${error.message}`);
  }
  const placeholders = [...output.matchAll(/\{\{[^}]+\}\}/g)].map((match) => match[0]);
  for (const key of replacements.keys()) {
    if (!placeholders.includes(key)) fail(`${templateFile} is missing required placeholder ${key}`);
  }
  for (const placeholder of placeholders) {
    if (!replacements.has(placeholder)) fail(`Unsupported template placeholder: ${placeholder}`);
  }
  return output.replace(/\{\{[^}]+\}\}/g, (placeholder) => replacements.get(placeholder));
}

const generatedAt = new Date().toISOString();
const compact = render('docs/governance/EXECUTIVE_TEMPLATE_CANONICAL.md', new Map([
  ['{{DATE}}', date], ['{{GENERATED_AT}}', generatedAt],
  ['{{INPUT_STATUS}}', inputStatus], ['{{DISPOSITIONS}}', dispositions.join('\n')],
  ['{{SOURCE_QUALITY}}', sourceQuality], ['{{EXEC_SUMMARY}}', summary],
  ['{{EVIDENCE_GAPS}}', gaps], ['{{DECISIONS}}', decisions], ['{{EVIDENCE_INDEX}}', evidenceIndex]
]));
const full = render('apps/executive-desk/cadence/EXECUTIVE_TEMPLATE_MASTER.md', new Map([
  ['{{DATE}}', date], ['{{GENERATED_AT}}', generatedAt],
  ['{{GOVERNANCE_PACKET}}', `./EXECUTIVE_PACKET_${date}.md`],
  ['{{GOVERNANCE_INPUT}}', `${sourceQuality}\n\n${dispositions.join('\n')}\n\n${gaps}`],
  ['{{OPERATING_QUEUE}}', queue], ['{{QUEUE_SOURCE_NOTE}}', register ? provenance : 'UNVERIFIED - no Actions snapshot configured.'],
  ['{{PORTFOLIO}}', sheetTable('Portfolio', ['Work Item ID', 'Priority', 'Status', 'Accountable Owner', 'Next Action', 'Deadline / Review Date'], true)],
  ['{{WORKFORCE}}', sheetTable('VR Workforce', ['Assignment ID', 'Work Item ID', 'VR Workforce Role', 'Human Accountable Owner', 'Status', 'Last Reviewed', 'Latest Report'], true, 'Last Reviewed')],
  ['{{RISKS}}', sheetTable('Risks', ['Risk ID', 'Severity', 'Status', 'Workstream', 'Risk / Blocker', 'Mitigation / Next Control', 'Owner', 'Review Date'], true)],
  ['{{PERSONNEL_ACCESS}}', sourceSection(sections.personnel)], ['{{DECISIONS}}', decisions],
  ['{{EVIDENCE_INDEX}}', `${provenance}\n\n${evidenceIndex}\n\n${sheetTable('Evidence', ['Evidence ID', 'Work Item ID', 'Verification Status', 'Source Link', 'Observed At', 'Summary'], false, 'Observed At')}`],
  ['{{EXECUTIVE_SUMMARY}}', summary], ['{{NEXT_ACTIONS}}', nextActions]
]));
const reports = [[`EXECUTIVE_PACKET_${date}.md`, compact], [`EXECUTIVE_TEMPLATE_${date}.md`, full]];
for (const [name] of reports) {
  const file = path.join(outputDir, name);
  const existing = fs.lstatSync(file, { throwIfNoEntry: false });
  if (existing && (!existing.isFile() || existing.isSymbolicLink() || existing.nlink > 1)) {
    fail(`Refusing non-regular report destination: ${file}`);
  }
}
fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
for (const [name, content] of reports) {
  const file = path.join(outputDir, name);
  fs.writeFileSync(file, content, { mode: 0o600 });
  console.log(`Generated report: ${file}`);
}
