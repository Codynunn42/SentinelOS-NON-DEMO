function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateControlInput(input = {}) {
  if (!hasText(input.intent)) throw new Error('Missing intent');
  if (!hasText(input.entity)) throw new Error('Missing entity');
  if (!hasText(input.action)) throw new Error('Missing action');
  if (!input.actor || !hasText(input.actor.role)) throw new Error('Missing actor role');
  if (!hasText(input.tenantId)) throw new Error('Missing tenantId');

  const normalizedIntent = input.intent.trim();
  const expectedIntent = `${input.entity.trim()}.${input.action.trim()}`;
  if (normalizedIntent !== expectedIntent) {
    throw new Error(`Intent contract mismatch: expected ${expectedIntent}`);
  }

  if (input.context !== undefined && !isRecord(input.context)) {
    throw new Error('Context must be an object');
  }

  if (input.metadata !== undefined && !isRecord(input.metadata)) {
    throw new Error('Metadata must be an object');
  }

  return true;
}

module.exports = {
  validateControlInput
};
