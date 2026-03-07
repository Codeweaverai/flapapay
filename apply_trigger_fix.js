const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function runFix() {
    try {
        const sqlPath = path.join(__dirname, 'fix_notifications_and_triggers.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running fix for notifications and triggers...');
        await pool.query(sql);
        console.log('Fix completed successfully.');

    } catch (err) {
        console.error('Fix failed:', err.message);
    } finally {
        await pool.end();
    }
}

runFix();
