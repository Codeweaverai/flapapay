const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function updateSchema() {
    try {
        console.log('Updating escrow_status enum...');
        // Adding the new value. Note: In PostgreSQL, you can't add a value to an enum inside a transaction in older versions, 
        // but adding it directly usually works.
        await pool.query("ALTER TYPE escrow_status ADD VALUE IF NOT EXISTS 'RELEASE_REQUESTED'");
        console.log('Successfully added RELEASE_REQUESTED to escrow_status enum.');
    } catch (err) {
        console.error('Schema Update Error:', err);
    } finally {
        await pool.end();
    }
}

updateSchema();
