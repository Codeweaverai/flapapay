const { Pool } = require('pg');
require('dotenv').config();

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
        console.log('Starting migration...');

        // 1. Add role column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
        `);
        console.log('Added role column to users table.');

        // 2. Promote a user to admin (optional, can be done via CLI)
        // const adminEmail = 'admin@flapapay.com';
        // await pool.query('UPDATE users SET role = \'admin\' WHERE email = $1', [adminEmail]);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
