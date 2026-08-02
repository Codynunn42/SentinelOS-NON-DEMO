// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Executive Desk — Oversight Plane
//
// The Executive Desk is the oversight surface for SentinelOS.
// It can view, approve, and reject governed actions.
// It cannot initiate execution directly.
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

export interface ExecutiveDesktopState {
    surface: 'executive';
    oversightActive: boolean;
    pendingActions: ExecutiveAction[];
    approvalRoute: string;
    rejectionRoute: string;
    auditRoute: string;
}

function buildExecutiveState(overrides: Partial<ExecutiveDesktopState> = {}): ExecutiveDesktopState {
    return {
        surface: 'executive',
        oversightActive: true,
        pendingActions: [],
        approvalRoute: '/approvals/:id/approve',
        rejectionRoute: '/approvals/:id/reject',
        auditRoute: '/v1/audit',
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
    description: 'Executive Desk — oversight-only surface. Approves or rejects governed actions. Cannot initiate execution.',
    handlers: executiveDeskHandlers,
    oversightOnly: true,
    telemetryClass: 'executive.oversight'
};
