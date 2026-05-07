const crypto = require('crypto');
const { ownerfiStore } = require('../store/ownerfiStore');
const { handleTelemetryCommand } = require('../telemetry/telemetryController');

function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function buildMissingFieldResult(required) {
  return {
    success: false,
    statusCode: 400,
    error: 'Required fields missing',
    details: { required }
  };
}

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(asTrimmedString).filter(Boolean);
}

function normalizeTargetWindows(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((window) => {
      if (!window || typeof window !== 'object') {
        return null;
      }

      const start = Number(window.start);
      const end = Number(window.end);
      const reason = asTrimmedString(window.reason);

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return null;
      }

      return {
        start,
        end,
        reason: reason || 'facial feature distortion'
      };
    })
    .filter(Boolean);
}

async function createMediaPolishManifest(payload, context, envelope = {}) {
  const tenant = context.tenant || 'ownerfi';
  const sourceVideo = asTrimmedString(payload.sourceVideo);
  const referenceFace = asTrimmedString(payload.referenceFace);
  const instruction = asTrimmedString(payload.instruction);
  const targetWindows = normalizeTargetWindows(payload.targetWindows);
  const targetStills = normalizeStringList(payload.targetStills);

  if (!sourceVideo || !referenceFace || targetWindows.length === 0) {
    return buildMissingFieldResult(['sourceVideo', 'referenceFace', 'targetWindows']);
  }

  const polishId = generateId('media_polish');
  const timestamp = new Date().toISOString();
  const command = envelope.command || 'media.polish';
  const manifest = {
    polishId,
    status: 'manifest_created',
    executionMode: 'operator_assisted',
    sourceVideo,
    referenceFace,
    instruction:
      instruction ||
      'Restore distorted facial features back to the model-approved reference likeness.',
    targetWindows,
    targetStills,
    constraints: [
      'preserve model identity from provided reference',
      'avoid synthetic face drift during turn frames',
      'keep edits consent-based and auditable'
    ],
    nextAction:
      'Use the manifest to drive frame-level face polish, then attach the final MP4 receipt.',
    createdAt: timestamp
  };

  const receipt = context.buildReceipt(
    `${tenant}.${command}`,
    { type: 'media_polish', id: polishId },
    {
      polishId,
      status: manifest.status,
      targetWindowCount: targetWindows.length,
      targetStillCount: targetStills.length,
      tenant
    },
    tenant
  );

  context.emitSecurityEvent(`${tenant}.media.polish.manifested`, {
    route: '/v1/command',
    command: `${tenant}.${command}`,
    receiptId: receipt.receiptId,
    auditId: receipt.auditId,
    polishId,
    targetWindowCount: targetWindows.length,
    targetStillCount: targetStills.length,
    tenant
  });

  return {
    success: true,
    statusCode: 200,
    data: {
      result: manifest,
      polishId,
      status: manifest.status,
      receipt
    }
  };
}

const ownerfiHandlers = {
  'media.polish': createMediaPolishManifest,
  'sentinel.media.polish': createMediaPolishManifest,

  'telemetry.harmonize': async (payload, context) => {
    const result = handleTelemetryCommand(
      {
        ...payload,
        tenant: context.tenant || payload.tenant || 'ownerfi'
      },
      context.principal || {}
    );

    return {
      success: true,
      statusCode: 200,
      data: {
        result,
        telemetry: result.result
      }
    };
  },

  'application.submit': async (payload, context) => {
    const tenant = context.tenant || 'ownerfi';
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const vehicle = typeof payload.vehicle === 'string' ? payload.vehicle.trim() : '';
    const amount = Number(payload.amount);
    const creditScore = Number(payload.creditScore);

    if (!name || !vehicle || !Number.isFinite(amount) || !Number.isFinite(creditScore)) {
      return buildMissingFieldResult(['name', 'vehicle', 'amount', 'creditScore']);
    }

    const applicationId = generateId('app');
    const timestamp = new Date().toISOString();

    const application = await ownerfiStore.createApplication({
      applicationId,
      tenantId: tenant,
      name,
      vehicle,
      amount,
      creditScore,
      status: 'submitted',
      createdAt: timestamp,
      updatedAt: timestamp
    });

    const receipt = context.buildReceipt(
      `${tenant}.application.submit`,
      { type: 'application', id: applicationId },
      { applicationId, status: application.status, tenant },
      tenant
    );

    context.emitSecurityEvent(`${tenant}.application.submitted`, {
      route: '/v1/command',
      command: `${tenant}.application.submit`,
      receiptId: receipt.receiptId,
      auditId: receipt.auditId,
      applicationId,
      tenant
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        result: {
          applicationId,
          status: application.status
        },
        applicationId,
        applicationStatus: application.status,
        receipt
      }
    };
  },

  'deal.submit': async (payload, context) => {
    const tenant = context.tenant || 'ownerfi';
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const vehicle = typeof payload.vehicle === 'string' ? payload.vehicle.trim() : '';
    const amount = Number(payload.amount);
    const creditScore = Number(payload.creditScore);

    if (!name || !vehicle || !Number.isFinite(amount) || !Number.isFinite(creditScore)) {
      return buildMissingFieldResult(['name', 'vehicle', 'amount', 'creditScore']);
    }

    const applicationId = generateId('app');
    const timestamp = new Date().toISOString();

    const application = await ownerfiStore.createApplication({
      applicationId,
      tenantId: tenant,
      name,
      vehicle,
      amount,
      creditScore,
      status: 'submitted',
      createdAt: timestamp,
      updatedAt: timestamp
    });

    const receipt = context.buildReceipt(
      `${tenant}.deal.submit`,
      { type: 'application', id: applicationId },
      { applicationId, status: application.status, tenant },
      tenant
    );

    context.emitSecurityEvent(`${tenant}.deal.submitted`, {
      route: '/v1/command',
      command: `${tenant}.deal.submit`,
      receiptId: receipt.receiptId,
      auditId: receipt.auditId,
      applicationId,
      tenant
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        result: {
          applicationId,
          status: application.status
        },
        applicationId,
        applicationStatus: application.status,
        receipt
      }
    };
  },

  'application.evaluate': async (payload, context) => {
    const tenant = context.tenant || 'ownerfi';
    const applicationId =
      typeof payload.applicationId === 'string' ? payload.applicationId.trim() : '';

    if (!applicationId) {
      return {
        success: false,
        statusCode: 400,
        error: 'Application ID is required',
        details: { required: ['applicationId'] }
      };
    }

    const application = ownerfiStore.getApplication(applicationId, tenant);
    if (!application) {
      return {
        success: false,
        statusCode: 404,
        error: 'Application not found',
        details: { required: ['applicationId'] }
      };
    }

    const status = application.creditScore > 650 ? 'approved' : 'review';
    const updated = await ownerfiStore.updateApplication(application.applicationId, {
      status,
      updatedAt: new Date().toISOString()
    });

    const receipt = context.buildReceipt(
      `${tenant}.application.evaluate`,
      { type: 'application', id: applicationId },
      {
        applicationId,
        status: updated.status,
        rule: 'creditScore > 650 approves; otherwise review',
        tenant
      },
      tenant
    );

    context.emitSecurityEvent(`${tenant}.application.${updated.status}`, {
      route: '/v1/command',
      command: `${tenant}.application.evaluate`,
      receiptId: receipt.receiptId,
      auditId: receipt.auditId,
      applicationId,
      creditScore: updated.creditScore,
      tenant
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        result: {
          applicationId,
          status: updated.status
        },
        applicationId,
        applicationStatus: updated.status,
        receipt
      }
    };
  },

  'deal.approve': async (payload, context) => {
    const tenant = context.tenant || 'ownerfi';
    const applicationId =
      typeof payload.applicationId === 'string' ? payload.applicationId.trim() : '';

    if (!applicationId) {
      return {
        success: false,
        statusCode: 400,
        error: 'Application ID is required',
        details: { required: ['applicationId'] }
      };
    }

    const application = ownerfiStore.getApplication(applicationId, tenant);
    if (!application) {
      return {
        success: false,
        statusCode: 404,
        error: 'Application not found',
        details: { required: ['applicationId'] }
      };
    }

    const updated = await ownerfiStore.updateApplication(application.applicationId, {
      status: 'approved',
      updatedAt: new Date().toISOString()
    });

    const receipt = context.buildReceipt(
      `${tenant}.deal.approve`,
      { type: 'application', id: applicationId },
      { applicationId, status: updated.status, tenant },
      tenant
    );

    context.emitSecurityEvent(`${tenant}.deal.approved`, {
      route: '/v1/command',
      command: `${tenant}.deal.approve`,
      receiptId: receipt.receiptId,
      auditId: receipt.auditId,
      applicationId,
      tenant
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        result: {
          applicationId,
          status: updated.status
        },
        applicationId,
        applicationStatus: updated.status,
        receipt
      }
    };
  },

  'deal.execute': async (payload, context) => {
    const tenant = context.tenant || 'ownerfi';
    const applicationId =
      typeof payload.applicationId === 'string' ? payload.applicationId.trim() : '';

    if (!applicationId) {
      return {
        success: false,
        statusCode: 400,
        error: 'Application ID is required',
        details: { required: ['applicationId'] }
      };
    }

    const application = ownerfiStore.getApplication(applicationId, tenant);
    if (!application) {
      return {
        success: false,
        statusCode: 404,
        error: 'Application not found',
        details: { required: ['applicationId'] }
      };
    }

    if (application.status !== 'approved') {
      return {
        success: false,
        statusCode: 409,
        error: 'Application must be approved before deal execution',
        data: {
          applicationId,
          applicationStatus: application.status
        }
      };
    }

    const timestamp = new Date().toISOString();
    const dealId = generateId('deal');
    const deal = await ownerfiStore.createDeal({
      dealId,
      tenantId: tenant,
      applicationId,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp
    });

    const receipt = context.buildReceipt(
      `${tenant}.deal.execute`,
      { type: 'deal', id: dealId },
      { applicationId, dealId, status: deal.status, tenant },
      tenant
    );

    context.emitSecurityEvent(`${tenant}.deal.active`, {
      route: '/v1/command',
      command: `${tenant}.deal.execute`,
      receiptId: receipt.receiptId,
      auditId: receipt.auditId,
      applicationId,
      dealId,
      tenant
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        result: {
          dealId,
          status: deal.status
        },
        applicationId,
        dealId,
        dealStatus: deal.status,
        receipt
      }
    };
  }
};

module.exports = {
  ownerfiHandlers
};
