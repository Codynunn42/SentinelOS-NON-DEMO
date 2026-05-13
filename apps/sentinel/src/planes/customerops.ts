import { validateRefundRequest, validateTicketCreate } from '../schemas/customerops';
import { generateId } from '../shared/idGenerator.js';

interface TicketCreatePayload {
    customerId: string;
    channel: string;
    subject: string;
    description: string;
    priority?: string;
    externalRef?: string;
}

interface RefundRequestPayload {
    ticketId: string;
    amount: number;
    reason: string;
    currency?: string;
    customerId?: string;
}

interface Context {
    tenant?: string;
    principal?: { actor: string };
    buildReceipt: (event: string, entity: any, data: any, tenant: string) => any;
    emitSecurityEvent: (event: string, data: any) => void;
}

interface Envelope {
    command: string;
    payload: any;
    metadata?: { actor: string };
    tenant?: string;
}

function generateId(prefix: string): string {
    return `${prefix}_${crypto.randomUUID()}`;
}

function validationFailure(result: any) {
    return {
        success: false,
        statusCode: 400,
        error: result.error,
        details: { required: result.required }
    };
}

function getActor(context: Context = {}, envelope: Envelope = {}): string {
    return (
        (context.principal && context.principal.actor) ||
        (envelope.metadata && envelope.metadata.actor) ||
        'unknown'
    );
}

async function createTicket(payload: TicketCreatePayload, context: Context = {}, envelope: Envelope = {}) {
    const validation = validateTicketCreate(payload);

    if (!validation.ok) {
        return validationFailure(validation);
    }

    const tenant = context.tenant || envelope.tenant || 'support';
    const ticketId = generateId('ticket');
    const timestamp = new Date().toISOString();
    const ticket = {
        ticketId,
        status: 'created',
        assignedQueue: validation.value.priority === 'urgent' ? 'priority-support' : 'customer-support',
        ...validation.value,
        createdBy: getActor(context, envelope),
        createdAt: timestamp
    };
    const receipt = context.buildReceipt(
        `${tenant}.support.ticket.create`,
        { type: 'support_ticket', id: ticketId },
        {
            ticketId,
            status: ticket.status,
            channel: ticket.channel,
            tenant
        },
        tenant
    );

    context.emitSecurityEvent('customerops.support.ticket.created', {
        route: '/v1/command',
        command: envelope.command || 'support.ticket.create',
        receiptId: receipt.receiptId,
        auditId: receipt.auditId,
        ticketId,
        tenant
    });

    return {
        success: true,
        statusCode: 201,
        data: {
            result: ticket,
            ticketId,
            ticketStatus: ticket.status,
            receipt
        }
    };
}

async function requestRefund(payload: RefundRequestPayload, context: Context = {}, envelope: Envelope = {}) {
    const validation = validateRefundRequest(payload);

    if (!validation.ok) {
        return validationFailure(validation);
    }

    const tenant = context.tenant || envelope.tenant || 'support';
    const refundRequestId = generateId('refund_req');
    const timestamp = new Date().toISOString();
    const approvalRequired = validation.value.amount >= 25;
    const refundRequest = {
        refundRequestId,
        status: approvalRequired ? 'approval_required' : 'created',
        approvalRequired,
        ...validation.value,
        requestedBy: getActor(context, envelope),
        createdAt: timestamp
    };
    const receipt = context.buildReceipt(
        `${tenant}.support.refund.request`,
        { type: 'support_refund_request', id: refundRequestId },
        {
            refundRequestId,
            status: refundRequest.status,
            amount: refundRequest.amount,
            currency: refundRequest.currency,
            approvalRequired,
            tenant
        },
        tenant
    );

    context.emitSecurityEvent('customerops.support.refund.requested', {
        route: '/v1/command',
        command: envelope.command || 'support.refund.request',
        receiptId: receipt.receiptId,
        auditId: receipt.auditId,
        refundRequestId,
        amount: refundRequest.amount,
        approvalRequired,
        tenant
    });

    const data = {
        result: refundRequest,
        refundRequestId,
        refundStatus: refundRequest.status,
        approvalRequired,
        receipt
    };

    if (approvalRequired) {
        return {
            success: false,
            statusCode: 403,
            error: 'APPROVAL_REQUIRED',
            details: {
                reason: 'support_refund_requires_approval',
                amount: refundRequest.amount,
                threshold: 25
            },
            data
        };
    }

    return {
        success: true,
        statusCode: 202,
        data
    };
}

const customerOpsHandlers = {
    'support.ticket.create': createTicket,
    'ticket.create': createTicket,
    'support.refund.request': requestRefund,
    'refund.request': requestRefund
};

export const customerOpsPlane = {
    name: 'customerops',
    handlers: customerOpsHandlers
};