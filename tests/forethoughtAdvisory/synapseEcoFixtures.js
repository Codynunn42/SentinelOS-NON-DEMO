'use strict';
const { document } = require('./fixtures');
const { bridgeFixture } = require('./bridgeFixtures');
const { MANIFEST } = require('../../apps/sentinel/src/forethought/evaluators/synapseEcoJob');
const NOW = '2026-11-11T23:50:00Z';
function domainInput() {
  const start = Date.parse(NOW);
  return {
    config: { facilityId: 'FACILITY-01', thermalResistance_C_per_kW: 2, thermalCapacity_kWh_per_C: 40,
      chillerCOP: 3, maxChillerPowerKW: 50, tempLimits: { minC: 20, maxC: 23, baselineSetPointC: 21.5 } },
    payload: {
      units: { temperature: 'degC', power: 'kW_electric', carbon: 'gCO2/kWh', tariff: 'USD/kWh' },
      telemetry: { facilityId: 'FACILITY-01', timestamp: NOW, currentZoneTempC: 21.5 },
      forecast: { facilityId: 'FACILITY-01', generatedAt: NOW, sourceMetadata: { carbonSource: 'SYNTHETIC-GRID', version: 'fixture-v1' },
        intervals: Array.from({ length: 24 }, (_, i) => ({ intervalStart: new Date(start + i * 3600000).toISOString(),
          durationMinutes: 60, ambientTempC: i >= 12 && i <= 16 ? 28 : 18,
          carbonIntensityGPerKWh: i < 6 ? 100 : 450, tariffUSDPerKWh: i < 6 ? .08 : .25, internalGainKW: 8 })) }
    }
  };
}
function jobFixture() {
  const input = domainInput();
  const artifact = document({ id: 'facility-evidence', title: 'Facility-01 thermal review',
    content: JSON.stringify(input), claims: [] });
  const f = bridgeFixture([artifact]);
  f.request = { ...f.request, id: 'synapseeco-review-1', evidenceId: artifact.id, facilityId: input.config.facilityId, requiredKeys: [] };
  f.context.evaluation_cutoff = NOW;
  // Large JSON source: use a bounded, exact source excerpt for Lens; C4 binds
  // and evaluates the complete authorized artifact, not the truncated excerpt.
  const excerpt = artifact.content.slice(0, 200);
  Object.assign(f.records[0], { excerpt, excerpt_start_utf8_byte: 0, excerpt_end_utf8_byte: Buffer.byteLength(excerpt) });
  f.deps.clock = () => NOW;
  const grant = { grantId: 'research-grant-1', subject: 'reviewer', tenant: 'alpha', adapterId: MANIFEST.adapterId,
    version: MANIFEST.version, codeSha256: MANIFEST.codeSha256, revoked: false, readOnly: true, executionAllowed: false,
    capabilities: [...MANIFEST.capabilities], facilityIds: [input.config.facilityId], notBefore: '2026-11-01T00:00:00Z', expiresAt: '2026-12-01T00:00:00Z' };
  f.deps.resolveDockingGrant = () => grant;
  return { ...f, grant, input };
}
module.exports = { domainInput, jobFixture, NOW };
