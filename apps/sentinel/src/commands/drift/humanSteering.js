const { get, save, updateStatus } = require('../../drift/driftStore');
const { isForkTargetAllowed } = require('../../drift/driftPolicies');

const ACTIONS = Object.freeze({
  accept: 'accept',
  hold: 'hold',
  reject: 'reject',
  redirect: 'redirect',
  modify: 'modify'
});

const STATUS_BY_ACTION = Object.freeze({
  accept: 'approved',
  hold: 'pending_approval',
  reject: 'rejected',
  redirect: 'pending_approval',
  modify: 'pending_approval'
});

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAction(value) {
  const action = text(value).toLowerCase();
  return ACTIONS[action] || null;
}

function validateProposedFork(proposedFork) {
  if (!proposedFork) {
    return { ok: true };
  }

  if (!Array.isArray(proposedFork.targetFiles) || proposedFork.targetFiles.length === 0) {
    return {
      ok: false,
      reason: 'TARGET_FILES_REQUIRED'
    };
  }

  const blockedTargets = proposedFork.targetFiles.filter((target) => !isForkTargetAllowed(target));
  if (blockedTargets.length) {
    return {
      ok: false,
      reason: 'FORK_TARGET_NOT_ALLOWED',
      blockedTargets
    };
  }

  return { ok: true };
}

function buildInstructionRecord({
  recommendation,
  action,
  humanInput,
  operator,
  proposedFork,
  modifiedRecommendation,
  status
}) {
  return {
    action,
    status,
    operator: operator || 'unknown',
    humanInput,
    previousStatus: recommendation.status,
    previousRecommendation: {
      recommendedAction: recommendation.recommendedAction,
      proposedFork: recommendation.proposedFork || null
    },
    modifiedRecommendation: modifiedRecommendation || null,
    proposedFork: proposedFork || recommendation.proposedFork || null,
    instructedAt: new Date().toISOString()
  };
}

async function handleDriftRecommendationInstruction(payload = {}, context = {}) {
  const recommendationId = text(payload.recommendationId);
  const action = normalizeAction(payload.action);
  const humanInput = text(payload.humanInput || payload.instruction);
  const operator =
    (context.principal && context.principal.actor) ||
    text(payload.operator) ||
    'unknown';

  if (!recommendationId) {
    return {
      success: false,
      statusCode: 400,
      error: 'RECOMMENDATION_ID_REQUIRED'
    };
  }

  if (!action) {
    return {
      success: false,
      statusCode: 400,
      error: 'VALID_ACTION_REQUIRED',
      details: {
        allowedActions: Object.keys(ACTIONS)
      }
    };
  }

  if (!humanInput) {
    return {
      success: false,
      statusCode: 400,
      error: 'HUMAN_INPUT_REQUIRED'
    };
  }

  const recommendation = get(recommendationId);
  if (!recommendation) {
    return {
      success: false,
      statusCode: 404,
      error: 'RECOMMENDATION_NOT_FOUND',
      details: { recommendationId }
    };
  }

  const proposedFork = payload.proposedFork && typeof payload.proposedFork === 'object'
    ? payload.proposedFork
    : recommendation.proposedFork || null;
  const forkValidation = validateProposedFork(proposedFork);

  if (!forkValidation.ok) {
    return {
      success: false,
      statusCode: 403,
      error: forkValidation.reason,
      details: {
        recommendationId,
        blockedTargets: forkValidation.blockedTargets || []
      }
    };
  }

  const modifiedRecommendation = payload.modifiedRecommendation && typeof payload.modifiedRecommendation === 'object'
    ? payload.modifiedRecommendation
    : null;
  const status = STATUS_BY_ACTION[action];
  const resolution = buildInstructionRecord({
    recommendation,
    action,
    humanInput,
    operator,
    proposedFork,
    modifiedRecommendation,
    status
  });
  const updated = updateStatus(recommendationId, status, resolution);
  const instructed = {
    ...updated,
    recommendedAction:
      modifiedRecommendation && text(modifiedRecommendation.recommendedAction)
        ? text(modifiedRecommendation.recommendedAction)
        : updated.recommendedAction,
    proposedFork
  };

  save(instructed);

  return {
    success: true,
    statusCode: 200,
    data: {
      result: {
        status: 'instruction_recorded',
        recommendationId,
        action,
        recommendationStatus: instructed.status,
        humanInput,
        operator,
        proposedFork: instructed.proposedFork,
        requiresHumanApproval: instructed.requiresHumanApproval !== false,
        instruction: resolution
      }
    }
  };
}

module.exports = {
  ACTIONS,
  handleDriftRecommendationInstruction,
  validateProposedFork
};
