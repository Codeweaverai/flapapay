const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://postgres:12345678@localhost:5432/flapapay_db"
});

async function check() {
    try {
        console.log("Checking API keys...");
        const result = await pool.query("SELECT id, merchant_id, key_type, key_value FROM api_keys");
        console.table(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
