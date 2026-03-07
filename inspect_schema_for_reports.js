const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function inspectSchema() {
    try {
        console.log('--- WALLETS TABLE ---');
        const wallets = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wallets'");
        wallets.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        console.log('\n--- LEDGER_ENTRIES TABLE ---');
        const ledger = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ledger_entries'");
        ledger.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectSchema();
