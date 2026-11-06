const assert = require('node:assert/strict');
const { describe, it } = require('mocha');
const { buildLightQuantitativeNextStepsResult } = require('../sentinelOsHandlers');

function doeOutput(payload = {}) {
    const result = buildLightQuantitativeNextStepsResult({
        focus: 'doe_sbirsttr',
        ...payload
    });
    return result.lanes.find((lane) => lane.lane === 'doe_sbirsttr_readiness').output;
}

describe('DOE SBIR/STTR readiness evidence', () => {
    it('reports missing or malformed status evidence as unknown and unverified', () => {
        const output = doeOutput({
            doeEvidence: {
                samRegistration: {
                    status: 'active',
                    provenanceClassification: 'owner_reported',
                    observationDate: 'not-a-date',
                    sourceReference: 'owner note'
                },
                cageAssignment: {
                    status: 'assigned',
                    provenanceClassification: 'owner_reported',
                    observationDate: '2026-08-18'
                },
                sbaCompanyRegistry: {
                    status: 'complete',
                    provenanceClassification: 'unsupported',
                    observationDate: '2026-08-18',
                    sourceReference: 'record-1'
                }
            }
        });

        assert.equal(output.currentPosture, 'pre_application_readiness_unverified');
        assert.deepEqual(output.statusEvidence.map(({ status, verification }) => ({
            status,
            verification
        })), [
            { status: 'unknown', verification: 'unverified' },
            { status: 'unknown', verification: 'unverified' },
            { status: 'unknown', verification: 'unverified' }
        ]);
        assert.equal(output.externalExecution, 'not_authorized');
    });

    it('labels complete caller inputs as reported rather than verified', () => {
        const output = doeOutput({
            doeEvidence: {
                samRegistration: {
                    status: 'active',
                    provenanceClassification: 'documentary_reference',
                    observationDate: '2026-08-18T12:30:00Z',
                    sourceReference: 'https://example.invalid/evidence/sam'
                }
            }
        });

        assert.deepEqual(output.statusEvidence[0], {
            field: 'samRegistration',
            label: 'SAM.gov registration',
            status: 'active',
            provenanceClassification: 'documentary_reference',
            assertion: 'reported by caller; not independently verified',
            verification: 'unverified',
            observationDate: '2026-08-18T12:30:00Z',
            sourceReference: 'https://example.invalid/evidence/sam'
        });
        assert.equal(output.statusEvidence[1].status, 'unknown');
        assert.equal(output.externalExecution, 'not_authorized');
    });

    it('rejects impossible calendar dates even in timestamp-form observations', () => {
        for (const observationDate of ['2026-02-30', '2026-02-30T12:30:00Z']) {
            const output = doeOutput({
                doeEvidence: {
                    samRegistration: {
                        status: 'active',
                        provenanceClassification: 'owner_reported',
                        observationDate,
                        sourceReference: 'owner note'
                    }
                }
            });
            assert.equal(output.statusEvidence[0].status, 'unknown');
            assert.equal(output.statusEvidence[0].verification, 'unverified');
        }
    });
});
