// C3.3 — Dock Manifest Schema
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Dock Manifest is the institutional contract between SentinelOS and
// any integrated system. Every docked system publishes one manifest.
//
// SentinelOS validates manifests against this schema before registering
// any system's capabilities in the Capability Registry.
//
// Required fields:
//   system.name, system.version
//   provides[]             — human-readable capability list
//   apis[]                 — which Command Envelope API paths this system satisfies
//   security.authentication
//   governance.evidence    — required | optional | none
//   runtime.healthEndpoint
//
// Optional fields:
//   lifecycle.status       — active | pending | deprecated (defaults to pending)
//   lifecycle.registeredAt — ISO timestamp (set on registration)

'use strict';

const VALID_APIS = ['planning', 'execution', 'evidence', 'command-envelope'];
const VALID_AUTH = ['JWT', 'api-key', 'managed-identity', 'mtls'];
const VALID_EVIDENCE = ['required', 'optional', 'none'];
const VALID_LIFECYCLE = ['active', 'pending', 'deprecated'];

/**
 * Validate a Dock Manifest object.
 * Returns { valid: true } or { valid: false, errors: string[] }.
 *
 * @param {object} manifest
 * @returns {{ valid: boolean, errors?: string[] }}
 */
function validateDockManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['manifest must be an object'] };
  }

  // system
  if (!manifest.system || typeof manifest.system !== 'object') {
    errors.push('manifest.system is required');
  } else {
    if (!manifest.system.name || typeof manifest.system.name !== 'string') {
      errors.push('manifest.system.name is required (string)');
    }
    if (!manifest.system.version || typeof manifest.system.version !== 'string') {
      errors.push('manifest.system.version is required (string)');
    }
  }

  // provides
  if (!Array.isArray(manifest.provides) || manifest.provides.length === 0) {
    errors.push('manifest.provides must be a non-empty array of strings');
  }

  // apis
  if (!Array.isArray(manifest.apis) || manifest.apis.length === 0) {
    errors.push('manifest.apis must be a non-empty array');
  } else {
    manifest.apis.forEach((api) => {
      if (!VALID_APIS.includes(api)) {
        errors.push(`manifest.apis contains unknown value '${api}'. Valid: ${VALID_APIS.join(', ')}`);
      }
    });
  }

  // security
  if (!manifest.security || typeof manifest.security !== 'object') {
    errors.push('manifest.security is required');
  } else {
    if (!manifest.security.authentication || !VALID_AUTH.includes(manifest.security.authentication)) {
      errors.push(`manifest.security.authentication must be one of: ${VALID_AUTH.join(', ')}`);
    }
  }

  // governance
  if (!manifest.governance || typeof manifest.governance !== 'object') {
    errors.push('manifest.governance is required');
  } else {
    if (!manifest.governance.evidence || !VALID_EVIDENCE.includes(manifest.governance.evidence)) {
      errors.push(`manifest.governance.evidence must be one of: ${VALID_EVIDENCE.join(', ')}`);
    }
  }

  // runtime
  if (!manifest.runtime || typeof manifest.runtime !== 'object') {
    errors.push('manifest.runtime is required');
  } else {
    if (!manifest.runtime.healthEndpoint || typeof manifest.runtime.healthEndpoint !== 'string') {
      errors.push('manifest.runtime.healthEndpoint is required (string)');
    }
  }

  // lifecycle (optional, validate if present)
  if (manifest.lifecycle) {
    if (manifest.lifecycle.status && !VALID_LIFECYCLE.includes(manifest.lifecycle.status)) {
      errors.push(`manifest.lifecycle.status must be one of: ${VALID_LIFECYCLE.join(', ')}`);
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Normalize a manifest — fills defaults for optional fields.
 *
 * @param {object} manifest
 * @returns {object}
 */
function normalizeDockManifest(manifest) {
  return {
    ...manifest,
    lifecycle: {
      status: (manifest.lifecycle && manifest.lifecycle.status) || 'pending',
      registeredAt: (manifest.lifecycle && manifest.lifecycle.registeredAt) || new Date().toISOString()
    }
  };
}

module.exports = {
  VALID_APIS,
  VALID_AUTH,
  VALID_EVIDENCE,
  VALID_LIFECYCLE,
  validateDockManifest,
  normalizeDockManifest
};
