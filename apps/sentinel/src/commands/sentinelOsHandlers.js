const fs = require('fs');
const path = require('path');

/**
 * SentinelOS governance command surface.
 * These handlers produce audit-ready reconstruction and canonicalization reports,
 * and they are registered through the tenant `sentinelos` surface.
 * Commands are intentionally read-and-report only; they do not enact external changes.
 */
const COMMANDS = {
    ARCHITECTURE_RECONSTRUCTION: 'architecture.reconstruction.begin',
    GOVERNANCE_CANONICALIZE: 'governance.canonicalize.platform',
    LIGHT_QUANTITATIVE_NEXT_STEPS: 'governance.nextsteps.quantitative.light',
    BRIDGE_GAPS_REPORT: 'governance.bridgegaps.report'
};

const KNOWN_LEGACY_KEYWORDS = ['ownerfi', 'nunncloud', 'hotelops', 'contractreclamation', 'sentinelos'];
const ALLOWED_NORTH_STAR_STATUS = ['aligned', 'partial', 'not_aligned'];
const INTERNAL_PATH_KEYWORDS = [
    'proof',
    'ops',
    'archive',
    'runtime',
    'scripts',
    'config',
    'configs',
    'fixtures',
    'infrastructure',
    'store',
    'deploy',
    'lambda',
    'ops-closeout',
    'contract_reclamation-incubator',
    'node_modules',
    'dist',
    'build',
    '.git',
    '.github',
    '.husky',
    '.vscode',
    '.turbo',
    '.next',
    'coverage',
    '.env',
    '.env.example',
    '.gitignore',
    'Dockerfile',
    'Dockerfile.phase1-lock',
    'DoctorModeRuntimeRestoreSupportPacket.json',
    'RELEASE_AUTHORITY_LOCK.md',
    'SECURITY.md',
    'SENTINEL-RELEASE-v1.md',
    'STATUS_REPORT.md',
    'activity-full.json',
    'activity.json',
    'broken-app.yaml',
    'compose-expanded.yml',
    'current-app.json',
    'docker-compose.yml'
];
const PUBLIC_PATH_KEYWORDS = ['docs', 'governance', 'apps', 'services', 'azure', 'README.md', 'package.json', 'package-lock.json', 'pnpm-lock.yaml'];

function normalizeBoolean(value, defaultValue = false) {
    return typeof value === 'boolean' ? value : defaultValue;
}

function normalizeString(value, defaultValue = '') {
    return typeof value === 'string' ? value.trim() : defaultValue;
}

function normalizeNorthStarStatus(value, defaultValue = 'partial') {
    const normalized = normalizeString(value, defaultValue).toLowerCase();
    return ALLOWED_NORTH_STAR_STATUS.includes(normalized) ? normalized : defaultValue;
}

function normalizeStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map(normalizeString).filter(Boolean);
}

function pathMatchesKeyword(normalizedPath, keyword) {
    const normalizedKeyword = keyword.toLowerCase();

    return normalizedPath === normalizedKeyword ||
        normalizedPath.startsWith(`${normalizedKeyword}/`) ||
        normalizedPath.includes(`/${normalizedKeyword}/`) ||
        normalizedPath.endsWith(`/${normalizedKeyword}`);
}

function inferAssetClassification(relativePath) {
    const normalized = relativePath.toLowerCase();

    if (INTERNAL_PATH_KEYWORDS.some((keyword) => pathMatchesKeyword(normalized, keyword))) {
        return 'internal';
    }

    if (PUBLIC_PATH_KEYWORDS.some((keyword) => pathMatchesKeyword(normalized, keyword))) {
        return 'public';
    }

    return 'unknown';
}

function buildLegacyNameHits(relativePath) {
    const normalized = relativePath.toLowerCase();
    return KNOWN_LEGACY_KEYWORDS.filter((keyword) => normalized.includes(keyword));
}

function walkRepository(rootPath) {
    const inventory = {
        files: [],
        directories: [],
        modules: [],
        publicationAssets: [],
        internalAssets: [],
        unknownAssets: [],
        legacyNames: []
    };

    function recurse(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const absolutePath = path.join(dir, entry.name);
            const relativePath = path.relative(rootPath, absolutePath).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                inventory.directories.push(relativePath);
                recurse(absolutePath);
                continue;
            }

            if (entry.isFile()) {
                inventory.files.push(relativePath);
                const classification = inferAssetClassification(relativePath);

                if (classification === 'public') {
                    inventory.publicationAssets.push(relativePath);
                } else if (classification === 'internal') {
                    inventory.internalAssets.push(relativePath);
                } else {
                    inventory.unknownAssets.push(relativePath);
                }

                inventory.legacyNames.push(...buildLegacyNameHits(relativePath));
            }
        }
    }

    recurse(rootPath);

    return {
        ...inventory,
        legacyNames: Array.from(new Set(inventory.legacyNames)).sort()
    };
}

function extractActiveModules(rootPath) {
    const modules = [];
    const appsDir = path.join(rootPath, 'apps');
    const servicesDir = path.join(rootPath, 'services');

    for (const candidate of [appsDir, servicesDir]) {
        if (!fs.existsSync(candidate)) {
            continue;
        }

        for (const entry of fs.readdirSync(candidate, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                modules.push(path.join(path.basename(candidate), entry.name).replace(/\\/g, '/'));
            }
        }
    }

    return modules.sort();
}

function buildExecutionMap() {
    return {
        surfaces: [
            'ownerfi',
            'customerops',
            'hotelops',
            'nunncloud',
            'contractreclamation',
            'mock',
            'sentinelos'
        ],
        commands: [
            {
                tenant: 'sentinelos',
                command: COMMANDS.ARCHITECTURE_RECONSTRUCTION,
                description: 'Build a canonical SentinelOS architecture model and inventory.'
            },
            {
                tenant: 'sentinelos',
                command: COMMANDS.GOVERNANCE_CANONICALIZE,
                description: 'Canonicalize platform governance, module classification, and publication boundaries.'
            },
            {
                tenant: 'sentinelos',
                command: COMMANDS.LIGHT_QUANTITATIVE_NEXT_STEPS,
                description: 'Score next-step deep-dive lanes in light mode and return bounded authorization recommendations.'
            }
        ]
    };
}

function scoreGate({ evidence = 0, risk = 0, reversibility = 0, authority = 0 }) {
    return Math.max(0, Math.min(100, Math.round((evidence * 0.35) + (authority * 0.25) + (reversibility * 0.2) + ((100 - risk) * 0.2))));
}

function buildCustomerDiscoveryQuestionnaire() {
    return {
        customer_identity_fields: [
            { field: 'customer_legal_name', status: 'required_before_production' },
            { field: 'authorized_contact_name', status: 'required_before_production' },
            { field: 'authorized_contact_role', status: 'required_before_production' },
            { field: 'authority_source', status: 'required_before_production' }
        ],
        workflow_scope_fields: [
            { field: 'implementation_objective', allowedValues: ['discovery', 'pilot', 'production'], status: 'required' },
            { field: 'workflow_commands', status: 'required_before_production' },
            { field: 'inputs_outputs', status: 'required_before_production' },
            { field: 'approval_chain', status: 'required_before_production' }
        ],
        data_classification_fields: [
            { field: 'data_categories', status: 'required_before_customer_data' },
            { field: 'tenant_boundary', status: 'required_before_customer_data' },
            { field: 'retention_expectation', status: 'required_before_customer_data' },
            { field: 'restricted_or_regulated_data', status: 'required_before_claims' }
        ],
        approval_authority_fields: [
            { field: 'customer_approver', status: 'required_before_production' },
            { field: 'nunncorp_approver', status: 'required_before_production' },
            { field: 'go_live_authority', status: 'required_before_production' }
        ],
        audit_receipt_fields: [
            { field: 'required_receipt_events', status: 'required_before_production' },
            { field: 'audit_retrieval_expectation', status: 'required_before_production' }
        ],
        support_boundary_fields: [
            { field: 'support_hours', status: 'required_before_sla' },
            { field: 'response_expectation', status: 'required_before_sla' },
            { field: 'escalation_contact', status: 'required_before_sla' }
        ],
        prohibited_claims_section: [
            'No regulated finance claim without separate evidence and approval.',
            'No production readiness claim until customer scope, data boundary, approval chain, and receipt evidence clear.',
            'No payment collection claim until Stripe live-payment approval clears.'
        ]
    };
}

function buildStripeEvidencePlan() {
    return {
        exact_environment_keys: [
            'SENTINEL_STRIPE_CHECKOUT_ENABLED',
            'STRIPE_PUBLISHABLE_KEY',
            'STRIPE_PRICE_ID'
        ],
        non_production_price_id_source: 'Stripe test-mode price ID supplied through approved environment management.',
        validation_commands: [
            'npm run check:revenue-readiness',
            'npm run check:stripe-checkout'
        ],
        expected_ready_response: {
            route: 'GET /billing/revenue-readiness',
            requiredStatusBeforeLiveApproval: 'ready_held_for_owner_activation'
        },
        expected_checkout_session_test_response: 'Test-mode session may succeed only after non-production Stripe configuration is supplied.',
        audit_receipt_expectation: 'Checkout attempts must produce an approval or audit receipt before live payment approval.',
        rollback_or_disable_plan: 'Set SENTINEL_STRIPE_CHECKOUT_ENABLED=false and preserve Mission Control as SINTENEX Commercial Trigger Review.'
    };
}

function buildOwnerFiInventoryTemplate() {
    return {
        source_paths: [],
        asset_type: 'to_be_classified',
        ownerfi_target_modules: [
            'treasury',
            'budgeting',
            'forecasting',
            'accounting',
            'executive_reporting',
            'ai_agents',
            'governance'
        ],
        preserve_or_supersede_recommendation: 'pending_read_only_inventory',
        governance_sensitivity: 'financial_internal',
        proposed_future_path: 'pending_exact_file_movement_manifest',
        movement_authority_required: true
    };
}

function buildPublicFrontDoorVerificationTemplate() {
    return {
        hosting_provider: 'pending_verification',
        production_deployment_method: 'pending_verification',
        contact_form_storage_or_notification_target: 'pending_verification',
        approved_public_copy_boundary: [
            'selected trusted proof review approved',
            'revenue conversations approved',
            'no live payment claim',
            'no production customer execution claim'
        ],
        rollback_plan: 'pending_hosting_target_verification'
    };
}

function buildLightQuantitativeNextStepsResult(payload = {}, context = {}) {
    const customerScopeFieldsComplete = normalizeBoolean(payload.customerScopeFieldsComplete, false);
    const ownerIntentAfterScope = normalizeBoolean(payload.ownerIntentAfterScope, true);
    const mode = normalizeString(payload.mode, 'light');
    const lanes = [
        {
            lane: 'stripe_non_production_configuration',
            score: scoreGate({ evidence: 55, risk: 68, reversibility: 80, authority: 45 }),
            decision: 'authorize_evidence_plan_only',
            output: buildStripeEvidencePlan()
        },
        {
            lane: 'customer_discovery_intake_and_risk',
            score: scoreGate({ evidence: 72, risk: 42, reversibility: 86, authority: 82 }),
            decision: 'authorize_questionnaire_preparation',
            output: buildCustomerDiscoveryQuestionnaire()
        },
        {
            lane: 'production_customer_deal_execution',
            score: customerScopeFieldsComplete
                ? scoreGate({ evidence: 88, risk: 55, reversibility: 45, authority: 90 })
                : scoreGate({ evidence: 38, risk: 86, reversibility: 35, authority: 45 }),
            decision: customerScopeFieldsComplete ? 'prepare_owner_authorization_packet' : 'hold_pending_completed_customer_scope',
            ownerIntentAfterScope,
            missingIfHeld: customerScopeFieldsComplete ? [] : [
                'customer_identity',
                'authorized_contact',
                'workflow_scope',
                'data_categories',
                'tenant_boundary',
                'approval_chain',
                'audit_receipt_requirements',
                'support_boundary',
                'allowed_claims'
            ]
        },
        {
            lane: 'ownerfi_ai_financial_management_inventory',
            score: scoreGate({ evidence: 78, risk: 30, reversibility: 92, authority: 85 }),
            decision: 'authorize_read_only_inventory',
            output: buildOwnerFiInventoryTemplate()
        },
        {
            lane: 'nunncorporation_public_front_door_verification',
            score: scoreGate({ evidence: 70, risk: 44, reversibility: 78, authority: 60 }),
            decision: 'authorize_read_only_deployment_target_verification',
            output: buildPublicFrontDoorVerificationTemplate()
        }
    ];

    return {
        command: COMMANDS.LIGHT_QUANTITATIVE_NEXT_STEPS,
        mode,
        model: 'sentinel_light_quantitative_reasoning_v1',
        generatedAt: new Date().toISOString(),
        source: normalizeString(payload.source, 'docs/NEXT_STEPS_DEEP_DIVE_SUMMARIES_2026-07-03.md'),
        thresholdPolicy: {
            authorizePreparation: 60,
            prepareOwnerAuthorizationPacket: 75,
            authorizeProductionExecution: 90,
            criticalMissingFieldsAllowedForProduction: 0
        },
        lanes,
        conclusion: {
            discoveryAndQuestionnaire: 'authorized_to_prepare',
            productionCustomerDealExecution: customerScopeFieldsComplete ? 'prepare_authorization_packet_for_owner_review' : 'not_authorized_yet',
            livePaymentCollection: 'not_authorized',
            fileMovement: 'not_authorized',
            runtimeMutation: 'not_authorized'
        },
        recommendedNextActions: [
            'Populate the customer discovery intake and risk questionnaire.',
            'Use the populated questionnaire to produce a customer-specific authorization packet only after required fields are complete.',
            'Prepare Stripe non-production configuration evidence before live payment approval.',
            'Run OwnerFi AI Financial Management inventory as read-only.',
            'Verify nunncorporation.com deployment target and contact form destination before production publish.'
        ]
    };
}

function buildBridgeGapsReportResult(payload = {}, context = {}) {
    const mode = normalizeString(payload.mode, 'doctor');
    const source = normalizeString(
        payload.source,
        'docs/executive-desk/evidence/2026-07-18-gbp-gate-traceability-report.md'
    );
    const requestedNorthStarStatus = normalizeString(payload.northStarStatus, 'partial').toLowerCase();
    const appliedNorthStarStatus = normalizeNorthStarStatus(requestedNorthStarStatus, 'partial');
    const blockingConditions = [
        'negative-control coverage for EVD-001, PER-001, and XE-001',
        'profile owner mapping not bound to institutional authority',
        'escalation-model verification not yet proven',
        'evidence-library completeness for edge-case logs'
    ];
    const orderedLightModeSteps = [
        'Add negative-control gates for EVD-001, PER-001, and XE-001.',
        'Map each profile to a named owner and authority chain.',
        'Capture evidence-library completeness for edge-case logs.',
        'Publish a separate, reviewable remediation plan before any expanded certification claim.'
    ];
    const northStar = {
        outcome: 'Mission first. Technology second.',
        operatingRule: 'Use direct, outcome-first, evidence-backed language for readiness and next-step clarity.',
        readinessTarget: 'bridge governed readiness gaps without claiming full certification.'
    };
    const doctrine = {
        readOnly: true,
        runtimeMutation: 'prohibited',
        deployment: 'prohibited',
        azureMutation: 'prohibited',
        doctrineRestructuring: 'prohibited unless separately approved',
        evidenceRule: 'tie every claim to evidence or a verified operating state'
    };
    const currentGapSummary = {
        posture: 'GBP validation incomplete',
        validatedScope: 'all implemented gates passed in the current certification scope',
        openGaps: [
            'negative-control coverage for EVD-001, PER-001, and XE-001',
            'profile owner mapping',
            'escalation-model verification',
            'evidence-library completeness'
        ],
        boundary: 'read-only validation only'
    };

    return {
        schemaVersion: 'bridge-gaps-report.v2',
        command: COMMANDS.BRIDGE_GAPS_REPORT,
        mode,
        model: 'sentinel_bridge_gaps_doctor_light_v1',
        generatedAt: new Date().toISOString(),
        source,
        bridgeGapSummary: {
            critical: 1,
            high: 3,
            medium: 2,
            low: 5
        },
        northStarAssessment: {
            objective: 'Keep certification outcome-first, doctrine-aligned, and evidence-backed.',
            status: appliedNorthStarStatus
        },
        northStarStatusValidation: {
            requested: requestedNorthStarStatus,
            applied: appliedNorthStarStatus,
            allowed: ALLOWED_NORTH_STAR_STATUS,
            valid: requestedNorthStarStatus === appliedNorthStarStatus
        },
        doctrineAssessment: {
            coverage: '92%',
            unmappedRequirements: 4
        },
        northStar,
        doctrine,
        currentGapSummary,
        doctorMode: {
            diagnosis: 'FIX and SET are not safely eligible until negative-control and governance mapping evidence closes the current blockers.',
            blockingConditions,
            recommendedFixes: [
                'Implement missing negative-control tests for EVD-001, PER-001, and XE-001.',
                'Bind each profile to a named authority owner and verification chain.',
                'Capture environment snapshots and edge-case evidence references in artifacts.'
            ],
            title: 'What is keeping us from FIX and SET',
            blockers: [
                'The system has not closed negative-control coverage for EVD-001, PER-001, and XE-001.',
                'Profile owner mapping is still not explicitly bound to institutional authority.',
                'Escalation-model verification remains a readiness gap rather than a proven control.',
                'The evidence library does not yet capture every edge-case validation log natively.'
            ],
            fixedUntil: [
                'no full production-certification claim',
                'no sovereign readiness claim',
                'no deployment authorization claim'
            ],
            readOnly: true
        },
        lightMode: {
            nextSteps: orderedLightModeSteps,
            dependencies: [
                'negative-control gate coverage',
                'profile owner and authority mapping',
                'edge-case evidence completeness'
            ],
            expectedOutcomes: [
                'Bridge-gaps blockers become evidence-backed and measurable.',
                'Certification posture is updated with explicit supporting artifacts.'
            ],
            readyToGo: [
                'All implemented gates within the current certification scope passed.',
                'Bridge gaps reporting can proceed as a read-only remediation planning exercise.'
            ],
            focusNow: orderedLightModeSteps.slice(0, 3),
            minimalRemediation: 'Use the Bridge Gaps Report to draft a constrained remediation plan that closes the smallest verified gap first.',
            nextImplementationStep: 'Produce a separate reviewable remediation plan for the open gaps without changing runtime behavior.'
        },
        fixAndSet: {
            fix: 'Define the smallest controlled correction that closes the current gap.',
            set: 'Define the governed target state and the evidence required to hold it.',
            eligible: false,
            blockedBy: ['missing negative-control coverage', 'missing owner mapping', 'missing evidence completeness'],
        },
        evidenceStillMissing: [
            'source revision or Git commit capture in the artifact',
            'explicit environment snapshot in the report',
            'negative-control proof for receipt lookup, performance, and XE execution mismatch cases'
        ],
        technologyImplementationRecommendation: {
            northStarHook: 'Keep the implementation outcome-first and evidence-backed.',
            doctrineHook: 'Keep it read-only for this pass and preserve all canonical boundaries.',
            bridge: 'Use the bridge-gaps report as the governing input to a separate remediation plan for negative-control and mapping gaps.'
        },
        nextGovernedStep: 'Create a separately reviewable remediation plan for the remaining gaps, then validate the new negative-control coverage before any expanded claim.'
    };
}

function buildReadinessReport(payload, inventory, modules) {
    const flags = {
        reconcileLegacyProjects: normalizeBoolean(payload.reconcileLegacyProjects, false),
        buildSystemInventory: normalizeBoolean(payload.buildSystemInventory, false),
        classifyModules: normalizeBoolean(payload.classifyModules, false),
        identifyPublicAssets: normalizeBoolean(payload.identifyPublicAssets, false),
        identifyInternalAssets: normalizeBoolean(payload.identifyInternalAssets, false),
        generateExecutionMap: normalizeBoolean(payload.generateExecutionMap, false)
    };

    return {
        completedAt: new Date().toISOString(),
        commandFlags: flags,
        summary: {
            moduleCount: modules.length,
            publicationAssetCount: inventory.publicationAssets.length,
            internalAssetCount: inventory.internalAssets.length,
            legacyNameCount: inventory.legacyNames.length,
            unknownAssetCount: inventory.unknownAssets.length
        },
        findings: [
            'SentinelOS platform reconciliation completed as a governance exercise.',
            'Active modules, publication assets, and internal assets are classified from available evidence.',
            'Legacy naming drift has been identified for review and canonicalization.'
        ],
        recommendations: [
            'Review legacy name hits and normalize terminology in platform documentation.',
            'Finalize public vs internal boundary classification before any external publication.',
            'Use the generated execution map as the basis for governed command routing and audit review.'
        ],
        status: 'governance_reconciliation_complete'
    };
}

function buildReconstructionResult(payload, context, commandName) {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const scope = normalizeString(payload.scope, 'platform');
    const artifacts = walkRepository(repoRoot);
    const modules = extractActiveModules(repoRoot);

    const report = {
        command: commandName,
        scope,
        generatedAt: new Date().toISOString(),
        generatedBy: context.tenant || 'sentinelos',
        canonicalModel: normalizeBoolean(payload.rebuildCanonicalModel, true),
        includeLegacyMappings: normalizeBoolean(payload.includeLegacyMappings, true),
        generateModuleInventory: normalizeBoolean(payload.generateModuleInventory, true),
        generatePublicationInventory: normalizeBoolean(payload.generatePublicationInventory, true),
        generateMonetizationInventory: normalizeBoolean(payload.generateMonetizationInventory, false),
        moduleInventory: modules,
        legacyNames: artifacts.legacyNames,
        publicationInventory: artifacts.publicationAssets.slice(0, 200),
        internalInventory: artifacts.internalAssets.slice(0, 200),
        executionMap: buildExecutionMap(),
        readinessReport: buildReadinessReport(payload, artifacts, modules)
    };

    if (context.emitSecurityEvent) {
        context.emitSecurityEvent(`${context.tenant || 'sentinelos'}.${commandName}.executed`, {
            route: '/v1/command',
            command: `${context.tenant || 'sentinelos'}.${commandName}`,
            tenant: context.tenant || 'sentinelos'
        });
    }

    return report;
}

function buildGovernanceReceipt(commandName, payload, context) {
    if (!context || typeof context.buildReceipt !== 'function') {
        return null;
    }

    return context.buildReceipt(
        {
            lane: 'sentinelos',
            op: commandName,
            target: normalizeString(payload.scope, 'platform')
        },
        {
            type: 'sentinelos_governance_command',
            command: commandName,
            scope: normalizeString(payload.scope, 'platform')
        },
        {
            message: 'Governance reconstruction output produced for operator review.',
            status: 'completed',
            generatedAt: new Date().toISOString()
        },
        context.tenant || 'sentinelos'
    );
}

async function handleArchitectureReconstruction(payload = {}, context = {}, envelope = {}) {
    const commandName = COMMANDS.ARCHITECTURE_RECONSTRUCTION;
    const report = buildReconstructionResult(payload, context, commandName);
    const receipt = buildGovernanceReceipt(commandName, payload, context);

    if (context.emitSecurityEvent) {
        context.emitSecurityEvent(`${context.tenant || 'sentinelos'}.${commandName}.receipt_created`, {
            route: '/v1/command',
            command: `${context.tenant || 'sentinelos'}.${commandName}`,
            tenant: context.tenant || 'sentinelos',
            receiptId: receipt ? receipt.receiptId : null,
            auditId: receipt ? receipt.auditId : null
        });
    }

    return {
        success: true,
        statusCode: 200,
        data: {
            result: report,
            command: commandName,
            tenant: context.tenant || 'sentinelos',
            receipt
        }
    };
}

async function handleGovernanceCanonicalize(payload = {}, context = {}, envelope = {}) {
    const commandName = COMMANDS.GOVERNANCE_CANONICALIZE;
    const report = buildReconstructionResult(payload, context, commandName);
    const receipt = buildGovernanceReceipt(commandName, payload, context);

    if (context.emitSecurityEvent) {
        context.emitSecurityEvent(`${context.tenant || 'sentinelos'}.${commandName}.receipt_created`, {
            route: '/v1/command',
            command: `${context.tenant || 'sentinelos'}.${commandName}`,
            tenant: context.tenant || 'sentinelos',
            receiptId: receipt ? receipt.receiptId : null,
            auditId: receipt ? receipt.auditId : null
        });
    }

    return {
        success: true,
        statusCode: 200,
        data: {
            result: report,
            command: commandName,
            tenant: context.tenant || 'sentinelos',
            receipt
        }
    };
}

async function handleLightQuantitativeNextSteps(payload = {}, context = {}, envelope = {}) {
    const commandName = COMMANDS.LIGHT_QUANTITATIVE_NEXT_STEPS;
    const result = buildLightQuantitativeNextStepsResult(payload, context);
    const receipt = buildGovernanceReceipt(commandName, { ...payload, scope: 'nextsteps-deep-dive' }, context);

    if (context.emitSecurityEvent) {
        context.emitSecurityEvent(`${context.tenant || 'sentinelos'}.${commandName}.receipt_created`, {
            route: '/v1/command',
            command: `${context.tenant || 'sentinelos'}.${commandName}`,
            tenant: context.tenant || 'sentinelos',
            receiptId: receipt ? receipt.receiptId : null,
            auditId: receipt ? receipt.auditId : null
        });
    }

    return {
        success: true,
        statusCode: 200,
        data: {
            result,
            command: commandName,
            tenant: context.tenant || 'sentinelos',
            receipt
        }
    };
}

async function handleBridgeGapsReport(payload = {}, context = {}, envelope = {}) {
    const commandName = COMMANDS.BRIDGE_GAPS_REPORT;
    const result = buildBridgeGapsReportResult(payload, context);
    const receipt = buildGovernanceReceipt(commandName, { ...payload, scope: 'bridge-gaps-report' }, context);
    const normalizedReceipt = {
        id: receipt ? (receipt.receiptId || receipt.id || null) : null,
        timestamp: new Date().toISOString(),
        audit: Boolean(receipt && (receipt.auditId || receipt.id || receipt.receiptId))
    };
    const resultWithReceipt = {
        ...result,
        receipt: normalizedReceipt
    };

    if (context.emitSecurityEvent) {
        context.emitSecurityEvent(`${context.tenant || 'sentinelos'}.${commandName}.receipt_created`, {
            route: '/v1/command',
            command: `${context.tenant || 'sentinelos'}.${commandName}`,
            tenant: context.tenant || 'sentinelos',
            receiptId: receipt ? receipt.receiptId : null,
            auditId: receipt ? receipt.auditId : null
        });
    }

    return {
        success: true,
        statusCode: 200,
        data: {
            result: resultWithReceipt,
            command: commandName,
            tenant: context.tenant || 'sentinelos',
            receipt
        }
    };
}

const sentinelOsHandlers = {
    [COMMANDS.ARCHITECTURE_RECONSTRUCTION]: handleArchitectureReconstruction,
    [COMMANDS.GOVERNANCE_CANONICALIZE]: handleGovernanceCanonicalize,
    [COMMANDS.LIGHT_QUANTITATIVE_NEXT_STEPS]: handleLightQuantitativeNextSteps,
    [COMMANDS.BRIDGE_GAPS_REPORT]: handleBridgeGapsReport
};

module.exports = {
    sentinelOsHandlers,
    COMMANDS,
    buildLightQuantitativeNextStepsResult,
    buildBridgeGapsReportResult
};
