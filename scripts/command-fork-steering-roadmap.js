const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { analyzeDrift } = require('../apps/sentinel/src/drift/driftAnalyzer');
const { createApprovalRequest } = require('../apps/sentinel/src/approval/approval');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

const RUN_DATE = '2026-05-15';
const ROADMAP_DOC = `docs/SENTINELOS_FORK_STEERING_ROADMAP_${RUN_DATE}.md`;

function auditEntry(command, result = {}, index = 0) {
  return {
    tenant: 'nunncloud',
    command,
    payload: {
      scenario: 'fork_steering_capability_check',
      index
    },
    result,
    actor: 'sentinel-ai@nunncloud.local',
    timestamp: new Date(Date.UTC(2026, 4, 15, 12, index, 0)).toISOString()
  };
}

function buildSyntheticAuditLog() {
  const entries = [];

  for (let index = 0; index < 4; index += 1) {
    entries.push(auditEntry('approval.requested', {
      success: true,
      status: 'pending',
      approvalRequired: true
    }, index));
  }

  for (let index = 0; index < 4; index += 1) {
    entries.push(auditEntry('deal.execute', {
      success: false,
      error: 'APPROVAL_REQUIRED',
      governance: 'preflight',
      decision: 'block'
    }, index + 10));
  }

  for (let index = 0; index < 5; index += 1) {
    entries.push(auditEntry('blocked-path', {
      success: false,
      governance: 'preflight',
      severity: index > 2 ? 'elevated' : 'warning'
    }, index + 20));
  }

  entries.push(auditEntry('system.validate.integrity', {
    success: false,
    error: 'readiness_check_failed'
  }, 30));
  entries.push(auditEntry('system.validate.integrity', {
    success: false,
    error: 'drift_check_failed'
  }, 31));

  return entries;
}

function statusForProposal(proposal) {
  if (proposal.status === 'blocked') {
    return 'blocked';
  }

  if (proposal.requiresHumanApproval) {
    return 'pending_approval';
  }

  return proposal.status || 'proposed';
}

function buildRoadmapMarkdown(analysis) {
  const forkRows = analysis.forkProposals.map((proposal) => [
    `\`${proposal.branchName || proposal.proposalId}\``,
    statusForProposal(proposal),
    proposal.targetFiles ? proposal.targetFiles.map((file) => `\`${file}\``).join('<br>') : 'n/a',
    proposal.rationale || proposal.reason || 'n/a',
    proposal.requiresHumanApproval ? 'yes' : 'n/a'
  ].join(' | ')).map((row) => `| ${row} |`);

  const recommendationRows = analysis.recommendations.map((recommendation) => [
    `\`${recommendation.type}\``,
    recommendation.severity,
    recommendation.riskAssessment.governanceRisk,
    recommendation.riskAssessment.operationalImpact,
    recommendation.approvalId ? `\`${recommendation.approvalId}\`` : 'pending route',
    recommendation.recommendedAction
  ].join(' | ')).map((row) => `| ${row} |`);

  const signalRows = analysis.signals.map((signal) => [
    `\`${signal.type}\``,
    signal.severity,
    signal.pattern,
    signal.evidence.join('; ')
  ].join(' | ')).map((row) => `| ${row} |`);

  return [
    `# SentinelOS Fork Steering Roadmap - ${RUN_DATE}`,
    '',
    '**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud',
    '',
    '## Capability Question',
    '',
    'Can Sentinel AI use drift signals to suggest controlled fork work that pushes builds in the correct direction while keeping drift at bay?',
    '',
    '## Sentinel Analysis',
    '',
    'Yes, with a strict control boundary. The capability exists as a governed recommendation loop, not as autonomous branch mutation.',
    '',
    'The current loop is:',
    '',
    '```txt',
    'audit history -> drift signals -> recommendations -> fork proposals -> approval routing -> human-reviewed implementation',
    '```',
    '',
    'This can steer drift if each fork proposal remains small, targets allowed files only, carries evidence, and requires explicit approval before implementation or merge.',
    '',
    '## Run Summary',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Status | \`${analysis.status}\` |`,
    `| Tenant | \`${analysis.tenant}\` |`,
    `| Signal Count | ${analysis.summary.signalCount} |`,
    `| Recommendation Count | ${analysis.summary.recommendationCount} |`,
    `| Fork Proposal Count | ${analysis.summary.forkProposalCount} |`,
    `| Requires Human Approval | \`${analysis.summary.requiresHumanApproval}\` |`,
    `| Routed Approvals | ${analysis.approvals.map((id) => `\`${id}\``).join(', ') || 'none'} |`,
    '',
    '## Drift Signals Detected',
    '',
    '| Type | Severity | Pattern | Evidence |',
    '| --- | --- | --- | --- |',
    ...(signalRows.length ? signalRows : ['| none | n/a | n/a | n/a |']),
    '',
    '## Recommendations',
    '',
    '| Type | Severity | Governance Risk | Operational Impact | Approval | Recommended Action |',
    '| --- | --- | --- | --- | --- | --- |',
    ...(recommendationRows.length ? recommendationRows : ['| none | n/a | n/a | n/a | n/a | n/a |']),
    '',
    '## Fork Proposals',
    '',
    '| Proposed Branch | Status | Target Files | Rationale | Approval Required |',
    '| --- | --- | --- | --- | --- |',
    ...(forkRows.length ? forkRows : ['| none | n/a | n/a | n/a | n/a |']),
    '',
    '## Roadmap Decision',
    '',
    'Sentinel can keep drift at bay only if fork suggestions are treated as governed steering, not automatic coding. The system should use fork proposals to narrow the next build slice, force evidence onto the table, and block unsafe target files.',
    '',
    '### Next Fork Sequence',
    '',
    '1. **Drift Steering Board**: use this artifact as the decision board before any branch work starts.',
    '2. **One Fork At A Time**: approve only one proposed fork per implementation pass.',
    '3. **Allowed Targets Only**: keep fork work inside allowed policy, dispatch, telemetry, verification, or learning files.',
    '4. **No Immutable Touches**: signing, audit, authority, execution guard, passport, and approval core remain protected unless a separate owner-approved hardening task exists.',
    '5. **Post-Fork Proof**: every approved fork must run integrity, drift, policy, and relevant demo checks before merge.',
    '',
    '## Controlled Outcome Criteria',
    '',
    '- drift signal has evidence',
    '- recommendation maps to one clear operational outcome',
    '- fork target is allowed and narrow',
    '- human approval exists before implementation',
    '- verification proves the drift reduced or the build became more stable',
    '- no new product plane is introduced',
    '',
    '## Sentinel Verdict',
    '',
    'Capability is present at proposal and governance level. The next maturity step is to connect each approved fork proposal to a small implementation checklist and a post-change drift comparison report.',
    ''
  ].join('\n');
}

async function main() {
  resetLocalPassportState();

  const analysis = await analyzeDrift(buildSyntheticAuditLog(), {
    tenant: 'nunncloud',
    createApprovalRequest,
    routeApprovals: true
  });

  const principal = {
    tenant: 'nunncloud',
    actor: 'sentinel-ai@nunncloud.local',
    role: 'platform',
    scopes: ['platform:admin']
  };

  const result = await dispatchCommand(signLocalCommand({
    tenant: 'nunncloud',
    command: 'repo.update.structure',
    source: 'sentinel',
    payload: {
      actions: [
        {
          type: 'create_file',
          path: ROADMAP_DOC,
          content: buildRoadmapMarkdown(analysis)
        }
      ]
    },
    metadata: {
      source: 'sentinel',
      actor: principal.actor,
      role: principal.role,
      scopes: principal.scopes
    }
  }), {
    principal,
    source: 'sentinel',
    emitSecurityEvent: () => {}
  });

  if (!result.success) {
    throw new Error(`Sentinel roadmap command failed: ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify({
    status: 'executed',
    command: 'repo.update.structure',
    analysisStatus: analysis.status,
    signals: analysis.summary.signalCount,
    recommendations: analysis.summary.recommendationCount,
    forkProposals: analysis.summary.forkProposalCount,
    approvals: analysis.approvals,
    written: ROADMAP_DOC,
    auditTrustScore: result.data && result.data.trustScore
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
