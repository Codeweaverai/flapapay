const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function checkRLS() {
    try {
        console.log('Checking RLS for tables...');
        const res = await pool.query(`
            SELECT relname, relrowsecurity 
            FROM pg_class 
            JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
            WHERE relname IN ('users', 'wallets', 'ledger_entries')
            AND nspname = 'public';
        `);
        console.log('RLS Status:', res.rows);

        console.log('\nChecking all columns in users table...');
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        `);
        console.log('Users columns:', cols.rows.map(c => c.column_name).join(', '));

        console.log('\nChecking for any active policies...');
        const policies = await pool.query(`
            SELECT * FROM pg_policies WHERE schemaname = 'public';
        `);
        console.log('Active Policies:', policies.rows);

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await pool.end();
    }
}

checkRLS();
