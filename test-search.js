const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function testSearch() {
    console.log('Connecting to DB...');
    const query = 'jessica.komani@gmail.com';
    try {
        console.log(`Running query for: ${query}`);
        const result = await pool.query(
            'SELECT id, email, full_name FROM users WHERE email ILIKE $1 OR full_name ILIKE $1 LIMIT 5',
            [`%${query}%`]
        );
        console.log('Query success!');
        console.log('Rows found:', result.rows.length);
        console.log(result.rows);
    } catch (err) {
        console.error('Query failed!');
        console.error(err);
    } finally {
        await pool.end();
    }
}

testSearch();
