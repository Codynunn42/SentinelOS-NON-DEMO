const crypto = require('crypto');

/**
 * Generate a prefixed unique identifier.
 * @param {string} prefix - The prefix for the generated ID
 * @returns {string} Unique ID string
 */
function generateId(prefix) {
    return `${String(prefix || 'id')}_${crypto.randomUUID()}`;
}

module.exports = {
    generateId
};
