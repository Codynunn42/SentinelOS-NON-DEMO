const { scanRepository } = require('../../repo/organizationScan');

const ALLOWED_PAYLOAD_FIELDS = new Set(['capabilityId', 'operation']);

async function handleRepoRead(payload = {}, context = {}, envelope = {}) {
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

  if (typeof context.buildReceipt !== 'function') {
    return {
      success: false,
      statusCode: 500,
      error: 'RECEIPT_BUILDER_UNAVAILABLE'
    };
  }

  const correlationId = envelope.correlationId || null;
  if (!correlationId) {
    return {
      success: false,
      statusCode: 500,
      error: 'RECEIPT_CORRELATION_UNAVAILABLE'
    };
  }

  const result = scanRepository();
  const tenant = context.tenant || envelope.tenant || 'nunncloud';
  const command = envelope.command || 'repo.read';
  const receipt = {
    ...context.buildReceipt(
      `${tenant}.${command}`,
      { type: 'repository_scan', id: correlationId },
      {
        capabilityId: result.capabilityId,
        operation: result.operation,
        executionMode: result.executionMode,
        correlationId,
        tenant
      },
      tenant
    ),
    correlationId
  };

  return {
    success: true,
    statusCode: 200,
    data: {
      result,
      receipt
    }
  };
}

module.exports = {
  handleRepoRead
};