const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function checkTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log('Tables:', res.rows.map(r => r.table_name));

        const payouts = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payouts';
        `);
        console.log('Payouts Columns:', payouts.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkTables();
