'use strict';
const assert = require('node:assert/strict');
const { SynapseEcoEvaluator } = require('../../evaluators/synapseEcoEvaluator');
const { runSynapseEcoJob, MANIFEST } = require('../../evaluators/synapseEcoJob');
const { authorizeAdvisoryDock } = require('../../../integrations/docking/advisoryPolicy');
const { domainInput, jobFixture, NOW } = require('../../../../../../tests/forethoughtAdvisory/synapseEcoFixtures');
const run = (change = () => {}, configChange = {}) => {
  const { config, payload } = domainInput(); change(payload);
  return new SynapseEcoEvaluator({ ...config, ...configChange }).evaluate(payload, { asOf: NOW });
};

describe('SynapseEco research evaluator', function () {
  it('reconciles the model, exact schedules and terminal states', function () {
    const r = run(); assert.equal(r.status, 'MODELED_IMPROVEMENT');
    assert(Math.abs(r.comparativeMetrics.deltas.avoidedEmissionsGrams - 6723.2) < .1);
    assert.equal(r.comparativeMetrics.baseline.finalTempC, 21.5);
    assert.equal(r.comparativeMetrics.proposed.finalTempC, 21.5);
    const energy = r.schedule.reduce((n, s) => n + s.powerKW, 0);
    assert(Math.abs(energy - r.comparativeMetrics.proposed.totalEnergyKWh) < 1e-9);
    assert.equal(r.provenance.timeCoverage.end, '2026-11-12T23:50:00.000Z');
    assert(r.forethought.epistemicGaps.length >= 3);
  });
  it('freezes results and configuration without mutating inputs', function () {
    const { config, payload } = domainInput(); const before = JSON.stringify({ config, payload });
    const evaluator = new SynapseEcoEvaluator(config), r = evaluator.evaluate(payload, { asOf: NOW });
    assert(Object.isFrozen(r.comparativeMetrics.deltas)); assert(Object.isFrozen(evaluator.config.tempLimits));
    assert.throws(() => { r.status = 'changed'; }, TypeError);
    assert.equal(JSON.stringify({ config, payload }), before);
  });
  it('rejects all displaced horizons, including a one-hour offset', function () {
    for (const offset of [-3600000, 3600000, 1e10]) assert.equal(run((p) => {
      p.forecast.intervals.forEach((s) => { s.intervalStart = new Date(Date.parse(s.intervalStart) + offset).toISOString(); });
    }).status, 'INSUFFICIENT_EVIDENCE');
  });
  it('rejects malformed IDs and non-string or rollover dates without throwing', function () {
    for (const change of [(p) => p.telemetry.facilityId = { toString: 1, valueOf: 1 },
      (p) => p.telemetry.timestamp = { toString: 1, valueOf: 1 },
      (p) => p.telemetry.timestamp = '2026-02-30T12:00:00Z',
      (p) => p.telemetry.timestamp = '2026-11-11T24:00:00Z']) assert.equal(run(change).status, 'INSUFFICIENT_EVIDENCE');
  });
  it('rejects non-finite and numeric-string configuration', function () {
    for (const bad of [Infinity, NaN, '40', 0, -1]) assert.equal(run(() => {}, { thermalCapacity_kWh_per_C: bad }).status, 'INSUFFICIENT_EVIDENCE');
  });
  it('requires 24 dense contiguous hourly intervals and declared units', function () {
    for (const change of [(p) => p.forecast.intervals.pop(), (p) => delete p.forecast.intervals[2],
      (p) => p.forecast.intervals[0].durationMinutes = 15, (p) => delete p.units,
      (p) => p.forecast.facilityId = 'other']) assert.equal(run(change).status, 'INSUFFICIENT_EVIDENCE');
  });
  it('rejects stale/future telemetry and missing forecast provenance', function () {
    for (const change of [(p) => p.telemetry.timestamp = '2026-11-01T00:00:00Z',
      (p) => p.telemetry.timestamp = '2026-11-12T00:00:00Z',
      (p) => delete p.forecast.sourceMetadata]) assert.equal(run(change).status, 'INSUFFICIENT_EVIDENCE');
  });
  it('classifies cost and thermal arithmetic overflow as insufficient evidence', function () {
    assert.equal(run((p) => p.forecast.intervals[0].tariffUSDPerKWh = 1e308).status, 'INSUFFICIENT_EVIDENCE');
    assert.equal(run((p) => p.forecast.intervals[0].internalGainKW = 1e308, { thermalCapacity_kWh_per_C: 1e-308 }).status, 'INSUFFICIENT_EVIDENCE');
  });
  it('returns physical and heuristic failures as different outcomes', function () {
    assert.equal(run((p) => p.telemetry.currentZoneTempC = 25).status, 'INFEASIBLE');
    assert.equal(run((p) => p.forecast.intervals.forEach((i) => { i.carbonIntensityGPerKWh = 200; })).status, 'NO_IMPROVEMENT_FOUND');
  });
  it('handles null and invalid options and JSON-shaped malformed payloads', function () {
    const { config, payload } = domainInput(); const e = new SynapseEcoEvaluator(config);
    for (const p of [null, false, [], 0, 'bad', {}, { telemetry: null }, { telemetry: { facilityId: { toString: 1 } } }]) assert.doesNotThrow(() => e.evaluate(p, null));
    assert.equal(e.evaluate(payload, { asOf: { toString: 1 } }).status, 'INSUFFICIENT_EVIDENCE');
  });
});

describe('Restrictive advisory docking profile', function () {
  const admit = (f, manifest = MANIFEST) => authorizeAdvisoryDock(manifest, f.deps.authenticate(f.request.caller), f.grant,
    { currentTime: NOW, codeSha256: MANIFEST.codeSha256, facilityId: f.request.facilityId });
  it('admits an explicitly granted adapter and labels its unsigned local receipt', function () {
    const r = admit(jobFixture()); assert.equal(r.allowed, true);
    assert.equal(r.receipt.evidenceType, 'UNSIGNED_LOCAL_DECISION'); assert.equal(r.executionAllowed, false);
  });
  it('denies unsupported versions, unknown capabilities and all actuator writes', function () {
    for (const cap of ['UNKNOWN_ACTUATOR_WRITE', 'EXECUTE_EXTERNAL_ACTION', 'FACEPLANE_WRITE']) assert.equal(admit(jobFixture(), { ...MANIFEST, capabilities: [cap] }).allowed, false);
    assert.equal(admit(jobFixture(), { ...MANIFEST, udpVersion: '999' }).allowed, false);
  });
  it('denies self-requested tiers without an independent matching grant', function () {
    const f = jobFixture(); f.grant.revoked = true;
    assert.equal(admit(f, { ...MANIFEST, requestedTrustTier: 'TIER_2' }).allowed, false);
  });
  it('denies expired, cross-tenant, wrong-code and cross-facility grants', function () {
    for (const change of [(g) => g.expiresAt = NOW, (g) => g.tenant = 'beta', (g) => g.codeSha256 = '0'.repeat(64), (g) => g.facilityIds = ['other']]) {
      const f = jobFixture(); change(f.grant); assert.equal(admit(f).allowed, false);
    }
  });
});

describe('SynapseEco through Discovery Lens and C4', function () {
  it('produces a cited, pending-review domain packet through the real bridge', function () {
    const f = jobFixture(); const r = runSynapseEcoJob(f.request, f.deps);
    assert.equal(r.status, 'REVIEW_REQUIRED'); assert.equal(r.domainStatus, 'MODELED_IMPROVEMENT');
    assert.equal(r.citations[0].documentId, 'facility-evidence'); assert.equal(r.citations[0].version, 'v1');
    assert.equal(r.executionAllowed, false); assert.equal(r.signOff.status, 'PENDING_HUMAN_REVIEW');
    assert(Object.isFrozen(r.evaluation.schedule)); assert.equal(r.localPolicyDecision.evidenceType, 'UNSIGNED_LOCAL_DECISION');
  });
  it('does not fetch evidence on denied docking admission', function () {
    const f = jobFixture(); f.grant.revoked = true;
    const r = runSynapseEcoJob(f.request, f.deps); assert.equal(r.status, 'BLOCKED'); assert.equal(f.readCount(), 0);
  });
  it('blocks stale authority, denied evidence and read holds without domain metrics', function () {
    for (const change of [(f) => f.policies['facility-evidence'].authorityBinding.revoked = true,
      (f) => f.policies['facility-evidence'].tenant = 'beta', (f) => f.policies['facility-evidence'].readBlocked = true]) {
      const f = jobFixture(); change(f); const r = runSynapseEcoJob(f.request, f.deps);
      assert.equal(r.status, 'BLOCKED'); assert.equal(r.evaluation, undefined);
    }
  });
  it('drops domain output if the docking grant is revoked before release', function () {
    const f = jobFixture(); let count = 0;
    f.deps.resolveDockingGrant = () => { if (++count === 2) f.grant.revoked = true; return f.grant; };
    const r = runSynapseEcoJob(f.request, f.deps); assert.equal(r.status, 'BLOCKED'); assert.equal(r.evaluation, undefined);
  });
  it('drops domain output when source contents change during evaluation', function () {
    const f = jobFixture(); let calls = 0; const read = f.deps.store.readVersion;
    f.deps.store.readVersion = (id, version) => { const value = read(id, version); if (++calls === 4) value.content += ' '; return value; };
    const r = runSynapseEcoJob(f.request, f.deps); assert.equal(r.status, 'BLOCKED'); assert.equal(r.evaluation, undefined);
  });
});
