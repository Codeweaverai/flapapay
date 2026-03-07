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
    const res = await pool.query('SELECT * FROM ledger_entries ORDER BY created_at DESC LIMIT 5');
    console.log("LEDGER ENTRIES:", JSON.stringify(res.rows, null, 2));

    const res2 = await pool.query('SELECT * FROM wallets LIMIT 1');
    console.log("WALLETS:", JSON.stringify(res2.rows, null, 2));
    process.exit(0);
}
run();
