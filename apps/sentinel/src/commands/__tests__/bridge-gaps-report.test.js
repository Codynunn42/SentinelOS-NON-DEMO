const assert = require('assert');
const {
    COMMANDS,
    buildBridgeGapsReportResult,
    sentinelOsHandlers
} = require('../sentinelOsHandlers');

describe('Sentinel bridge gaps report command', () => {
    it('builds a read-only bridge gaps report with doctor and light guidance', async () => {
        const result = buildBridgeGapsReportResult({ mode: 'doctor' }, { tenant: 'sentinelos' });

        assert.strictEqual(result.command, COMMANDS.BRIDGE_GAPS_REPORT);
        assert.strictEqual(result.schemaVersion, 'bridge-gaps-report.v2');
        assert.strictEqual(result.mode, 'doctor');
        assert.strictEqual(result.northStarAssessment.status, 'partial');
        assert.strictEqual(result.northStarStatusValidation.valid, true);
        assert.strictEqual(result.northStarStatusValidation.applied, 'partial');
        assert.strictEqual(result.doctrineAssessment.unmappedRequirements, 4);
        assert.strictEqual(result.bridgeGapSummary.critical, 1);
        assert.strictEqual(result.currentGapSummary.posture, 'GBP validation incomplete');
        assert(result.doctorMode.blockingConditions.length > 0);
        assert(result.doctorMode.recommendedFixes.length > 0);
        assert(result.doctorMode.blockers.length > 0);
        assert(result.lightMode.nextSteps.length > 0);
        assert(result.lightMode.focusNow.includes('Add negative-control gates for EVD-001, PER-001, and XE-001.'));
        assert.strictEqual(result.fixAndSet.eligible, false);
        assert.strictEqual(result.fixAndSet.set, 'Define the governed target state and the evidence required to hold it.');
    });

    it('normalizes north star status to allowed enum values', async () => {
        const valid = buildBridgeGapsReportResult({ mode: 'doctor', northStarStatus: 'aligned' }, { tenant: 'sentinelos' });
        assert.strictEqual(valid.northStarAssessment.status, 'aligned');
        assert.strictEqual(valid.northStarStatusValidation.valid, true);

        const invalid = buildBridgeGapsReportResult({ mode: 'doctor', northStarStatus: 'unsupported_state' }, { tenant: 'sentinelos' });
        assert.strictEqual(invalid.northStarAssessment.status, 'partial');
        assert.strictEqual(invalid.northStarStatusValidation.valid, false);
        assert.strictEqual(invalid.northStarStatusValidation.requested, 'unsupported_state');
    });

    it('routes through the governed handler and returns a receipt', async () => {
        const handled = await sentinelOsHandlers[COMMANDS.BRIDGE_GAPS_REPORT](
            { mode: 'doctor' },
            {
                tenant: 'sentinelos',
                buildReceipt: () => ({ receiptId: 'test-receipt-bridge-gaps', auditId: 'test-audit-bridge-gaps' }),
                emitSecurityEvent: () => { }
            }
        );

        assert.strictEqual(handled.success, true);
        assert.strictEqual(handled.statusCode, 200);
        assert.strictEqual(handled.data.command, COMMANDS.BRIDGE_GAPS_REPORT);
        assert.strictEqual(handled.data.result.receipt.audit, true);
        assert.strictEqual(handled.data.receipt.receiptId, 'test-receipt-bridge-gaps');
    });
});