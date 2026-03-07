const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function checkEnum() {
    try {
        const res = await pool.query(`
            SELECT e.enumlabel
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = 'notification_type'
        `);
        console.log('Enum Values:', res.rows.map(r => r.enumlabel).join(', '));
    } catch (err) {
        console.error('Error checking enum:', err);
    } finally {
        await pool.end();
    }
}

checkEnum();
