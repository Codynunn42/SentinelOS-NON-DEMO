const { hasText, isRecord } = require('../shared/validation');

function parseCommandToken(value, label = 'command') {
  const trimmed = value.trim();
  const parts = trimmed.split('.');

  if (parts.some((part) => !hasText(part))) {
    throw new Error(`${label} must not contain empty path segments`);
  }

  if (parts.length === 1) {
    return {
      entity: 'system',
      action: parts[0],
      intent: `system.${parts[0]}`,
      isQualified: false
    };
  }

  return {
    entity: parts.slice(0, -1).join('.'),
    action: parts[parts.length - 1],
    intent: `${parts.slice(0, -1).join('.')}.${parts[parts.length - 1]}`,
    isQualified: true
  };
}

function normalizeControlInput(input = {}, principal = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};

  if (source.actor !== undefined && source.actor !== null && (typeof source.actor !== 'object' || Array.isArray(source.actor))) {
    throw new Error('Malformed actor payload');
  }
  if (source.metadata !== undefined && !isRecord(source.metadata)) {
    throw new Error('Metadata must be an object');
  }
  if (source.context !== undefined && !isRecord(source.context)) {
    throw new Error('Context must be an object');
  }
  if (source.payload !== undefined && !isRecord(source.payload)) {
    throw new Error('Context must be an object');
  }

  const explicitEntity = hasText(source.entity) ? source.entity.trim() : '';
  const explicitAction = hasText(source.action) ? source.action.trim() : '';
  const explicitIntent = hasText(source.intent) ? source.intent.trim() : '';
  const explicitCommand = hasText(source.command) ? source.command.trim() : '';

  let entity = explicitEntity || 'system';
  let action = explicitAction || '';
  let intent = explicitIntent || '';

  const parsedIntent = hasText(explicitIntent) ? parseCommandToken(explicitIntent, 'intent') : null;
  const parsedCommand = hasText(explicitCommand) ? parseCommandToken(explicitCommand, 'command') : null;

  if (parsedIntent) {
    entity = explicitEntity || parsedIntent.entity;
    action = explicitAction || parsedIntent.action;
    intent = `${entity}.${action}`;
  } else if (parsedCommand) {
    entity = explicitEntity || parsedCommand.entity;
    action = explicitAction || parsedCommand.action;
    intent = `${entity}.${action}`;
  }

  if (!hasText(intent) && hasText(entity) && hasText(action)) {
    intent = `${entity}.${action}`;
  }

  const actorSource = source.actor && typeof source.actor === 'object' && !Array.isArray(source.actor) ? source.actor : {};
  const metadataSource = source.metadata && typeof source.metadata === 'object' && !Array.isArray(source.metadata) ? source.metadata : {};
  const actorIsExplicit = Object.prototype.hasOwnProperty.call(source, 'actor') && source.actor !== undefined && source.actor !== null;

  const actor = {
    role: hasText(actorSource.role) ? actorSource.role.trim() : hasText(metadataSource.role) ? metadataSource.role.trim() : (!actorIsExplicit && hasText(principal.role)) ? principal.role.trim() : '',
    userId: hasText(actorSource.userId) ? actorSource.userId.trim() : hasText(actorSource.id) ? actorSource.id.trim() : hasText(metadataSource.actor) ? metadataSource.actor.trim() : (!actorIsExplicit && hasText(principal.actor)) ? principal.actor.trim() : 'unknown'
  };

  const normalized = {
    ...source,
    tenantId: hasText(source.tenantId) ? source.tenantId.trim() : hasText(source.tenant) ? source.tenant.trim() : hasText(principal.tenant) ? principal.tenant.trim() : '',
    entity,
    action,
    intent,
    actor,
    context: isRecord(source.context) ? source.context : isRecord(source.payload) ? source.payload : {},
    metadata: {
      ...(isRecord(metadataSource) ? metadataSource : {}),
      ...(isRecord(source.metadata) ? source.metadata : {}),
      actor: actor.userId,
      role: actor.role,
      ...((hasText(principal.tenant) && !hasText(source.tenantId) && !hasText(source.tenant)) ? { tenantId: principal.tenant } : {})
    }
  };

  if (!hasText(normalized.intent) && hasText(normalized.entity) && hasText(normalized.action)) {
    normalized.intent = `${normalized.entity}.${normalized.action}`;
  }

  return normalized;
}

function validateControlInput(input = {}, principal = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};

  if (source.actor !== undefined && source.actor !== null && (typeof source.actor !== 'object' || Array.isArray(source.actor))) {
    throw new Error('Malformed actor payload');
  }
  if (source.metadata !== undefined && !isRecord(source.metadata)) {
    throw new Error('Metadata must be an object');
  }
  if (source.context !== undefined && !isRecord(source.context)) {
    throw new Error('Context must be an object');
  }
  if (source.payload !== undefined && !isRecord(source.payload)) {
    throw new Error('Context must be an object');
  }

  const explicitEntity = hasText(source.entity) ? source.entity.trim() : '';
  const explicitAction = hasText(source.action) ? source.action.trim() : '';
  const explicitIntent = hasText(source.intent) ? source.intent.trim() : '';
  const explicitCommand = hasText(source.command) ? source.command.trim() : '';
  const actorSource = source.actor && typeof source.actor === 'object' && !Array.isArray(source.actor) ? source.actor : {};

  if (hasText(explicitIntent)) {
    const parsedIntent = parseCommandToken(explicitIntent, 'intent');
    if (hasText(explicitEntity) && explicitEntity !== parsedIntent.entity && !(parsedIntent.isQualified === false && explicitEntity === 'system')) {
      throw new Error(`Intent contract mismatch: expected ${parsedIntent.entity}.${parsedIntent.action}`);
    }
    if (hasText(explicitAction) && explicitAction !== parsedIntent.action) {
      throw new Error(`Intent contract mismatch: expected ${parsedIntent.entity}.${parsedIntent.action}`);
    }
    if (hasText(explicitEntity) && hasText(explicitAction) && explicitIntent !== `${explicitEntity}.${explicitAction}` && explicitIntent !== explicitAction) {
      throw new Error(`Intent contract mismatch: expected ${explicitEntity}.${explicitAction}`);
    }
  }

  if (hasText(explicitCommand)) {
    const parsedCommand = parseCommandToken(explicitCommand, 'command');
    if (hasText(explicitEntity) && explicitEntity !== parsedCommand.entity && !(parsedCommand.isQualified === false && explicitEntity === 'system')) {
      throw new Error(`Intent contract mismatch: expected ${parsedCommand.entity}.${parsedCommand.action}`);
    }
    if (hasText(explicitAction) && explicitAction !== parsedCommand.action) {
      throw new Error(`Intent contract mismatch: expected ${parsedCommand.entity}.${parsedCommand.action}`);
    }
    if (hasText(explicitEntity) && hasText(explicitAction) && explicitCommand !== `${explicitEntity}.${explicitAction}` && explicitCommand !== explicitAction) {
      throw new Error(`Intent contract mismatch: expected ${explicitEntity}.${explicitAction}`);
    }
  }

  if (source.actor !== undefined && source.actor !== null && (!isRecord(source.actor) || (!hasText(actorSource.role) && !hasText(principal.role)))) {
    throw new Error('Missing actor role');
  }

  const normalized = normalizeControlInput(input, principal);

  if (!hasText(normalized.intent)) throw new Error('Missing intent');
  if (!hasText(normalized.entity)) throw new Error('Missing entity');
  if (!hasText(normalized.action)) throw new Error('Missing action');
  if (!normalized.actor || !hasText(normalized.actor.role)) throw new Error('Missing actor role');
  if (!hasText(normalized.tenantId)) throw new Error('Missing tenantId');

  if (hasText(explicitEntity) && explicitEntity !== normalized.entity) {
    throw new Error(`Intent contract mismatch: expected ${normalized.entity}.${normalized.action}`);
  }
  if (hasText(explicitAction) && explicitAction !== normalized.action) {
    throw new Error(`Intent contract mismatch: expected ${normalized.entity}.${normalized.action}`);
  }
  if (hasText(explicitIntent) && explicitIntent !== normalized.intent && explicitIntent !== normalized.action) {
    throw new Error(`Intent contract mismatch: expected ${normalized.entity}.${normalized.action}`);
  }
  if (hasText(explicitCommand) && explicitCommand !== normalized.intent && explicitCommand !== normalized.action) {
    throw new Error(`Intent contract mismatch: expected ${normalized.entity}.${normalized.action}`);
  }

  if (normalized.context !== undefined && !isRecord(normalized.context)) {
    throw new Error('Context must be an object');
  }

  if (normalized.metadata !== undefined && !isRecord(normalized.metadata)) {
    throw new Error('Metadata must be an object');
  }

  Object.assign(input, normalized);
  return true;
}

module.exports = {
  normalizeControlInput,
  validateControlInput
};
