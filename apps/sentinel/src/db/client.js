const fs = require('fs');
const path = require('path');

let Pool = null;

try {
  ({ Pool } = require('pg'));
} catch (error) {
  Pool = null;
}

const hasDatabaseUrl = typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim() !== '';
const databaseEnabled = Boolean(Pool && hasDatabaseUrl);

const pool = databaseEnabled
  ? new Pool({
      connectionString: process.env.DATABASE_URL
    })
  : null;

let schemaEnsured = false;

async function query(text, params) {
  if (!pool) {
    return null;
  }

  return pool.query(text, params);
}

function getDatabaseStatus() {
  if (!hasDatabaseUrl) {
    return 'disabled';
  }

  if (!Pool) {
    return 'driver_missing';
  }

  return 'enabled';
}

async function ensureSchema() {
  if (!pool || schemaEnsured) {
    return;
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
  schemaEnsured = true;
}

module.exports = {
  databaseEnabled,
  ensureSchema,
  getDatabaseStatus,
  query
};
