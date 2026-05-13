import { asText, asPositiveAmount } from '../shared/validation.js';

const SUPPORT_CHANNELS = new Set(['web', 'email', 'phone', 'chat', 'sms', 'internal']);

export function validateTicketCreate(payload: any = {}) {
    const customerId = asText(payload.customerId);
    const channel = asText(payload.channel).toLowerCase();
    const subject = asText(payload.subject);
    const description = asText(payload.description);
    const missing: string[] = [];

    if (!customerId) missing.push('customerId');
    if (!channel) missing.push('channel');
    if (!subject) missing.push('subject');
    if (!description) missing.push('description');

    if (missing.length) {
        return { ok: false, error: 'Required fields missing', required: missing };
    }

    if (!SUPPORT_CHANNELS.has(channel)) {
        return {
            ok: false,
            error: 'Unsupported support channel',
            required: ['web', 'email', 'phone', 'chat', 'sms', 'internal']
        };
    }

    return {
        ok: true,
        value: {
            customerId,
            channel,
            subject,
            description,
            priority: asText(payload.priority).toLowerCase() || 'normal',
            externalRef: asText(payload.externalRef) || null
        }
    };
}

export function validateRefundRequest(payload: any = {}) {
    const ticketId = asText(payload.ticketId);
    const reason = asText(payload.reason);
    const amount = asPositiveAmount(payload.amount);
    const missing: string[] = [];

    if (!ticketId) missing.push('ticketId');
    if (amount === null) missing.push('amount');
    if (!reason) missing.push('reason');

    if (missing.length) {
        return { ok: false, error: 'Required fields missing', required: missing };
    }

    return {
        ok: true,
        value: {
            ticketId,
            amount,
            reason,
            currency: asText(payload.currency).toUpperCase() || 'USD',
            customerId: asText(payload.customerId) || null
        }
    };
}