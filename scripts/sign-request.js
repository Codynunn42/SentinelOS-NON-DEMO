#!/usr/bin/env node

const crypto = require('crypto');

const CONFIG = {
  api_key: process.env.SENTINEL_API_KEY || '48f1c6a241b184c10770060ac4a9bd5603b37ea8ddd3e684cc7ac599f61e3677',
  hmac_secret: process.env.SENTINEL_HMAC_SECRET || 'd31ce60f6af89ce36b97ac61d7f6aa6e9889c4b1b0764a5fc0fbc4fd10a04784e97426479ff1974bdb1ff4aee1e28d67579224f4bb62c36b6d1215a32e1dae72',
  base_url: process.env.SENTINEL_URL || 'http://localhost',
  tenant: process.env.SENTINEL_TENANT || 'sentinelos'
};

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const pairs = Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${pairs.join(',')}}`;
  }
  return JSON.stringify(value);
}

function canonicalizePassport(env = {}) {
  return stableStringify({
    commandId: env.commandId || null,
    timestamp: env.timestamp || null,
    nonce: env.nonce || null,
    tenant: env.tenant || null,
    command: env.command || null,
    payload: env.payload || {},
    meta: env.meta || {}
  });
}

function signCommand(opts = {}) {
  const {
    tenant = CONFIG.tenant,
    command = 'architecture.reconstruction.begin',
    payload = { scope: 'full' },
    commandId = crypto.randomUUID(),
    timestamp = Date.now(),
    nonce = crypto.randomUUID()
  } = opts;

  const request = {
    tenant,
    command,
    commandId,
    timestamp,
    nonce,
    payload,
    meta: {
      tenantId: tenant,
      surface: 'sentinelos-control-plane'
    }
  };

  const canonical = canonicalizePassport(request);
  const sig = crypto.createHmac('sha256', CONFIG.hmac_secret).update(canonical).digest('base64');

  return { ...request, sig, source: 'sentinel' };
}

function formatCurl(signedRequest) {
  return `curl -X POST ${CONFIG.base_url}/v1/command \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${CONFIG.api_key}" \\
  -d '${JSON.stringify(signedRequest)}'`;
}

function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'sign': {
      const signed = signCommand();
      console.log(JSON.stringify(signed, null, 2));
      break;
    }
    case 'curl': {
      const signed = signCommand();
      console.log(formatCurl(signed));
      break;
    }
    case 'test': {
      const signed = signCommand();
      console.log('Health: curl -s http://localhost/health -H "Authorization: Bearer ' + CONFIG.api_key + '"');
      console.log('\nReady: curl -s http://localhost/ready -H "Authorization: Bearer ' + CONFIG.api_key + '"');
      console.log('\nCommand:\n' + formatCurl(signed));
      break;
    }
    case 'env': {
      console.log(`API Key: ${CONFIG.api_key.substring(0, 16)}...`);
      console.log(`HMAC: ${CONFIG.hmac_secret.substring(0, 16)}...`);
      console.log(`URL: ${CONFIG.base_url}`);
      console.log(`Tenant: ${CONFIG.tenant}`);
      break;
    }
    default: {
      console.log('Usage: node sign-request.js [sign|curl|test|env]');
    }
  }
}

main();
