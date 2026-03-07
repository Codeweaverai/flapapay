const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function createVirtualCardsTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS virtual_cards (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
        );

        -- Add an index for faster lookups by user and card ID
        CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON virtual_cards(user_id);
    `;

    try {
        console.log('Connecting to database...');
        await pool.query(query);
        console.log('Successfully created virtual_cards table.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await pool.end();
    }
}

createVirtualCardsTable();
