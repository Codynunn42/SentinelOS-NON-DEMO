const { scanRepository } = require('../../repo/organizationScan');

const ALLOWED_PAYLOAD_FIELDS = new Set(['capabilityId', 'operation']);

async function handleRepoRead(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      success: false,
      statusCode: 400,
      error: 'INVALID_PAYLOAD'
    };
  }

  if (payload.capabilityId !== 'repo-read') {
    return {
      success: false,
      statusCode: 400,
      error: 'INVALID_CAPABILITY'
    };
  }

  if (payload.operation !== 'organization_scan') {
    return {
      success: false,
      statusCode: 400,
      error: 'UNSUPPORTED_OPERATION'
    };
  }

  const unsupportedFields = Object.keys(payload).filter((field) => !ALLOWED_PAYLOAD_FIELDS.has(field));
  if (unsupportedFields.length) {
    return {
      success: false,
      statusCode: 400,
      error: 'UNSUPPORTED_PAYLOAD_FIELDS',
      details: { fields: unsupportedFields }
    };
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      result: scanRepository()
    }
  };
}

module.exports = {
  handleRepoRead
};