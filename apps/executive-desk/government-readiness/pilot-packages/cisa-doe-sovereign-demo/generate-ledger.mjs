import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../../..');
const receiptsDir = path.join(repoRoot, 'docs', 'executive-desk', 'receipts');
const outputJson = path.join(__dirname, 'ledger-demo.json');
const outputJs = path.join(__dirname, 'ledger-data.js');

function hashFor(payload) {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function mapReceiptToLedgerEntry(receipt, index, previousSignature) {
    const timestamp = String(receipt.generated_at || new Date().toISOString());
    const action = String(receipt.command || `runtime.command.${index + 1}`);
    const actor = String(receipt.generated_by || receipt.comm || 'Local SentinelOS Executive Desk');
    const gate = receipt.blockers && receipt.blockers.length > 0
        ? `blocked:${receipt.blockers.join('|')}`
        : receipt.warnings && receipt.warnings.length > 0
            ? `warning:${receipt.warnings.join('|')}`
            : 'runtime-generated';

    const base = {
        id: `runtime-${String(index + 1).padStart(3, '0')}`,
        timestamp,
        actor,
        action,
        decision: String(receipt.status || 'issued'),
        gate,
        previousSignature,
    };

    return {
        ...base,
        signature: hashFor(base),
    };
}

async function main() {
    await mkdir(__dirname, { recursive: true });
    const files = (await readdir(receiptsDir))
        .filter((file) => file.endsWith('.json'))
        .sort();

    const parsed = [];
    for (const file of files) {
        const fullPath = path.join(receiptsDir, file);
        try {
            const value = JSON.parse(await readFile(fullPath, 'utf8'));
            if (value && typeof value === 'object' && typeof value.command === 'string') {
                parsed.push({ value });
            }
        } catch {
            // Skip malformed receipts so the bundle remains usable.
        }
    }

    const recent = parsed.slice(-8).sort((left, right) => {
        const leftTime = new Date(left.value.generated_at || 0).getTime();
        const rightTime = new Date(right.value.generated_at || 0).getTime();
        return leftTime - rightTime;
    });

    let previousSignature = 'GENESIS';
    const ledger = recent.map(({ value }, index) => {
        const entry = mapReceiptToLedgerEntry(value, index, previousSignature);
        previousSignature = entry.signature;
        return entry;
    });

    const metadata = {
        generatedAt: new Date().toISOString(),
        sourceDirectory: path.relative(__dirname, receiptsDir),
        receiptCount: ledger.length,
    };

    await writeFile(outputJson, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
    await writeFile(
        outputJs,
        `window.__SOVEREIGN_LEDGER__ = ${JSON.stringify(ledger, null, 2)};\nwindow.__SOVEREIGN_LEDGER_METADATA__ = ${JSON.stringify(metadata, null, 2)};\n`,
        'utf8',
    );

    console.log(`Generated ${ledger.length} ledger entries from ${receiptsDir}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});