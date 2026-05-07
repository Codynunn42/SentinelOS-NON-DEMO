/**
 * @typedef {string} Intent
 *
 * @typedef {Object} ControlActor
 * @property {string} role
 * @property {string=} userId
 *
 * @typedef {Object} ControlInput
 * @property {Intent} intent
 * @property {string} entity
 * @property {string} action
 * @property {Object=} context
 * @property {ControlActor} actor
 * @property {string} tenantId
 * @property {Object=} metadata
 *
 * @typedef {Object} CommandEnvelope
 * @property {string} commandId
 * @property {string} sessionId
 * @property {string} tenant
 * @property {string} command
 * @property {Object} payload
 * @property {Object} metadata
 */

module.exports = {};
