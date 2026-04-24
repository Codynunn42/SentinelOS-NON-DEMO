/**
 * @typedef {Object} CommandEnvelope
 * @property {string=} commandId
 * @property {string=} sessionId
 * @property {string} tenant
 * @property {string} command
 * @property {string=} legacyCommand
 * @property {Object} payload
 * @property {{ actor?: string, role?: string, timestamp?: string }=} metadata
 */

/**
 * @typedef {Object} CommandResult
 * @property {boolean} success
 * @property {Object=} data
 * @property {string=} error
 * @property {number=} statusCode
 * @property {Object=} details
 */

/**
 * Normalize the incoming request body into a predictable command envelope.
 * This keeps the public route stable even if clients send only command/payload.
 *
 * @param {Object} body
 * @returns {CommandEnvelope}
 */
function normalizeCommandEnvelope(body) {
  const payload =
    body && body.payload && typeof body.payload === 'object' ? body.payload : body || {};

  const rawCommand = typeof body?.command === 'string' ? body.command.trim() : '';
  const explicitTenant = typeof body?.tenant === 'string' ? body.tenant.trim() : '';

  let tenant = explicitTenant;
  let command = rawCommand;

  if (!tenant && rawCommand.includes('.')) {
    const parts = rawCommand.split('.');
    if (parts.length >= 3) {
      tenant = parts[0];
      command = parts.slice(1).join('.');
    }
  }

  if (tenant && rawCommand.startsWith(`${tenant}.`)) {
    command = rawCommand.slice(tenant.length + 1);
  }

  return {
    commandId: typeof body?.commandId === 'string' ? body.commandId : undefined,
    sessionId: typeof body?.sessionId === 'string' ? body.sessionId : undefined,
    tenant,
    command,
    legacyCommand: rawCommand || undefined,
    payload,
    metadata: body && typeof body.metadata === 'object' ? body.metadata : undefined
  };
}

module.exports = {
  normalizeCommandEnvelope
};
