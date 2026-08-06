const fs = require('fs');
const path = require('path');

const DEFAULT_BRAND_ROOT = 'docs/brand/sentinelos-brand-v1.0';

const REQUIRED = {
    '01_vectors': [
        'sentinelos-primary-dark.svg',
        'sentinelos-primary-light.svg',
        'sentinelos-mono-white.svg',
        'sentinelos-mono-black.svg',
        'sentinelos-app-icon.svg',
        'sentinelos-favicon-matrix.svg'
    ],
    '02_icons': [
        'app-icon-macos-512x512.png',
        'app-icon-ios-1024x1024.png',
        'github-org-avatar-64x64.png',
        'favicon-32x32.png',
        'favicon.ico'
    ],
    '03_docs': [
        'SentinelOS_Brand_Guidelines_v1.0.md',
        'RELEASE_CHECKLIST_v1.0.md',
        'ASSET_MANIFEST_TEMPLATE_v1.0.sha256',
        'SOURCE_ASSET_INTAKE_2026-07-21.md'
    ]
};

const OPTIONAL_DOCS = ['ASSET_MANIFEST_v1.0.sha256'];
const ALLOWED_ALWAYS = new Set(['README.md']);

function parseArgs(argv) {
    const args = {
        brandRoot: DEFAULT_BRAND_ROOT,
        allowExtra: false,
        requireGeneratedManifest: false
    };

    for (let index = 2; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--brand-root') {
            args.brandRoot = argv[index + 1];
            index += 1;
        } else if (arg === '--allow-extra') {
            args.allowExtra = true;
        } else if (arg === '--require-generated-manifest') {
            args.requireGeneratedManifest = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return args;
}

function listFiles(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }

    return fs
        .readdirSync(dirPath, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort();
}

function toRelative(dirName, fileName) {
    return `${dirName}/${fileName}`;
}

function validateBrandPackage(brandRoot, options) {
    const missing = [];
    const unexpected = [];

    for (const [dirName, requiredFiles] of Object.entries(REQUIRED)) {
        const absoluteDir = path.join(brandRoot, dirName);
        const foundFiles = listFiles(absoluteDir);
        const foundSet = new Set(foundFiles);

        for (const requiredFile of requiredFiles) {
            if (!foundSet.has(requiredFile)) {
                missing.push(toRelative(dirName, requiredFile));
            }
        }

        if (dirName === '03_docs' && options.requireGeneratedManifest) {
            if (!foundSet.has('ASSET_MANIFEST_v1.0.sha256')) {
                missing.push('03_docs/ASSET_MANIFEST_v1.0.sha256');
            }
        }

        const allowInDir = new Set([
            ...requiredFiles,
            ...ALLOWED_ALWAYS,
            ...(dirName === '03_docs' ? OPTIONAL_DOCS : [])
        ]);

        if (!options.allowExtra) {
            for (const found of foundFiles) {
                if (!allowInDir.has(found)) {
                    unexpected.push(toRelative(dirName, found));
                }
            }
        }
    }

    return { missing, unexpected };
}

function main() {
    const args = parseArgs(process.argv);
    const brandRoot = path.resolve(args.brandRoot);

    if (!fs.existsSync(brandRoot)) {
        throw new Error(`Brand root not found: ${brandRoot}`);
    }

    const { missing, unexpected } = validateBrandPackage(brandRoot, args);
    const hasFailures = missing.length > 0 || unexpected.length > 0;

    const result = {
        status: hasFailures ? 'failed' : 'passed',
        brandRoot,
        missing,
        unexpected,
        options: {
            allowExtra: args.allowExtra,
            requireGeneratedManifest: args.requireGeneratedManifest
        }
    };

    if (hasFailures) {
        console.error(JSON.stringify(result, null, 2));
        process.exit(1);
    }

    console.log(JSON.stringify(result, null, 2));
}

main();
