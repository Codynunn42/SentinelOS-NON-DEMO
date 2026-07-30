const {
  LifecycleConflictError,
  LifecycleError
} = require('../../sentinel/src/lifecycle/lifecycleErrors');
const { planCommand } = require('../../sentinel/src/lifecycle/planningService');

function createPlanningHandler(dependencies = {}) {
  const {
    sendJson,
    emitSecurityEvent
  } = dependencies;

  return async function handlePlanning(body, context = {}) {
    try {
      const result = await planCommand(body, {
        principal: context.principal,
        normalizeCommandEnvelope: context.normalizeCommandEnvelope,
        route: context.route
      });

      return sendJson(context.res, result.statusCode, result.payload);
    } catch (error) {
      if (error instanceof LifecycleConflictError) {
        return sendJson(context.res, 409, {
          status: 'blocked',
          error: error.details && error.details.error ? error.details.error : 'PLANNING_CONFLICT',
          state: 'FAILED',
          commandId: context.body && context.body.commandId ? context.body.commandId : null,
          idempotencyKey: context.body && context.body.idempotencyKey ? context.body.idempotencyKey : null
        });
      }

      if (error instanceof LifecycleError) {
        return sendJson(context.res, 400, {
          status: 'blocked',
          error: error.message,
          state: 'FAILED',
          details: error.details || {}
        });
      }

      emitSecurityEvent('planning.request.failed', {
        route: context.route,
        method: context.req.method,
        reason: error instanceof Error ? error.message : 'Unknown planning failure'
      });

      return sendJson(context.res, 500, {
        status: 'error',
        error: 'PLANNING_REQUEST_FAILED'
      });
    }
  };
}

module.exports = {
  createPlanningHandler
};
