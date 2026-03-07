const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:12345678@localhost:5432/flapapay_db',
    ssl: false
});

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migrations', 'create_revenue_wallet.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration successful: Revenue wallets created.');

        // innovative check
        const res = await pool.query("SELECT * FROM wallets WHERE user_id = '00000000-0000-0000-0000-000000000000'");
        console.log('System Wallets:', res.rows);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
