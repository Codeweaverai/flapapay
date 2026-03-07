const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function verifyTrigger() {
    try {
        // 1. Get a test user and wallet
        const userRes = await pool.query('SELECT id FROM users LIMIT 1');
        if (userRes.rows.length === 0) throw new Error('No users found');
        const userId = userRes.rows[0].id;

        const walletRes = await pool.query('SELECT id FROM wallets WHERE user_id = $1 LIMIT 1', [userId]);
        if (walletRes.rows.length === 0) throw new Error('No wallet found for user');
        const walletId = walletRes.rows[0].id;

        console.log(`Testing trigger for User: ${userId} / Wallet: ${walletId}`);

        // 2. Insert a ledger entry (Credit)
        const ledgerRes = await pool.query(`
            INSERT INTO ledger_entries (
                transaction_reference, debit_wallet_id, credit_wallet_id, amount, currency, description, transaction_type, status
            ) VALUES (
                $1, NULL, $2, 100.50, 'ZMW', 'Test Credit Notification', 'test', 'completed'
            ) RETURNING *;
        `, [`TEST-REF-${Date.now()}`, walletId]);
        console.log('Inserted ledger entry:', ledgerRes.rows[0].id);

        // 3. Check notifications table
        // Wait a small bit for trigger execution (though it's atomic)
        const notifyRes = await pool.query(`
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC LIMIT 1;
        `, [userId]);

        if (notifyRes.rows.length > 0 && notifyRes.rows[0].message.includes('Test Credit Notification')) {
            console.log('SUCCESS: Notification auto-generated!');
            console.table(notifyRes.rows);
        } else {
            console.error('FAILED: Notification not found.');
        }

    } catch (err) {
        console.error('Verification Error:', err.message);
    } finally {
        await pool.end();
    }
}

verifyTrigger();
