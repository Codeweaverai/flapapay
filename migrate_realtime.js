const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678', // Using the password identified from previous steps
    ssl: false
});

async function runMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'create_realtime_tables.sql'), 'utf8');
        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration successful!');

        // Verify tables
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('support_sessions', 'chat_messages', 'notifications');
        `);
        console.log('Created Tables:', res.rows.map(r => r.table_name));

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
