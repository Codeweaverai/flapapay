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
        const sqlPath = path.join(__dirname, 'fix_trigger_enum.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running enum fix for triggers...');
        await pool.query(sql);
        console.log('Fix completed successfully.');

    } catch (err) {
        console.error('Fix failed:', err.message);
    } finally {
        await pool.end();
    }
}

runFix();
