const fs = require('fs');
const path = require('path');

const schemaCache = new Map();

function loadSchema(schemaName) {
  if (!schemaCache.has(schemaName)) {
    const schemaPath = path.join(__dirname, `${schemaName}.schema.json`);
    schemaCache.set(schemaName, JSON.parse(fs.readFileSync(schemaPath, 'utf8')));
  }

  return schemaCache.get(schemaName);
}

function describePath(pathParts) {
  return pathParts.length ? pathParts.join('.') : '$';
}

function validateNode(schema, value, pathParts, errors) {
  if (!schema || typeof schema !== 'object') {
    return;
  }

  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${describePath(pathParts)} must be an object`);
      return;
    }

    const required = Array.isArray(schema.required) ? schema.required : [];
    required.forEach((field) => {
      if (value[field] === undefined) {
        errors.push(`${describePath([...pathParts, field])} is required`);
      }
    });

    const properties = schema.properties || {};
    Object.keys(properties).forEach((field) => {
      if (value[field] !== undefined) {
        validateNode(properties[field], value[field], [...pathParts, field], errors);
      }
    });

    if (schema.additionalProperties === false) {
      Object.keys(value).forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(properties, field)) {
          errors.push(`${describePath([...pathParts, field])} is not allowed`);
        }
      });
    }

    return;
  }

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${describePath(pathParts)} must be an array`);
      return;
    }

    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${describePath(pathParts)} must contain at least ${schema.minItems} item(s)`);
    }

    if (schema.items) {
      value.forEach((item, index) => {
        validateNode(schema.items, item, [...pathParts, `[${index}]`], errors);
      });
    }

    return;
  }

  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      errors.push(`${describePath(pathParts)} must be a string`);
      return;
    }

    if (schema.minLength !== undefined && value.trim().length < schema.minLength) {
      errors.push(`${describePath(pathParts)} must be at least ${schema.minLength} character(s)`);
    }

    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${describePath(pathParts)} must be one of: ${schema.enum.join(', ')}`);
    }

    return;
  }

  if (schema.type === 'integer') {
    if (!Number.isInteger(value)) {
      errors.push(`${describePath(pathParts)} must be an integer`);
      return;
    }

    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${describePath(pathParts)} must be greater than or equal to ${schema.minimum}`);
    }

    return;
  }

  if (schema.type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      errors.push(`${describePath(pathParts)} must be a number`);
      return;
    }

    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${describePath(pathParts)} must be greater than or equal to ${schema.minimum}`);
    }

    return;
  }

  if (schema.type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${describePath(pathParts)} must be a boolean`);
  }
}

function validateSchema(schemaName, payload) {
  const schema = loadSchema(schemaName);
  const errors = [];
  validateNode(schema, payload, [], errors);
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateSchema
};
