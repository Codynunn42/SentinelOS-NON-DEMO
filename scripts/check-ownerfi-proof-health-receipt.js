const crypto = require('crypto');

const DEFAULT_BASE = 'https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io';
const base = (process.env.SENTINEL_LIVE_BASE || DEFAULT_BASE).replace(/\/$/, '');
const timeoutMs = Number(process.env.SENTINEL_LIVE_TIMEOUT_MS || 30000);

async function fetchWithTimeout(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${base}${path}`, {
      ...options,
      signal: controller.signal
    });
    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();
    let body = null;

    if (contentType.includes('application/json') && bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = null;
      }
    }

    return {
      path,
      status: response.status,
      ok: response.ok,
      contentType,
      body,
      bodySha256: crypto.createHash('sha256').update(bodyText).digest('hex'),
      bodyLength: bodyText.length
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const checkedAt = new Date().toISOString();
  const health = await fetchWithTimeout('/health');
  const proof = await fetchWithTimeout('/proof');
  const auditNoKey = await fetchWithTimeout('/v1/audit?tenant=ownerfi');
  const checks = {
    health,
    proof,
    auditNoKey: {
      ...auditNoKey,
      expected: 'authorization_denial_without_key'
    }
  };
  const failures = [];

  if (health.status !== 200) {
    failures.push(`/health returned HTTP ${health.status}; expected 200`);
  }

  if (proof.status !== 200) {
    failures.push(`/proof returned HTTP ${proof.status}; expected 200`);
  }

  if (![401, 403].includes(auditNoKey.status)) {
    failures.push(
      `/v1/audit?tenant=ownerfi without key returned HTTP ${auditNoKey.status}; expected 401 or 403`
    );
  }

  const receipt = {
    status: failures.length ? 'failed' : 'passed',
    gate: 'VERIFY_CURRENT_OWNERFI_PROOF_HEALTH_BEFORE_SHARE_OR_MEETING',
    base,
    checkedAt,
    checks,
    failures,
    authorityCreated: false,
    liveClaimsAllowed: failures.length === 0,
    externalShareAllowed: false,
    note: 'This receipt verifies route health and auth boundary only; external sharing still requires separate owner decision.'
  };

  console.log(JSON.stringify(receipt, null, 2));
  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: 'failed',
        gate: 'VERIFY_CURRENT_OWNERFI_PROOF_HEALTH_BEFORE_SHARE_OR_MEETING',
        base,
        error: error.message,
        authorityCreated: false,
        liveClaimsAllowed: false
      },
      null,
      2
    )
  );
  process.exit(1);
});
