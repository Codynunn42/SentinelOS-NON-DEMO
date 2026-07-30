const { createPlanningHandler } = require('../../handlers/planningHandler');

function createPlanningRoute(dependencies = {}) {
  const handler = createPlanningHandler(dependencies);
  const {
    authenticateCommand,
    enforceRateLimit,
    readJsonBody,
    sendJson,
    emitSecurityEvent,
    normalizeCommandEnvelope
  } = dependencies;

  return function handlePlanningRoute(req, res, context = {}) {
    if (context.pathname !== '/api/v1/planning' || req.method !== 'POST') {
      return false;
    }

    const principal = authenticateCommand(req, '/api/v1/planning', res);
    if (!principal) {
      return true;
    }

    if (!enforceRateLimit(req, '/api/v1/planning', res, principal)) {
      return true;
    }

    readJsonBody(req, async (error, body) => {
      if (error) {
        emitSecurityEvent('planning.request.invalid_json', {
          route: '/api/v1/planning',
          method: req.method
        });

        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      return handler(body, {
        body,
        principal,
        req,
        res,
        route: '/api/v1/planning',
        normalizeCommandEnvelope
      });
    });

    return true;
  };
}

module.exports = {
  createPlanningRoute
};
