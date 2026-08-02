// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Executive Desk — Oversight Plane
//
// The Executive Desk is the oversight surface for SentinelOS.
// It can view, approve, and reject governed actions.
// It cannot initiate execution directly.
//
// C3.4: The Executive Desk is now capability-aware. It can query the
// Capability Registry and read Dock Manifests to answer governance questions:
//   - What capabilities are registered?
//   - Which systems are healthy?
//   - What governance applies?
//   - What evidence is required?
//   - What modernization opportunities exist?
//
// C4.6: The Executive Desk is now a cross-provider governance dashboard.
//   - Provider Health panel: all registered providers with health, drift, evidence posture
//   - GET /api/v1/drift/capabilities feeds the Provider Health panel
//   - buildExecutiveState includes crossProviderDrift for each provider
//   - crossProviderDashboard: true marks this upgrade
//
// All Executive Desk decisions are routed through the Approval Layer
// and audited under the executive.oversight.* telemetry class.
//
// Execution flow:
//   NEXUS (or any face plane) requests high-risk execution
//   -> Approval Layer creates pending checkpoint
//   -> Executive Desk reviews via nexus.executive.review
//   -> Executive approves or rejects via /approvals/:id/approve or /approvals/:id/reject
//   -> Decision Layer re-evaluates with approval state
//   -> Policy enforces; execution allowed only when approved

import { getCapabilitySummary, listCapabilities } from '../capabilities/resolver';

export interface ExecutiveReviewContext {
    tenant?: string;
    principal?: { actor: string; role: string };
}

export interface ExecutiveAction {
    actionId: string;
    command: string;
    tenant: string;
    requestedBy: string;
    status: 'pending' | 'approved' | 'rejected';
    oversightLevel: 'executive';
    submittedAt: string;
}

export interface CapabilityStatus {
    capabilityId: string;
    provider: string;
    type: string;
    endpoint: string;
    lifecycle: { status: string; registeredAt: string };
    governance: { evidenceRequired: boolean };
    authority: { minimumRole: string };
    healthEndpoint: string;
    version: string;
    providerHealth?: string;
}

export interface ProviderDriftSummary {
    provider: string;
    total: number;
    clean: boolean;
    driftedCapabilities: number;
    signals: string[];
    assessedAt: string;
}

export interface ExecutiveDesktopState {
    surface: 'executive';
    oversightActive: boolean;
    pendingActions: ExecutiveAction[];
    approvalRoute: string;
    rejectionRoute: string;
    auditRoute: string;
    capabilities: {
        summary: ReturnType<typeof getCapabilitySummary>;
        registeredProviders: string[];
        evidenceRequired: CapabilityStatus[];
    };
    crossProviderDrift: ProviderDriftSummary[];
}

function buildExecutiveState(overrides: Partial<ExecutiveDesktopState> = {}): ExecutiveDesktopState {
    const allCapabilities = listCapabilities();
    const evidenceRequired = allCapabilities.filter(
        (c: any) => c.governance && c.governance.evidenceRequired
    );
    const registeredProviders = Array.from(
        new Set(allCapabilities.map((c: any) => c.provider))
    ) as string[];

    // Build per-provider health summary for the cross-provider dashboard
    const crossProviderDrift: ProviderDriftSummary[] = registeredProviders.map((provider) => {
        const providerCaps = allCapabilities.filter((c: any) => c.provider === provider);
        const degraded = providerCaps.filter((c: any) => c.providerHealth === 'degraded').length;
        const unknown = providerCaps.filter((c: any) => c.providerHealth === 'unknown').length;
        const signals: string[] = [];
        if (degraded > 0) signals.push('health_degraded');
        if (unknown > 0) signals.push('health_unknown');
        return {
            provider,
            total: providerCaps.length,
            clean: signals.length === 0,
            driftedCapabilities: degraded,
            signals,
            assessedAt: new Date().toISOString()
        };
    });

    return {
        surface: 'executive',
        oversightActive: true,
        pendingActions: [],
        approvalRoute: '/approvals/:id/approve',
        rejectionRoute: '/approvals/:id/reject',
        auditRoute: '/v1/audit',
        capabilities: {
            summary: getCapabilitySummary(),
            registeredProviders,
            evidenceRequired: evidenceRequired as unknown as CapabilityStatus[]
        },
        crossProviderDrift,
        ...overrides
    };
}

async function reviewPendingActions(
    payload: Record<string, unknown> = {},
    context: ExecutiveReviewContext = {}
): Promise<{ success: boolean; data: ExecutiveDesktopState }> {
    const state = buildExecutiveState();

    return {
        success: true,
        data: state
    };
}

const executiveDeskHandlers = {
    'nexus.executive.review': reviewPendingActions
};

export const executiveDeskPlane = {
    name: 'executive',
    description: 'Executive Desk — oversight-only surface. Approves or rejects governed actions. Queries Capability Registry and Dock Manifests for governance decisions. Cannot initiate execution. Cross-provider governance dashboard active.',
    handlers: executiveDeskHandlers,
    oversightOnly: true,
    telemetryClass: 'executive.oversight',
    capabilityAware: true,
    crossProviderDashboard: true
};
