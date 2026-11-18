'use strict';
const { createHash } = require('node:crypto');

// Digest is an identity check against a TRUSTED registry, not a digital signature.
function artifactDigest(artifact) {
  return createHash('sha256').update(JSON.stringify(artifact)).digest('hex');
}

function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return NaN;
  const n = Date.parse(value);
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 19) !== value.slice(0, 19)) return NaN;
  return n;
}

function evaluateArtifact(artifact, { currentTime, authorityBinding, minimumAuthorityLevel = 3 } = {}) {
  const now = timestamp(currentTime);
  if (!Number.isFinite(now)) throw new TypeError('A valid trusted UTC clock is required');
  const p = artifact.provenance || {};
  const l = artifact.lifecycle || {};
  const authored = timestamp(p.authoredAt);
  const ingested = timestamp(p.ingestedAt);
  const until = timestamp(l.validUntil);
  const reasons = [];
  const metadataValid = typeof artifact.id === 'string' && artifact.id.length > 0 &&
    typeof artifact.version === 'string' && artifact.version.length > 0 &&
    typeof p.origin === 'string' && p.origin.length > 0 &&
    [authored, ingested, until].every(Number.isFinite) &&
    authored <= ingested && ingested <= now && until > authored &&
    Number.isInteger(p.authorityLevel) && p.authorityLevel >= 1 && p.authorityLevel <= 5 &&
    ['ACTIVE', 'SUPERSEDED', 'STALE', 'UNDER_HOLD'].includes(l.status) &&
    (l.supersededBy === null || (typeof l.supersededBy === 'string' && l.supersededBy.length > 0));
  if (!metadataValid) reasons.push('INVALID_METADATA');
  if (l.status !== 'ACTIVE') reasons.push('NOT_ACTIVE');
  if (l.supersededBy !== null) reasons.push('SUPERSEDED_OR_UNDECLARED');
  if (Number.isFinite(until) && until < now) reasons.push('EXPIRED');
  const trusted = authorityBinding && authorityBinding.revoked === false &&
    authorityBinding.version === artifact.version &&
    authorityBinding.digest === artifactDigest(artifact) &&
    authorityBinding.authorityLevel === p.authorityLevel;
  if (!trusted) reasons.push('UNVERIFIED_AUTHORITY');
  if (!(p.authorityLevel >= minimumAuthorityLevel)) reasons.push('INSUFFICIENT_AUTHORITY');
  const score = metadataValid ? Math.max(0, Math.min(1, (until - now) / (until - authored))) : null;
  return {
    slot: reasons.length ? 'HISTORICAL_CONTEXT' : 'CURRENT_AUTHORITY',
    authorityLevel: Number.isInteger(p.authorityLevel) && p.authorityLevel >= 1 && p.authorityLevel <= 5 ? p.authorityLevel : null,
    lifecycleStatus: l.status || 'UNKNOWN',
    freshness: { score, rationale: score === null ? 'Invalid metadata; freshness unknown.' : 'Remaining validity fraction; not factual confidence or permission.' },
    reasons
  };
}

module.exports = { artifactDigest, evaluateArtifact, timestamp };
