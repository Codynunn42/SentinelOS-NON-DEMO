const { routeFixtureRetrieval } = require('../../integrations/retrieval/nexusFixtureRouter');
const { auditLogger } = require('../../audit/auditLogger');

const EXACT_FIXTURE_REQUEST = {
  capsuleId: 'NAV-TASKS',
  resource: 'logs',
  order: 'latest',
  limit: 10,
  mode: 'fixture_only'
};

function isExactFixtureRequest(payload = {}) {
  const expectedKeys = Object.keys(EXACT_FIXTURE_REQUEST).sort();
  const receivedKeys = Object.keys(payload).sort();

  return (
    expectedKeys.length === receivedKeys.length &&
    expectedKeys.every((key, index) => key === receivedKeys[index]) &&
    Object.entries(EXACT_FIXTURE_REQUEST).every(([key, value]) => payload[key] === value)
  );
}

async function handleVaultRetrieveFixture(payload = {}, context = {}, envelope = {}) {
  if (process.env.SENTINEL_FIXTURE_RETRIEVAL_POC_ENABLED !== 'true') {
    return {
      success: false,
      statusCode: 403,
      error: 'FIXTURE_RETRIEVAL_POC_DISABLED'
    };
  }

  if (!isExactFixtureRequest(payload)) {
    return {
      success: false,
      statusCode: 403,
      error: 'FIXTURE_RETRIEVAL_SCOPE_DENIED',
      details: {
        allowedCapsule: EXACT_FIXTURE_REQUEST.capsuleId,
        allowedResource: EXACT_FIXTURE_REQUEST.resource,
        maximumLimit: EXACT_FIXTURE_REQUEST.limit,
        requiredMode: EXACT_FIXTURE_REQUEST.mode
      }
    };
  }

  const routed = routeFixtureRetrieval({
    command: 'vault.retrieve',
    ...payload
  });

  if (!routed.success) {
    return routed;
  }

  await auditLogger.log({
    correlationId: envelope.correlationId || null,
    tenant: envelope.tenant || context.tenant || 'nunncloud',
    command: 'vault.retrieve.fixture.access',
    payload: {
      capsuleId: payload.capsuleId,
      resource: payload.resource,
      mode: payload.mode,
      requestId: envelope.commandId || null
    },
    result: {
      success: true,
      resultCount: routed.data.resultCount,
      recordsIncluded: false
    },
    actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : undefined
  });

  return {
    success: true,
    data: {
      integration: 'fixture_only_controlled_retrieval_poc',
      capsuleId: payload.capsuleId,
      resource: payload.resource,
      mode: payload.mode,
      records: routed.data.records,
      resultCount: routed.data.resultCount,
      route: [
        'Sentinel_approval',
        'Nexus_fixture_router',
        routed.data.fixtureRole,
        'Vault_fixture_adapter',
        'audit_log_creation'
      ],
      isolation: {
        networkAccess: false,
        externalConnector: false,
        productionVault: false,
        writes: false
      }
    }
  };
}

module.exports = {
  EXACT_FIXTURE_REQUEST,
  handleVaultRetrieveFixture,
  isExactFixtureRequest
};
