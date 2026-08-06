const fs = require('fs');
const path = require('path');

const rootPath = path.resolve(__dirname, '..');

const DOCKING_BUCKETS = [
  {
    name: 'repo_metadata',
    classification: 'internal',
    match: (filePath) =>
      filePath.startsWith('.git/') ||
      filePath.startsWith('.github/') ||
      filePath.startsWith('.husky/') ||
      filePath.startsWith('.vscode/') ||
      filePath.startsWith('.turbo/') ||
      filePath.startsWith('.vercel/')
  },
  {
    name: 'dependency_or_generated_runtime',
    classification: 'internal',
    match: (filePath) =>
      filePath.includes('/node_modules/') ||
      filePath.includes('/dist/') ||
      filePath.includes('/build/') ||
      filePath.includes('/.next/') ||
      filePath.includes('/.turbo/') ||
      filePath.includes('/coverage/')
  },
  {
    name: 'application_or_service_source',
    classification: 'internal',
    match: (filePath) => filePath.startsWith('apps/') || filePath.startsWith('services/')
  },
  {
    name: 'governance_or_public_docs',
    classification: 'review_public_or_internal_by_manifest',
    match: (filePath) => filePath.startsWith('docs/') || filePath.startsWith('governance/')
  },
  {
    name: 'scripts_configs_fixtures',
    classification: 'internal',
    match: (filePath) =>
      filePath.startsWith('scripts/') ||
      filePath.startsWith('config/') ||
      filePath.startsWith('configs/') ||
      filePath.startsWith('fixtures/') ||
      filePath.startsWith('infrastructure/') ||
      filePath.startsWith('deploy/') ||
      filePath.startsWith('lambda/') ||
      filePath.startsWith('ops-closeout/') ||
      filePath.startsWith('contract_reclamation-incubator/')
  },
  {
    name: 'package_and_root_control_files',
    classification: 'internal_or_public_by_manifest',
    match: (filePath) =>
      !filePath.includes('/') ||
      filePath.endsWith('/package.json') ||
      filePath.endsWith('/package-lock.json') ||
      filePath.endsWith('/pnpm-lock.yaml') ||
      filePath.endsWith('/tsconfig.json')
  }
];

function walkRepository(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);
    const relativePath = path.relative(rootPath, absolutePath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      walkRepository(absolutePath, files);
      continue;
    }

    if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

function classifyAsset(filePath) {
  return DOCKING_BUCKETS.find((bucket) => bucket.match(filePath)) || {
    name: 'needs_manual_review',
    classification: 'hold_until_manifest_review'
  };
}

function buildClassificationReport() {
  const files = walkRepository(rootPath);
  const buckets = {};

  for (const filePath of files) {
    const bucket = classifyAsset(filePath);

    if (!buckets[bucket.name]) {
      buckets[bucket.name] = {
        classification: bucket.classification,
        count: 0,
        samples: []
      };
    }

    buckets[bucket.name].count += 1;

    if (buckets[bucket.name].samples.length < 12) {
      buckets[bucket.name].samples.push(filePath);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    rootPath,
    totalFiles: files.length,
    bucketCount: Object.keys(buckets).length,
    buckets,
    recommendation: 'Use docking buckets as manifest inputs before external publication or execution.'
  };
}

if (require.main === module) {
  console.log(JSON.stringify(buildClassificationReport(), null, 2));
}

module.exports = {
  buildClassificationReport,
  classifyAsset
};
