'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { createHash } = require('node:crypto');
const { jobFixture } = require('../tests/forethoughtAdvisory/synapseEcoFixtures');
const { artifactDigest } = require('../apps/sentinel/src/archiveIntelligence/artifactPolicy');
const { runSynapseEcoJob, EVALUATOR_SHA256 } = require('../apps/sentinel/src/forethought/evaluators/synapseEcoJob');

const out = path.join(__dirname, '../docs/executive-desk/evidence/synapseeco-docked-research-2026-11-11');
fs.mkdirSync(out, { recursive: true });
const fixtures = Array.from({ length: 100 }, (_, index) => {
  const f = jobFixture(); f.request.id = `research-${index}`;
  f.input.payload.forecast.intervals.forEach((s, hour) => {
    s.ambientTempC += (index % 5) * .1;
    s.internalGainKW += (index % 7) * .05;
    s.carbonIntensityGPerKWh += hour < 6 ? index % 11 : index % 17;
  });
  const kind = index % 10;
  if (kind === 0) f.grant.revoked = true;
  if (kind === 1) f.input.payload.units.carbon = 'unknown';
  if (kind === 2) f.input.payload.telemetry.currentZoneTempC = 25;
  if (kind === 3) f.input.payload.forecast.intervals.forEach((s) => { s.carbonIntensityGPerKWh = 200; });
  f.docs[0].content = JSON.stringify(f.input);
  f.records[0].text = f.docs[0].content; f.records[0].excerpt = f.docs[0].content.slice(0, 200);
  f.records[0].excerpt_end_utf8_byte = Buffer.byteLength(f.records[0].excerpt);
  const digest = artifactDigest(f.docs[0]);
  f.policies['facility-evidence'].digest = digest;
  f.policies['facility-evidence'].authorityBinding.digest = digest;
  return { ...f, kind };
});
const scrub = (value) => {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['computationalProfile', 'timestamp'].includes(key)).map(([key, item]) => [key, scrub(item)]));
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Non-finite output');
  return value;
};
const samples = [], hashes = new Map();
for (const f of fixtures) runSynapseEcoJob(f.request, f.deps); // Excluded warmup.
for (let repeat = 0; repeat < 5; repeat++) for (const f of fixtures) {
  const start = performance.now(), cpu = process.cpuUsage(), memory = process.memoryUsage();
  const result = runSynapseEcoJob(f.request, f.deps);
  JSON.stringify(result); // Include result serialization.
  const elapsedMs = performance.now() - start, used = process.cpuUsage(cpu), end = process.memoryUsage();
  const digest = createHash('sha256').update(JSON.stringify(scrub(result))).digest('hex');
  if (hashes.has(f.request.id) && hashes.get(f.request.id) !== digest) throw new Error('Semantic drift');
  hashes.set(f.request.id, digest);
  samples.push({ caseId: f.request.id, kind: f.kind, repeat, status: result.status,
    domainStatus: result.domainStatus || null, elapsedMs, processCpuUs: used.user + used.system,
    sampledRssBytes: Math.max(memory.rss, end.rss), rssDeltaBytes: end.rss - memory.rss,
    semanticSha256: digest, energyJ: null });
}
const q = (values, p) => { const a = [...values].sort((a, b) => a - b); return a[Math.ceil(a.length * p) - 1] ?? null; };
const complete = samples.filter((s) => s.status === 'REVIEW_REQUIRED');
const summary = { generatedAt: new Date().toISOString(), base: '51490c22c9091f95d92da312e73c9cf246e17578', evaluatorSha256: EVALUATOR_SHA256,
  node: process.version, platform: process.platform, cases: 100, repeats: 5, measuredCalls: samples.length,
  statuses: samples.reduce((m, s) => { const key = s.domainStatus || s.status; m[key] = (m[key] || 0) + 1; return m; }, {}),
  completePacketLatencyMs: { p50: q(complete.map((s) => s.elapsedMs), .5), p95: q(complete.map((s) => s.elapsedMs), .95), p99: q(complete.map((s) => s.elapsedMs), .99) },
  semanticRepeatability: 'PASS', allOutputNumbersFinite: true, energyJ: null, carbonG: null,
  limits: ['Synthetic in-memory policy, identity, evidence and forecasts; correlated repetitions.',
    'Local process timings include serialization; fixture setup, semantic hashing and file output are excluded.',
    'No live provider, actuator, standard certification, energy meter, human acceptance or Light comparison.'] };
fs.writeFileSync(path.join(out, 'benchmark.json'), JSON.stringify(summary, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'samples.jsonl'), samples.map((s) => JSON.stringify(s)).join('\n') + '\n');
const f = jobFixture();
const packet = runSynapseEcoJob(f.request, f.deps);
fs.writeFileSync(path.join(out, 'sample-review-packet.json'), JSON.stringify(packet, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
