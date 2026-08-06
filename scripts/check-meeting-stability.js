const http = require('http');
const https = require('https');

const BASE_URL = process.env.MEETING_STABILITY_BASE_URL || 'https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io';
const TIMEOUT_MS = Number(process.env.MEETING_STABILITY_TIMEOUT_MS || 10000);

function request(pathname) {
  const url = new URL(pathname, BASE_URL);
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve) => {
    const req = client.get(url, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          ok: true,
          url: url.toString(),
          statusCode: res.statusCode,
          body
        });
      });
    });

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error('request_timeout'));
    });

    req.on('error', (error) => {
      resolve({
        ok: false,
        url: url.toString(),
        error: error.message
      });
    });
  });
}

async function main() {
  const health = await request('/health');
  const proof = await request('/proof');
  const audit = await request('/v1/audit?tenant=ownerfi');
  const failures = [];

  if (!health.ok || health.statusCode !== 200) {
    failures.push(`health:${health.statusCode || health.error}`);
  }

  if (!proof.ok || proof.statusCode !== 200) {
    failures.push(`proof:${proof.statusCode || proof.error}`);
  }

  if (!audit.ok || audit.statusCode !== 401) {
    failures.push(`audit_no_key:${audit.statusCode || audit.error}`);
  }

  const result = {
    baseUrl: BASE_URL,
    health: {
      statusCode: health.statusCode || null,
      ok: health.ok && health.statusCode === 200
    },
    proof: {
      statusCode: proof.statusCode || null,
      ok: proof.ok && proof.statusCode === 200
    },
    auditNoKey: {
      statusCode: audit.statusCode || null,
      ok: audit.ok && audit.statusCode === 401
    },
    meetingReady: failures.length === 0,
    failures
  };

  console.log(JSON.stringify(result, null, 2));

  if (failures.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
