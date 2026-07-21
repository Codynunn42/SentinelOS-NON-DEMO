const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_BRAND_ROOT = 'docs/brand/sentinelos-brand-v1.0';
const DEFAULT_OUTPUT = 'docs/brand/sentinelos-brand-v1.0/03_docs/ASSET_MANIFEST_v1.0.sha256';
const TARGET_DIRS = ['01_vectors', '02_icons'];

function parseArgs(argv) {
    const args = {
        brandRoot: DEFAULT_BRAND_ROOT,
        output: DEFAULT_OUTPUT,
        failIfEmpty: false
    };

    for (let index = 2; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--brand-root') {
            args.brandRoot = argv[index + 1];
            index += 1;
        } else if (arg === '--output') {
            args.output = argv[index + 1];
            index += 1;
        } else if (arg === '--fail-if-empty') {
            args.failIfEmpty = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return args;
}

function sha256(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function collectFiles(brandRoot) {
    const files = [];

    for (const targetDir of TARGET_DIRS) {
        const absoluteDir = path.join(brandRoot, targetDir);

        if (!fs.existsSync(absoluteDir)) {
            continue;
        }

        const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isFile()) {
                continue;
            }

            const lower = entry.name.toLowerCase();
            if (lower === 'readme.md') {
                continue;
            }

            const absoluteFile = path.join(absoluteDir, entry.name);
            const relativeFile = path.relative(brandRoot, absoluteFile).split(path.sep).join('/');
            files.push({ absoluteFile, relativeFile });
        }
    }

    files.sort((a, b) => a.relativeFile.localeCompare(b.relativeFile));
    return files;
}

function buildManifestContent(files) {
    const lines = [];
    lines.push('# SentinelOS Brand Asset Manifest');
    lines.push('# Format: <sha256>  <relative-path>');
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');

    for (const file of files) {
        lines.push(`${sha256(file.absoluteFile)}  ${file.relativeFile}`);
    }

    lines.push('');
    return `${lines.join('\n')}`;
}

function main() {
    const args = parseArgs(process.argv);
    const brandRoot = path.resolve(args.brandRoot);
    const outputPath = path.resolve(args.output);

    if (!fs.existsSync(brandRoot)) {
        throw new Error(`Brand root not found: ${brandRoot}`);
    }

    const files = collectFiles(brandRoot);

    if (args.failIfEmpty && files.length === 0) {
        throw new Error('No assets found in 01_vectors or 02_icons.');
    }

    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, buildManifestContent(files));

    console.log(JSON.stringify({
        status: 'ok',
        brandRoot,
        outputPath,
        fileCount: files.length
    }, null, 2));
}

main();
