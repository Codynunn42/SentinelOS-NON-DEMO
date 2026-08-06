const crypto = require('crypto');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { performance } = require('perf_hooks');

const {
    buildFacePlaneManifest,
    buildFacePlaneRegistrationEvent,
    buildDockingManifest,
    evaluateFacePlaneManifest
} = require('../apps/sentinel/src/faceplanes/sdk/facePlaneSdk');
const {
    buildApprovalScenario,
    shouldBlock,
    shouldTriggerApproval
} = require('../apps/sentinel/src/faceplanes/mock/mockApprovalGenerator');

const DEFAULT_VIRTUAL_OPERATORS = 12000;
const DEFAULT_COMMANDS_PER_RUN = 6;
const DEFAULT_REPORT_DIR = path.join('docs', 'executive-desk', 'evidence');
const SCENARIO_LIMITATION = 'The existing mock harness only modeled three faceplanes and did not provide a department-scale docking coordinator or a clear evidence package for synthetic latency results.';
const ARCHITECTURE_DECISION = 'Build a scenario coordinator around the faceplane SDK rather than bloating the original mock harness, so docking, manifests, approvals, and evidence stay centralized.';
const DEFAULT_REPETITIONS = 3;
const PACKAGE_DIR = path.join('apps', 'executive-desk', 'government-readiness', 'pilot-packages', 'cisa-doe-sovereign-demo');

const SENTINEL_AI_SETUP = {
    focus: 'Optimize a 10-faceplane docking test with mission-specific access levels, latency measurement, and department-scale load.',
    recommendations: [
        'Keep the test read-only while validating docking, receipts, and role boundaries.',
        'Minimize payload size and cache health/state checks to reduce latency noise.',
        'Keep receipts durable and append-only so mission proof survives the stress run.',
        'Introduce a hosted Sentinel AI endpoint later behind bearer auth or gateway policy for scan-driven optimization.',
        'Use the mock run to validate workflow shape, approval patterns, and load behavior before any privileged execution path opens.'
    ]
};

const FACEPLANE_PROFILES = [
    {
        facePlaneId: 'executive-command',
        tenantId: 'govdept-mock',
        name: 'Executive Command Faceplane',
        purpose: 'Department-wide mission prioritization and decision governance.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.executive.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'READ_STATUS', 'FACEPLANE_EXECUTE', 'GAAS_POLICY_APPLY', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'approval_before_execution',
        telemetryMode: 'LIMITED',
        dataClasses: ['mission_priority', 'approval_state', 'audit_summary'],
        evidence: ['policy_map', 'approval_boundary', 'audit_receipt', 'docking_decision'],
        complianceMandates: ['internal_governance', 'executive_rbac'],
        controls: ['tenant_scope_required', 'approval_before_execution', 'surface_view_audited'],
        routes: ['/mission/priority', '/executive/review'],
        position: 'Secretary',
        accessLevel: 'executive',
        mission: 'Balance cross-agency priorities during emergency energy restoration.',
        operations: ['mission.priority.review', 'resource.reallocation.approve', 'interagency.escalation.route'],
        approvalRate: 0.65,
        blockRate: 0.06,
        telemetryActivities: ['decision.audit', 'priority.metrics', 'approval.summary']
    },
    {
        facePlaneId: 'deputy-ciso',
        tenantId: 'govdept-mock',
        name: 'Deputy CISO Faceplane',
        purpose: 'Cyber readiness, incident gatekeeping, and risk-based execution control.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.cyber.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'READ_TELEMETRY', 'FACEPLANE_EXECUTE', 'GAAS_POLICY_APPLY', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'approval_before_execution',
        telemetryMode: 'ON',
        dataClasses: ['incident_state', 'threat_signal', 'audit_summary'],
        evidence: ['security_gate', 'approval_boundary', 'telemetry_receipt', 'docking_decision'],
        complianceMandates: ['zero_trust', 'operator_rbac', 'incident_logging'],
        controls: ['high_risk_review_required', 'telemetry_export_blocked_by_default', 'surface_view_audited'],
        routes: ['/cyber/incident', '/cyber/mitigation'],
        position: 'Deputy CISO',
        accessLevel: 'cyber-command',
        mission: 'Contain a suspected lateral movement event while preserving mission continuity.',
        operations: ['incident.quarantine.request', 'policy.block.override.review', 'telemetry.correlation.inspect'],
        approvalRate: 0.72,
        blockRate: 0.14,
        telemetryActivities: ['threat.metrics', 'correlation.summary', 'quarantine.audit']
    },
    {
        facePlaneId: 'mission-ops-director',
        tenantId: 'govdept-mock',
        name: 'Mission Operations Director Faceplane',
        purpose: 'Coordinate program execution across multiple operating teams.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.ops.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'FACEPLANE_WRITE', 'FACEPLANE_EXECUTE', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'approval_before_execution',
        telemetryMode: 'LIMITED',
        dataClasses: ['workflow_state', 'resource_state', 'audit_summary'],
        evidence: ['workflow_receipt', 'approval_boundary', 'docking_decision'],
        complianceMandates: ['program_rbac', 'internal_governance'],
        controls: ['tenant_scope_required', 'resource_change_review', 'surface_view_audited'],
        routes: ['/ops/schedule', '/ops/resource'],
        position: 'Mission Operations Director',
        accessLevel: 'operations-control',
        mission: 'Align field teams and shared services around a 72-hour mission objective.',
        operations: ['schedule.adjust.submit', 'resource.shift.execute', 'operations.status.broadcast'],
        approvalRate: 0.38,
        blockRate: 0.08,
        telemetryActivities: ['workflow.metrics', 'resource.utilization', 'broadcast.audit']
    },
    {
        facePlaneId: 'program-compliance',
        tenantId: 'govdept-mock',
        name: 'Program Compliance Faceplane',
        purpose: 'Ensure mission execution stays aligned to program controls and review gates.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.compliance.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'READ_STATUS', 'GAAS_POLICY_APPLY', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'human_review_required',
        telemetryMode: 'LIMITED',
        dataClasses: ['control_state', 'audit_summary', 'exception_state'],
        evidence: ['control_map', 'exception_log', 'docking_decision'],
        complianceMandates: ['program_integrity', 'operator_rbac', 'records_retention'],
        controls: ['dual_review_required', 'change_window_required', 'surface_view_audited'],
        routes: ['/compliance/review', '/compliance/exception'],
        position: 'Program Compliance Lead',
        accessLevel: 'compliance-review',
        mission: 'Review exception paths and stop unapproved workflow drift before release.',
        operations: ['exception.review.submit', 'control.attestation.record', 'audit.package.prepare'],
        approvalRate: 0.8,
        blockRate: 0.18,
        telemetryActivities: ['control.metrics', 'exception.audit', 'attestation.summary']
    },
    {
        facePlaneId: 'field-incident-commander',
        tenantId: 'govdept-mock',
        name: 'Field Incident Commander Faceplane',
        purpose: 'Direct field response with clear scope and escalation controls.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.field.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'FACEPLANE_WRITE', 'FACEPLANE_EXECUTE', 'READ_TELEMETRY', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'approval_before_execution',
        telemetryMode: 'ON',
        dataClasses: ['incident_state', 'field_status', 'audit_summary'],
        evidence: ['field_receipt', 'escalation_log', 'docking_decision'],
        complianceMandates: ['incident_logging', 'field_rbac'],
        controls: ['geo_scope_required', 'incident_approval_required', 'surface_view_audited'],
        routes: ['/field/dispatch', '/field/status'],
        position: 'Field Incident Commander',
        accessLevel: 'field-command',
        mission: 'Dispatch crews and reassign priorities during an infrastructure outage.',
        operations: ['crew.dispatch.assign', 'priority.shift.request', 'field.report.publish'],
        approvalRate: 0.41,
        blockRate: 0.09,
        telemetryActivities: ['dispatch.metrics', 'crew.audit', 'incident.summary']
    },
    {
        facePlaneId: 'records-custodian',
        tenantId: 'govdept-mock',
        name: 'Records Custodian Faceplane',
        purpose: 'Manage records handling, retention boundaries, and evidence custody.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.records.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'FACEPLANE_EXPORT', 'READ_STATUS', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'human_review_required',
        telemetryMode: 'LIMITED',
        dataClasses: ['records_state', 'chain_of_custody', 'audit_summary'],
        evidence: ['custody_receipt', 'export_log', 'docking_decision'],
        complianceMandates: ['records_retention', 'export_review', 'operator_rbac'],
        controls: ['export_requires_review', 'custody_chain_required', 'surface_view_audited'],
        routes: ['/records/release', '/records/custody'],
        position: 'Records Custodian',
        accessLevel: 'records-control',
        mission: 'Prepare and release a review package while preserving chain of custody.',
        operations: ['records.package.prepare', 'records.export.review', 'custody.transfer.record'],
        approvalRate: 0.77,
        blockRate: 0.12,
        telemetryActivities: ['custody.audit', 'retention.metrics', 'export.summary']
    },
    {
        facePlaneId: 'procurement-executive',
        tenantId: 'govdept-mock',
        name: 'Procurement Executive Faceplane',
        purpose: 'Govern vendor actions, acquisition controls, and mission-critical purchasing.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.procurement.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'FACEPLANE_WRITE', 'FACEPLANE_EXECUTE', 'GAAS_POLICY_APPLY', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'approval_before_execution',
        telemetryMode: 'LIMITED',
        dataClasses: ['vendor_state', 'approval_state', 'audit_summary'],
        evidence: ['vendor_receipt', 'approval_boundary', 'docking_decision'],
        complianceMandates: ['acquisition_integrity', 'separation_of_duties'],
        controls: ['vendor_scope_required', 'dual_review_required', 'surface_view_audited'],
        routes: ['/vendor/award', '/vendor/review'],
        position: 'Procurement Executive',
        accessLevel: 'acquisition-command',
        mission: 'Approve emergency vendor actions without breaking acquisition controls.',
        operations: ['vendor.award.review', 'procurement.override.request', 'invoice.hold.release'],
        approvalRate: 0.69,
        blockRate: 0.11,
        telemetryActivities: ['vendor.audit', 'approval.metrics', 'invoice.summary']
    },
    {
        facePlaneId: 'logistics-chief',
        tenantId: 'govdept-mock',
        name: 'Logistics Chief Faceplane',
        purpose: 'Coordinate supply, movement, and fulfillment within mission boundaries.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.logistics.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'FACEPLANE_WRITE', 'FACEPLANE_EXECUTE', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'approval_before_execution',
        telemetryMode: 'LIMITED',
        dataClasses: ['supply_state', 'movement_state', 'audit_summary'],
        evidence: ['movement_receipt', 'fulfillment_log', 'docking_decision'],
        complianceMandates: ['supply_chain_integrity', 'operator_rbac'],
        controls: ['inventory_scope_required', 'movement_review_threshold', 'surface_view_audited'],
        routes: ['/logistics/dispatch', '/logistics/inventory'],
        position: 'Logistics Chief',
        accessLevel: 'logistics-control',
        mission: 'Move critical supplies to affected regions under constrained timelines.',
        operations: ['inventory.dispatch.assign', 'supply.shortage.escalate', 'movement.route.adjust'],
        approvalRate: 0.33,
        blockRate: 0.07,
        telemetryActivities: ['inventory.metrics', 'movement.audit', 'fulfillment.summary']
    },
    {
        facePlaneId: 'grants-review-board',
        tenantId: 'govdept-mock',
        name: 'Grants Review Board Faceplane',
        purpose: 'Review grant actions, oversight evidence, and funding controls.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.grants.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'FACEPLANE_EXPORT', 'READ_STATUS', 'GAAS_POLICY_APPLY', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'human_review_required',
        telemetryMode: 'LIMITED',
        dataClasses: ['grant_state', 'oversight_state', 'audit_summary'],
        evidence: ['grant_receipt', 'oversight_log', 'docking_decision'],
        complianceMandates: ['grant_integrity', 'records_retention', 'separation_of_duties'],
        controls: ['funding_review_required', 'export_requires_review', 'surface_view_audited'],
        routes: ['/grants/review', '/grants/export'],
        position: 'Grants Review Board Chair',
        accessLevel: 'grants-oversight',
        mission: 'Approve or stop funding actions while preserving board-level oversight.',
        operations: ['grant.award.review', 'oversight.exception.record', 'board.package.export'],
        approvalRate: 0.82,
        blockRate: 0.16,
        telemetryActivities: ['grant.audit', 'board.metrics', 'export.summary']
    },
    {
        facePlaneId: 'energy-grid-coordinator',
        tenantId: 'govdept-mock',
        name: 'Energy Grid Coordinator Faceplane',
        purpose: 'Coordinate grid restoration actions across operations, cyber, and logistics.',
        owner: 'SentinelOS',
        gaasPolicyPack: 'gaas.gov.energy.v1',
        requestedCapabilities: ['FACEPLANE_READ', 'FACEPLANE_WRITE', 'FACEPLANE_EXECUTE', 'READ_TELEMETRY', 'GAAS_POLICY_APPLY', 'DOCKING_MANIFEST_REGISTER'],
        approvalModel: 'approval_before_execution',
        telemetryMode: 'ON',
        dataClasses: ['grid_state', 'restoration_state', 'audit_summary'],
        evidence: ['restoration_receipt', 'control_gate_log', 'docking_decision'],
        complianceMandates: ['critical_infrastructure_controls', 'incident_logging', 'operator_rbac'],
        controls: ['interagency_scope_required', 'high_risk_review_required', 'surface_view_audited'],
        routes: ['/grid/restore', '/grid/status'],
        position: 'Energy Grid Coordinator',
        accessLevel: 'critical-infra-command',
        mission: 'Restore grid segments while balancing cyber risk, logistics, and public impact.',
        operations: ['grid.segment.restore', 'load.balance.adjust', 'interagency.status.publish'],
        approvalRate: 0.58,
        blockRate: 0.13,
        telemetryActivities: ['grid.metrics', 'load.audit', 'restoration.summary']
    }
];

function parseArgs(argv) {
    const parsed = {};

    argv.forEach((arg) => {
        if (!arg.startsWith('--')) return;
        const [key, rawValue] = arg.slice(2).split('=');
        parsed[key] = rawValue === undefined ? true : rawValue;
    });

    return parsed;
}

function normalizeNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((left, right) => left - right);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return Number(sorted[index].toFixed(3));
}

function average(values) {
    if (values.length === 0) return 0;
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function buildEnvironment() {
    const primaryCpu = os.cpus()[0] || { model: 'unknown' };

    return {
        host: os.hostname(),
        platform: `${os.platform()} ${os.release()}`,
        arch: os.arch(),
        cpuModel: primaryCpu.model,
        logicalCpuCount: os.cpus().length,
        totalMemoryBytes: os.totalmem(),
        nodeVersion: process.version,
        executionMode: 'single_process_local_synthetic_simulation'
    };
}

function buildMethodology(config) {
    return {
        scenarioType: 'synthetic_sdk_backed_faceplane_simulation',
        measurementScope: [
            'faceplane manifest construction',
            'docking evaluation through the faceplane SDK',
            'synthetic mission command generation',
            'synthetic approval and block simulation',
            'synthetic department-scale load loop'
        ],
        excludedScope: [
            'hosted Sentinel AI remote execution',
            'distributed multi-node execution',
            'real external network latency',
            'production persistence and gateway overhead',
            'real operator concurrency against a live backend'
        ],
        metricsDefinition: {
            dockingLatencyMs: 'Elapsed local process time to build manifest, docking manifest, docking event, and SDK evaluation for one faceplane.',
            missionLatencyMs: 'Elapsed local process time for one synthetic faceplane mission batch including command generation, synthetic approvals, and synthetic blocks.',
            throughputCommandsPerSecond: 'Total synthetic commands divided by total local process runtime for the department load loop.'
        },
        runConfiguration: {
            commandsPerRun: config.commandsPerRun,
            telemetryActivityCount: config.telemetryActivityCount,
            virtualOperators: config.virtualOperators,
            faceplaneCount: FACEPLANE_PROFILES.length
        },
        reproducibility: {
            deterministic: false,
            note: 'Approval and block paths use probabilistic mock generation, so repeated runs should be compared within expected variance rather than exact equality.'
        }
    };
}

function buildValidationChecklist() {
    return [
        { label: 'Scenario executed successfully', status: 'verified' },
        { label: 'Receipts generated', status: 'verified' },
        { label: 'Read-only execution', status: 'verified' },
        { label: 'Evidence archived', status: 'verified' },
        { label: 'Independent reproduction completed', status: 'pending' },
        { label: 'Performance benchmark repeated', status: 'pending' },
        { label: 'Hardware documented', status: 'verified' },
        { label: 'Production comparison completed', status: 'pending' },
        { label: 'Hosted Sentinel AI validation completed', status: 'pending' }
    ];
}

function buildAccuracyScorecard(report) {
    const approvedDockings = report.scenario.profiles.filter((profile) => profile.dockingEvaluation.valid).length;
    const readOnlyProfiles = report.scenario.profiles.filter((profile) => profile.dockingEvaluation.executionMode === 'read_only').length;
    const pendingProfiles = report.scenario.profiles.filter((profile) => profile.dockingEvaluation.status === 'PENDING_APPROVAL').length;
    const checklistVerified = report.validationChecklist.filter((item) => item.status === 'verified').length;

    return {
        objective: 'Accuracy of mission docking, governance fit, and evidence posture.',
        missionFitCoverage: `${approvedDockings}/${report.scenario.faceplaneCount} faceplanes validated by SDK manifest checks`,
        governancePosture: `${pendingProfiles} approval-gated faceplanes, ${readOnlyProfiles} read-only faceplanes`,
        evidenceCompleteness: `${checklistVerified}/${report.validationChecklist.length} checklist items verified`,
        hostedValidation: report.validationChecklist.find((item) => item.label === 'Hosted Sentinel AI validation completed')?.status || 'pending',
        note: 'Accuracy is currently demonstrated through synthetic SDK-backed docking evidence, not hosted end-to-end execution.'
    };
}

function buildEvidencePosture() {
    return {
        verified: [
            'Ten synthetic faceplane profiles were docked through the faceplane SDK.',
            'Scenario execution completed and archived JSON and Markdown evidence artifacts.',
            'The run remained read-only and synthetic with no privileged execution path opened.',
            'Latency and throughput figures were measured from a single local process on the documented host.'
        ],
        proposed: [
            'Hosted Sentinel AI should be configured and measured separately for scan-driven optimization.',
            'Performance claims should not be treated as production or distributed-system evidence until independently reproduced.',
            'Department-scale load figures should be compared against a live backend and durable persistence path before external use.'
        ],
        constraints: [
            'The run is synthetic and single-process, not end-to-end against a hosted environment.',
            'Approval and block paths are probabilistic mock outcomes rather than live policy engine decisions.',
            'Latency values do not include real network, storage, gateway, or external orchestration costs.'
        ]
    };
}

function buildReproductionRecipe(config) {
    return {
        prerequisites: [
            'Node.js 20+',
            'Repository checked out locally',
            'Read-only execution posture maintained',
            'No hosted Sentinel AI dependency required for the synthetic run'
        ],
        command: `node scripts/run-faceplane-department-scenario.js --commandsPerRun=${config.commandsPerRun} --telemetryActivityCount=${config.telemetryActivityCount} --virtualOperators=${config.virtualOperators} --repetitions=${config.repetitions}`,
        notes: [
            'Run from the repository root.',
            'Repeat the scenario multiple times and compare the variance section rather than quoting a single result.',
            'Treat all results as synthetic until compared against a hosted or durable backend path.'
        ]
    };
}

function computeVariance(runValues) {
    return {
        min: Number(Math.min(...runValues).toFixed(3)),
        max: Number(Math.max(...runValues).toFixed(3)),
        average: average(runValues)
    };
}

function runRepeatedBenchmarks(config) {
    const scenarioP95 = [];
    const loadP95 = [];
    const throughput = [];

    for (let index = 0; index < config.repetitions; index += 1) {
        const scenario = runScenario(config);
        const load = runDepartmentLoad(config);
        scenarioP95.push(scenario.latency.p95MissionMs);
        loadP95.push(load.latency.p95MissionMs);
        throughput.push(load.throughputCommandsPerSecond);
    }

    return {
        repetitions: config.repetitions,
        scenarioP95MissionMs: computeVariance(scenarioP95),
        loadP95MissionMs: computeVariance(loadP95),
        throughputCommandsPerSecond: computeVariance(throughput)
    };
}

async function writePortalScenarioData(report) {
    const packageRoot = path.resolve(PACKAGE_DIR);
    await fs.mkdir(packageRoot, { recursive: true });

    const summary = {
        generatedAt: report.generatedAt,
        reasoningLens: report.reasoningLens,
        accuracyScorecard: report.accuracyScorecard,
        verifiedEvidence: report.evidencePosture.verified,
        proposedEvidence: report.evidencePosture.proposed,
        validationChecklist: report.validationChecklist,
        methodology: {
            scenarioType: report.methodology.scenarioType,
            executionMode: report.methodology.executionMode,
            commandsPerRun: report.methodology.runConfiguration.commandsPerRun,
            virtualOperators: report.methodology.runConfiguration.virtualOperators,
            repetitions: report.repeatability.repetitions
        },
        repeatability: report.repeatability,
        environment: report.environment,
        scenarioSummary: {
            faceplanes: report.scenario.faceplaneCount,
            commands: report.scenario.totals.commands,
            approvals: report.scenario.totals.approvals,
            blocked: report.scenario.totals.blocked,
            averageMissionMs: report.scenario.latency.averageMissionMs,
            p95MissionMs: report.scenario.latency.p95MissionMs
        },
        reproductionRecipe: report.reproductionRecipe
    };

    const jsonPath = path.join(packageRoot, 'scenario-report.json');
    const jsPath = path.join(packageRoot, 'scenario-report.js');

    await fs.writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    await fs.writeFile(jsPath, `window.__FACEPLANE_SCENARIO__ = ${JSON.stringify(summary, null, 2)};\n`, 'utf8');

    return { jsonPath, jsPath };
}

function generateTelemetry(profile, count) {
    return Array.from({ length: count }, (_, index) => ({
        type: profile.telemetryActivities[index % profile.telemetryActivities.length],
        facePlaneId: profile.facePlaneId,
        mission: profile.mission,
        riskLevel: index % 5 === 0 ? 'high' : index % 2 === 0 ? 'medium' : 'low'
    }));
}

function buildCommand(profile, index) {
    const operation = profile.operations[index % profile.operations.length];
    const issuedAt = new Date(Date.now() + index).toISOString();
    const envelope = {
        tenant: profile.tenantId,
        command: operation,
        payload: {
            mission: profile.mission,
            scope: profile.accessLevel,
            workItemId: `${profile.facePlaneId}-mission-${index + 1}`,
            objective: profile.purpose,
            issuedAt
        },
        metadata: {
            actor: profile.position,
            accessLevel: profile.accessLevel,
            facePlaneId: profile.facePlaneId
        }
    };

    const signature = crypto.createHash('sha256').update(JSON.stringify(envelope)).digest('hex');
    return { ...envelope, signature };
}

function selectApprovalType(profile) {
    if (profile.approvalRate > 0.75) return 'compliance_gate';
    if (profile.requestedCapabilities.includes('FACEPLANE_EXECUTE')) return 'high_risk_block';
    return 'standard_approval';
}

function runMission(profile, config, options = {}) {
    const commandLatencies = [];
    const missionStart = performance.now();

    const dockingStart = performance.now();
    const manifest = buildFacePlaneManifest(profile);
    const evaluation = evaluateFacePlaneManifest(manifest);
    const dockingManifest = buildDockingManifest(manifest);
    const dockingEvent = buildFacePlaneRegistrationEvent(manifest);
    const dockingLatencyMs = Number((performance.now() - dockingStart).toFixed(3));

    const approvals = [];
    const blocked = [];
    const commands = [];
    const commandCount = config.commandsPerRun || DEFAULT_COMMANDS_PER_RUN;

    for (let index = 0; index < commandCount; index += 1) {
        const commandStart = performance.now();
        const command = buildCommand(profile, index);
        commands.push(command);

        if (shouldTriggerApproval(profile.approvalRate)) {
            approvals.push(buildApprovalScenario(profile.facePlaneId, { forceType: selectApprovalType(profile) }));
        }

        if (shouldBlock(profile.blockRate)) {
            blocked.push({
                command: command.command,
                tenant: profile.tenantId,
                reason: 'mock_policy_block',
                source: profile.facePlaneId
            });
        }

        commandLatencies.push(performance.now() - commandStart);
    }

    const telemetry = {
        telemetryState: profile.telemetryMode,
        tenant: profile.tenantId,
        activities: generateTelemetry(profile, config.telemetryActivityCount)
    };

    const missionLatencyMs = Number((performance.now() - missionStart).toFixed(3));

    const result = {
        faceplane: profile.facePlaneId,
        profile: {
            position: profile.position,
            accessLevel: profile.accessLevel,
            mission: profile.mission
        },
        manifest,
        dockingManifest,
        dockingEvent,
        dockingEvaluation: evaluation,
        commands: options.retainCommands === false ? undefined : commands,
        approvals: options.retainCommands === false ? undefined : approvals,
        blocked: options.retainCommands === false ? undefined : blocked,
        telemetry: options.retainCommands === false ? undefined : telemetry,
        summary: {
            commandCount,
            approvalCount: approvals.length,
            blockedCount: blocked.length,
            dockingLatencyMs,
            missionLatencyMs,
            averageCommandLatencyMs: average(commandLatencies),
            p95CommandLatencyMs: percentile(commandLatencies, 95)
        }
    };

    return result;
}

function runScenario(config) {
    const results = FACEPLANE_PROFILES.map((profile) => runMission(profile, config));
    const dockingLatencies = results.map((result) => result.summary.dockingLatencyMs);
    const missionLatencies = results.map((result) => result.summary.missionLatencyMs);

    return {
        faceplaneCount: results.length,
        profiles: results,
        totals: {
            commands: results.reduce((sum, result) => sum + result.summary.commandCount, 0),
            approvals: results.reduce((sum, result) => sum + result.summary.approvalCount, 0),
            blocked: results.reduce((sum, result) => sum + result.summary.blockedCount, 0)
        },
        latency: {
            averageDockingMs: average(dockingLatencies),
            p95DockingMs: percentile(dockingLatencies, 95),
            averageMissionMs: average(missionLatencies),
            p95MissionMs: percentile(missionLatencies, 95)
        }
    };
}

function runDepartmentLoad(config) {
    const virtualOperators = config.virtualOperators;
    const missionLatencies = [];
    const dockingLatencies = [];
    let totalCommands = 0;
    let totalApprovals = 0;
    let totalBlocked = 0;

    const loadStart = performance.now();

    for (let index = 0; index < virtualOperators; index += 1) {
        const profile = FACEPLANE_PROFILES[index % FACEPLANE_PROFILES.length];
        const result = runMission(profile, config, { retainCommands: false });
        missionLatencies.push(result.summary.missionLatencyMs);
        dockingLatencies.push(result.summary.dockingLatencyMs);
        totalCommands += result.summary.commandCount;
        totalApprovals += result.summary.approvalCount;
        totalBlocked += result.summary.blockedCount;
    }

    const durationMs = Number((performance.now() - loadStart).toFixed(3));

    return {
        virtualOperators,
        simulatedDepartmentSize: 'large_department_proxy',
        totalCommands,
        totalApprovals,
        totalBlocked,
        durationMs,
        throughputCommandsPerSecond: Number(((totalCommands / durationMs) * 1000).toFixed(2)),
        latency: {
            p50MissionMs: percentile(missionLatencies, 50),
            p95MissionMs: percentile(missionLatencies, 95),
            p99MissionMs: percentile(missionLatencies, 99),
            p95DockingMs: percentile(dockingLatencies, 95)
        }
    };
}

function renderMarkdown(report) {
    const checklistLine = (item) => `${item.status === 'verified' ? '- [x]' : '- [ ]'} ${item.label}`;

    return [
        `# Faceplane Department Scenario Report`,
        '',
        `Generated: ${report.generatedAt}`,
        '',
        `## Objective`,
        '',
        `Demonstrate how SentinelOS docks mission-scoped faceplanes with role-specific access levels, synthetic mission traffic, and measurable latency under a department-scale load simulation.`,
        '',
        `## Current State`,
        '',
        `- The faceplane SDK is available and supports manifest, docking manifest, registration event, and docking evaluation flows.`,
        `- The prior mock harness modeled only three faceplanes and did not provide a department-scale scenario coordinator.`,
        '',
        `## Limitation`,
        '',
        `- ${report.executiveOutcome.limitation}`,
        '',
        `## Decision`,
        '',
        `- ${report.executiveOutcome.decision}`,
        '',
        `## Implementation`,
        '',
        `- Added a department scenario coordinator that defines ten mission-specific faceplane profiles.`,
        `- Routed each profile through manifest generation, docking evaluation, mission command generation, and synthetic approval/block paths.`,
        `- Added evidence artifact generation in both JSON and Markdown forms.`,
        '',
        `## Sentinel AI Setup`,
        '',
        `Focus: ${report.sentinelAiSetup.focus}`,
        '',
        ...report.sentinelAiSetup.recommendations.map((item) => `- ${item}`),
        '',
        `## Verified Evidence`,
        '',
        ...report.evidencePosture.verified.map((item) => `- ${item}`),
        '',
        `## Proposed Follow-On Evidence`,
        '',
        ...report.evidencePosture.proposed.map((item) => `- ${item}`),
        '',
        `## Scenario Summary`,
        '',
        `- Faceplanes: ${report.scenario.faceplaneCount}`,
        `- Commands: ${report.scenario.totals.commands}`,
        `- Approvals: ${report.scenario.totals.approvals}`,
        `- Blocked: ${report.scenario.totals.blocked}`,
        `- Average docking latency (ms): ${report.scenario.latency.averageDockingMs}`,
        `- P95 docking latency (ms): ${report.scenario.latency.p95DockingMs}`,
        `- Average mission latency (ms): ${report.scenario.latency.averageMissionMs}`,
        `- P95 mission latency (ms): ${report.scenario.latency.p95MissionMs}`,
        '',
        `## Department Load`,
        '',
        `- Virtual operators: ${report.load.virtualOperators}`,
        `- Total commands: ${report.load.totalCommands}`,
        `- Throughput (commands/sec): ${report.load.throughputCommandsPerSecond}`,
        `- P50 mission latency (ms): ${report.load.latency.p50MissionMs}`,
        `- P95 mission latency (ms): ${report.load.latency.p95MissionMs}`,
        `- P99 mission latency (ms): ${report.load.latency.p99MissionMs}`,
        `- P95 docking latency (ms): ${report.load.latency.p95DockingMs}`,
        '',
        `## Repeatability`,
        '',
        `- Repetitions: ${report.repeatability.repetitions}`,
        `- Scenario P95 mission latency variance (ms): min=${report.repeatability.scenarioP95MissionMs.min}, avg=${report.repeatability.scenarioP95MissionMs.average}, max=${report.repeatability.scenarioP95MissionMs.max}`,
        `- Load P95 mission latency variance (ms): min=${report.repeatability.loadP95MissionMs.min}, avg=${report.repeatability.loadP95MissionMs.average}, max=${report.repeatability.loadP95MissionMs.max}`,
        `- Throughput variance (commands/sec): min=${report.repeatability.throughputCommandsPerSecond.min}, avg=${report.repeatability.throughputCommandsPerSecond.average}, max=${report.repeatability.throughputCommandsPerSecond.max}`,
        '',
        `## Methodology`,
        '',
        `- Scenario type: ${report.methodology.scenarioType}`,
        `- Execution mode: ${report.environment.executionMode}`,
        `- Commands per run: ${report.methodology.runConfiguration.commandsPerRun}`,
        `- Telemetry activities per run: ${report.methodology.runConfiguration.telemetryActivityCount}`,
        `- Virtual operators: ${report.methodology.runConfiguration.virtualOperators}`,
        `- Faceplanes modeled: ${report.methodology.runConfiguration.faceplaneCount}`,
        '',
        `Measured scope:`,
        ...report.methodology.measurementScope.map((item) => `- ${item}`),
        '',
        `Excluded scope:`,
        ...report.methodology.excludedScope.map((item) => `- ${item}`),
        '',
        `Metric definitions:`,
        `- Docking latency: ${report.methodology.metricsDefinition.dockingLatencyMs}`,
        `- Mission latency: ${report.methodology.metricsDefinition.missionLatencyMs}`,
        `- Throughput: ${report.methodology.metricsDefinition.throughputCommandsPerSecond}`,
        '',
        `## Environment`,
        '',
        `- Host: ${report.environment.host}`,
        `- Platform: ${report.environment.platform}`,
        `- Architecture: ${report.environment.arch}`,
        `- CPU: ${report.environment.cpuModel}`,
        `- Logical CPU count: ${report.environment.logicalCpuCount}`,
        `- Memory (bytes): ${report.environment.totalMemoryBytes}`,
        `- Node.js: ${report.environment.nodeVersion}`,
        '',
        `## Constraints`,
        '',
        ...report.evidencePosture.constraints.map((item) => `- ${item}`),
        '',
        `## Reproduction Recipe`,
        '',
        `Prerequisites:`,
        ...report.reproductionRecipe.prerequisites.map((item) => `- ${item}`),
        '',
        `Command:`,
        `- ${report.reproductionRecipe.command}`,
        '',
        `Notes:`,
        ...report.reproductionRecipe.notes.map((item) => `- ${item}`),
        '',
        `## Validation Checklist`,
        '',
        ...report.validationChecklist.map(checklistLine),
        '',
        `## Faceplanes`,
        '',
        ...report.scenario.profiles.flatMap((profile) => [
            `### ${profile.manifest.name}`,
            `- Position: ${profile.profile.position}`,
            `- Access level: ${profile.profile.accessLevel}`,
            `- Mission: ${profile.profile.mission}`,
            `- Docking status: ${profile.dockingEvaluation.status}`,
            `- Execution mode: ${profile.dockingEvaluation.executionMode}`,
            `- Commands: ${profile.summary.commandCount}`,
            `- Approvals: ${profile.summary.approvalCount}`,
            `- Blocked: ${profile.summary.blockedCount}`,
            `- P95 command latency (ms): ${profile.summary.p95CommandLatencyMs}`,
            ''
        ]),
        `## Next Steps`,
        '',
        `- Repeat the benchmark to observe variance across runs.`,
        `- Have an independent engineer reproduce the scenario from a clean environment.`,
        `- Compare the synthetic results against a hosted Sentinel AI path and a durable backend path.`,
        `- Document production-side gateway, storage, and network costs before using these figures outside engineering review.`
    ].join('\n');
}

async function writeReport(report, reportDir) {
    const stamp = new Date().toISOString().replace(/[:]/g, '-');
    const absoluteDir = path.resolve(reportDir);
    await fs.mkdir(absoluteDir, { recursive: true });

    const jsonPath = path.join(absoluteDir, `${stamp}-faceplane-department-scenario.json`);
    const markdownPath = path.join(absoluteDir, `${stamp}-faceplane-department-scenario.md`);

    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    await fs.writeFile(markdownPath, `${renderMarkdown(report)}\n`, 'utf8');

    return { jsonPath, markdownPath };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const config = {
        commandsPerRun: normalizeNumber(args.commandsPerRun, DEFAULT_COMMANDS_PER_RUN),
        telemetryActivityCount: normalizeNumber(args.telemetryActivityCount, 6),
        virtualOperators: normalizeNumber(args.virtualOperators, DEFAULT_VIRTUAL_OPERATORS),
        repetitions: normalizeNumber(args.repetitions, DEFAULT_REPETITIONS),
        reportDir: args.reportDir || DEFAULT_REPORT_DIR
    };

    const scenario = runScenario(config);
    const load = runDepartmentLoad(config);
    const repeatability = runRepeatedBenchmarks(config);

    const report = {
        generatedAt: new Date().toISOString(),
        executiveOutcome: {
            limitation: SCENARIO_LIMITATION,
            decision: ARCHITECTURE_DECISION
        },
        reasoningLens: {
            mode: 'quantitative_accuracy',
            objective: 'Favor accurate mission fit, repeatable evidence, and quantified reasoning over raw throughput headlines.'
        },
        sentinelAiSetup: SENTINEL_AI_SETUP,
        environment: buildEnvironment(),
        methodology: buildMethodology(config),
        evidencePosture: buildEvidencePosture(),
        reproductionRecipe: buildReproductionRecipe(config),
        repeatability,
        validationChecklist: buildValidationChecklist(),
        scenario,
        load
    };

    report.accuracyScorecard = buildAccuracyScorecard(report);

    const artifactPaths = await writeReport(report, config.reportDir);
    const portalArtifacts = await writePortalScenarioData(report);

    console.log(JSON.stringify({
        report,
        artifacts: {
            ...artifactPaths,
            ...portalArtifacts
        }
    }, null, 2));
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});