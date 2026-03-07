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

async function verifySchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('Users Table Schema:');
        console.table(res.rows);
    } catch (err) {
        console.error('Error verifying schema:', err);
    } finally {
        await pool.end();
    }
}

verifySchema();
