const { Pool } = require('pg');

async function main() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL is required');
        process.exit(1);
    }

    const pool = new Pool({ connectionString });

    try {
        const receiptsTable = await pool.query(`
      SELECT to_regclass('public.receipts') AS receipts_table,
             to_regclass('public.delegation_rules') AS delegation_table
    `);

        const row = receiptsTable.rows[0] || {};
        if (!row.receipts_table) {
            throw new Error('receipts table is missing');
        }

        const countResult = await pool.query('SELECT COUNT(*) AS total FROM receipts');

        console.log(JSON.stringify({
            status: 'ok',
            receiptsTable: row.receipts_table,
            delegationTable: row.delegation_table || null,
            receiptsTotal: Number(countResult.rows[0].total),
        }));
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error(`Executive Desk DB smoke failed: ${error.message}`);
    process.exit(1);
});