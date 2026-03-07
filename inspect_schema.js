const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function inspectLedger() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ledger_entries'
            ORDER BY ordinal_position;
        `);
        console.log('Ledger Entries Columns:');
        console.table(res.rows);

        const wallets = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'wallets'
            ORDER BY ordinal_position;
        `);
        console.log('Wallets Columns:');
        console.table(wallets.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

inspectLedger();
