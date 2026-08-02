// C4.5 — Capability Drift Monitor
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Capability Drift Monitor enumerates all registered capabilities
// from the Capability Registry and tracks governance drift against their
// declared dock manifests.
//
// Drift is defined as a deviation between what a capability declares
// (in its dock manifest) and what is currently observable at runtime:
//   - health status change (healthy → degraded)
//   - evidence posture change (evidenceRequired → false)
//   - lifecycle status change (active → deprecated/pending)
//   - missing commands in the manifest
//
// The monitor produces a per-provider drift summary for the Executive Desk
// and the GET /api/v1/drift/capabilities route.

'use strict';

const { listCapabilities } = require('../capabilities/registry');
const fs = require('fs');
const path = require('path');

const FACEPLANE_DIR = path.join(__dirname, '..', '..', '..', '..', '..', 'fixtures', 'faceplanes');

// Provider → dock manifest filename mapping
const MANIFEST_FILES = {
  nexus: 'nexus-faceplane.json',
  ownerfi: null, // no standalone faceplane file; governance posture derived from registry
  tilda: 'tilda-faceplane.json',
  microsoft365: 'microsoft365-faceplane.json',
  github: 'github-faceplane.json'
};

/**
 * Load a dock manifest from the fixtures directory.
 * Returns null if the file does not exist or is not parseable.
 *
 * @param {string} filename
 * @returns {object | null}
 */
function loadDockManifest(filename) {
  if (!filename) return null;
  try {
    const filePath = path.join(FACEPLANE_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Assess drift for a single capability against its declared posture.
 *
 * Drift signals:
 *   - health_degraded: providerHealth is 'degraded'
 *   - health_unknown:  providerHealth is 'unknown'
 *   - evidence_posture_weakened: capability declares evidenceRequired but manifest says 'none'
 *   - lifecycle_inactive: capability lifecycle.status is not 'active'
 *
 * @param {object} cap — capability record from the registry
 * @param {object | null} dockManifest — loaded dock manifest (or null)
 * @returns {{ capabilityId: string, provider: string, driftSignals: string[], clean: boolean }}
 */
function assessCapabilityDrift(cap, dockManifest) {
  const signals = [];

  // Health drift
  if (cap.providerHealth === 'degraded') {
    signals.push('health_degraded');
  } else if (cap.providerHealth === 'unknown') {
    signals.push('health_unknown');
  }

  // Lifecycle drift
  if (cap.lifecycle && cap.lifecycle.status !== 'active') {
    signals.push('lifecycle_inactive');
  }

  // Evidence posture drift — cap says evidenceRequired but manifest says 'none'
  if (dockManifest && dockManifest.dockManifest) {
    const manifestEvidence = dockManifest.dockManifest.governance &&
      dockManifest.dockManifest.governance.evidence;
    if (cap.governance && cap.governance.evidenceRequired && manifestEvidence === 'none') {
      signals.push('evidence_posture_weakened');
    }
  }

  return {
    capabilityId: cap.capabilityId,
    provider: cap.provider,
    type: cap.type,
    providerHealth: cap.providerHealth || 'unknown',
    lifecycleStatus: (cap.lifecycle && cap.lifecycle.status) || 'unknown',
    driftSignals: signals,
    clean: signals.length === 0
  };
}

/**
 * Build a provider-level drift summary.
 *
 * @param {string} provider
 * @param {object[]} capabilities — all capabilities for this provider
 * @param {object | null} dockManifest
 * @returns {object}
 */
function buildProviderDriftSummary(provider, capabilities, dockManifest) {
  const assessments = capabilities.map((cap) => assessCapabilityDrift(cap, dockManifest));
  const drifted = assessments.filter((a) => !a.clean);
  const allSignals = drifted.flatMap((a) => a.driftSignals);

  return {
    provider,
    total: capabilities.length,
    clean: drifted.length === 0,
    driftedCapabilities: drifted.length,
    signals: Array.from(new Set(allSignals)),
    assessments,
    manifestLoaded: dockManifest !== null,
    assessedAt: new Date().toISOString()
  };
}

/**
 * Run the capability drift monitor across all registered providers.
 * Returns a full cross-provider drift report.
 *
 * @returns {{ providers: object[], totalProviders: number, totalCapabilities: number, totalDrifted: number, assessedAt: string }}
 */
function runCapabilityDriftMonitor() {
  const all = listCapabilities();

  // Group by provider
  const byProvider = {};
  all.forEach((cap) => {
    if (!byProvider[cap.provider]) {
      byProvider[cap.provider] = [];
    }
    byProvider[cap.provider].push(cap);
  });

  const providers = Object.entries(byProvider).map(([provider, caps]) => {
    const manifestFile = MANIFEST_FILES[provider] || null;
    const dockManifest = loadDockManifest(manifestFile);
    return buildProviderDriftSummary(provider, caps, dockManifest);
  });

  const totalCapabilities = all.length;
  const totalDrifted = providers.reduce((sum, p) => sum + p.driftedCapabilities, 0);

  return {
    providers,
    totalProviders: providers.length,
    totalCapabilities,
    totalDrifted,
    clean: totalDrifted === 0,
    assessedAt: new Date().toISOString()
  };
}

module.exports = {
  runCapabilityDriftMonitor,
  buildProviderDriftSummary,
  assessCapabilityDrift,
  loadDockManifest
};
