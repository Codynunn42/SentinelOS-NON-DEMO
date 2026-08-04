const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

const RUN_DATE = '2026-05-15';
const OUTPUT_DOC = `docs/SENTINELOS_CLASSIFIED_ISSUES_APPROVAL_XE_${RUN_DATE}.md`;

const principal = {
  tenant: 'nunncloud',
  actor: 'sentinel-ai@nunncloud.local',
  role: 'platform',
  scopes: ['platform:admin']
};

function commandEnvelope(command, payload) {
  return signLocalCommand({
    tenant: 'nunncloud',
    command,
    source: 'sentinel',
    payload,
    metadata: {
      source: 'sentinel',
      actor: principal.actor,
      role: principal.role,
      scopes: principal.scopes
    }
  });
}

function currentIssueSet() {
  return [
    {
      id: 'issue_execution_integrity_enforcement',
      title: 'Signed decision enforcement and immutable audit integrity',
      category: 'execution_integrity',
      concept: 'execution_integrity',
      severity: 'critical',
      status: 'implemented',
      sourceArtifact: 'docs/SENTINELOS_EXECUTIVE_ALIGNMENT_2026-05-15.md',
      evidence: [
        'Unsigned or tampered decisions must fail before execution.',
        'Audit chain verification is available for proof review.'
      ],
      verification: [
        'pnpm run check:execution-integrity'
      ]
    },
    {
      id: 'issue_approval_bottleneck',
      title: 'Approval bottleneck requires cleanup before threshold changes',
      category: 'approval_continuity',
      concept: 'approval_continuity',
      severity: 'elevated',
      status: 'analysis_only',
      sourceArtifact: 'docs/SENTINELOS_APPROVAL_BOTTLENECK_ANALYSIS_2026-05-15.md',
      evidence: [
        'Duplicate pending approvals, stale approvals, and high-risk concentration are classified separately.',
        'Policy adjustment is not safe by default.'
      ],
      proposedFork: {
        branchName: 'fork/drift-approval-threshold-adjustment',
        targetFiles: ['apps/sentinel/src/governance/policyEngine.js'],
        rationale: 'Only after stale and duplicate approval friction is cleared.'
      },
      verification: [
        'pnpm run check:approval-bottleneck',
        'pnpm run check:policy'
      ]
    },
    {
      id: 'issue_workflow_retry_reduction',
      title: 'Repeated blocked commands need explicit retry guidance',
      category: 'workflow_control',
      concept: 'workflow_control',
      severity: 'elevated',
      status: 'implemented',
      sourceArtifact: 'docs/SENTINELOS_FORK_WORKFLOW_RETRY_RESULT_2026-05-15.md',
      evidence: [
        'Blocked responses now include retryability, retry timing, governing concept, and next action.',
        'Blind retries are steered into approval, policy, authority, integrity, or registry correction.'
      ],
      proposedFork: {
        branchName: 'fork/drift-workflow-retry-reduction',
        targetFiles: ['apps/sentinel/src/commands/dispatch.js'],
        rationale: 'Already implemented; keep in monitoring and regression checks.'
      },
      verification: [
        'pnpm run check:workflow-retry',
        'pnpm run check:execution-integrity'
      ]
    },
    {
      id: 'issue_telemetry_normalization',
      title: 'Blocked-path telemetry needed deterministic severity',
      category: 'telemetry_normalization',
      concept: 'telemetry_normalization',
      severity: 'medium',
      status: 'implemented',
      sourceArtifact: 'docs/SENTINELOS_FORK_TELEMETRY_NORMALIZATION_RESULT_2026-05-15.md',
      evidence: [
        'Telemetry findings now carry normalized severity.',
        'Governed telemetry audit artifacts now include severity summaries.'
      ],
      proposedFork: {
        branchName: 'fork/drift-telemetry-normalization',
        targetFiles: ['apps/sentinel/src/telemetry/telemetrySchema.js'],
        rationale: 'Already implemented; keep as drift evidence normalization.'
      },
      verification: [
        'pnpm run check:telemetry-harmonizer',
        'pnpm run check:governance-drift'
      ]
    },
    {
      id: 'issue_faceplane_fork_continuity',
      title: 'Fork steering must remain coherent across faceplanes',
      category: 'faceplane_continuity',
      concept: 'surface_plane_governance',
      severity: 'medium',
      status: 'implemented',
      sourceArtifact: 'docs/SENTINELOS_FACEPLANE_FORK_CONTINUITY_STRESS_2026-05-15.md',
      evidence: [
        'OwnerFi, HotelOps, and ITAD faceplanes map drift into the same concept lanes.',
        'Fork proposals are checked against allowed targets.'
      ],
      verification: [
        'pnpm run check:faceplane-fork-continuity',
        'pnpm run simulate:stress-mock-faceplanes -- --iterations 2 --commands 12'
      ]
    },
    {
      id: 'issue_deployment_stability',
      title: 'Deployment stability requires pre/post state anchors',
      category: 'deployment_stability',
      concept: 'deployment_stability',
      severity: 'elevated',
      status: 'pending_approval',
      sourceArtifact: 'docs/SENTINELOS_DRIFT_CONCEPT_ALIGNMENT_2026-05-15.md',
      evidence: [
        'Failed system events are mapped to deployment stability.',
        'State anchors are the next hardening target after local drift stays green.'
      ],
      proposedFork: {
        branchName: 'fork/drift-deployment-stability',
        targetFiles: ['apps/sentinel/src/verification/stateAnchors.js'],
        rationale: 'Add pre/post deployment state anchors and recovery checks.'
      },
      verification: [
        'pnpm run check:state-anchors',
        'pnpm run check:ready',
        'pnpm run check:execution-integrity'
      ]
    },
    {
      id: 'issue_operator_override_policy',
      title: 'Repeated operator overrides need policy-boundary review',
      category: 'policy_boundary',
      concept: 'policy_boundary',
      severity: 'medium',
      status: 'proposed',
      sourceArtifact: 'docs/SENTINELOS_DRIFT_CONCEPT_ALIGNMENT_2026-05-15.md',
      evidence: [
        'Operator override repetition is mapped to policy boundary.',
        'Policy changes require explicit approval and should not weaken execution integrity.'
      ],
      proposedFork: {
        branchName: 'fork/drift-operator-override-policy',
        targetFiles: ['apps/sentinel/src/governance/policyEngine.js'],
        rationale: 'Review override rules only after approval bottleneck evidence is separated from legitimate risk.'
      },
      verification: [
        'pnpm run check:policy',
        'pnpm run check:approval-bottleneck'
      ]
    }
  ];
}

function issueRows(issues) {
  return issues.map((issue) => {
    const fork = issue.proposedFork;
    const target = fork && fork.targetFiles.length ? fork.targetFiles.map((file) => `\`${file}\``).join('<br>') : 'n/a';
    return `| \`${issue.id}\` | ${issue.severity} | \`${issue.status}\` | \`${issue.approvalPosture}\` | ${fork && fork.branchName ? `\`${fork.branchName}\`` : 'n/a'} | ${target} |`;
  });
}

function categorySections(categories) {
  return Object.entries(categories).flatMap(([category, issues]) => [
    `### ${category}`,
    '',
    '| Issue | Severity | Status | Approval Posture | Fork | Target |',
    '| --- | --- | --- | --- | --- | --- |',
    ...issueRows(issues),
    '',
    '#### XE Steps',
    '',
    ...issues.flatMap((issue) => [
      `- \`${issue.id}\`: ${issue.xeStep}`,
      issue.verification.length ? `  Verification: ${issue.verification.map((cmd) => `\`${cmd}\``).join(', ')}` : '  Verification: pending'
    ]),
    ''
  ]);
}

function buildMarkdown(classification) {
  return [
    `# SentinelOS Classified Issues, Approval, and XE Steps - ${RUN_DATE}`,
    '',
    '**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud',
    '',
    '## Sentinel Processing Result',
    '',
    'Sentinel processed the current issue set from the hardening artifacts and classified each item by governing concept, approval posture, fork readiness, and XE execution step.',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Status | \`${classification.status}\` |`,
    `| Execution Mode | \`${classification.executionMode}\` |`,
    `| Tenant | \`${classification.tenant}\` |`,
    `| Total Issues | ${classification.summary.totalIssues} |`,
    `| Approval Required | ${classification.summary.approvalRequired} |`,
    `| Approved For Monitoring | ${classification.summary.approvedForMonitoring} |`,
    `| Blocked | ${classification.summary.blocked} |`,
    `| Observe Only | ${classification.summary.observeOnly} |`,
    `| XE Ready After Approval | ${classification.summary.xeReady} |`,
    '',
    '## Operating Rules',
    '',
    `- ${classification.approvalRule}`,
    `- ${classification.xeRule}`,
    '- Implemented items remain in the regression loop; they are not reopened unless drift increases.',
    '- Pending approval items may be prepared by XE, but not executed or merged without human approval.',
    '- Blocked items stop immediately and return to human review.',
    '',
    '## Classified Categories',
    '',
    ...categorySections(classification.categories),
    '## Approval Queue',
    '',
    '1. `fork/drift-deployment-stability` - approve next if the goal is operational hardening without touching policy.',
    '2. `fork/drift-approval-threshold-adjustment` - hold until duplicate/stale approval cleanup evidence is reviewed.',
    '3. `fork/drift-operator-override-policy` - hold behind approval bottleneck analysis so policy does not absorb workflow friction.',
    '',
    '## XE Execution Sequence',
    '',
    '1. Maintain implemented forks in regression: execution integrity, workflow retry, telemetry normalization, and faceplane continuity.',
    '2. Prepare deployment stability state-anchor fork as the next safest XE build step.',
    '3. Run approval bottleneck analysis against live/persisted pending approvals before any policy threshold change.',
    '4. Only after human approval, execute one fork at a time and run the listed verification commands.',
    '5. Return a post-fork drift comparison report before merge or production rollout.',
    '',
    '## Sentinel Verdict',
    '',
    'The system can now process discovered issues into controlled categories and XE steps. The immediate next executable lane is deployment stability; approval threshold and override policy remain analysis/approval items.',
    ''
  ].join('\n');
}

async function dispatch(command, payload) {
  return dispatchCommand(commandEnvelope(command, payload), {
    principal,
    source: 'sentinel',
    emitSecurityEvent: () => {}
  });
}

async function main() {
  resetLocalPassportState();

  const classified = await dispatch('drift.issues.classify', {
    tenant: 'nunncloud',
    now: '2026-05-15T12:00:00.000Z',
    issues: currentIssueSet()
  });

  if (!classified.success) {
    throw new Error(`Issue classification failed: ${JSON.stringify(classified)}`);
  }

  const content = buildMarkdown(classified.data.result);
  const written = await dispatch('repo.update.structure', {
    actions: [
      {
        type: 'create_file',
        path: OUTPUT_DOC,
        content
      }
    ]
  });

  if (!written.success) {
    throw new Error(`Issue classification write failed: ${JSON.stringify(written)}`);
  }

  console.log(JSON.stringify({
    status: 'executed',
    command: 'drift.issues.classify',
    written: OUTPUT_DOC,
    summary: classified.data.result.summary,
    auditTrustScore: written.data && written.data.trustScore
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
