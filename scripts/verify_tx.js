const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function checkTransaction() {
    try {
        const ref = 'TX-3A5983378104EABD';
        console.log(`Checking transaction: ${ref}`);

        const res = await pool.query("SELECT * FROM ledger_entries WHERE transaction_reference = $1", [ref]);
        console.log('Results from ledger_entries:', JSON.stringify(res.rows, null, 2));

        if (res.rows.length > 0) {
            const entry = res.rows[0];
            const wallets = await pool.query("SELECT * FROM wallets WHERE id IN ($1, $2)", [entry.debit_wallet_id, entry.credit_wallet_id]);
            console.log('Associated Wallets:', JSON.stringify(wallets.rows, null, 2));

            const users = await pool.query("SELECT id, email, full_name FROM users WHERE id IN (SELECT user_id FROM wallets WHERE id IN ($1, $2))", [entry.debit_wallet_id, entry.credit_wallet_id]);
            console.log('Associated Users:', JSON.stringify(users.rows, null, 2));
        }
    } catch (err) {
        console.error('Error checking transaction:', err);
    } finally {
        await pool.end();
    }
}

checkTransaction();
