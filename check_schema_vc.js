require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function main() {
    try {
        console.log('--- USERS SCHEMA ---');
        const users = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        console.log(JSON.stringify(users.rows, null, 2));

        console.log('\n--- VIRTUAL_CARDS SCHEMA ---');
        const vcards = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'virtual_cards'");
        console.log(JSON.stringify(vcards.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
