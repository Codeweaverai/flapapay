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

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address.');
    process.exit(1);
}

async function promote() {
    try {
        const result = await pool.query('UPDATE users SET role = \'admin\' WHERE email = $1 RETURNING id, email, role', [email]);
        if (result.rows.length === 0) {
            console.error('User not found.');
        } else {
            console.log('User promoted successfully:', result.rows[0]);
        }
    } catch (err) {
        console.error('Promotion failed:', err);
    } finally {
        await pool.end();
    }
}

promote();
