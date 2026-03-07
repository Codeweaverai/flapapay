const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://postgres:12345678@localhost:5432/flapapay_db"
});

async function check() {
    try {
        console.log("Checking connected_accounts...");
        const caResult = await pool.query("SELECT id, platform_merchant_id, email, business_name, status, livemode FROM connected_accounts");
        console.table(caResult.rows);

        console.log("\nChecking merchants...");
        const mResult = await pool.query("SELECT id, user_id, email, business_name, is_live_enabled FROM merchants");
        console.table(mResult.rows);

        console.log("\nChecking charges for destination_merchant_id...");
        const cResult = await pool.query("SELECT id, merchant_id, destination_merchant_id, amount, status, livemode FROM charges WHERE destination_merchant_id IS NOT NULL");
        console.table(cResult.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
