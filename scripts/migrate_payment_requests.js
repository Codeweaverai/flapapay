const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function runMigration() {
    try {
        console.log('--- Creating payment_requests table ---');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                requester_id UUID NOT NULL REFERENCES users(id),
                recipient_email TEXT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                currency VARCHAR(3) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Success: Table payment_requests created.');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
