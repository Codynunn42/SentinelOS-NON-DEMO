const { hasText, isRecord } = require('../shared/validation');

function normalizeControlInput(input = {}, principal = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};

  if (source.actor !== undefined && source.actor !== null && (typeof source.actor !== 'object' || Array.isArray(source.actor))) {
    throw new Error('Malformed actor payload');
  }
  if (source.metadata !== undefined && source.metadata !== null && (typeof source.metadata !== 'object' || Array.isArray(source.metadata))) {
    throw new Error('Metadata must be an object');
  }

  const commandValue = hasText(source.command) ? source.command.trim() : '';
  const commandName = commandValue || (hasText(source.intent) ? source.intent.trim() : '');
  const explicitEntity = hasText(source.entity) ? source.entity.trim() : '';
  const explicitAction = hasText(source.action) ? source.action.trim() : '';
  const explicitIntent = hasText(source.intent) ? source.intent.trim() : '';

  let entity = explicitEntity || 'system';
  let action = explicitAction || '';
  let intent = explicitIntent || '';

  if (!hasText(intent) && commandName) {
    if (commandName.includes('.')) {
      const parts = commandName.split('.').map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 2) {
        entity = explicitEntity || parts.slice(0, -1).join('.');
        action = explicitAction || parts[parts.length - 1];
        intent = `${entity}.${action}`;
      }
    } else if (!hasText(explicitEntity) && !hasText(explicitAction)) {
      action = commandName;
      entity = 'system';
      intent = `${entity}.${action}`;
    }
  }

  if (hasText(explicitEntity) && !hasText(entity)) entity = explicitEntity;
  if (hasText(explicitAction) && !hasText(action)) action = explicitAction;
  if (hasText(explicitIntent) && !hasText(intent)) intent = explicitIntent;
  if (!hasText(intent) && hasText(entity) && hasText(action)) intent = `${entity}.${action}`;

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
  if (source.metadata !== undefined && source.metadata !== null && (typeof source.metadata !== 'object' || Array.isArray(source.metadata))) {
    throw new Error('Metadata must be an object');
  }

  const explicitEntity = hasText(source.entity) ? source.entity.trim() : '';
  const explicitAction = hasText(source.action) ? source.action.trim() : '';
  const explicitIntent = hasText(source.intent) ? source.intent.trim() : '';
  const explicitCommand = hasText(source.command) ? source.command.trim() : '';
  const actorSource = source.actor && typeof source.actor === 'object' && !Array.isArray(source.actor) ? source.actor : {};

  if (hasText(explicitIntent) && hasText(explicitEntity) && hasText(explicitAction) && explicitIntent !== `${explicitEntity}.${explicitAction}`) {
    throw new Error(`Intent contract mismatch: expected ${explicitEntity}.${explicitAction}`);
  }

  if (hasText(explicitCommand) && hasText(explicitEntity) && hasText(explicitAction)) {
    const expectedQualified = `${explicitEntity}.${explicitAction}`;
    const bareAllowed = explicitCommand === explicitAction;
    if (explicitCommand !== expectedQualified && !bareAllowed) {
      throw new Error(`Command contract mismatch: expected ${expectedQualified}`);
    }
  }

  if (hasText(explicitCommand) && hasText(explicitIntent) && explicitIntent !== explicitCommand && explicitIntent !== `${explicitEntity}.${explicitAction}`) {
    const expectedIntent = hasText(explicitEntity) && hasText(explicitAction) ? `${explicitEntity}.${explicitAction}` : explicitIntent;
    throw new Error(`Command contract mismatch: expected ${expectedIntent}`);
  }

  const normalized = normalizeControlInput(input, principal);

  if (!hasText(normalized.intent)) throw new Error('Missing intent');
  if (!hasText(normalized.entity)) throw new Error('Missing entity');
  if (!hasText(normalized.action)) throw new Error('Missing action');
  if (!normalized.actor || !hasText(normalized.actor.role)) throw new Error('Missing actor role');
  if (!hasText(normalized.tenantId)) throw new Error('Missing tenantId');

  if (Object.prototype.hasOwnProperty.call(source, 'actor') && source.actor !== undefined && source.actor !== null && (!hasText(actorSource.role) || (!hasText(actorSource.userId) && !hasText(actorSource.id)))) {
    throw new Error('Missing actor role');
  }

  const expectedIntent = `${normalized.entity.trim()}.${normalized.action.trim()}`;
  if (normalized.intent.trim() !== expectedIntent) {
    throw new Error(`Intent contract mismatch: expected ${expectedIntent}`);
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
