const { buildEnvelope } = require('./buildEnvelope');
const { validateControlInput } = require('./validate');

function getControlEndpoint(options = {}) {
  return options.endpoint ||
    process.env.SENTINEL_COMMAND_URL ||
    'http://localhost:3000/v1/command';
}

function getApiKey(options = {}) {
  return options.apiKey ||
    process.env.SENTINEL_CONTROL_API_KEY ||
    process.env.SENTINEL_API_KEY ||
    '';
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      status: 'error',
      error: 'Invalid JSON response',
      raw: text
    };
  }
}

async function executeIntent(input, options = {}) {
  validateControlInput(input);

  const fetchImpl = options.fetch || global.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch is unavailable; run on Node 20+ or pass options.fetch');
  }

  const envelope = buildEnvelope(input);
  const apiKey = getApiKey(options);
  const headers = {
    'content-type': 'application/json',
    ...(options.headers && typeof options.headers === 'object' ? options.headers : {})
  };

  if (apiKey && !headers.authorization && !headers['x-api-key']) {
    headers.authorization = `Bearer ${apiKey}`;
  }

  const response = await fetchImpl(getControlEndpoint(options), {
    method: 'POST',
    headers,
    body: JSON.stringify(envelope)
  });
  const data = await readResponseBody(response);

  return {
    envelope,
    result: data,
    ok: response.ok,
    statusCode: response.status
  };
}

module.exports = {
  executeIntent
};
