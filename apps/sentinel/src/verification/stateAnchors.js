const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ANCHOR_TYPES = {
  SYSTEM_RELEASE: 'SYSTEM_RELEASE',
  PILOT_START: 'PILOT_START',
  EXECUTION_APPROVED: 'EXECUTION_APPROVED',
  BILLING_ACTIVATED: 'BILLING_ACTIVATED'
};

const DEFAULT_RELEASE_STATE = Object.freeze({
  type: ANCHOR_TYPES.SYSTEM_RELEASE,
  version: 'control-surface-20260505-0128',
  apiBase: 'https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/v1',
  features: [
    'workflow orchestration',
    'approval enforcement',
    'telemetry harmonizer',
    'governed billing',
    'nunn cloud control surface'
  ],
  releaseRevision: 'ca-nc-dev-sentinel--control-surface-0128',
  image: 'acrncdevsentinel.azurecr.io/sentinel-api:control-surface-20260505-0128',
  status: 'RUNNING'
});

const NEXT_ANCHORS = [
  ANCHOR_TYPES.PILOT_START,
  ANCHOR_TYPES.EXECUTION_APPROVED,
  ANCHOR_TYPES.BILLING_ACTIVATED,
  'CONTRACT_RENEWAL_TRANSITION'
];

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const ANCHOR_DIR = path.join(ROOT, 'docs', 'anchors');
const SYSTEM_RELEASE_ANCHOR_PATH = path.join(ANCHOR_DIR, 'system-release-current.json');

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function buildSystemReleaseState(overrides = {}) {
  return {
    ...DEFAULT_RELEASE_STATE,
    ...overrides,
    type: ANCHOR_TYPES.SYSTEM_RELEASE,
    features: Array.isArray(overrides.features) ? overrides.features : DEFAULT_RELEASE_STATE.features,
    timestamp: overrides.timestamp || new Date().toISOString()
  };
}

function buildAnchorRecord(state, external = {}) {
  const canonical = stableStringify(state);
  const hash = sha256(canonical);

  return {
    type: state.type,
    status: external.txId && external.blockNumber ? 'VERIFIED' : 'PENDING_EXTERNAL_ANCHOR',
    hash,
    canonical,
    state,
    external: {
      txId: external.txId || null,
      blockNumber: external.blockNumber || null,
      anchoredAt: external.anchoredAt || null
    },
    clientLanguage: 'We create verifiable records of key system states so they can be independently validated.',
    nextAnchors: NEXT_ANCHORS,
    createdAt: state.timestamp
  };
}

function ensureAnchorDir() {
  fs.mkdirSync(ANCHOR_DIR, { recursive: true });
}

function writeAnchorRecord(record, filePath = SYSTEM_RELEASE_ANCHOR_PATH) {
  ensureAnchorDir();
  fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

function readAnchorRecord(filePath = SYSTEM_RELEASE_ANCHOR_PATH) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function getSystemReleaseAnchor() {
  const existing = readAnchorRecord();
  if (existing) {
    return existing;
  }

  return buildAnchorRecord(buildSystemReleaseState());
}

function listAnchors() {
  const systemRelease = getSystemReleaseAnchor();
  return [systemRelease];
}

function updateExternalAnchor(type, external = {}) {
  if (type !== ANCHOR_TYPES.SYSTEM_RELEASE) {
    throw new Error(`Unsupported anchor type: ${type}`);
  }

  const current = getSystemReleaseAnchor();
  const updated = {
    ...current,
    status: external.txId && external.blockNumber ? 'VERIFIED' : 'PENDING_EXTERNAL_ANCHOR',
    external: {
      txId: external.txId || current.external.txId || null,
      blockNumber: external.blockNumber || current.external.blockNumber || null,
      anchoredAt: external.anchoredAt || new Date().toISOString()
    }
  };

  return writeAnchorRecord(updated);
}

module.exports = {
  ANCHOR_TYPES,
  DEFAULT_RELEASE_STATE,
  NEXT_ANCHORS,
  SYSTEM_RELEASE_ANCHOR_PATH,
  buildAnchorRecord,
  buildSystemReleaseState,
  getSystemReleaseAnchor,
  listAnchors,
  sha256,
  stableStringify,
  updateExternalAnchor,
  writeAnchorRecord
};
