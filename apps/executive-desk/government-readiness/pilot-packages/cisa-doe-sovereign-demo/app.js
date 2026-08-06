const PACKAGE_DATA = {
    mission: {
        title: 'Grid Restoration Coordination Scenario',
        objective: 'Coordinate a cross-agency response package while preserving executive approval, operator traceability, and zero-trust boundary enforcement.',
        risk: 'Moderate',
        policyState: 'Conditional release only after authority and compliance checks.',
        participants: ['Executive sponsor', 'Mission operator', 'Security reviewer', 'Audit lead']
    },
    faceplane: {
        id: 'governed-workflow',
        name: 'Governed Workflow Faceplane',
        purpose: 'Operator surface for governed workflow execution under SentinelOS.',
        owner: 'Nunn Cloud',
        dockingTier: 'TIER_2',
        approvalModel: 'approval_before_execution',
        telemetryMode: 'LIMITED',
        missionScope: 'Grid restoration coordination with local-only release posture.',
        requestedCapabilities: ['FACEPLANE_READ', 'FACEPLANE_WRITE', 'FACEPLANE_EXECUTE', 'GAAS_POLICY_APPLY', 'DOCKING_MANIFEST_REGISTER'],
        controls: ['tenant_scope_required', 'approval_before_execution', 'telemetry_export_blocked_by_default', 'surface_view_audited'],
        evidence: ['policy_map', 'approval_boundary', 'audit_receipt', 'docking_decision'],
        complianceMandates: ['internal_governance', 'operator_rbac']
    },
    stages: [
        {
            title: 'Mission Intent Submitted',
            status: 'complete',
            summary: 'The operator proposes an emergency coordination package for a regional disruption event.',
            evidence: 'Intent payload captured with mission tag and approval boundary.'
        },
        {
            title: 'Authority Validation',
            status: 'complete',
            summary: 'Delegated authority is confirmed for simulation scope only.',
            evidence: 'Principal and delegation scope match approved emergency playbook.'
        },
        {
            title: 'Compliance Gate',
            status: 'blocked',
            summary: 'Outbound dissemination remains locked until data handling control is satisfied.',
            evidence: 'Control state changed in real time to blocked because export path was unapproved.'
        },
        {
            title: 'Executive Resolution',
            status: 'ready',
            summary: 'An executive can approve a local-only release profile or hold the package.',
            evidence: 'No mutation occurs until a human decision is recorded.'
        }
    ],
    impactMatrix: [
        {
            category: 'Mission Governance',
            executive: 'Authority boundaries remain visible before action is allowed.',
            operator: 'The control state is inspectable with explicit gate rationale.'
        },
        {
            category: 'Audit Readiness',
            executive: 'Every decision point yields an attributable receipt.',
            operator: 'Signed ledger entries include timestamps, actors, and control outcomes.'
        },
        {
            category: 'Legacy Overlay',
            executive: 'No rip-and-replace dependency is required to begin evaluation.',
            operator: 'Gateway policy and schema overlays can be tested against existing systems immediately.'
        }
    ],
    ledger: [
        {
            id: 'rcpt-001',
            timestamp: '2026-07-17T13:00:00Z',
            actor: 'operator.alpha',
            action: 'mission.intent.submit',
            decision: 'executed',
            gate: 'captured',
            signature: 'e1c0fd2f7a61b55dcd6d9f2c60e32eb2ac8a8283177a4ce0cb5cbd4257b5eb43',
            previousSignature: 'GENESIS'
        },
        {
            id: 'rcpt-002',
            timestamp: '2026-07-17T13:00:09Z',
            actor: 'policy.engine',
            action: 'authority.validate',
            decision: 'executed',
            gate: 'authority-approved',
            signature: '7b17b174f040371a8f460f1c940e8f103d8299f6a2c3f1e6a07f672908694e66',
            previousSignature: 'e1c0fd2f7a61b55dcd6d9f2c60e32eb2ac8a8283177a4ce0cb5cbd4257b5eb43'
        },
        {
            id: 'rcpt-003',
            timestamp: '2026-07-17T13:00:14Z',
            actor: 'control.gate',
            action: 'egress.profile.evaluate',
            decision: 'blocked',
            gate: 'export-path-unapproved',
            signature: 'c392ae37e81fe5a46eaf4def4e96c951f14f9a7ff8b4e8a2c3eedf905ea5f3e9',
            previousSignature: '7b17b174f040371a8f460f1c940e8f103d8299f6a2c3f1e6a07f672908694e66'
        },
        {
            id: 'rcpt-004',
            timestamp: '2026-07-17T13:00:22Z',
            actor: 'exec.sponsor',
            action: 'release.profile.local-only',
            decision: 'issued',
            gate: 'awaiting-human-release',
            signature: '5ec0c7a7b1a403859fbdd0d4a2f5ad0ef9efb7ee3d2d5cfab2f9178ce1aa3761',
            previousSignature: 'c392ae37e81fe5a46eaf4def4e96c951f14f9a7ff8b4e8a2c3eedf905ea5f3e9'
        }
    ],
    overlays: [
        {
            id: 'intent-schema',
            name: 'Intent Validation Schema',
            file: 'overlays/intent-validation.schema.json',
            description: 'Portable schema for validating mission intent payloads before workflow entry.',
            content: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MissionIntentEnvelope",
  "type": "object",
  "required": ["missionId", "principalId", "requestedAction", "justification", "executionBoundary"],
  "properties": {
    "missionId": { "type": "string", "minLength": 6 },
    "principalId": { "type": "string", "minLength": 3 },
    "requestedAction": { "type": "string", "minLength": 3 },
    "justification": { "type": "string", "minLength": 20 },
    "executionBoundary": {
      "type": "string",
      "enum": ["local-only", "intra-perimeter", "external-release-prohibited"]
    }
  }
}`
        },
        {
            id: 'ledger-schema',
            name: 'Ledger Entry Schema',
            file: 'overlays/ledger-entry.schema.json',
            description: 'Schema for signed, chained activity receipts.',
            content: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "VerificationLedgerEntry",
  "type": "object",
  "required": ["id", "timestamp", "actor", "action", "decision", "gate", "signature", "previousSignature"],
  "properties": {
    "id": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "actor": { "type": "string" },
    "action": { "type": "string" },
    "decision": { "type": "string", "enum": ["issued", "executed", "blocked", "rejected"] },
    "gate": { "type": "string" },
    "signature": { "type": "string", "minLength": 32 },
    "previousSignature": { "type": "string", "minLength": 6 }
  }
}`
        },
        {
            id: 'gateway-policy',
            name: 'API Gateway Local Release Policy',
            file: 'overlays/local-release-policy.xml',
            description: 'Gateway policy that denies non-local release paths until authority and compliance controls pass.',
            content: `<policies>
  <inbound>
    <base />
    <set-variable name="execution-boundary" value="@(context.Request.Headers.GetValueOrDefault(\"x-execution-boundary\", \"external-release-prohibited\"))" />
    <choose>
      <when condition="@(context.Variables.GetValueOrDefault<string>(\"execution-boundary\") != \"local-only\")">
        <return-response>
          <set-status code="403" reason="Blocked by sovereign package policy" />
          <set-body>{"error":"external_release_not_authorized"}</set-body>
        </return-response>
      </when>
    </choose>
  </inbound>
  <backend><base /></backend>
  <outbound><base /></outbound>
  <on-error><base /></on-error>
</policies>`
        },
        {
            id: 'runtime-template',
            name: 'Local Runtime Configuration Template',
            file: 'overlays/local-runtime.config.template.json',
            description: 'Configuration template for deploying the package within a sovereign boundary.',
            content: `{
  "packageMode": "air-gapped-evaluation",
  "networkEgress": "disabled",
  "signInMode": "local-demo-identities",
  "ledger": {
    "mode": "append-only",
    "signatureAlgorithm": "sha256",
    "tamperCheck": "hash-chain"
  },
  "controlPlane": {
    "authorityCheck": "required",
    "complianceGate": "required",
    "externalRelease": false
  }
}`
        }
    ]
};

const GENERATED_LEDGER = Array.isArray(window.__SOVEREIGN_LEDGER__) ? window.__SOVEREIGN_LEDGER__ : null;
const LEDGER_METADATA = window.__SOVEREIGN_LEDGER_METADATA__ || null;
const SCENARIO_REPORT = window.__FACEPLANE_SCENARIO__ || null;

function renderMetricStrip(targetId, metrics) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.innerHTML = metrics.map((metric) => `
    <article class="metric-card">
      <span>${metric.label}</span>
      <strong>${metric.value}</strong>
    </article>
  `).join('');
}

function renderExecutiveView() {
    let stageIndex = 0;
    const scenarioCard = document.getElementById('scenarioCard');
    const timeline = document.getElementById('stageTimeline');
    const impactMatrix = document.getElementById('impactMatrix');
    const advanceButton = document.getElementById('advanceScenario');
    const missionFaceplane = document.getElementById('missionFaceplane');
    const executiveEvidence = document.getElementById('executiveEvidence');

    renderMetricStrip('executiveMetrics', [
        { label: 'Mission Risk', value: PACKAGE_DATA.mission.risk },
        { label: 'Faceplane Tier', value: PACKAGE_DATA.faceplane.dockingTier },
        { label: 'Network Mode', value: 'Offline local' },
        { label: 'Audit State', value: 'Tamper evident' }
    ]);

    if (missionFaceplane) {
        missionFaceplane.innerHTML = `
      <article class="faceplane-card">
        <p class="eyebrow">Mission Scope</p>
        <strong>${PACKAGE_DATA.faceplane.missionScope}</strong>
        <p>${PACKAGE_DATA.faceplane.purpose}</p>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Requested Capabilities</p>
        <ul>${PACKAGE_DATA.faceplane.requestedCapabilities.map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Evidence and Controls</p>
        <ul>${[...PACKAGE_DATA.faceplane.controls, ...PACKAGE_DATA.faceplane.evidence].map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
    `;
    }

    if (executiveEvidence && SCENARIO_REPORT) {
        const scorecard = SCENARIO_REPORT.accuracyScorecard || {};
        executiveEvidence.innerHTML = `
      <article class="faceplane-card">
        <p class="eyebrow">Accuracy Objective</p>
        <strong>${scorecard.objective || 'Accuracy of mission docking and evidence posture.'}</strong>
        <p>${scorecard.note || ''}</p>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Accuracy Scorecard</p>
        <ul>
          <li>Mission fit coverage: ${scorecard.missionFitCoverage || 'n/a'}</li>
          <li>Governance posture: ${scorecard.governancePosture || 'n/a'}</li>
          <li>Evidence completeness: ${scorecard.evidenceCompleteness || 'n/a'}</li>
          <li>Hosted Sentinel AI validation: ${scorecard.hostedValidation || 'pending'}</li>
        </ul>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Verified vs Proposed</p>
        <ul>${(SCENARIO_REPORT.verifiedEvidence || []).slice(0, 2).map((item) => `<li>Verified: ${item}</li>`).join('')}${(SCENARIO_REPORT.proposedEvidence || []).slice(0, 2).map((item) => `<li>Proposed: ${item}</li>`).join('')}</ul>
      </article>
    `;
    }

    function paintStage() {
        const stage = PACKAGE_DATA.stages[stageIndex];
        scenarioCard.innerHTML = `
      <p class="eyebrow">Scenario Step ${stageIndex + 1}</p>
      <h3>${stage.title}</h3>
      <p>${stage.summary}</p>
      <div class="pill">${stage.status}</div>
      <p><strong>Evidence:</strong> ${stage.evidence}</p>
      <p><strong>Mission Objective:</strong> ${PACKAGE_DATA.mission.objective}</p>
    `;

        timeline.innerHTML = PACKAGE_DATA.stages.map((entry, index) => {
            const state = index === stageIndex ? 'active' : entry.status === 'blocked' ? 'blocked' : '';
            return `
        <article class="timeline-step ${state}">
          <strong>${entry.title}</strong>
          <p>${entry.summary}</p>
        </article>
      `;
        }).join('');
    }

    impactMatrix.innerHTML = PACKAGE_DATA.impactMatrix.map((row) => `
    <article class="matrix-row">
      <div>
        <p class="eyebrow">Category</p>
        <strong>${row.category}</strong>
      </div>
      <div>
        <p class="eyebrow">Executive Value</p>
        <p>${row.executive}</p>
      </div>
      <div>
        <p class="eyebrow">Operator Value</p>
        <p>${row.operator}</p>
      </div>
    </article>
  `).join('');

    paintStage();

    advanceButton?.addEventListener('click', () => {
        stageIndex = (stageIndex + 1) % PACKAGE_DATA.stages.length;
        paintStage();
    });
}

function renderOperatorView() {
    const ledgerChain = document.getElementById('ledgerChain');
    const overlayList = document.getElementById('overlayList');
    const overlayPreview = document.getElementById('overlayPreview');
    const missionControls = document.getElementById('missionControls');
    const evidencePosture = document.getElementById('evidencePosture');
    const validationChecklist = document.getElementById('validationChecklist');
    const ledgerEntries = GENERATED_LEDGER || PACKAGE_DATA.ledger;

    renderMetricStrip('operatorMetrics', [
        { label: 'Ledger Entries', value: String(ledgerEntries.length) },
        { label: 'Hash Chain', value: 'Continuous' },
        { label: 'Approval Model', value: 'approval before execution' },
        { label: 'Overlay Assets', value: String(PACKAGE_DATA.overlays.length) }
    ]);

    if (missionControls) {
        missionControls.innerHTML = `
      <article class="faceplane-card">
        <p class="eyebrow">Docking Controls</p>
        <ul>${PACKAGE_DATA.faceplane.controls.map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Compliance Measures</p>
        <ul>${PACKAGE_DATA.faceplane.complianceMandates.map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Evidence Path</p>
        <ul>${PACKAGE_DATA.faceplane.evidence.map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
    `;
    }

    if (evidencePosture && SCENARIO_REPORT) {
        evidencePosture.innerHTML = `
      <article class="faceplane-card">
        <p class="eyebrow">Reasoning Lens</p>
        <strong>${SCENARIO_REPORT.reasoningLens?.mode || 'quantitative_accuracy'}</strong>
        <p>${SCENARIO_REPORT.reasoningLens?.objective || 'Accuracy-first reasoning posture.'}</p>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Verified Evidence</p>
        <ul>${(SCENARIO_REPORT.verifiedEvidence || []).map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Proposed Follow-On</p>
        <ul>${(SCENARIO_REPORT.proposedEvidence || []).map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
    `;
    }

    if (validationChecklist && SCENARIO_REPORT) {
        validationChecklist.innerHTML = `
      <article class="faceplane-card">
        <p class="eyebrow">Validation Checklist</p>
        <ul>${(SCENARIO_REPORT.validationChecklist || []).map((item) => `<li>${item.status === 'verified' ? 'Verified' : 'Pending'}: ${item.label}</li>`).join('')}</ul>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Repeatability</p>
        <ul>
          <li>Repetitions: ${SCENARIO_REPORT.repeatability?.repetitions ?? 0}</li>
          <li>Scenario P95 mission latency avg: ${SCENARIO_REPORT.repeatability?.scenarioP95MissionMs?.average ?? 'n/a'} ms</li>
          <li>Load P95 mission latency avg: ${SCENARIO_REPORT.repeatability?.loadP95MissionMs?.average ?? 'n/a'} ms</li>
          <li>Throughput avg: ${SCENARIO_REPORT.repeatability?.throughputCommandsPerSecond?.average ?? 'n/a'} cmds/sec</li>
        </ul>
      </article>
      <article class="faceplane-card">
        <p class="eyebrow">Reproduction Recipe</p>
        <p class="mini-code">${SCENARIO_REPORT.reproductionRecipe?.command || 'Not available'}</p>
        <ul>${(SCENARIO_REPORT.reproductionRecipe?.notes || []).map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
    `;
    }

    ledgerChain.innerHTML = ledgerEntries.map((entry) => `
    <article class="ledger-entry">
      <header>
        <strong>${entry.action}</strong>
        <span class="pill">${entry.decision}</span>
      </header>
      <p><strong>Actor:</strong> ${entry.actor}</p>
      <p><strong>Gate:</strong> ${entry.gate}</p>
      <p><strong>Time:</strong> ${entry.timestamp}</p>
      <p class="ledger-hash"><strong>Signature:</strong> ${entry.signature}</p>
      <p class="ledger-hash"><strong>Previous:</strong> ${entry.previousSignature}</p>
    </article>
  `).join('');

    if (LEDGER_METADATA) {
        ledgerChain.insertAdjacentHTML('afterbegin', `
      <article class="ledger-entry">
        <header>
          <strong>Runtime Receipt Feed</strong>
          <span class="pill">generated</span>
        </header>
        <p><strong>Source:</strong> ${LEDGER_METADATA.sourceDirectory}</p>
        <p><strong>Generated:</strong> ${LEDGER_METADATA.generatedAt}</p>
        <p><strong>Receipts Used:</strong> ${LEDGER_METADATA.receiptCount}</p>
      </article>
    `);
    }

    function selectOverlay(overlayId) {
        const selected = PACKAGE_DATA.overlays.find((item) => item.id === overlayId) || PACKAGE_DATA.overlays[0];
        overlayPreview.innerHTML = `
      <p class="eyebrow">${selected.file}</p>
      <h3>${selected.name}</h3>
      <p>${selected.description}</p>
      <pre>${escapeHtml(selected.content)}</pre>
    `;

        overlayList.querySelectorAll('.overlay-button').forEach((button) => {
            button.classList.toggle('active', button.dataset.overlayId === selected.id);
        });
    }

    overlayList.innerHTML = PACKAGE_DATA.overlays.map((overlay) => `
    <article class="overlay-card">
      <header>
        <strong>${overlay.name}</strong>
        <span class="mini-code">${overlay.file}</span>
      </header>
      <p>${overlay.description}</p>
      <button class="overlay-button" type="button" data-overlay-id="${overlay.id}">Preview Scaffold</button>
    </article>
  `).join('');

    overlayList.querySelectorAll('.overlay-button').forEach((button) => {
        button.addEventListener('click', () => selectOverlay(button.dataset.overlayId));
    });

    selectOverlay(PACKAGE_DATA.overlays[0].id);
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function initialize() {
    const view = document.body.dataset.view;
    if (view === 'executive') {
        renderExecutiveView();
    }
    if (view === 'operator') {
        renderOperatorView();
    }
}

initialize();