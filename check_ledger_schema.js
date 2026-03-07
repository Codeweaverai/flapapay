const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function check() {
    try {
        console.log('--- ledger_entries Schema ---');
        const resLedger = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ledger_entries'");
        console.table(resLedger.rows);

        console.log('\n--- wallets Schema ---');
        const resWallets = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wallets'");
        console.table(resWallets.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
