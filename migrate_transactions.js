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

async function migrate() {
    try {
        const sqlPath = path.join(__dirname, 'create_transaction_triggers.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing transaction trigger migration...');
        await pool.query(sql);
        console.log('Migration completed successfully.');

        // Test: Check if trigger exists
        const check = await pool.query(`
            SELECT trigger_name 
            FROM information_schema.triggers 
            WHERE event_object_table = 'ledger_entries';
        `);
        console.log('Active triggers on ledger_entries:', check.rows.map(r => r.trigger_name));

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
