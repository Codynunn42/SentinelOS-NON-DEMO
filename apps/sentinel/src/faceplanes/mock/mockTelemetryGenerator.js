// Mock Telemetry Generator
// Purpose: Generate realistic telemetry activity payloads for synthetic faceplane operations.

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const OWNERFI_ACTIVITIES = [
  { type: 'workflow.metrics', name: 'Application intake metrics' },
  { type: 'deal.execution', name: 'Deal execution event', approvalRequired: true },
  { type: 'billing.checkout', name: 'Billing checkout attempt', approvalRequired: true },
  { type: 'audit.summary', name: 'Audit summary export' },
  { type: 'telemetry.export.external', name: 'External telemetry export', approvalRequired: true }
];

const HOTELOPS_ACTIVITIES = [
  { type: 'workflow.metrics', name: 'Occupancy metrics' },
  { type: 'workflow.metrics', name: 'Maintenance queue metrics' },
  { type: 'workflow.metrics', name: 'Booking override metrics' },
  { type: 'audit.summary', name: 'Property audit summary' }
];

const ITAD_ACTIVITIES = [
  { type: 'audit.summary', name: 'Asset chain-of-custody audit' },
  { type: 'workflow.metrics', name: 'Wipe verification metrics' },
  { type: 'telemetry.export.external', name: 'Compliance report export', approvalRequired: true },
  { type: 'deal.execution', name: 'Asset disposal execution', approvalRequired: true }
];

function buildTelemetryActivities(faceplane, count = 4) {
  let pool;
  switch (faceplane) {
    case 'ownerfi': pool = OWNERFI_ACTIVITIES; break;
    case 'hotelops': pool = HOTELOPS_ACTIVITIES; break;
    case 'itad': pool = ITAD_ACTIVITIES; break;
    default: pool = OWNERFI_ACTIVITIES;
  }

  return Array.from({ length: count }, () => ({
    ...pick(pool),
    riskLevel: pick(['low', 'medium', 'high']),
    tenant: `${faceplane}-mock`
  }));
}

function buildTelemetryPayload(faceplane, options = {}) {
  return {
    telemetryState: options.telemetryState || 'LIMITED',
    tenant: `${faceplane}-mock`,
    activities: buildTelemetryActivities(faceplane, options.activityCount || 4)
  };
}

module.exports = {
  buildTelemetryActivities,
  buildTelemetryPayload
};
