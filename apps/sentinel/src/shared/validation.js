/**
 * Shared Validation Helpers
 * 
 * Consolidated validation utilities used across multiple modules:
 * - String validation (hasText)
 * - Object validation (isRecord)
 * - Email and phone validation
 * - Type conversion (asArray, asNumber, asText, asPositiveAmount)
 * 
 * Single source of truth for all validation patterns.
 */

/**
 * Check if value is a non-empty string
 * @param {any} value - Value to check
 * @returns {boolean} True if string with content
 */
function hasText(value) {
    return typeof value === 'string' && value.trim() !== '';
}

/**
 * Check if value is a plain object (not array, null, or primitive)
 * @param {any} value - Value to check
 * @returns {boolean} True if plain object
 */
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Validate email format
 * @param {any} value - Value to check
 * @returns {boolean} True if valid email
 */
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
}

/**
 * Validate phone format (10-15 digits)
 * @param {any} value - Value to check
 * @returns {boolean} True if valid phone
 */
function isValidPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
}

/**
 * Convert value to array
 * @param {any} value - Value to convert
 * @returns {array} Array or empty array if not array
 */
function asArray(value) {
    return Array.isArray(value) ? value : [];
}

/**
 * Convert value to number
 * @param {any} value - Value to convert
 * @param {any} [fallback=null] - Fallback returned when conversion fails
 * @returns {number|null|any} Number if finite, fallback otherwise
 */
function asNumber(value, fallback = null) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

/**
 * Convert value to trimmed string
 * @param {any} value - Value to convert
 * @returns {string} Trimmed string or empty string
 */
function asText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

/**
 * Convert value to positive amount
 * @param {any} value - Value to convert
 * @returns {number|null} Positive number or null
 */
function asPositiveAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
}

module.exports = {
    hasText,
    isRecord,
    isValidEmail,
    isValidPhone,
    asArray,
    asNumber,
    asText,
    asPositiveAmount
};
