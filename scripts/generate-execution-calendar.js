#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd();
const workbookPath = path.join(
    repoRoot,
    'apps/executive-desk/government-readiness/governance/NUNN_CORP_2030_EXECUTION_WORKBOOK.md',
);
const outputPath = path.join(
    repoRoot,
    'docs/executive-desk/calendar/nunn-corp-2030-deliverables.ics',
);
const publicOutputPath = path.join(
    repoRoot,
    'apps/executive-desk/public/downloads/nunn-corp-2030-deliverables.ics',
);

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (token === '--from' && argv[i + 1]) {
            args.from = argv[i + 1];
            i += 1;
        }
    }
    return args;
}

function toIsoDate(date) {
    return date.toISOString().slice(0, 10);
}

function isValidIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDays(dateStr, days) {
    const date = new Date(`${dateStr}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return toIsoDate(date);
}

function toIcsDate(dateStr) {
    return dateStr.replace(/-/g, '');
}

function escapeIcsText(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

function parseDeliverables(markdown) {
    const lines = markdown.split(/\r?\n/);
    let inImmediateSteps = false;
    const items = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (line.startsWith('## 11) Immediate Next Steps')) {
            inImmediateSteps = true;
            continue;
        }

        if (inImmediateSteps && line.startsWith('## ') && !line.startsWith('## 11)')) {
            break;
        }

        if (!inImmediateSteps) {
            continue;
        }

        if (!line.startsWith('|')) {
            continue;
        }

        const cols = line
            .split('|')
            .map((part) => part.trim())
            .filter((part) => part.length > 0);

        if (cols.length < 5) {
            continue;
        }

        const [step, owner, due, status, evidence] = cols;

        if (step.toLowerCase() === 'step' || /^-+$/.test(step)) {
            continue;
        }

        if (!isValidIsoDate(due)) {
            continue;
        }

        items.push({ step, owner, due, status, evidence });
    }

    return items;
}

function toEvent(item, uidPrefix) {
    const uid = `${uidPrefix}-${item.due}-${Buffer.from(item.step).toString('hex').slice(0, 16)}`;
    const summary = `Deliverable: ${item.step}`;
    const description = [
        `Owner: ${item.owner}`,
        `Status: ${item.status}`,
        `Evidence: ${item.evidence}`,
        'Source: NUNN_CORP_2030_EXECUTION_WORKBOOK.md',
    ].join('\n');

    return {
        uid,
        summary,
        description,
        start: item.due,
        end: addDays(item.due, 1),
        categories: 'NUNN2030,DELIVERABLE,EXECUTION',
    };
}

function buildIcs(events) {
    const dtstamp = toIcsDate(toIsoDate(new Date())) + 'T000000Z';

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Nunn Corporation//Sentinel Executive OS//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
    ];

    for (const ev of events) {
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${escapeIcsText(ev.uid)}`);
        lines.push(`DTSTAMP:${dtstamp}`);
        lines.push(`DTSTART;VALUE=DATE:${toIcsDate(ev.start)}`);
        lines.push(`DTEND;VALUE=DATE:${toIcsDate(ev.end)}`);
        lines.push(`SUMMARY:${escapeIcsText(ev.summary)}`);
        lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
        lines.push(`CATEGORIES:${escapeIcsText(ev.categories)}`);
        lines.push('STATUS:CONFIRMED');
        lines.push('TRANSP:OPAQUE');
        lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const today = toIsoDate(new Date());
    const fromDate = args.from && isValidIsoDate(args.from) ? args.from : today;

    if (!fs.existsSync(workbookPath)) {
        throw new Error(`Workbook not found: ${workbookPath}`);
    }

    const workbook = fs.readFileSync(workbookPath, 'utf8');
    const deliverables = parseDeliverables(workbook)
        .filter((item) => item.due >= fromDate)
        .sort((a, b) => a.due.localeCompare(b.due) || a.step.localeCompare(b.step));

    const events = deliverables.map((item) => toEvent(item, 'nunn-deliverable'));

    // Requested leadership marker.
    events.unshift({
        uid: `nunn-milestone-sentinel-ai-complete-${fromDate}`,
        summary: 'Sentinel AI: Complete',
        description:
            'Leadership milestone marker. Controlled operations and cadence execution are active with Sentinel AI completion declared for this process.',
        start: fromDate,
        end: addDays(fromDate, 1),
        categories: 'NUNN2030,MILESTONE,SENTINEL_AI',
    });

    const ics = buildIcs(events);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, ics, 'utf8');

    // Publish a browser-downloadable copy via /executive static hosting.
    fs.mkdirSync(path.dirname(publicOutputPath), { recursive: true });
    fs.writeFileSync(publicOutputPath, ics, 'utf8');

    console.log(`Generated calendar: ${outputPath}`);
    console.log(`Downloadable copy: ${publicOutputPath}`);
    console.log('Web URL path: /executive/downloads/nunn-corp-2030-deliverables.ics');
    console.log(`From date: ${fromDate}`);
    console.log(`Events: ${events.length}`);
}

main();
