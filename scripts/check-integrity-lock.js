'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCK_PATH = path.join(ROOT, 'config', 'integrity-lock.json');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readLock() {
  return JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
}

function verifyIntegrityLock(lock = readLock()) {
  assert.strictEqual(lock.schemaVersion, 1, 'Unsupported integrity-lock schema version');
  assert.strictEqual(lock.status, 'LOCKED', 'Integrity lock must be LOCKED');
  assert(Array.isArray(lock.files) && lock.files.length > 0, 'Integrity lock must include protected files');

  const seenPaths = new Set();
  const results = lock.files.map((entry) => {
    assert(entry && typeof entry.path === 'string' && entry.path.length > 0, 'Protected file path is required');
    assert(/^[a-f0-9]{64}$/.test(entry.sha256), `Invalid SHA-256 for ${entry.path}`);
    assert(!path.isAbsolute(entry.path) && !entry.path.split('/').includes('..'), `Unsafe protected path: ${entry.path}`);
    assert(!seenPaths.has(entry.path), `Duplicate protected path: ${entry.path}`);
    seenPaths.add(entry.path);

    const content = fs.readFileSync(path.join(ROOT, entry.path));
    const actual = sha256(content);
    assert.strictEqual(actual, entry.sha256, `Integrity lock violation: ${entry.path}`);
    return { path: entry.path, sha256: actual };
  });

  return { lockId: lock.lockId, files: results };
}

if (require.main === module) {
  const result = verifyIntegrityLock();
  console.log(`Integrity lock verified: ${result.lockId} (${result.files.length} protected files)`);
}

module.exports = { readLock, sha256, verifyIntegrityLock };
