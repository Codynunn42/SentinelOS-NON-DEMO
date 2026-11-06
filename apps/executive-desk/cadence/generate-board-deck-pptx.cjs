const path = require('node:path');
const PptxGenJS = require('pptxgenjs');

const args = new Set(process.argv.slice(2));
const isDoeVariant = args.has('--doe');
const isCanaryVariant = args.has('--canary');
const deckDate = '2026-08-20';
const deckLabel = `${isDoeVariant ? 'DOE Briefing Variant' : 'DOE Discussion Draft'} · Historical draft · ${deckDate}`;

const pptx = new PptxGenJS();
pptx.author = 'Executive Desk';
pptx.company = 'SentinelOS';
pptx.subject = 'DOE leadership executive briefing';
pptx.title = 'SentinelOS Executive Status';
pptx.layout = 'LAYOUT_WIDE';
pptx.theme = {
    headFontFace: 'Calibri',
    bodyFontFace: 'Calibri',
    lang: 'en-US',
};

const COLORS = {
    navy: '0B1F3A',
    blue: '205493',
    teal: '2A7F8A',
    slate: '5B6770',
    light: 'F4F7FB',
    white: 'FFFFFF',
    green: '2E7D32',
    amber: 'C77700',
};

function addHeader(slide, title, subtitle) {
    slide.background = { color: COLORS.light };
    slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.33,
        h: 0.85,
        fill: { color: COLORS.navy },
        line: { color: COLORS.navy },
    });

    slide.addText('SentinelOS Executive Desk', {
        x: 0.45,
        y: 0.2,
        w: 5.8,
        h: 0.35,
        color: COLORS.white,
        bold: true,
        fontSize: 16,
    });

    slide.addText(deckLabel, {
        x: 8.3,
        y: 0.22,
        w: 4.6,
        h: 0.3,
        color: 'DCE6F7',
        align: 'right',
        fontSize: 11,
    });

    slide.addText(title, {
        x: 0.65,
        y: 1.15,
        w: 12,
        h: 0.6,
        color: COLORS.navy,
        bold: true,
        fontSize: 30,
    });

    if (subtitle) {
        slide.addText(subtitle, {
            x: 0.68,
            y: 1.85,
            w: 11.6,
            h: 0.45,
            color: COLORS.slate,
            fontSize: 15,
        });
    }

    if (isCanaryVariant) {
        slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.5,
            y: 7.04,
            w: 3.35,
            h: 0.33,
            radius: 0.05,
            fill: { color: 'FFF1D6' },
            line: { color: 'F3CF8C' },
        });
        slide.addText('Canary Discussion Draft', {
            x: 0.66,
            y: 7.12,
            w: 2.95,
            h: 0.16,
            color: COLORS.amber,
            bold: true,
            fontSize: 9,
        });
    }
}

function addDoeAskDependenciesSlide() {
    const slide = pptx.addSlide();
    addHeader(slide, 'DOE Ask / Decision Needed', 'Interagency dependencies and clear decision requests');

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.95,
        y: 2.35,
        w: 5.75,
        h: 4.15,
        radius: 0.08,
        fill: { color: 'EAF3FF' },
        line: { color: 'C8DCF8' },
    });
    slide.addText('Ask / Decision Needed', {
        x: 1.25,
        y: 2.65,
        w: 5.2,
        h: 0.35,
        bold: true,
        color: COLORS.blue,
        fontSize: 16,
    });
    addBullets(
        slide,
        [
            'Confirm that evidence refresh precedes any overall posture or readiness statement',
            'Confirm acceptance of sequencing: database readiness before final readiness claim',
            'Approve continued evidence-first reporting language for cross-agency updates',
            'Acknowledge that closure criteria remain execution-based, not governance-failure based',
        ],
        1.22,
        3.12,
        5.25,
        3.05,
        { fontSize: 14, paraSpaceAfterPt: 6 }
    );

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.95,
        y: 2.35,
        w: 5.75,
        h: 4.15,
        radius: 0.08,
        fill: { color: 'FFF7EA' },
        line: { color: 'F1DBB1' },
    });
    slide.addText('Interagency Dependencies', {
        x: 7.25,
        y: 2.65,
        w: 5.2,
        h: 0.35,
        bold: true,
        color: COLORS.amber,
        fontSize: 16,
    });
    addBullets(
        slide,
        [
            'Environment provisioning alignment for live DATABASE_URL and database access boundaries',
            'Security and gateway enforcement coordination for Stage 3 controls',
            'Release-governance coordination for final publish controls and sign-off order',
            'Cadence synchronization to ensure DOE-facing updates remain evidence-backed and current',
        ],
        7.22,
        3.12,
        5.2,
        3.05,
        { fontSize: 14, paraSpaceAfterPt: 6 }
    );
}

function addBullets(slide, items, x, y, w, h, opts = {}) {
    const bulletIndent = opts.bulletIndent || 16;
    const paraSpaceAfterPt = opts.paraSpaceAfterPt || 8;
    const fontSize = opts.fontSize || 20;

    const runs = items.map((text) => ({
        text,
        options: {
            bullet: { indent: bulletIndent },
            hanging: 2,
            paraSpaceAfterPt,
        },
    }));

    slide.addText(runs, {
        x,
        y,
        w,
        h,
        color: COLORS.navy,
        fontSize,
        valign: 'top',
    });
}

function addStatusChip(slide, label, value, x, y, isGood = true) {
    const fillColor = isGood ? 'EAF5EC' : 'FFF2DE';
    const textColor = isGood ? COLORS.green : COLORS.amber;
    slide.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w: 3.9,
        h: 0.62,
        radius: 0.07,
        fill: { color: fillColor },
        line: { color: fillColor },
    });
    slide.addText(`${label}: ${value}`, {
        x: x + 0.2,
        y: y + 0.15,
        w: 3.5,
        h: 0.3,
        bold: true,
        color: textColor,
        fontSize: 13,
    });
}

// Slide 1
{
    const slide = pptx.addSlide();
    addHeader(slide, 'Executive Summary', 'Status: Historical draft; current posture requires evidence refresh');
    addBullets(
        slide,
        [
            'Repository health: not independently verified for this briefing',
            'Governance controls and evidence trail: require current evidence review',
            'Product and policy status: not assessed by this briefing',
            'Production readiness remains unverified pending live deployment evidence',
        ],
        0.85,
        2.5,
        8.4,
        3.3,
        { fontSize: 20 }
    );

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 9.45,
        y: 2.65,
        w: 3.15,
        h: 2.95,
        radius: 0.08,
        fill: { color: 'E9F0FA' },
        line: { color: 'C9DAF2' },
    });
    slide.addText('Key Message', {
        x: 9.75,
        y: 2.95,
        w: 2.55,
        h: 0.35,
        color: COLORS.blue,
        bold: true,
        fontSize: 14,
    });
    slide.addText(
        'This historical briefing does not establish current operating posture. Refresh source evidence before making a readiness claim.',
        {
            x: 9.75,
            y: 3.35,
            w: 2.55,
            h: 2.1,
            color: COLORS.navy,
            fontSize: 13,
            valign: 'top',
        }
    );
}

// Slide 2
{
    const slide = pptx.addSlide();
    addHeader(slide, 'Evidence Status', 'Current posture is unverified until source evidence is reviewed');

    addStatusChip(slide, 'Governance integrity', 'Unverified', 0.85, 2.5, false);
    addStatusChip(slide, 'Repo health', 'Unverified', 4.95, 2.5, false);
    addStatusChip(slide, 'Evidence chain', 'Unverified', 9.05, 2.5, false);
    addStatusChip(slide, 'Product risk', 'Not assessed', 0.85, 3.3, false);
    addStatusChip(slide, 'Operational readiness', 'Unverified', 4.95, 3.3, false);

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.85,
        y: 4.35,
        w: 11.9,
        h: 1.5,
        radius: 0.08,
        fill: { color: COLORS.white },
        line: { color: 'D5DEEB' },
    });
    slide.addText(
        'Review current, timestamped sources before making a posture or controlled-execution recommendation. Artifact presence alone does not establish runtime health.',
        {
            x: 1.15,
            y: 4.72,
            w: 11.35,
            h: 1.05,
            color: COLORS.navy,
            fontSize: 16,
            valign: 'mid',
        }
    );
}

// Slide 3
{
    const slide = pptx.addSlide();
    addHeader(slide, 'Recorded Activities', 'Claims require their original source evidence');
    addBullets(
        slide,
        [
            'Governance review and control-alignment activity is recorded in source documents',
            'Executive cadence and support-triage documentation is recorded',
            'Repository and runtime validation claims require original evidence',
            'This historical draft does not establish current production readiness',
        ],
        0.95,
        2.5,
        11.7,
        3.1,
        { fontSize: 19 }
    );

    slide.addShape(pptx.ShapeType.line, {
        x: 0.95,
        y: 5.9,
        w: 11.7,
        h: 0,
        line: { color: 'B7C9E5', width: 1.5 },
    });
    slide.addText('Outcome: no current system posture is established by this historical draft.', {
        x: 0.95,
        y: 6.02,
        w: 11.7,
        h: 0.45,
        bold: true,
        color: COLORS.blue,
        fontSize: 15,
    });
}

// Slide 4
{
    const slide = pptx.addSlide();
    addHeader(slide, 'Remaining Live-Environment Blockers', 'Bounded execution dependencies before final closure');
    addBullets(
        slide,
        [
            'Provision live DATABASE_URL for the deployment environment',
            'Complete Postgres smoke validation and readiness checks',
            'Finalize Stage 2 GPT publish controls',
            'Enforce Stage 3 gateway and WAF controls',
        ],
        0.95,
        2.55,
        8.25,
        3.3,
        { fontSize: 19 }
    );

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 9.45,
        y: 2.6,
        w: 3.15,
        h: 3.2,
        radius: 0.08,
        fill: { color: 'FFF5E8' },
        line: { color: 'F0D4A8' },
    });
    slide.addText('Risk Framing', {
        x: 9.78,
        y: 2.92,
        w: 2.5,
        h: 0.32,
        bold: true,
        color: COLORS.amber,
        fontSize: 14,
    });
    slide.addText('These are listed deployment-path dependencies; this briefing does not establish that they are exhaustive.', {
        x: 9.78,
        y: 3.3,
        w: 2.5,
        h: 2.3,
        color: COLORS.navy,
        fontSize: 13,
        valign: 'top',
    });
}

// Slide 5
{
    const slide = pptx.addSlide();
    addHeader(slide, 'Evidence Gate', 'Do not infer overall status from this historical draft');
    addBullets(
        slide,
        [
            'Repository health: not assessed',
            'Governance status: not assessed',
            'Do not infer launch approval from this document',
            'Confirm current owner, path, and measurable completion criteria',
        ],
        0.95,
        2.5,
        11.7,
        2.85,
        { fontSize: 20 }
    );

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.95,
        y: 5.5,
        w: 11.7,
        h: 1.15,
        radius: 0.06,
        fill: { color: 'EAF3FF' },
        line: { color: 'C4D9F9' },
    });
    slide.addText('Governance approach: proceed deliberately, preserve evidence, and avoid declaring full readiness until live checks pass.', {
        x: 1.2,
        y: 5.84,
        w: 11.25,
        h: 0.55,
        color: COLORS.navy,
        bold: true,
        fontSize: 15,
    });
}

// Slide 6
{
    const slide = pptx.addSlide();
    addHeader(slide, 'Next Milestones', 'Evidence-gated path to any future readiness assessment');
    const milestones = [
        'Provision the live or staging DATABASE_URL',
        'Complete Postgres setup and smoke validation',
        'Confirm Stage 2 GPT publish controls are active',
        'Enforce Stage 3 gateway and WAF controls',
        'Re-run evidence-backed checks before final launch closure',
    ];

    milestones.forEach((text, index) => {
        const y = 2.45 + index * 0.78;
        slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.95,
            y,
            w: 0.5,
            h: 0.42,
            radius: 0.05,
            fill: { color: COLORS.teal },
            line: { color: COLORS.teal },
        });
        slide.addText(String(index + 1), {
            x: 1.12,
            y: y + 0.11,
            w: 0.18,
            h: 0.2,
            color: COLORS.white,
            bold: true,
            fontSize: 11,
            align: 'center',
        });
        slide.addText(text, {
            x: 1.6,
            y: y + 0.05,
            w: 9.2,
            h: 0.35,
            color: COLORS.navy,
            fontSize: 17,
        });
    });

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 10.55,
        y: 2.45,
        w: 2.1,
        h: 3.45,
        radius: 0.08,
        fill: { color: COLORS.white },
        line: { color: 'D5DEEB' },
    });
    slide.addText('Expected Outcome', {
        x: 10.78,
        y: 2.75,
        w: 1.7,
        h: 0.35,
        color: COLORS.blue,
        bold: true,
        fontSize: 13,
        align: 'center',
    });
    slide.addText('Readiness remains unverified until current live checks and governance evidence pass review.', {
        x: 10.78,
        y: 3.2,
        w: 1.7,
        h: 2.3,
        color: COLORS.navy,
        fontSize: 12,
        valign: 'mid',
        align: 'center',
    });
}

if (isDoeVariant) {
    addDoeAskDependenciesSlide();
}

// Slide 7
{
    const slide = pptx.addSlide();
    addHeader(slide, 'Leadership Recommendation', 'Historical draft; refresh evidence before use');

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.95,
        y: 2.5,
        w: 11.7,
        h: 1.05,
        radius: 0.07,
        fill: { color: 'FFF2DE' },
        line: { color: 'F1DBB1' },
    });
    slide.addText('Hold an overall readiness judgment until current evidence is reviewed.', {
        x: 1.2,
        y: 2.87,
        w: 11.1,
        h: 0.38,
        bold: true,
        color: COLORS.amber,
        fontSize: 20,
        align: 'center',
    });

    addBullets(
        slide,
        [
            'Proceed with controlled execution',
            'Maintain evidence-driven status reporting',
            'Do not overstate readiness until final live enforcement is complete',
        ],
        1.25,
        3.9,
        11,
        1.6,
        { fontSize: 18, paraSpaceAfterPt: 7 }
    );

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.95,
        y: 5.75,
        w: 11.7,
        h: 1.05,
        radius: 0.06,
        fill: { color: COLORS.navy },
        line: { color: COLORS.navy },
    });
    slide.addText('This historical draft does not establish current program, governance, repository-health, or readiness status.', {
        x: 1.2,
        y: 6.05,
        w: 11.1,
        h: 0.55,
        color: COLORS.white,
        fontSize: 14,
        align: 'center',
        valign: 'mid',
    });
}

let outFileName = 'EXECUTIVE_BOARD_DECK.pptx';
if (isDoeVariant && isCanaryVariant) {
    outFileName = 'EXECUTIVE_BOARD_DECK_DOE_CANARY.pptx';
} else if (isDoeVariant) {
    outFileName = 'EXECUTIVE_BOARD_DECK_DOE.pptx';
} else if (isCanaryVariant) {
    outFileName = 'EXECUTIVE_BOARD_DECK_CANARY.pptx';
}
const outPath = path.resolve(__dirname, outFileName);

pptx
    .writeFile({ fileName: outPath })
    .then(() => {
        console.log(`Created ${outPath}`);
    })
    .catch((error) => {
        console.error('Failed to generate deck:', error);
        process.exitCode = 1;
    });
