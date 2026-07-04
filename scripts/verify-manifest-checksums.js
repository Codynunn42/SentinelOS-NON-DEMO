const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_SOURCE_ROOT = '/Users/codynunn/Downloads/AI Docs ';
const DEFAULT_OUTPUT = 'docs/OWNERFI_AI_FINANCIAL_MANAGEMENT_CHECKSUM_MANIFEST_2026-07-03.json';

const MODULES = [
  'Treasury',
  'Budgeting',
  'Forecasting',
  'Accounting',
  'Executive Reporting',
  'AI Agents',
  'Governance'
];

function parseArgs(argv) {
  const args = {
    sourceRoot: DEFAULT_SOURCE_ROOT,
    manifest: DEFAULT_OUTPUT,
    write: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--write') {
      args.write = true;
    } else if (arg === '--source-root') {
      args.sourceRoot = argv[index + 1];
      index += 1;
    } else if (arg === '--manifest') {
      args.manifest = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function slugModule(moduleName) {
  return moduleName.toLowerCase().replaceAll(' ', '_');
}

function classify(filename) {
  const lower = filename.toLowerCase();

  if (/treasury|cash|liquidity|bank|reserve/.test(lower)) {
    return 'Treasury';
  }

  if (/budget|planning|variance/.test(lower)) {
    return 'Budgeting';
  }

  if (/forecast|projection|model/.test(lower)) {
    return 'Forecasting';
  }

  if (/account|payable|receivable|reconciliation/.test(lower)) {
    return 'Accounting';
  }

  if (/board|investor|employee|internal_launch|teleprompter|welcome|release_notes/.test(lower)) {
    return 'Executive Reporting';
  }

  if (/agent|copilot|recommendation|anomaly/.test(lower)) {
    return 'AI Agents';
  }

  return 'Governance';
}

function buildManifest(sourceRoot) {
  const entries = fs
    .readdirSync(sourceRoot)
    .filter((filename) => filename.startsWith('AI_Financial_Management'))
    .sort()
    .map((filename) => {
      const sourcePath = path.join(sourceRoot, filename);
      const moduleName = classify(filename);
      return {
        filename,
        sourcePath,
        sha256: sha256(sourcePath),
        module: moduleName,
        proposedDestination: `ownerfi/${slugModule(moduleName)}/${filename}`,
        movementStatus: 'held'
      };
    });

  return {
    comm: 'Sentinel AI by Cody Nunn | Nunn Cloud',
    mode: 'read_only_checksum_and_movement_manifest',
    sourceRoot,
    sourceRootNote: 'Path is literal and includes the trailing space after AI Docs.',
    matchingPattern: 'AI_Financial_Management*',
    fileCount: entries.length,
    canonicalBaseline: 'v1.2.1',
    distributionArtifact: 'v1.2.2',
    modules: MODULES,
    authorityCreated: false,
    movementAuthorized: false,
    entries
  };
}

function verifyManifest(current, recorded) {
  const failures = [];

  if (recorded.fileCount !== current.fileCount) {
    failures.push(`fileCount mismatch: expected ${recorded.fileCount}, actual ${current.fileCount}`);
  }

  const currentByName = new Map(current.entries.map((entry) => [entry.filename, entry]));

  for (const recordedEntry of recorded.entries || []) {
    const currentEntry = currentByName.get(recordedEntry.filename);
    if (!currentEntry) {
      failures.push(`missing file: ${recordedEntry.filename}`);
      continue;
    }

    if (recordedEntry.sha256 !== currentEntry.sha256) {
      failures.push(`checksum mismatch: ${recordedEntry.filename}`);
    }

    if (recordedEntry.proposedDestination !== currentEntry.proposedDestination) {
      failures.push(`destination mismatch: ${recordedEntry.filename}`);
    }
  }

  return failures;
}

function main() {
  const args = parseArgs(process.argv);
  const sourceRoot = path.resolve(args.sourceRoot);
  const manifestPath = path.resolve(args.manifest);
  const current = buildManifest(sourceRoot);

  if (args.write) {
    fs.writeFileSync(manifestPath, `${JSON.stringify(current, null, 2)}\n`);
    console.log(`Wrote OwnerFi AI Financial Management checksum manifest: ${manifestPath}`);
    console.log(`Entries: ${current.fileCount}`);
    return;
  }

  const recorded = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const failures = verifyManifest(current, recorded);

  if (failures.length > 0) {
    console.error(JSON.stringify({ status: 'failed', failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: 'passed',
    manifest: manifestPath,
    sourceRoot,
    fileCount: current.fileCount,
    movementAuthorized: false
  }, null, 2));
}

main();
