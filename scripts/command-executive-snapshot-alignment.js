const fs = require('fs');
const path = require('path');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { routeArchiveIntelligenceIntake } = require('../apps/sentinel/src/learning/interpretation');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

const RUN_DATE = '2026-05-15';
const DOCS_DIR = path.join(process.cwd(), 'docs');
const ALIGNMENT_DOC = `docs/SENTINELOS_EXECUTIVE_ALIGNMENT_${RUN_DATE}.md`;
const DOCUMENTATION_DOC = `docs/SENTINELOS_DOCUMENTATION_ADVANCEMENT_${RUN_DATE}.md`;

const SNAPSHOT_INPUT = {
  id: 'executive_snapshot_2026_05_14_alignment',
  title: 'SentinelOS Executive Snapshot - May 14, 2026',
  source: 'operator',
  tags: [
    'platform stabilization',
    'operational hardening',
    'approval continuity',
    'execution integrity',
    'audit integrity',
    'trust binder',
    'pilot onboarding'
  ],
  body: [
    'Current operating position: platform stabilization and operational hardening.',
    'Stop building more and make good what exists.',
    'Priority 1: signature verification enforcement, immutable audit integrity, execution boundary formalization.',
    'Priority 2: health and drift discipline, demo stabilization, reduce architectural branching.',
    'Priority 3: Trust Binder, pilot onboarding kit, security posture, institutional diagrams, and institutional overview materials.',
    'Avoid new Face Planes, major redesigns, blockchain expansion, infrastructure pivots, unrelated AI capabilities, and speculative integrations.'
  ].join(' ')
};

const DOC_POSITIONING = [
  {
    package: 'Trust Binder',
    role: 'canonical_source',
    files: [
      'docs/PRODUCT.md',
      'docs/EXECUTION_ARCHITECTURE.md',
      'docs/GOVERNANCE_PREFLIGHT.md',
      'docs/INVARIANTS.md',
      'docs/SYSTEM_DESIGN.md',
      'docs/SURFACE_PLANES.md',
      'docs/REPO_AUTHORITY_MAP_2026-05-08.md',
      'docs/NUNN_GOVERNANCE_DOCTRINE_v1.md'
    ],
    action: 'Consolidate into one operator-readable binder section explaining what SentinelOS can do, what it cannot do, and where execution is blocked.'
  },
  {
    package: 'Execution Integrity Appendix',
    role: 'proof_evidence',
    files: [
      'docs/EXECUTION_ARCHITECTURE.md',
      'docs/SECURITY_HARDENING_PASS_2026-05-11.md',
      'docs/PHASE1_LIVE_VERIFICATION_2026-05-15.md',
      'docs/SENTINEL_CRAFTSMANSHIP_PASS_2026-05-13.md',
      'docs/STATE_ANCHORING_RUNBOOK.md'
    ],
    action: 'Promote signature enforcement, audit-chain verification, readiness checks, and release anchors into a hardened execution-control appendix.'
  },
  {
    package: 'Operational Runbook',
    role: 'operator_package',
    files: [
      'docs/DEPLOYMENT.md',
      'docs/DAILY_OPERATING_GOAL.md',
      'docs/STATE_ANCHORING_RUNBOOK.md',
      'docs/PHASE1_APPROVAL_BOARD_2026-05-12.md',
      'docs/PHASE1_APPROVAL_DECISION_2026-05-15.md',
      'docs/GITHUB_ACTIONS_SENTINELOS_REPAIR_REPORT_2026-05-08.md'
    ],
    action: 'Turn deployment validation, daily verification, drift snapshots, incident posture, and recovery notes into a single daily operating routine.'
  },
  {
    package: 'Demo Reliability Packet',
    role: 'proof_package',
    files: [
      'docs/SENTINELOS_DEMO_PACKAGE_V2.md',
      'docs/SENTINELOS_LIVE_DEMO_SCRIPT_V2.md',
      'docs/SENTINELOS_PROOF_SHEET_V2.md',
      'docs/PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md',
      'docs/GOVERNED_BLOCK_DEMO_MOMENT.md',
      'docs/PROOF_CASE_OWNERFI.md'
    ],
    action: 'Keep the proof loop submit -> block -> show why -> score -> alert -> approve -> execute -> audit as the only demo spine until fragility is removed.'
  },
  {
    package: 'Pilot Onboarding Kit',
    role: 'buyer_package',
    files: [
      'docs/OWNERFI_PILOT_API_SPEC.md',
      'docs/OWNERFI_TODD_PILOT_MESSAGE.md',
      'docs/COMMERCIAL_ASSETS_2026-04-29.md',
      'docs/GO_TO_MARKET.md',
      'docs/BILLING_FUNNEL_READINESS.md',
      'docs/GOVERNMENT_POSITIONING.md',
      'docs/VENDOR_ONBOARDING_RULE_SET_V1.md'
    ],
    action: 'Extract prerequisites, deployment checklist, success metrics, integration assumptions, rollback posture, and buyer-facing governance language.'
  },
  {
    package: 'Architecture Diagram Set',
    role: 'visual_evidence',
    files: [
      'docs/ARCHITECTURE_INDEX_2026-05-11.md',
      'docs/diagrams/sentinelos_architecture_v2.mmd',
      'docs/diagrams/governance_pipeline_v2.mmd',
      'docs/diagrams/faceplane_docking_v2.mmd',
      'docs/FACEPLANE_SDK_SPEC.md',
      'docs/SENTINEL_DOCKING_PROTOCOL.md'
    ],
    action: 'Use as institutional diagrams, but freeze new plane expansion and annotate Face Plane content as surface routing, not new systems.'
  },
  {
    package: 'Archive And Hold Ledger',
    role: 'scope_control',
    files: [
      'docs/ARCHIVE_INTELLIGENCE_DOCKING_2026-05-13.md',
      'docs/ARCHIVE_INTELLIGENCE_INGESTION_LEDGER_2026-05-13.md',
      'docs/SENTINEL_ARTIFACT_DECISION_REGISTER_2026-05-13.md',
      'docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md',
      'docs/HERGLASS_FACEPLANE_PLAN.md',
      'docs/FACEPLANE_GAAS_DOCKING_DOCTRINE.md'
    ],
    action: 'Keep deferred/future material visible as lineage, but prevent it from changing today’s stabilization lane without explicit approval.'
  }
];

function readDoc(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const headings = content
    .split('\n')
    .filter((line) => /^#{1,3}\s+/.test(line))
    .slice(0, 6)
    .map((line) => line.replace(/^#{1,3}\s+/, '').trim());

  return {
    path: relativePath,
    bytes: Buffer.byteLength(content, 'utf8'),
    headings,
    content
  };
}

function listMarkdownDocs() {
  return fs.readdirSync(DOCS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => `docs/${file}`)
    .sort();
}

function scoreDocument(doc) {
  const text = doc.content.toLowerCase();
  const signals = {
    trustBinder: ['architecture', 'governance', 'approval', 'audit', 'security', 'tenant', 'operator']
      .filter((term) => text.includes(term)).length,
    hardening: ['signature', 'integrity', 'ready', 'health', 'drift', 'deployment', 'verification']
      .filter((term) => text.includes(term)).length,
    pilot: ['pilot', 'ownerfi', 'onboarding', 'success metrics', 'rollback', 'buyer', 'procurement']
      .filter((term) => text.includes(term)).length,
    demo: ['proof', 'demo', 'approve', 'execute', 'blocked', 'activity feed', 'decision score']
      .filter((term) => text.includes(term)).length
  };

  return {
    path: doc.path,
    bytes: doc.bytes,
    headings: doc.headings,
    signals,
    strongestLane: Object.entries(signals).sort((a, b) => b[1] - a[1])[0][0]
  };
}

function existingFiles(files) {
  return files
    .map((file) => readDoc(file))
    .filter(Boolean)
    .map((doc) => scoreDocument(doc));
}

function buildAlignmentMarkdown(intake, commandResult) {
  return [
    `# SentinelOS Executive Alignment - ${RUN_DATE}`,
    '',
    '**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud',
    '',
    '## Command Result',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Command | \`repo.update.structure\` |`,
    `| Status | \`${commandResult.status || 'executed'}\` |`,
    `| Governance Lane | \`${intake.lane}\` |`,
    `| Execution Mode | \`${intake.executionMode}\` |`,
    `| Active Execution Allowed By Archive Intake | \`${intake.activeExecutionAllowed}\` |`,
    `| Interpretation Action Gate | \`${intake.interpretation.actionGate}\` |`,
    '',
    '## Alignment Decision',
    '',
    'SentinelOS is aligned to the May 14, 2026 executive instruction as the active operating posture:',
    '',
    '- primary mission: convert SentinelOS from advanced prototype into hardened operational infrastructure',
    '- build posture: freeze expansion and harden existing governed execution surfaces',
    '- priority 1: signed decision enforcement, audit integrity, execution boundary formalization',
    '- priority 2: health/drift discipline, demo stabilization, runtime issue elimination',
    '- priority 3: Trust Binder, pilot onboarding kit, security posture, institutional diagrams',
    '',
    '## Build Freeze Enforcement',
    '',
    'Temporarily hold entirely new Face Planes, major UI redesigns, blockchain expansion, infra pivots, unrelated AI capabilities, and speculative integrations unless explicitly approved.',
    '',
    '## Current Evidence',
    '',
    '- Signed policy decisions are now required before command handlers execute.',
    '- Audit events now have explicit chain verification and tamper checks.',
    '- Approval-required paths remain visible as governed stops, not silent success.',
    '- Archive Intelligence remains observe/classify only and cannot execute commands.',
    '',
    '## Next Required Outputs',
    '',
    '1. Trust Binder from existing canonical docs.',
    '2. Operational Runbook from health, readiness, drift, deployment, and incident docs.',
    '3. Pilot Onboarding Kit from OwnerFi/commercial/procurement assets.',
    '4. Demo Reliability Packet from proof/demo docs.',
    '5. Architecture Diagram Set from existing Mermaid and docking docs.',
    ''
  ].join('\n');
}

function buildDocumentationMarkdown(intake, allScores) {
  const packageSections = DOC_POSITIONING.map((item) => {
    const scores = existingFiles(item.files);
    const rows = scores.map((doc) => {
      const headings = doc.headings.length ? doc.headings.join('; ') : 'no headings captured';
      return `| \`${doc.path}\` | ${doc.strongestLane} | ${doc.bytes} | ${headings} |`;
    });

    return [
      `## ${item.package}`,
      '',
      `Role: \`${item.role}\``,
      '',
      item.action,
      '',
      '| Document | Strongest Lane | Bytes | Captured Headings |',
      '| --- | --- | ---: | --- |',
      ...(rows.length ? rows : ['| none found | n/a | 0 | n/a |']),
      ''
    ].join('\n');
  });

  const topDocs = allScores
    .filter((doc) => Math.max(...Object.values(doc.signals)) >= 4)
    .slice(0, 20)
    .map((doc) => `| \`${doc.path}\` | ${doc.strongestLane} | ${Object.values(doc.signals).join(' / ')} |`);

  return [
    `# SentinelOS Documentation Advancement Evaluation - ${RUN_DATE}`,
    '',
    '**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud',
    '',
    '## Intake Classification',
    '',
    `Archive Intelligence classified the May 14 executive snapshot as \`${intake.lane}\` with action gate \`${intake.interpretation.actionGate}\`. It informs documentation alignment but does not execute platform changes.`,
    '',
    '## Documentation Positioning Decision',
    '',
    'Current documents are sufficient to advance institutional documentation. The right move is consolidation into buyer/operator packages, not broad new writing.',
    '',
    ...packageSections,
    '## Highest-Signal Existing Documents',
    '',
    '| Document | Strongest Lane | Scores: Trust / Hardening / Pilot / Demo |',
    '| --- | --- | --- |',
    ...(topDocs.length ? topDocs : ['| none | n/a | n/a |']),
    '',
    '## Immediate Documentation Work Order',
    '',
    '1. Build the Trust Binder from canonical architecture, governance, audit, approval, security, operator, and tenant documents.',
    '2. Build the Operational Runbook from deployment, readiness, drift, incident, and approval-board evidence.',
    '3. Build the Pilot Onboarding Kit from OwnerFi, commercial, government, and vendor-onboarding assets.',
    '4. Lock demo documentation to the governed deal execution proof loop.',
    '5. Keep archive/deferred documents indexed, but do not let them expand current scope.',
    ''
  ].join('\n');
}

async function main() {
  resetLocalPassportState();

  const intake = routeArchiveIntelligenceIntake(SNAPSHOT_INPUT, {
    systemGoal: 'align SentinelOS to platform stabilization and operational hardening'
  });
  const allScores = listMarkdownDocs()
    .map((file) => readDoc(file))
    .filter(Boolean)
    .map((doc) => scoreDocument(doc));

  const alignmentMarkdown = buildAlignmentMarkdown(intake, { status: 'executed' });
  const documentationMarkdown = buildDocumentationMarkdown(intake, allScores);

  const principal = {
    tenant: 'nunncloud',
    actor: 'sentinel-ai@nunncloud.local',
    role: 'platform',
    scopes: ['platform:admin']
  };

  const command = signLocalCommand({
    tenant: 'nunncloud',
    command: 'repo.update.structure',
    source: 'sentinel',
    payload: {
      actions: [
        {
          type: 'create_file',
          path: ALIGNMENT_DOC,
          content: alignmentMarkdown
        },
        {
          type: 'create_file',
          path: DOCUMENTATION_DOC,
          content: documentationMarkdown
        }
      ]
    },
    metadata: {
      source: 'sentinel',
      actor: principal.actor,
      role: principal.role,
      scopes: principal.scopes
    }
  });

  const result = await dispatchCommand(command, {
    principal,
    source: 'sentinel',
    emitSecurityEvent: () => {}
  });

  if (!result.success) {
    throw new Error(`Sentinel command failed: ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify({
    status: 'executed',
    command: 'repo.update.structure',
    intakeLane: intake.lane,
    actionGate: intake.interpretation.actionGate,
    docsScanned: allScores.length,
    written: [ALIGNMENT_DOC, DOCUMENTATION_DOC],
    auditTrustScore: result.data && result.data.trustScore
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
