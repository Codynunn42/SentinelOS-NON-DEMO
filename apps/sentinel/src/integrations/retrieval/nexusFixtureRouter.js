const { executeFixtureRetrieval } = require('./bhindiFixtureExecutor');

function routeFixtureRetrieval(request = {}) {
  if (
    request.command !== 'vault.retrieve' ||
    request.mode !== 'fixture_only'
  ) {
    return {
      success: false,
      statusCode: 403,
      error: 'FIXTURE_ROUTE_DENIED'
    };
  }

  return executeFixtureRetrieval({
    type: 'read',
    capsuleId: request.capsuleId,
    resource: request.resource,
    order: request.order,
    limit: request.limit
  });
}

module.exports = {
  routeFixtureRetrieval
};
