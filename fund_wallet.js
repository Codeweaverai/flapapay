const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

const EMAIL = 'test@example.com';

async function fundWallet() {
    try {
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [EMAIL]);
        if (userRes.rows.length === 0) {
            console.error('User not found');
            return;
        }
        const userId = userRes.rows[0].id;

        const walletRes = await pool.query("SELECT id FROM wallets WHERE user_id = $1 AND currency = 'USD'", [userId]);
        if (walletRes.rows.length === 0) {
            console.error('USD Wallet not found');
            return;
        }
        const walletId = walletRes.rows[0].id;

        await pool.query('UPDATE wallets SET balance = balance + 1000 WHERE id = $1', [walletId]);
        console.log(`Funded 1000 USD to wallet ${walletId}`);

    } catch (err) {
        console.error('Funding Error:', err);
    } finally {
        await pool.end();
    }
}

fundWallet();
