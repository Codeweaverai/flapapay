const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function runMigration() {
    try {
        console.log('Adding sender columns to invoices table...');

        await pool.query(`
            ALTER TABLE invoices 
            ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS sender_address TEXT,
            ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(50)
        `);

        console.log('✅ Migration successful');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
