const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function checkSchema() {
    try {
        const tables = ['users', 'wallets', 'ledger_entries'];
        for (const table of tables) {
            console.log(`\n--- Columns in ${table} ---`);
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `, [table]);
            res.rows.forEach(col => console.log(`- ${col.column_name} (${col.data_type})`));
        }
    } catch (err) {
        console.error('Schema check failed:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
