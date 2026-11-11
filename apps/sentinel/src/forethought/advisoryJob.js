'use strict';
const { performance } = require('node:perf_hooks');
const { createHash } = require('node:crypto');
const { evaluateArtifact, artifactDigest, timestamp } = require('../archiveIntelligence/artifactPolicy');
const { evaluateForethought } = require('./interpretation');

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function snapshot(value) { return freeze(structuredClone(value)); }
function decorate(ctx, extra) { return freeze({ ...ctx, ...extra }); }
function fail(code = 'POLICY_BLOCKED') { const error = new Error(code); error.code = code; throw error; }

// Metadata discovery does not assign permission or truth. No top-K truncation:
// every lexical match is retained so a restrictive/contradictory record isn't lost.
function discover(query, store) {
  const words = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  return store.listMetadata().filter((m) => words.some((word) =>
    `${m.title} ${(m.tags || []).join(' ')}`.toLowerCase().includes(word)));
}

function gateCandidates(ctx, deps) {
  const caller = deps.authenticate(ctx.request.caller);
  if (!caller || caller.authenticated !== true || typeof caller.tenant !== 'string' || !Number.isInteger(caller.clearance)) fail('ACCESS_DENIED');
  if (!Number.isInteger(ctx.request.requestedClassification) || ctx.request.requestedClassification < 0 || ctx.request.requestedClassification > caller.clearance) fail('ACCESS_DENIED');
  const currentTime = deps.clock();
  if (!Number.isFinite(timestamp(currentTime))) fail('INVALID_CLOCK');
  const evidence = [];
  for (const metadata of ctx.candidates) {
    // Policy must come from a trusted adapter; caller/document fields aren't grants.
    const policy = deps.resolvePolicy(metadata.id);
    if (!policy || policy.tenant !== caller.tenant || !Number.isInteger(policy.classification) ||
      policy.classification < 0 || policy.classification > caller.clearance ||
      policy.classification > ctx.request.requestedClassification ||
      !Array.isArray(policy.readers) || !policy.readers.includes(caller.subject)) fail('ACCESS_DENIED');
    if (policy.readBlocked === true) fail();
    if (typeof policy.readBlocked !== 'boolean' || typeof policy.retentionHold !== 'boolean') fail();
    // Content is fetched only after policy succeeds.
    const artifact = deps.store.readVersion(metadata.id, metadata.version);
    if (!artifact || artifact.id !== metadata.id || artifact.version !== metadata.version ||
      artifact.version !== policy.activeVersion || policy.digest !== artifactDigest(artifact)) fail('EVIDENCE_CHANGED');
    if (artifact.lifecycle?.status === 'UNDER_HOLD') fail();
    const evaluation = evaluateArtifact(artifact, {
      currentTime, authorityBinding: policy.authorityBinding,
      minimumAuthorityLevel: deps.minimumAuthorityLevel ?? 3
    });
    evidence.push(snapshot({ artifact, evaluation, retentionHold: policy.retentionHold }));
  }
  return decorate(ctx, { evidence: freeze(evidence), evaluatedAt: currentTime });
}

function cite(artifact, claim) {
  const lines = artifact.content.split('\n');
  if (!Number.isInteger(claim.line) || claim.line < 1 || claim.line > lines.length ||
    typeof claim.quote !== 'string' || !claim.quote.length || lines[claim.line - 1] !== claim.quote ||
    !['subject', 'predicate', 'value'].every((k) => typeof claim[k] === 'string' && claim[k].length)) fail('INVALID_CITATION');
  return { documentId: artifact.id, version: artifact.version, digest: artifactDigest(artifact),
    startLine: claim.line, endLine: claim.line, quote: claim.quote };
}

// Deliberately bounded synthesis: extracts declared, line-validated claims.
// This is a deterministic adapter, not an LLM or natural-language contradiction engine.
function synthesize(ctx) {
  const claims = [];
  for (const { artifact, evaluation } of ctx.evidence) {
    if (typeof artifact.content !== 'string' || !Array.isArray(artifact.claims)) fail('INVALID_EVIDENCE');
    for (const claim of artifact.claims) {
      const citation = cite(artifact, claim);
      if (evaluation.slot === 'CURRENT_AUTHORITY') claims.push({ ...claim, key: `${claim.subject}:${claim.predicate}`, citation });
    }
  }
  const keys = [...new Set(claims.map((c) => c.key))].sort();
  const conflicts = keys.filter((key) => new Set(claims.filter((c) => c.key === key).map((c) => c.value)).size > 1)
    .map((key) => ({ key, alternatives: claims.filter((c) => c.key === key).map((c) => ({ value: c.value, citation: c.citation })) }));
  const conflictKeys = new Set(conflicts.map((c) => c.key));
  const conclusions = claims.filter((c) => !conflictKeys.has(c.key))
    .map((c) => ({ key: c.key, value: c.value, support: 'SOURCE_REPORTED', citation: c.citation }));
  const gaps = (ctx.request.requiredKeys || []).filter((key) => !claims.some((c) => c.key === key));
  const nextUsefulAction = conflicts.length ? 'Ask the accountable owner to resolve the cited conflicting claims.' :
    gaps.length ? 'Request current authorized evidence for the listed gaps.' :
    conclusions.length ? 'Ask the human reviewer to assess the cited conclusions.' : 'Request current authorized evidence before drawing a conclusion.';
  const frame = evaluateForethought({ learningState: {
    state: conflicts.length || gaps.length || !conclusions.length ? 'unknown' : 'stable',
    actionGate: 'human_review_required', requiresApproval: true, riskLevel: 'medium',
    reason: nextUsefulAction, evidence: conclusions.map((c) => c.citation.documentId)
  } });
  return decorate(ctx, { synthesis: snapshot({ conclusions, conflicts, gaps, nextUsefulAction,
    framing: { ...frame, confidence: null, explanation: 'Deterministic source-claim extraction; factual confidence unassessed.' } }) });
}

function assemble(ctx) {
  let discoveryReview = ctx.discoveryReview;
  if (discoveryReview?.verdict === 'EVIDENCE_SUPPORTS_PREREQUISITES' &&
      (ctx.synthesis.conflicts.length || ctx.synthesis.gaps.length)) {
    discoveryReview = { ...discoveryReview, verdict: 'INSUFFICIENT_EVIDENCE', supporting_ids: [],
      rationale: 'Advisory conflicts or required evidence gaps remain unresolved.',
      next_evidence_request: ctx.synthesis.nextUsefulAction };
  }
  return decorate(ctx, { packet: snapshot({
    requestId: ctx.request.id, status: 'REVIEW_REQUIRED', executionAllowed: false,
    summary: `${ctx.synthesis.conclusions.length} supported source claims; ${ctx.synthesis.conflicts.length} conflicts; ${ctx.synthesis.gaps.length} required evidence gaps.`,
    ...ctx.synthesis,
    ...(discoveryReview ? { discoveryReview, nextUsefulAction: discoveryReview.next_evidence_request } : {}),
    evidenceTable: ctx.evidence.map(({ artifact: a, evaluation: e, retentionHold }) => ({
      id: a.id, version: a.version, title: a.title, provenance: a.provenance,
      lifecycle: a.lifecycle, slot: e.slot, authorityLevel: e.authorityLevel,
      freshness: e.freshness, reasons: e.reasons, retentionHold
    })),
    signOff: { required: true, status: 'PENDING_HUMAN_REVIEW', grantsExecution: false }
  }) });
}

function validatePacket(ctx) {
  const citations = [...ctx.packet.conclusions.map((x) => x.citation),
    ...ctx.packet.conflicts.flatMap((x) => x.alternatives.map((y) => y.citation))];
  for (const c of citations) {
    const entry = ctx.evidence.find((e) => e.artifact.id === c.documentId && e.artifact.version === c.version);
    if (!entry || entry.evaluation.slot !== 'CURRENT_AUTHORITY' || artifactDigest(entry.artifact) !== c.digest ||
      entry.artifact.content.split('\n')[c.startLine - 1] !== c.quote) fail('INVALID_CITATION');
  }
  if (ctx.packet.executionAllowed !== false || ctx.packet.signOff.grantsExecution !== false) fail('INVALID_PACKET');
}

function runAdvisoryJob(request, deps) {
  const start = performance.now(), cpu = process.cpuUsage();
  const memoryStart = process.memoryUsage();
  const trace = [];
  let ctx;
  const stage = (name, action) => {
    const t = performance.now(), c = process.cpuUsage(), m = process.memoryUsage();
    let status = 'OK';
    try { ctx = action(ctx); }
    catch (error) { status = 'BLOCKED'; throw error; }
    finally {
      const end = process.memoryUsage(), used = process.cpuUsage(c);
      trace.push({ name, status, wallMs: performance.now() - t, cpuUserUs: used.user, cpuSystemUs: used.system,
        rssDeltaBytes: end.rss - m.rss, heapUsedDeltaBytes: end.heapUsed - m.heapUsed,
        sampledRssBytes: end.rss, sampledHeapUsedBytes: end.heapUsed });
    }
  };
  let output;
  try {
    stage('lens', () => {
      if (!request || typeof request.id !== 'string' || typeof request.query !== 'string' || !request.query.trim() ||
        (request.requiredKeys !== undefined && (!Array.isArray(request.requiredKeys) || !request.requiredKeys.every((k) => typeof k === 'string')))) fail('INVALID_REQUEST');
      const initial = snapshot({ request });
      const candidates = deps.discoverCandidates
        ? deps.discoverCandidates(initial.request, deps.store)
        : discover(initial.request.query, deps.store);
      return decorate(initial, { candidates: snapshot(candidates) });
    });
    const validateAndSelect = (c) => {
      const checked = gateCandidates(c, deps);
      return deps.selectEvidence ? deps.selectEvidence(checked) : checked;
    };
    stage('sentinel', validateAndSelect);
    stage('forethought', synthesize);
    stage('desk', (c) => {
      // Revalidate immediately before release: expiry/revocation/changed policy
      // cannot be masked by earlier evaluation or any future synthesis adapter.
      const checked = validateAndSelect(c);
      const identities = (bundle) => bundle.map((e) => [artifactDigest(e.artifact), e.evaluation.slot, e.evaluation.reasons, e.retentionHold]);
      if (JSON.stringify(identities(checked.evidence)) !== JSON.stringify(identities(c.evidence))) fail('EVIDENCE_CHANGED');
      const next = assemble(checked); validatePacket(next); return next;
    });
    output = ctx.packet;
  } catch (error) {
    const known = ['ACCESS_DENIED', 'POLICY_BLOCKED', 'INVALID_CLOCK', 'EVIDENCE_CHANGED', 'INVALID_CITATION', 'INVALID_EVIDENCE', 'INVALID_PACKET', 'INVALID_REQUEST'];
    output = snapshot({ requestId: typeof request?.id === 'string' ? request.id : null,
      status: 'BLOCKED', code: known.includes(error.code) ? error.code : 'INTERNAL_FAILURE', executionAllowed: false });
  }
  stage('telemetry', (c) => c);
  const memoryEnd = process.memoryUsage(), used = process.cpuUsage(cpu);
  return snapshot({ ...output, telemetry: {
    totalWallMs: performance.now() - start, cpuUserUs: used.user, cpuSystemUs: used.system,
    rssDeltaBytes: memoryEnd.rss - memoryStart.rss, heapUsedDeltaBytes: memoryEnd.heapUsed - memoryStart.heapUsed,
    sampledMaxRssBytes: Math.max(memoryStart.rss, memoryEnd.rss, ...trace.map((t) => t.sampledRssBytes)),
    sampledMaxHeapUsedBytes: Math.max(memoryStart.heapUsed, memoryEnd.heapUsed, ...trace.map((t) => t.sampledHeapUsedBytes)),
    processLifetimeMaxRssKiB: process.resourceUsage().maxRSS,
    stages: trace, energyJ: null, carbonG: null, energyStatus: 'UNKNOWN'
  } });
}

function semanticDigest(packet) {
  const { telemetry, ...semantic } = packet;
  return createHash('sha256').update(JSON.stringify(semantic)).digest('hex');
}
module.exports = { runAdvisoryJob, discover, gateCandidates, synthesize, assemble, snapshot, semanticDigest, validatePacket };
