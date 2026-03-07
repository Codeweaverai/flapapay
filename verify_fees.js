const axios = require('axios');
const { Pool } = require('pg');

const API_URL = 'http://localhost:3005';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:12345678@localhost:5432/flapapay_db',
    ssl: false
});

async function runTest() {
    try {
        console.log('--- Starting Fee Verification (Markup Logic) ---');

        // 1. Register User A
        const emailA = `fee_test_A_${Date.now()}@example.com`;
        const password = 'Password123!';
        console.log(`Registering User A: ${emailA}`);
        const regResA = await axios.post(`${API_URL}/auth/register`, {
            email: emailA, password, fullName: 'Fee Tester A'
        });
        const tokenA = regResA.data.token;
        const userIdA = regResA.data.user.id;

        const walletResA = await axios.get(`${API_URL}/wallets`, { headers: { Authorization: `Bearer ${tokenA}` } });
        const zmwWalletA = walletResA.data.find(w => w.currency === 'ZMW');
        const usdWalletA = walletResA.data.find(w => w.currency === 'USD');

        // 2. Test Mobile Money Deposit (Markup)
        // Request: 1000.
        // Expect: Wallet + 1000.
        // Fee (Internal): 18.
        const depositAmount = 1000;
        const expectedFee = 18; // 1.8% of 1000

        console.log(`\nTesting Deposit: User request ${depositAmount} ZMW (Expected Credit: ${depositAmount})`);
        const depRes = await axios.post(`${API_URL}/wallets/deposit`, {
            walletId: zmwWalletA.id,
            amount: depositAmount
        }, { headers: { Authorization: `Bearer ${tokenA}` } });

        console.log('Deposit Result:', depRes.data);
        if (parseFloat(depRes.data.newBalance) === 1000 && parseFloat(depRes.data.fee) === expectedFee) {
            console.log('SUCCESS: Deposit Markup Logic Correct (User got 1000).');
        } else {
            console.error(`FAILURE: Deposit Balance ${depRes.data.newBalance} != 1000`);
        }

        // 3. Test Transfer (Markup)
        // Register User B
        const emailB = `fee_test_B_${Date.now()}@example.com`;
        console.log(`\nRegistering User B: ${emailB}`);
        const regResB = await axios.post(`${API_URL}/auth/register`, {
            email: emailB, password, fullName: 'Fee Tester B'
        });
        console.log('User B Reg Response:', regResB.data); // Debug logging
        const tokenB = regResB.data.token;
        if (!tokenB) throw new Error('Failed to get token for User B');

        const walletResB = await axios.get(`${API_URL}/wallets`, { headers: { Authorization: `Bearer ${tokenB}` } });
        const zmwWalletB = walletResB.data.find(w => w.currency === 'ZMW');

        // Transfer 100 ZMW from A to B.
        // Fee: 1% = 1 ZMW.
        // A Debit: 101.
        // B Credit: 100.
        const transferAmount = 100;
        const transferFee = 1;

        console.log(`\nTesting Transfer: 100 ZMW from A to B (Expected Fee: ${transferFee})`);
        const txRes = await axios.post(`${API_URL}/payments/transfer`, {
            debitWalletId: zmwWalletA.id,
            creditWalletId: zmwWalletB.id,
            amount: transferAmount,
            currency: 'ZMW'
        }, { headers: { Authorization: `Bearer ${tokenA}` } });

        console.log('Transfer Result:', txRes.data);

        // Verify Balances
        const checkA = await axios.get(`${API_URL}/wallets`, { headers: { Authorization: `Bearer ${tokenA}` } });
        const checkB = await axios.get(`${API_URL}/wallets`, { headers: { Authorization: `Bearer ${tokenB}` } });

        const balA = parseFloat(checkA.data.find(w => w.currency === 'ZMW').balance);
        const balB = parseFloat(checkB.data.find(w => w.currency === 'ZMW').balance);

        // Initial 1000. Send 100 + 1 fee. Remainder 899.
        if (balA === 899) {
            console.log(`SUCCESS: Sender Balance ${balA} is correct (1000 - 101).`);
        } else {
            console.error(`FAILURE: Sender Balance ${balA} != 899`);
        }

        if (balB === 100) {
            console.log(`SUCCESS: Recipient Balance ${balB} is correct (+100).`);
        } else {
            console.error(`FAILURE: Recipient Balance ${balB} != 100`);
        }

        // 4. Test Card Issuance (Markup)
        // First deposit USD
        console.log('\nFunding USD wallet for Card Test...');
        await axios.post(`${API_URL}/wallets/deposit`, {
            walletId: usdWalletA.id,
            amount: 100 // Balance 100. Fee 1.8 (internal).
        }, { headers: { Authorization: `Bearer ${tokenA}` } });

        console.log(`\nTesting Card Issuance: Load 50 USD (Expected Fee: 0.50 USD)`);
        const cardRes = await axios.post(`${API_URL}/v1/issuing/cards`, {
            amount: 50,
            currency: 'USD'
        }, { headers: { Authorization: `Bearer ${tokenA}` } });

        console.log('Card Result:', cardRes.data);
        console.log('SUCCESS: Card issued.');

        // 5. Test Payment Link Fee (1.8%)
        console.log('\nTesting Payment Link Fee Deduction...');
        const linkRes = await axios.post(`${API_URL}/payment-links`, {
            title: 'Test Fee Link',
            amount: 100,
            currency: 'USD',
            wallet_id: usdWalletA.id
        }, { headers: { Authorization: `Bearer ${tokenA}` } });
        const linkId = linkRes.data.id;

        console.log(`Payment Link Created: ${linkId}. Confirming payment of 100 USD...`);
        const confRes = await axios.post(`${API_URL}/public/payment-links/${linkId}/confirm`, {
            amount: 100
        });
        console.log('Confirmation Response:', confRes.data);

        const checkA_final = await axios.get(`${API_URL}/wallets`, { headers: { Authorization: `Bearer ${tokenA}` } });
        const balA_final = parseFloat(checkA_final.data.find(w => w.currency === 'USD').balance);
        // Initial 0. Deposit 100. Issue Card 50+0.5 fee = 49.5 left.
        // Payment Link: Deposit 100. Fee 1.8. Net +98.2.
        // Expected: 49.5 + 98.2 = 147.7
        console.log(`User A USD Balance: ${balA_final} (Expected: 147.7)`);

        if (Math.abs(balA_final - 147.7) < 0.01) {
            console.log('SUCCESS: Payment Link Fee correctly deducted.');
        } else {
            console.error(`FAILURE: Payment Link Fee deduction incorrect. Check Logic.`);
        }

        // 6. Verify Revenue
        console.log('\nVerifying Revenue Wallet...');
        const revenueRes = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [SYSTEM_USER_ID]);
        const revZmw = parseFloat(revenueRes.rows.find(w => w.currency === 'ZMW').balance);
        const revUsd = parseFloat(revenueRes.rows.find(w => w.currency === 'USD').balance);

        console.log(`Revenue ZMW (Expect > 0): ${revZmw}`);
        console.log(`Revenue USD (Expect > 0): ${revUsd}`);

    } catch (err) {
        console.error('Test Failed Full Error:', err);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error Message:', err.message);
        }
    } finally {
        await pool.end();
    }
}

runTest();
