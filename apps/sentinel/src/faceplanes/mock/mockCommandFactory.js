// Mock Command Factory
// Purpose: Build realistic governed command envelopes for synthetic faceplane operations.
// All commands are sandboxed. No real external integrations are called.

const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomCreditScore() {
  return Math.floor(Math.random() * 350) + 450; // 450–800
}

// OwnerFi commands — financial governance pressure
const OWNERFI_COMMANDS = [
  () => ({
    tenant: 'ownerfi-mock',
    command: 'application.submit',
    payload: {
      name: `Mock Applicant ${uuid().slice(0, 6)}`,
      vehicle: pick(['2021 Toyota Camry', '2019 Honda Civic', '2022 Ford F-150', '2020 Chevy Silverado']),
      amount: randomAmount(8000, 45000),
      creditScore: randomCreditScore()
    },
    metadata: { actor: 'mock-agent@ownerfi.local', role: 'operator' }
  }),
  () => ({
    tenant: 'ownerfi-mock',
    command: 'application.evaluate',
    payload: { applicationId: `app_mock_${uuid().slice(0, 8)}` },
    metadata: { actor: 'mock-agent@ownerfi.local', role: 'operator' }
  }),
  () => ({
    tenant: 'ownerfi-mock',
    command: 'deal.execute',
    payload: { applicationId: `app_mock_${uuid().slice(0, 8)}` },
    metadata: { actor: 'mock-approver@ownerfi.local', role: 'approver' }
  }),
  () => ({
    tenant: 'ownerfi-mock',
    command: 'support.refund.request',
    payload: {
      customerId: `cust_${uuid().slice(0, 8)}`,
      amount: randomAmount(10, 500),
      reason: pick(['duplicate charge', 'service not rendered', 'billing error', 'customer dispute'])
    },
    metadata: { actor: 'mock-support@ownerfi.local', role: 'operator', scopes: ['support:refund'] }
  })
];

// HotelOps commands — high-frequency operational routing
const HOTELOPS_COMMANDS = [
  () => ({
    tenant: 'hotelops-mock',
    command: 'room.maintenance.escalate',
    payload: {
      roomId: `room_${Math.floor(Math.random() * 500) + 100}`,
      issue: pick(['HVAC failure', 'plumbing leak', 'electrical fault', 'elevator outage']),
      priority: pick(['low', 'medium', 'high'])
    },
    metadata: { actor: 'mock-ops@hotelops.local', role: 'operator' }
  }),
  () => ({
    tenant: 'hotelops-mock',
    command: 'booking.override',
    payload: {
      bookingId: `bk_${uuid().slice(0, 8)}`,
      reason: pick(['overbooking', 'system error', 'VIP request', 'emergency relocation']),
      authorizedBy: 'mock-manager@hotelops.local'
    },
    metadata: { actor: 'mock-manager@hotelops.local', role: 'operator' }
  }),
  () => ({
    tenant: 'hotelops-mock',
    command: 'occupancy.spike.alert',
    payload: {
      propertyId: `prop_${Math.floor(Math.random() * 20) + 1}`,
      occupancyRate: Math.floor(Math.random() * 30) + 70,
      threshold: 85
    },
    metadata: { actor: 'mock-system@hotelops.local', role: 'operator' }
  })
];

// ITAD commands — compliance-heavy workflow simulation
const ITAD_COMMANDS = [
  () => ({
    tenant: 'itad-mock',
    command: 'asset.custody.transfer',
    payload: {
      assetId: `asset_${uuid().slice(0, 8)}`,
      fromCustodian: `custodian_${Math.floor(Math.random() * 10) + 1}`,
      toCustodian: `custodian_${Math.floor(Math.random() * 10) + 11}`,
      assetType: pick(['laptop', 'server', 'mobile device', 'storage array', 'network switch'])
    },
    metadata: { actor: 'mock-compliance@itad.local', role: 'operator' }
  }),
  () => ({
    tenant: 'itad-mock',
    command: 'asset.wipe.verify',
    payload: {
      assetId: `asset_${uuid().slice(0, 8)}`,
      wipeMethod: pick(['DoD 5220.22-M', 'NIST 800-88', 'Gutmann', 'Secure Erase']),
      verifiedBy: 'mock-auditor@itad.local',
      certificateId: `cert_${uuid().slice(0, 8)}`
    },
    metadata: { actor: 'mock-auditor@itad.local', role: 'operator' }
  }),
  () => ({
    tenant: 'itad-mock',
    command: 'compliance.audit.submit',
    payload: {
      auditId: `audit_${uuid().slice(0, 8)}`,
      scope: pick(['quarterly', 'annual', 'incident-triggered', 'regulatory']),
      assetCount: Math.floor(Math.random() * 500) + 10,
      complianceFramework: pick(['SOC2', 'ISO27001', 'NIST', 'HIPAA'])
    },
    metadata: { actor: 'mock-compliance@itad.local', role: 'operator' }
  })
];

function buildCommand(faceplane) {
  switch (faceplane) {
    case 'ownerfi': return pick(OWNERFI_COMMANDS)();
    case 'hotelops': return pick(HOTELOPS_COMMANDS)();
    case 'itad': return pick(ITAD_COMMANDS)();
    default: return pick(OWNERFI_COMMANDS)();
  }
}

function buildCommandBatch(faceplane, count = 5) {
  return Array.from({ length: count }, () => buildCommand(faceplane));
}

module.exports = {
  buildCommand,
  buildCommandBatch,
  OWNERFI_COMMANDS,
  HOTELOPS_COMMANDS,
  ITAD_COMMANDS
};
