const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function createTestSession() {
    try {
        // Find a test key and merchant
        const keyRes = await pool.query("SELECT key_value, merchant_id FROM api_keys WHERE key_type = 'test_public' LIMIT 1");

        if (keyRes.rows.length === 0) {
            console.log("No test API key found. Please create one in the dashboard first.");
            process.exit(0);
        }

        const apiKey = keyRes.rows[0].key_value;
        const merchantId = keyRes.rows[0].merchant_id;

        const sessionId = 'cs_test_' + crypto.randomBytes(24).toString('hex');

        await pool.query(
            `INSERT INTO checkout_sessions 
             (id, merchant_id, amount, currency, payment_method_types, success_url, cancel_url, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')`,
            [
                sessionId,
                merchantId,
                1500.00,
                'ZMW',
                JSON.stringify(['card', 'mobile_money']),
                'http://localhost:5173/dashboard?status=success',
                'http://localhost:5173/dashboard?status=cancel'
            ]
        );

        console.log(`\n✅ Checkout Session Created!`);
        console.log(`🔗 URL: http://localhost:5173/checkout/${sessionId}`);
        console.log(`🔑 Using API Key: ${apiKey}`);
    } catch (err) {
        console.error("Error creating session:", err);
    } finally {
        await pool.end();
    }
}

createTestSession();
