const SUPPORT_CHANNELS = new Set(['web', 'email', 'phone', 'chat', 'sms', 'internal']);

function asText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asPositiveAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function validateTicketCreate(payload = {}) {
  const customerId = asText(payload.customerId);
  const channel = asText(payload.channel).toLowerCase();
  const subject = asText(payload.subject);
  const description = asText(payload.description);
  const missing = [];

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

function validateRefundRequest(payload = {}) {
  const ticketId = asText(payload.ticketId);
  const reason = asText(payload.reason);
  const amount = asPositiveAmount(payload.amount);
  const missing = [];

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

module.exports = {
  validateRefundRequest,
  validateTicketCreate
};
