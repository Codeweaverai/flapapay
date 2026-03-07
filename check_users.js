const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:12345678@localhost:5432/flapapay_db',
    ssl: false
});

async function listUsers() {
    try {
        const result = await pool.query('SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 10');
        console.log('Users in database:');
        console.log('==================');
        result.rows.forEach((user, i) => {
            console.log(`${i + 1}. ${user.email} - ${user.full_name} (${user.role}) - ID: ${user.id}`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        pool.end();
    }
}

listUsers();
