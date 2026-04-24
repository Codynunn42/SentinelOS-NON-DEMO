const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, '..', 'apps', 'sentinel', 'src', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const pool = new Pool({ connectionString });

  try {
    await pool.query(schemaSql);
    console.log('Schema applied successfully');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Schema apply failed: ${error.message}`);
  process.exit(1);
});
