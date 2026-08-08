const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const APPROVED_ROOT = path.resolve(__dirname, '../../../..');
const MAX_FILES = 5000;
const MAX_HASH_BYTES = 1024 * 1024;
const SKIP_DIRECTORIES = new Set([
  '.git',
  '.next',
  'build',
  'coverage',
  'dist',
  'node_modules'
]);
const SENSITIVE_NAMES = new Set([
  '.env',
  '.npmrc',
  'credentials.json',
  'secrets.json'
]);

function isSensitiveName(name) {
  const normalized = name.toLowerCase();
  return SENSITIVE_NAMES.has(normalized) || normalized.startsWith('.env.');
}

function isWithinApprovedRoot(candidatePath) {
  const relativePath = path.relative(APPROVED_ROOT, candidatePath);
  return relativePath !== '..' && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath);
}

function toRepoPath(filePath) {
  return path.relative(APPROVED_ROOT, filePath).split(path.sep).join('/');
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function collectInventory() {
  const files = [];
  const skippedLinks = [];
  let directoriesScanned = 0;
  let truncated = false;

  function walk(directory) {
    if (truncated) return;
    directoriesScanned += 1;

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (files.length >= MAX_FILES) {
        truncated = true;
        return;
      }

      if (isSensitiveName(entry.name)) continue;

      const absolutePath = path.resolve(directory, entry.name);
      if (!isWithinApprovedRoot(absolutePath)) continue;

      const stats = fs.lstatSync(absolutePath);
      if (stats.isSymbolicLink()) {
        skippedLinks.push(toRepoPath(absolutePath));
        continue;
      }

      if (stats.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) walk(absolutePath);
        continue;
      }

      if (!stats.isFile()) continue;

      files.push({
        path: toRepoPath(absolutePath),
        extension: path.extname(entry.name).toLowerCase() || '[none]',
        size: stats.size,
        hash: stats.size <= MAX_HASH_BYTES ? hashFile(absolutePath) : null
      });
    }
  }

  walk(APPROVED_ROOT);
  return { directoriesScanned, files, skippedLinks, truncated };
}

function buildFindings(inventory) {
  const extensionCounts = {};
  const hashes = new Map();

  for (const file of inventory.files) {
    extensionCounts[file.extension] = (extensionCounts[file.extension] || 0) + 1;
    if (!file.hash) continue;
    if (!hashes.has(file.hash)) hashes.set(file.hash, []);
    hashes.get(file.hash).push(file.path);
  }

  const duplicateGroups = [...hashes.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([hash, files]) => ({ hash, files }));

  return [
    {
      type: 'repository_inventory',
      filesScanned: inventory.files.length,
      directoriesScanned: inventory.directoriesScanned,
      truncated: inventory.truncated,
      skippedLinks: inventory.skippedLinks
    },
    {
      type: 'file_type_distribution',
      counts: extensionCounts
    },
    {
      type: 'exact_content_duplicates',
      groups: duplicateGroups
    }
  ];
}

function scanRepository() {
  const inventory = collectInventory();

  return {
    capabilityId: 'repo-read',
    operation: 'organization_scan',
    executionMode: 'read_only',
    rootPolicy: 'server_controlled',
    findings: buildFindings(inventory)
  };
}

module.exports = {
  scanRepository
};