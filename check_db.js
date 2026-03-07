require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function check() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'virtual_cards' ORDER BY ordinal_position");
        console.log('--- VIRTUAL CARDS COLUMNS ---');
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        const userRes = await pool.query("SELECT id FROM users LIMIT 1");
        console.log('\n--- SAMPLE USER ID ---');
        console.log(userRes.rows[0]);

        await pool.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
