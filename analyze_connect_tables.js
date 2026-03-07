const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://postgres:12345678@localhost:5432/flapapay_db"
});

async function analyze() {
    try {
        console.log("--- TABLE: connected_accounts ---");
        const caResult = await pool.query("SELECT * FROM public.connected_accounts ORDER BY id ASC");
        console.table(caResult.rows);

        console.log("\n--- TABLE: connected_account_payout_methods ---");
        const capmResult = await pool.query("SELECT * FROM public.connected_account_payout_methods ORDER BY id ASC");
        console.table(capmResult.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

analyze();
