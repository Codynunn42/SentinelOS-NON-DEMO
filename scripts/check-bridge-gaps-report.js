const assert = require('assert');
const {
    COMMANDS,
    buildBridgeGapsReportResult,
    sentinelOsHandlers
} = require('../apps/sentinel/src/commands/sentinelOsHandlers');

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
assert(result.lightMode.nextSteps.length > 0);
assert.strictEqual(result.fixAndSet.fix, 'Define the smallest controlled correction that closes the current gap.');

(async () => {
    const handled = await sentinelOsHandlers[COMMANDS.BRIDGE_GAPS_REPORT](
        { mode: 'doctor' },
        {
            tenant: 'sentinelos',
            buildReceipt: () => ({ receiptId: 'local-receipt-bridge-gaps-report', auditId: 'audit-bridge-gaps-report' }),
            emitSecurityEvent: () => { }
        }
    );

    assert.strictEqual(handled.success, true);
    assert.strictEqual(handled.statusCode, 200);
    assert.strictEqual(handled.data.result.receipt.audit, true);
    assert.strictEqual(handled.data.receipt.receiptId, 'local-receipt-bridge-gaps-report');
    console.log('Bridge gaps report check passed');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});