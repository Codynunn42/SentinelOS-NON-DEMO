import path from 'node:path';
import { CommandContext, CommandExecutionResult, GeneratedArtifact } from '../cli/types';
import { writeJsonArtifact } from './markdown-reporter';

export type LocalExecutionReceipt = {
    status: 'executed' | 'blocked';
    command: string;
    execution_mode: 'local_repository_only';
    generated_at: string;
    what_if: boolean;
    summary: string;
    warnings: string[];
    blockers: string[];
    generated_artifacts: string[];
    comm: string;
    authority_created: false;
    operational_mutation: false;
    external_claims_authorized: false;
    generated_by: string;
};

export async function writeExecutionReceipt(
    context: CommandContext,
    result: CommandExecutionResult,
): Promise<GeneratedArtifact> {
    const safeCommand = result.command.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    const stamp = context.utcNow.toISOString().replace(/[:]/g, '-');
    const targetPath = path.join(
        context.docsRoot,
        'receipts',
        `${stamp}-${safeCommand}.json`,
    );

    const receipt: LocalExecutionReceipt = {
        status: result.ok ? 'executed' : 'blocked',
        command: result.command,
        execution_mode: 'local_repository_only',
        generated_at: context.utcNow.toISOString(),
        what_if: context.whatIf,
        summary: result.summary,
        warnings: result.warnings,
        blockers: result.blockers,
        generated_artifacts: result.artifacts.map((item) => item.path),
        comm: context.governance.comm,
        authority_created: false,
        operational_mutation: false,
        external_claims_authorized: false,
        generated_by: context.governance.generated_by,
    };

    return writeJsonArtifact(context, targetPath, receipt);
}
