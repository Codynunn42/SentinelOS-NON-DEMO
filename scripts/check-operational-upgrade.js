#!/usr/bin/env node
/**
 * Verification Script: Operational Upgrade Assessment
 * 
 * Validates:
 * - Progressive flow widget integrity
 * - Faceplane UI correctness
 * - Assessment handler functionality
 * - Integration with SentinelOS governance
 * - Non-adversarial framing and UX delight
 */

const assert = require('assert');
const path = require('path');
const { buildProgressiveFlow } = require(path.join(__dirname, '../apps/sentinel/src/faceplanes/operationalUpgradePlane'));
const { executeAssessment, routeAssessmentThroughGovernance } = require(path.join(__dirname, '../apps/sentinel/src/commands/operationalUpgrade'));

console.log('🚀 Operational Upgrade Assessment Verification\n');

// Test 1: Progressive Flow Structure
console.log('✓ Test 1: Progressive Flow Structure');
const flow = buildProgressiveFlow({
    step: 0,
    data: {
        discovery: { relationships: [] },
        analysis: { drifts: [] },
        recommendations: { opportunities: [] },
        actionPlan: { phases: [] }
    }
});

assert.strictEqual(flow.currentStep, 0, 'Should start at step 0');
assert.strictEqual(flow.totalSteps, 4, 'Should have 4 steps');
assert(flow.avatar, 'Should have avatar widget');
assert(flow.mainWidget, 'Should have main widget');
assert(flow.navigation, 'Should have navigation state');
console.log('  ✓ Flow has correct structure\n');

// Test 2: Avatar State Transitions
console.log('✓ Test 2: Avatar State Transitions');
const flow0 = buildProgressiveFlow({ step: 0 });
const flow1 = buildProgressiveFlow({ step: 1 });
const flow2 = buildProgressiveFlow({ step: 2 });
const flow3 = buildProgressiveFlow({ step: 3 });

assert.strictEqual(flow0.avatar.state, 'greeting', 'Step 0: greeting');
assert.strictEqual(flow1.avatar.state, 'thinking', 'Step 1: thinking');
assert.strictEqual(flow2.avatar.state, 'explaining', 'Step 2: explaining');
assert.strictEqual(flow3.avatar.state, 'celebrating', 'Step 3: celebrating');
console.log('  ✓ Avatar transitions are delightful\n');

// Test 3: Widget Correctness
console.log('✓ Test 3: Widget Types at Each Phase');
assert.strictEqual(flow0.mainWidget.type, 'discovery', 'Phase 0: discovery');
assert.strictEqual(flow1.mainWidget.type, 'drift-analysis', 'Phase 1: drift-analysis');
assert.strictEqual(flow2.mainWidget.type, 'recommendations', 'Phase 2: recommendations');
assert.strictEqual(flow3.mainWidget.type, 'action-plan', 'Phase 3: action-plan');
console.log('  ✓ Each phase has correct widget type\n');

// Test 4: Assessment Execution (OwnerFi)
console.log('✓ Test 4: Assessment Execution (OwnerFi)');
(async () => {
    const assessment = await executeAssessment('ownerfi', {
        tenantId: 'ownerfi',
        initiatedBy: 'verification_script'
    });

    assert.strictEqual(assessment.status, 'success', 'Assessment should succeed');
    assert(assessment.driftAnalysis, 'Should have drift analysis');
    assert(assessment.driftAnalysis.length > 0, 'Should detect drifts');

    const criticalDrift = assessment.driftAnalysis.find(d => d.severity === 'critical');
    assert(criticalDrift, 'Should detect critical drift (continuity)');
    console.log('  ✓ Assessment detected critical continuity gap');

    assert(assessment.opportunities, 'Should have opportunities');
    assert(assessment.opportunities.length > 0, 'Should generate opportunities');

    const quickWin = assessment.opportunities.find(o => o.effort === 'Low');
    assert(quickWin, 'Should have quick-win opportunity');
    console.log('  ✓ Assessment identified quick wins\n');

    // Test 5: Non-Adversarial Framing
    console.log('✓ Test 5: Non-Adversarial Framing');
    const summary = assessment.summary;

    // Validate framing
    assert(!summary.nextControlledAction.title.includes('recover'), 'Should not use "recover" language');
    assert(!summary.nextControlledAction.title.includes('litigate'), 'Should not use "litigate" language');
    assert(summary.nextControlledAction.title.includes('Alignment') || summary.nextControlledAction.title.includes('Modernization'), 'Should use positive language');
    console.log('  ✓ Assessment uses non-adversarial, positive framing\n');

    // Test 6: UX Delight Indicators
    console.log('✓ Test 6: UX Delight Indicators');
    assert(flow.avatar.message, 'Avatar should have message');
    assert(flow.avatar.actions, 'Avatar should suggest actions');
    assert(flow.navigation.stepsDisplay, 'Should show progress indication');
    console.log('  ✓ UX includes delightful guidance and feedback\n');

    // Test 7: Progressive Disclosure
    console.log('✓ Test 7: Progressive Disclosure');
    const flow1Drift = buildProgressiveFlow({
        step: 1,
        data: { analysis: { drifts: assessment.driftAnalysis } }
    });

    assert(flow1Drift.mainWidget.drifts, 'Should show drift items');
    const drift = flow1Drift.mainWidget.drifts[0];
    assert(!drift.details, 'Details should start collapsed (not expanded)');
    console.log('  ✓ Information is progressively disclosed\n');

    // Test 8: Governance Integration
    console.log('✓ Test 8: Governance Integration');
    assert(assessment.governanceTrace, 'Should have governance trace');
    assert.strictEqual(assessment.governanceTrace.auditArtifact.type, 'operational_upgrade_assessment', 'Should create audit artifact');
    console.log('  ✓ Assessment creates governance audit trail\n');

    // Test 9: Next Controlled Action Clarity
    console.log('✓ Test 9: Next Controlled Action Clarity');
    const actionPlan = assessment.summary;
    assert(actionPlan.nextControlledAction, 'Should have clear next action');
    assert(actionPlan.nextControlledAction.title, 'Next action should have title');
    assert(actionPlan.nextControlledAction.description, 'Next action should have description');
    assert(actionPlan.nextControlledAction.timeline, 'Next action should have timeline');
    console.log('  ✓ Next controlled action is clear and actionable\n');

    // Test 10: Routing through SentinelOS
    console.log('✓ Test 10: Routing through SentinelOS Governance');
    const governed = await routeAssessmentThroughGovernance('ownerfi', {
        tenantId: 'ownerfi'
    });

    assert.strictEqual(governed.status, 'ASSESSMENT_COMPLETE', 'Should complete assessment');
    assert(governed.flow, 'Should return progressive flow');
    assert(governed.summary, 'Should return summary');
    assert.strictEqual(governed.intent, 'operational.upgrade.assess', 'Should route through correct intent');
    console.log('  ✓ Assessment routes through SentinelOS governance\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✅ All verification tests passed!\n');
    console.log('Assessment Summary for OwnerFi:');
    console.log(`  • Detected ${assessment.driftAnalysis.length} drift patterns`);
    console.log(`  • Identified ${assessment.opportunities.length} modernization opportunities`);
    console.log(`  • Generated ${assessment.summary.immediateActions.length} immediate actions`);
    console.log(`  • Modernization Score: ${assessment.summary.modernizationScore * 100}%\n`);
    console.log('Critical Gaps Identified:');
    assessment.summary.criticalGaps.forEach(gap => console.log(`  • ${gap}`));
    console.log('\nQuick Wins Available:');
    assessment.summary.quickWins.forEach(win => console.log(`  • ${win}`));
    console.log('\nNext Controlled Action:');
    console.log(`  ${assessment.summary.nextControlledAction.title}`);
    console.log(`  ${assessment.summary.nextControlledAction.description}`);
    console.log(`  Timeline: ${assessment.summary.nextControlledAction.timeline}\n`);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✨ Operational Upgrade Assessment is ready for controlled review!\n');
    console.log('How to use:');
    console.log('  1. Open apps/api/public/operational-upgrade.html in browser');
    console.log('  2. Select a relationship to assess');
    console.log('  3. Follow progressive flow through 4 phases');
    console.log('  4. Review recommendations and prepare the controlled upgrade plan\n');
})().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
