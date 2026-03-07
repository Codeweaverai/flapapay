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
            WITH months AS (
                SELECT generate_series(
                    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
                    DATE_TRUNC('month', CURRENT_DATE),
                    '1 month'::interval
                ) as month
            )
            SELECT 
                TO_CHAR(m.month, 'Mon YYYY') as label,
                COALESCE(SUM(l.amount), 0) as total,
                m.month as sort_date
            FROM months m
            LEFT JOIN ledger_entries l ON DATE_TRUNC('month', l.created_at) = m.month 
                AND l.transaction_type IN ('TRANSFER', 'DEPOSIT', 'CARD_FUNDING')
            GROUP BY m.month
            ORDER BY m.month ASC
        `);
        console.log("YEAR:", JSON.stringify(yearGrowthRes.rows.map(r => ({ label: r.label, total: parseFloat(r.total) })), null, 2));

        const monthGrowthRes = await pool.query(`
            WITH days AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    '1 day'::interval
                ) as day
            )
            SELECT 
                TO_CHAR(d.day, 'DD Mon') as label,
                COALESCE(SUM(l.amount), 0) as total,
                d.day as sort_date
            FROM days d
            LEFT JOIN ledger_entries l ON DATE_TRUNC('day', l.created_at) = d.day 
                AND l.transaction_type IN ('TRANSFER', 'DEPOSIT', 'CARD_FUNDING')
            GROUP BY d.day
            ORDER BY d.day ASC
        `);
        console.log("MONTH:", monthGrowthRes.rows.length);

        const weekGrowthRes = await pool.query(`
            WITH days AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '6 days',
                    CURRENT_DATE,
                    '1 day'::interval
                ) as day
            )
            SELECT 
                TO_CHAR(d.day, 'Dy') as label,
                COALESCE(SUM(l.amount), 0) as total,
                d.day as sort_date
            FROM days d
            LEFT JOIN ledger_entries l ON DATE_TRUNC('day', l.created_at) = d.day 
                AND l.transaction_type IN ('TRANSFER', 'DEPOSIT', 'CARD_FUNDING')
            GROUP BY d.day
            ORDER BY d.day ASC
        `);
        console.log("WEEK:", weekGrowthRes.rows.length);

    } catch (e) {
        console.error("DB ERROR :", e);
    }
    process.exit(0);
}

run();
