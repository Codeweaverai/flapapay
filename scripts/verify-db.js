
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:12345678@127.0.0.1:5432/flapapay_db',
});

async function checkConnection() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the database!');
        const res = await client.query('SELECT NOW()');
        console.log('Database time:', res.rows[0].now);

        // Check tables
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables found:', tables.rows.map(r => r.table_name).join(', '));

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

checkConnection();
