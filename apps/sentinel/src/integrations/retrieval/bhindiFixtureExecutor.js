const { retrieveNavTasksLogs } = require('./vaultFixtureAdapter');

function executeFixtureRetrieval(operation = {}) {
  if (
    operation.type !== 'read' ||
    operation.capsuleId !== 'NAV-TASKS' ||
    operation.resource !== 'logs' ||
    operation.order !== 'latest' ||
    operation.limit !== 10
  ) {
    return {
      success: false,
      statusCode: 403,
      error: 'FIXTURE_RETRIEVAL_SCOPE_DENIED'
    };
  }

  const records = retrieveNavTasksLogs({ limit: operation.limit });

  return {
    success: true,
    data: {
      records,
      resultCount: records.length,
      fixtureRole: 'Bhindi_fixture_executor'
    }
  };
}

module.exports = {
  executeFixtureRetrieval
};
