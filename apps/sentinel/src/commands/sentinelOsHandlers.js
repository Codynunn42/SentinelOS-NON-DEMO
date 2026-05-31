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
    GOVERNANCE_CANONICALIZE: 'governance.canonicalize.platform'
};

const KNOWN_LEGACY_KEYWORDS = ['ownerfi', 'nunncloud', 'hotelops', 'contractreclamation', 'sentinelos'];
const INTERNAL_PATH_KEYWORDS = ['proof', 'ops', 'archive', 'runtime', 'scripts', 'configs', 'fixtures', 'infrastructure', 'store'];
const PUBLIC_PATH_KEYWORDS = ['docs', 'apps', 'services', 'azure', 'README.md', 'package.json', 'package-lock.json', 'pnpm-lock.yaml'];

function normalizeBoolean(value, defaultValue = false) {
    return typeof value === 'boolean' ? value : defaultValue;
}

function normalizeString(value, defaultValue = '') {
    return typeof value === 'string' ? value.trim() : defaultValue;
}

function normalizeStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map(normalizeString).filter(Boolean);
}

function inferAssetClassification(relativePath) {
    const normalized = relativePath.toLowerCase();

    if (INTERNAL_PATH_KEYWORDS.some((keyword) => normalized.includes(`/${keyword}/`) || normalized.endsWith(`/${keyword}`))) {
        return 'internal';
    }

    if (PUBLIC_PATH_KEYWORDS.some((keyword) => normalized.includes(`/${keyword}/`) || normalized.endsWith(`/${keyword}`))) {
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
            }
        ]
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

const sentinelOsHandlers = {
    [COMMANDS.ARCHITECTURE_RECONSTRUCTION]: handleArchitectureReconstruction,
    [COMMANDS.GOVERNANCE_CANONICALIZE]: handleGovernanceCanonicalize
};

module.exports = {
    sentinelOsHandlers,
    COMMANDS
};
