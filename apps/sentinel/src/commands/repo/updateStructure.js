const fs = require('fs');
const path = require('path');

const LABEL_MAP_PATH = path.join(process.cwd(), 'config', 'labelMap.json');
const MAX_FILE_BYTES = 64 * 1024;

function assertSafeRelativePath(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    throw new Error('Action path is required');
  }

  const normalized = path.normalize(relativePath.trim());

  if (
    path.isAbsolute(normalized) ||
    normalized.startsWith('..') ||
    normalized.includes(`${path.sep}..${path.sep}`) ||
    (!normalized.startsWith(`docs${path.sep}`) && !normalized.startsWith(`config${path.sep}`))
  ) {
    throw new Error(`Unsafe repo update path: ${relativePath}`);
  }

  return normalized;
}

function writeTextFile(relativePath, content) {
  const safePath = assertSafeRelativePath(relativePath);
  const text = typeof content === 'string' ? content : '';

  if (Buffer.byteLength(text, 'utf8') > MAX_FILE_BYTES) {
    throw new Error(`Repo update content too large: ${relativePath}`);
  }

  const target = path.join(process.cwd(), safePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text.endsWith('\n') ? text : `${text}\n`, 'utf8');

  return safePath;
}

function writeLabelTargets(targets = {}) {
  if (!targets || typeof targets !== 'object' || Array.isArray(targets)) {
    throw new Error('Label targets must be an object');
  }

  fs.mkdirSync(path.dirname(LABEL_MAP_PATH), { recursive: true });
  fs.writeFileSync(
    LABEL_MAP_PATH,
    `${JSON.stringify({
      targets,
      updatedAt: new Date().toISOString()
    }, null, 2)}\n`,
    'utf8'
  );

  return path.relative(process.cwd(), LABEL_MAP_PATH);
}

async function handleRepoUpdate(payload = {}) {
  const actions = Array.isArray(payload.actions) ? payload.actions : [];
  const applied = [];

  for (const action of actions) {
    if (!action || typeof action !== 'object') {
      continue;
    }

    if (action.type === 'create_file' || action.type === 'update_file') {
      applied.push({
        type: action.type,
        path: writeTextFile(action.path, action.content)
      });
      continue;
    }

    if (action.type === 'update_labels') {
      applied.push({
        type: action.type,
        path: writeLabelTargets(action.targets)
      });
    }
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      result: {
        status: 'success',
        message: 'Repo structure updated locally',
        applied
      }
    }
  };
}

module.exports = {
  handleRepoUpdate
};
