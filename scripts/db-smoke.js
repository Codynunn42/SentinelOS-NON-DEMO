const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    const result = await pool.query('SELECT NOW() AS now');
    console.log(JSON.stringify({
      status: 'ok',
      now: result.rows[0].now
    }));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Database smoke failed: ${error.message}`);
  process.exit(1);
});
