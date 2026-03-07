require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Dropping old virtual_cards table with CASCADE...');
        await client.query('DROP TABLE IF EXISTS virtual_cards CASCADE');

        console.log('Creating new virtual_cards table (Real Schema)...');
        await client.query(`
            CREATE TABLE virtual_cards (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                card_contract_id VARCHAR(100) NOT NULL UNIQUE,
                account_contract_id VARCHAR(100) NOT NULL,
                client_id VARCHAR(100) NOT NULL,
                last4 VARCHAR(4) NOT NULL,
                brand VARCHAR(20) DEFAULT 'Mastercard',
                status VARCHAR(20) DEFAULT 'ACTIVE',
                amount DECIMAL(15, 2) DEFAULT 0.00,
                currency VARCHAR(3) NOT NULL,
                expiry_month VARCHAR(2) NOT NULL,
                expiry_year VARCHAR(2) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query('CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON virtual_cards(user_id)');

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
