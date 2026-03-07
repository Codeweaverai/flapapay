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
        const res = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5');
        console.log("TRANSACTIONS:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.log("No transactions table");
    }

    try {
        const res2 = await pool.query('SELECT * FROM ledger_entries WHERE debit_wallet_id IS NOT NULL ORDER BY created_at DESC LIMIT 5');
        console.log("LEDGER WITH DEBIT WALLET:", JSON.stringify(res2.rows, null, 2));
    } catch (e) { }

    process.exit(0);
}
run();
