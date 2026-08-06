const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const SENTINEL_API_KEY = process.env.SENTINEL_API_KEY || '';
const SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || '';
const SENTINEL_URL = process.env.SENTINEL_URL || 'http://localhost';

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

function signRequest(payload) {
  if (!payload.commandId) payload.commandId = crypto.randomUUID();
  if (!payload.timestamp) payload.timestamp = Date.now();
  if (!payload.nonce) payload.nonce = crypto.randomUUID();
  if (!payload.source) payload.source = 'sentinel';
  if (!payload.meta) payload.meta = {};
  if (!payload.meta.tenantId && payload.tenant) payload.meta.tenantId = payload.tenant;
  if (!payload.meta.surface) payload.meta.surface = 'sentinelos-control-plane';

  const canonical = canonicalizePassport(payload);
  const sig = crypto.createHmac('sha256', SENTINEL_HMAC_SECRET).update(canonical).digest('base64');

  return { ...payload, sig };
}

function forwardToSentinelOS(method, path, signedPayload) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SENTINEL_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENTINEL_API_KEY}`
      }
    };

    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (method === 'POST' || method === 'PUT') req.write(JSON.stringify(signedPayload));
    req.end();
  });
}

exports.handler = async (event) => {
  try {
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const path = event.path || event.rawPath || '/';
    let body = {};

    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }

    console.log(`${httpMethod} ${path}`);

    if (!SENTINEL_API_KEY || !SENTINEL_HMAC_SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing SENTINEL_API_KEY or SENTINEL_HMAC_SECRET' })
      };
    }

    if (httpMethod === 'GET') {
      const result = await forwardToSentinelOS(httpMethod, path);
      return {
        statusCode: result.statusCode,
        body: JSON.stringify(result.body),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    if (httpMethod === 'POST') {
      if (!body.tenant) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required field: tenant' }) };
      }
      if (!body.command) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required field: command' }) };
      }

      const signedPayload = signRequest(body);
      console.log('Signed payload generated');
      
      const result = await forwardToSentinelOS(httpMethod, path, signedPayload);
      return {
        statusCode: result.statusCode,
        body: JSON.stringify(result.body),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
