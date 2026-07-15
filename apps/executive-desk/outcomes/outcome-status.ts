import path from 'node:path';
import { access, readFile } from 'node:fs/promises';
import {
    CommandContext,
    CommandExecutionResult,
    OutcomeStatusEntry,
} from '../cli/types';
import { OUTCOME_KEYS } from '../config/executive-desk.config';
import { getDateParts, wrapGovernedReport } from '../cadence/cadence-engine';
import { writeMarkdownArtifact } from '../reporting/markdown-reporter';

async function hasEvidence(context: CommandContext, relPath: string): Promise<boolean> {
    try {
        await access(path.join(context.repoRoot, relPath));
        return true;
    } catch {
        return false;
    }
}

type OutcomeKey = (typeof OUTCOME_KEYS)[number];
type OutcomeVerificationItem = {
    verified?: boolean;
    verificationEvidence?: string[];
};

async function loadVerificationProfile(
    context: CommandContext,
): Promise<{ profile: Partial<Record<OutcomeKey, OutcomeVerificationItem>>; warnings: string[] }> {
    const profilePath = path.join(context.docsRoot, 'outcomes', 'verification-profile.json');
    try {
        const raw = await readFile(profilePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<Record<OutcomeKey, OutcomeVerificationItem>>;
        return { profile: parsed, warnings: [] };
    } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);
        return {
            profile: {},
            warnings: [`outcome_verification_profile_unavailable_or_invalid: ${detail}`],
        };
    }
}

async function buildEntries(context: CommandContext): Promise<OutcomeStatusEntry[]> {
    const now = context.utcNow.toISOString();
    const { profile } = await loadVerificationProfile(context);
    const mapEvidence: Record<(typeof OUTCOME_KEYS)[number], string[]> = {
        government_readiness: ['apps/executive-desk/government-readiness/README.md'],
        sentinelos_completion: ['apps/executive-desk/EXECUTIVE_DESK_V1_ROADMAP.md'],
        executive_desk_operational_cadence: ['apps/executive-desk/GOVERNMENT_READINESS_DAILY_CADENCE_2026-07-14.md'],
        ownerfi_internal_financial_management: ['docs/OWNERFI_INTERNAL_FINANCIAL_DOMAIN_AND_MOB_ALIGNMENT_DECISION_2026-07-03.md'],
        sintinex_commercial_readiness: ['apps/executive-desk/INTEGRATION_CHECKLIST.md'],
        governed_deal_execution: ['apps/executive-desk/proxy/command-handler.ts'],
    };

    const owners: Record<(typeof OUTCOME_KEYS)[number], string> = {
        government_readiness: 'government-readiness-lead',
        sentinelos_completion: 'sentinelos-operator',
        executive_desk_operational_cadence: 'executive-desk-operator',
        ownerfi_internal_financial_management: 'ownerfi-domain-owner',
        sintinex_commercial_readiness: 'sintinex-commercial-owner',
        governed_deal_execution: 'governance-command-owner',
    };

    const entries: OutcomeStatusEntry[] = [];

    for (const outcome of OUTCOME_KEYS) {
        const evidencePaths = mapEvidence[outcome];
        const verificationPaths = profile[outcome]?.verificationEvidence || [];
        const found: string[] = [];
        const foundVerification: string[] = [];
        for (const evidencePath of evidencePaths) {
            if (await hasEvidence(context, evidencePath)) {
                found.push(`artifact_present_not_behavior_verified: ${evidencePath}`);
            }
        }

        for (const verificationPath of verificationPaths) {
            if (await hasEvidence(context, verificationPath)) {
                foundVerification.push(`behavior_verified: ${verificationPath}`);
            }
        }

        const profileVerified = profile[outcome]?.verified === true;
        const behaviorVerified = profileVerified && foundVerification.length > 0;

        const state: OutcomeStatusEntry['state'] =
            found.length === 0 ? 'red' : behaviorVerified ? 'green' : 'yellow';

        const blockers =
            state === 'red' ? ['missing_evidence'] : state === 'yellow' ? ['behavior_not_verified'] : [];

        entries.push({
            outcome,
            state,
            evidence: [...found, ...foundVerification],
            blockers,
            owner: owners[outcome],
            nextGate: state === 'green' ? 'operational-ready' : 'evidence-verification',
            lastChecked: now,
        });
    }

    return entries;
}

export async function runOutcomeStatus(context: CommandContext): Promise<CommandExecutionResult> {
    const date = getDateParts(context);
    const targetPath = path.join(context.docsRoot, 'outcomes', `${date.isoDate}.md`);
    const { warnings } = await loadVerificationProfile(context);
    const entries = await buildEntries(context);

    const lines = entries.flatMap((entry) => [
        `## ${entry.outcome}`,
        '',
        `- state: ${entry.state}`,
        `- owner: ${entry.owner}`,
        `- next_gate: ${entry.nextGate}`,
        `- last_checked: ${entry.lastChecked}`,
        `- evidence: ${entry.evidence.length ? entry.evidence.join('; ') : 'none'}`,
        `- blockers: ${entry.blockers.join('; ')}`,
        '',
    ]);

    const markdown = wrapGovernedReport(
        [
            `# Outcome Status — ${date.isoDate}`,
            '',
            ...lines,
        ].join('\n'),
        context,
    );

    const artifact = await writeMarkdownArtifact(context, targetPath, markdown);

    return {
        ok: true,
        command: 'outcome status',
        summary: 'Outcome status report generated.',
        artifacts: [artifact],
        warnings,
        blockers: [],
    };
}
