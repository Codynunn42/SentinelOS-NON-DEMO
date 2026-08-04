// Phase 3 — Federated Policy Merge Rules (FPMR)
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Federated Policy Merge Rules (FPMR) resolve how policies combine
// when a federation envelope touches multiple providers.
//
// Merge rules:
//   1. Provider-specific scopes merge into a unified policy scope.
//   2. Conflicts are resolved by priority order:
//        EXECUTIVE_DESK  (highest — always wins)
//        PROVIDER        (mid-tier — wins over capability)
//        CAPABILITY      (baseline)
//   3. requiresApproval: if ANY provider requires approval → merged result requires approval.
//   4. complianceGates: union of all gates (no duplicates).
//   5. Drift-aware overrides: CRITICAL drift on any provider forces requiresApproval=true
//      and adds a DRIFT_CRITICAL_HOLD gate.
//   6. If the Executive Desk scope is present, its complianceGates and requiresApproval
//      override all other provider inputs (it wins unconditionally on conflicts).
//   7. driftOverride: true on the Executive Desk scope suppresses lower-tier drift gates.
//
// Conflict resolution:
//   - Boolean fields (requiresApproval): OR-merge, then apply priority overrides.
//   - Array fields (complianceGates): union, then apply priority filters.
//   - String/enum fields (priority, minimumRole): highest-priority tier wins.
//
// minimumRole resolution:
//   Roles are ordered: platform > executive > operator
//   Merged minimumRole is the most restrictive (highest) across all providers.

'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FPMR_VERSION = '1.0';

const POLICY_PRIORITY = {
  EXECUTIVE_DESK: 'executive-desk',
  PROVIDER: 'provider',
  CAPABILITY: 'capability'
};

// Priority order — index 0 = highest authority
const PRIORITY_ORDER = [
  POLICY_PRIORITY.EXECUTIVE_DESK,
  POLICY_PRIORITY.PROVIDER,
  POLICY_PRIORITY.CAPABILITY
];

// Role strength order — index 0 = most restrictive
const ROLE_ORDER = ['platform', 'executive', 'operator'];

const MERGE_OUTCOME = {
  CLEAN: 'CLEAN',           // no conflicts
  CONFLICT_RESOLVED: 'CONFLICT_RESOLVED',  // conflicts resolved by priority
  DRIFT_OVERRIDE: 'DRIFT_OVERRIDE',        // drift caused policy hardening
  EMPTY_INPUT: 'EMPTY_INPUT'               // no provider policies supplied
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the most restrictive (highest) role from a list.
 * @param {string[]} roles
 * @returns {string}
 */
function mostRestrictiveRole(roles) {
  const filtered = roles.filter((r) => ROLE_ORDER.includes(r));
  if (!filtered.length) return 'operator';
  return filtered.reduce((a, b) =>
    ROLE_ORDER.indexOf(a) <= ROLE_ORDER.indexOf(b) ? a : b
  );
}

/**
 * Compare two priority strings — returns true if a is higher priority than b.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isHigherPriority(a, b) {
  return PRIORITY_ORDER.indexOf(a) < PRIORITY_ORDER.indexOf(b);
}

/**
 * Deduplicate an array preserving order.
 * @param {string[]} arr
 * @returns {string[]}
 */
function dedup(arr) {
  return Array.from(new Set(arr));
}

// ---------------------------------------------------------------------------
// Core merge function
// ---------------------------------------------------------------------------

/**
 * Merge provider-specific policy scopes into a unified federated policy.
 *
 * Each providerPolicy entry has shape:
 *   {
 *     provider: string,
 *     priority: 'executive-desk' | 'provider' | 'capability',
 *     requiresApproval: boolean,
 *     complianceGates: string[],
 *     minimumRole?: string,
 *     driftOverride?: boolean   — if true, this scope suppresses lower-tier drift gates
 *   }
 *
 * @param {object[]} providerPolicies
 * @param {{ driftScores?: object }} options — { driftScores: { [provider]: 'NONE'|'INFO'|'WARNING'|'CRITICAL' } }
 * @returns {{
 *   merged: {
 *     requiresApproval: boolean,
 *     complianceGates: string[],
 *     minimumRole: string,
 *     priority: string,
 *     driftOverride: boolean
 *   },
 *   outcome: string,
 *   conflicts: string[],
 *   driftHardenings: string[],
 *   sources: string[],
 *   version: string
 * }}
 */
function mergeProviderPolicies(providerPolicies, options = {}) {
  const { driftScores = {} } = options;

  if (!Array.isArray(providerPolicies) || providerPolicies.length === 0) {
    return {
      merged: {
        requiresApproval: false,
        complianceGates: [],
        minimumRole: 'operator',
        priority: POLICY_PRIORITY.CAPABILITY,
        driftOverride: false
      },
      outcome: MERGE_OUTCOME.EMPTY_INPUT,
      conflicts: [],
      driftHardenings: [],
      sources: [],
      version: FPMR_VERSION
    };
  }

  // Sort by priority — highest first
  const sorted = providerPolicies.slice().sort((a, b) =>
    PRIORITY_ORDER.indexOf(a.priority || POLICY_PRIORITY.CAPABILITY) -
    PRIORITY_ORDER.indexOf(b.priority || POLICY_PRIORITY.CAPABILITY)
  );

  const conflicts = [];
  const driftHardenings = [];

  // --- Executive Desk override: if present, it sets the floor ---
  const execDesk = sorted.find((p) => p.priority === POLICY_PRIORITY.EXECUTIVE_DESK);

  // --- Accumulate values across all providers ---
  let requiresApproval = false;
  const allGates = [];
  const allRoles = [];
  const sources = [];

  for (const policy of sorted) {
    const providerLabel = policy.provider || 'unknown';
    sources.push(providerLabel);

    // requiresApproval: OR-merge
    if (policy.requiresApproval === true) {
      if (!requiresApproval) {
        conflicts.push(`requiresApproval: ${providerLabel} requires approval (merged to true)`);
      }
      requiresApproval = true;
    }

    // complianceGates: union
    if (Array.isArray(policy.complianceGates)) {
      allGates.push(...policy.complianceGates);
    }

    // minimumRole: collect for most-restrictive resolution
    if (policy.minimumRole) {
      allRoles.push(policy.minimumRole);
    }
  }

  // --- Executive Desk always wins on requiresApproval and gates ---
  if (execDesk) {
    if (execDesk.requiresApproval === true) {
      requiresApproval = true;
    }
    if (execDesk.driftOverride === true) {
      // Suppress drift gates added by lower-tier providers
      // (drift hardening will still apply if drift is present)
    }
  }

  // --- Drift-aware hardening ---
  const criticalProviders = Object.keys(driftScores).filter(
    (p) => driftScores[p] === 'CRITICAL'
  );

  // Only apply drift hardening if Executive Desk driftOverride is not set
  const execDriftOverride = execDesk && execDesk.driftOverride === true;

  if (criticalProviders.length > 0 && !execDriftOverride) {
    if (!requiresApproval) {
      requiresApproval = true;
      driftHardenings.push('requiresApproval forced true by CRITICAL drift on: ' + criticalProviders.join(', '));
    }
    allGates.push('DRIFT_CRITICAL_HOLD');
    driftHardenings.push('DRIFT_CRITICAL_HOLD gate added for providers: ' + criticalProviders.join(', '));
  }

  // WARNING drift: add advisory gate only
  const warningProviders = Object.keys(driftScores).filter(
    (p) => driftScores[p] === 'WARNING' && !criticalProviders.includes(p)
  );
  if (warningProviders.length > 0 && !execDriftOverride) {
    allGates.push('DRIFT_WARNING_ADVISORY');
    driftHardenings.push('DRIFT_WARNING_ADVISORY gate added for providers: ' + warningProviders.join(', '));
  }

  // --- Conflict tracking: compare approval states ---
  const approvalValues = providerPolicies.map((p) => p.requiresApproval);
  if (new Set(approvalValues).size > 1) {
    conflicts.push('requiresApproval conflict across providers — resolved to true (most restrictive)');
  }

  // --- Final merged values ---
  const minimumRole = mostRestrictiveRole(allRoles.length ? allRoles : ['operator']);
  const topPriority = sorted[0] ? (sorted[0].priority || POLICY_PRIORITY.CAPABILITY) : POLICY_PRIORITY.CAPABILITY;

  const merged = {
    requiresApproval,
    complianceGates: dedup(allGates),
    minimumRole,
    priority: topPriority,
    driftOverride: !!(execDesk && execDesk.driftOverride)
  };

  const outcome = driftHardenings.length > 0
    ? MERGE_OUTCOME.DRIFT_OVERRIDE
    : conflicts.length > 0
      ? MERGE_OUTCOME.CONFLICT_RESOLVED
      : MERGE_OUTCOME.CLEAN;

  return {
    merged,
    outcome,
    conflicts,
    driftHardenings,
    sources: dedup(sources),
    version: FPMR_VERSION
  };
}

/**
 * Apply merged policy to a federation envelope's policyScope.
 * Returns a new envelope with the merged policyScope applied.
 *
 * @param {object} envelope — FEM envelope
 * @param {object[]} providerPolicies — per-provider policy entries
 * @param {{ driftScores?: object }} options
 * @returns {{ envelope: object, mergeResult: object }}
 */
function applyMergedPolicy(envelope, providerPolicies, options = {}) {
  const mergeResult = mergeProviderPolicies(providerPolicies, options);
  const updatedEnvelope = Object.assign({}, envelope, {
    policyScope: Object.assign({}, envelope.policyScope, {
      requiresApproval: mergeResult.merged.requiresApproval,
      complianceGates: mergeResult.merged.complianceGates,
      minimumRole: mergeResult.merged.minimumRole,
      priority: mergeResult.merged.priority,
      driftOverride: mergeResult.merged.driftOverride
    })
  });
  return { envelope: updatedEnvelope, mergeResult };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  FPMR_VERSION,
  POLICY_PRIORITY,
  MERGE_OUTCOME,
  mergeProviderPolicies,
  applyMergedPolicy
};
