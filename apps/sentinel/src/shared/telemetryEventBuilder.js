const { normalizeSeverity } = require('../telemetry/telemetrySchema');

function buildBaseTelemetryEvent(overrides = {}) {
    return {
        source: 'sentinel-api',
        category: 'governance',
        timestamp: new Date().toISOString(),
        ...overrides
    };
}

function buildBlockedPathEvent(envelope = {}, reason, details = {}) {
    const actor = (envelope.metadata && envelope.metadata.actor) || null;
    const command = envelope.command || envelope.legacyCommand || 'unknown';

    return buildBaseTelemetryEvent({
        eventType: 'blocked-path',
        command,
        tenant: envelope.tenant || null,
        actor,
        reason,
        trustScore: typeof details.trustScore === 'number' ? details.trustScore : 0,
        blockingPolicy: details.blockingPolicy || null,
        executionPath: details.executionPath || null,
        severity: normalizeSeverity(details.severity || 'warning'),
        ...details
    });
}

module.exports = {
    buildBlockedPathEvent,
    buildBaseTelemetryEvent
};
