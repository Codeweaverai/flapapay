const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678'
});

async function run() {
    try {
        const yearGrowthRes = await pool.query(`
            SELECT 
                TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as label,
                COALESCE(SUM(amount), 0) as total,
                DATE_TRUNC('month', created_at) as sort_date
            FROM ledger_entries 
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY 1, 3
            ORDER BY sort_date ASC
        `);
        console.log("YEAR:", yearGrowthRes.rows);

        const monthGrowthRes = await pool.query(`
            SELECT 
                TO_CHAR(DATE_TRUNC('day', created_at), 'DD Mon') as label,
                COALESCE(SUM(amount), 0) as total,
                DATE_TRUNC('day', created_at) as sort_date
            FROM ledger_entries 
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY 1, 3
            ORDER BY sort_date ASC
        `);
        console.log("MONTH:", monthGrowthRes.rows);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();
