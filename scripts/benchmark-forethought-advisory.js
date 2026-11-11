'use strict';
const fs = require('node:fs');
const { prepareEvidence } = require('../apps/sentinel/src/forethought/discoveryLens/discoveryLensCore');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { createHash } = require('node:crypto');
const { cases } = require('../tests/forethoughtAdvisory/fixtures');
const { discover, gateCandidates, synthesize, snapshot, runAdvisoryJob, semanticDigest } = require('../apps/sentinel/src/forethought/advisoryJob');
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const quantile = (values, p) => {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered.length ? ordered[Math.max(0, Math.ceil(p * ordered.length) - 1)] : null;
};
const { bridgeFixture } = require('../tests/forethoughtAdvisory/bridgeFixtures');
const { runDiscoveryAdvisoryJob } = require('../apps/sentinel/src/forethought/discoveryLens/advisoryBridge');
const fixtures = cases().map((base) => {
  const f = bridgeFixture(base.docs);
  f.request = base.request;
  Object.assign(f.policies, base.policies);
  return { ...f, kind: base.kind };
});
const repetitions = 10;
const samples = [], skips = [];
const references = new Map();
const variants = ['C1', 'C2', 'C3', 'C4'];
const prepared = fixtures.map((f) => {
  try {
    return gateCandidates(snapshot({ request: f.request, candidates: discover(f.request.query, f.deps.store) }), f.deps);
  } catch { return null; }
});

function invoke(config, index) {
  const f = fixtures[index];
  if (config === 'C1') return { status: 'UNVALIDATED_CONTROL', documents: f.docs };
  if (config === 'C2') return { status: 'UNVALIDATED_CONTROL', packet: prepareEvidence({ ...f.context, request_id: f.request.id }, f.request.query, f.records) };
  if (config === 'C3') return { status: 'SYNTHESIS_ONLY', synthesis: synthesize(prepared[index]).synthesis };
  return runDiscoveryAdvisoryJob(f.request, f.deps);
}

function observe(config, index, repeat, retain) {
  if (config === 'C3' && !prepared[index]) {
    if (retain) skips.push({ config, caseId: fixtures[index].request.id, repeat, reason: 'NO_PREVALIDATED_INPUT' });
    return;
  }
  const start = performance.now(), cpu = process.cpuUsage(), mem = process.memoryUsage();
  const result = invoke(config, index);
  const serialized = JSON.stringify(result); // Included in outer roundtrip timing.
  const elapsed = performance.now() - start, used = process.cpuUsage(cpu), end = process.memoryUsage();
  if (!retain) return;
  const digest = config === 'C4' ? semanticDigest(result) : config === 'C2' ? hash({ ...result, packet: { ...result.packet, timings_ms: {} } }) : hash(result);
  const key = `${config}:${index}`;
  if (references.has(key) && references.get(key) !== digest) throw new Error(`Semantic drift in ${key}`);
  references.set(key, digest);
  samples.push({ config, caseId: fixtures[index].request.id, kind: fixtures[index].kind, repeat,
    status: result.status, outerRoundtripMs: elapsed, cpuUserUs: used.user, cpuSystemUs: used.system,
    rssDeltaBytes: end.rss - mem.rss, heapUsedDeltaBytes: end.heapUsed - mem.heapUsed,
    sampledMaxRssBytes: Math.max(mem.rss, end.rss, result.telemetry?.sampledMaxRssBytes || 0),
    sampledMaxHeapUsedBytes: Math.max(mem.heapUsed, end.heapUsed, result.telemetry?.sampledMaxHeapUsedBytes || 0),
    processLifetimeMaxRssKiB: process.resourceUsage().maxRSS,
    // Boundary sample estimate only. Not a true peak or device-energy measure.
    endpointRssMbSeconds: ((mem.rss + end.rss) / 2 / 1e6) * elapsed / 1000,
    bytesSerialized: Buffer.byteLength(serialized), semanticDigest: digest,
    stages: result.telemetry?.stages || [] });
}

for (let i = 0; i < fixtures.length; i++) for (const config of variants) observe(config, i, -1, false);
for (let repeat = 0; repeat < repetitions; repeat++) {
  const order = variants.slice(repeat % 4).concat(variants.slice(0, repeat % 4));
  for (let i = 0; i < fixtures.length; i++) for (const config of order) observe(config, i, repeat, true);
}

function summarize(items) {
  const values = items.map((s) => s.outerRoundtripMs);
  return { samples: items.length, statuses: items.reduce((m, s) => ({ ...m, [s.status]: (m[s.status] || 0) + 1 }), {}),
    p50Ms: quantile(values, 0.5), p90Ms: quantile(values, 0.9), p95Ms: quantile(values, 0.95), p99Ms: quantile(values, 0.99),
    cpuSeconds: items.reduce((n, s) => n + s.cpuUserUs + s.cpuSystemUs, 0) / 1e6,
    sampledMaxRssBytes: Math.max(...items.map((s) => s.sampledMaxRssBytes)),
    sampledMaxHeapUsedBytes: Math.max(...items.map((s) => s.sampledMaxHeapUsedBytes)) };
}
const arms = Object.fromEntries(variants.map((config) => [config, summarize(samples.filter((s) => s.config === config))]));
const c4 = samples.filter((s) => s.config === 'C4');
const completed = c4.filter((s) => s.status === 'REVIEW_REQUIRED');
const blocked = c4.filter((s) => s.status === 'BLOCKED');
const stageSummary = Object.fromEntries(['lens', 'sentinel', 'forethought', 'desk', 'telemetry'].map((name) => {
  const values = completed.flatMap((s) => s.stages.filter((t) => t.name === name).map((t) => t.wallMs));
  return [name, { observations: values.length, p50Ms: quantile(values, .5), p95Ms: quantile(values, .95), p99Ms: quantile(values, .99) }];
}));
const report = {
  parentSource: '9d95b5b2028c72849b8f3deb12e81332f13481d6', experiment: 'discovery-lens-c4-integration-v0.3',
  generatedAt: new Date().toISOString(), fixtureClock: fixtures[0].deps.clock(), fixtureManifestDigest: hash(fixtures.map((f) => ({ request: f.request, docs: f.docs, policies: f.policies }))),
  environment: { node: process.version, platform: process.platform, arch: process.arch, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model },
  standardizedCases: fixtures.length, repetitions, warmupPasses: 1, warmupExcluded: true,
  measuredSamples: samples.length, skippedC3: skips.length, semanticRepeatability: 'PASS', arms,
  c4Completed: summarize(completed), c4Blocked: summarize(blocked), c4StageSummary: stageSummary,
  c4ResourcesPer1000CompletedPackets: {
    cpuSeconds: completed.reduce((n, s) => n + s.cpuUserUs + s.cpuSystemUs, 0) / 1e6 / completed.length * 1000,
    endpointSampledRssMbHours: completed.reduce((n, s) => n + s.endpointRssMbSeconds, 0) / 3600 / completed.length * 1000,
    energyJ: null, carbonG: null, energyStatus: 'UNKNOWN'
  },
  limits: [
    'Synthetic in-memory metadata/claim fixtures; no network, LLM, live policy registry, production identity or energy counters.',
    'C1/C2 are deliberately unvalidated negative controls; C3 uses prevalidated input prepared outside timing. Arms are not capability-equivalent speed candidates.',
    'Repeated correlated synthetic cases and a shared process; quantiles are descriptive, not production SLO evidence.',
    'Outer timing includes result JSON serialization, excludes fixture setup, semantic hashing and evidence-file writes.',
    'Memory snapshots are boundary samples; maxRSS is process lifetime high-water, not per-request peak heap. CPU time is not vCPU allocation or joules.',
    'No Light implementation or green claim. No human acceptance or operational governance closure.'
  ]
};
const out = path.join(__dirname, '..', 'docs/executive-desk/evidence/forethought-c4-integration-2026-11-11'); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'benchmark.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'samples.jsonl'), samples.map((s) => JSON.stringify(s)).join('\n') + '\n');
fs.writeFileSync(path.join(out, 'skips.json'), JSON.stringify(skips, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'sample-review-packet.json'), JSON.stringify(runDiscoveryAdvisoryJob(fixtures[0].request, fixtures[0].deps), null, 2) + '\n');
fs.writeFileSync(path.join(out, 'sample-conflict-packet.json'), JSON.stringify(runDiscoveryAdvisoryJob(fixtures[4].request, fixtures[4].deps), null, 2) + '\n');
fs.writeFileSync(path.join(out, 'sample-denial-receipt.json'), JSON.stringify(runDiscoveryAdvisoryJob(fixtures[5].request, fixtures[5].deps), null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
