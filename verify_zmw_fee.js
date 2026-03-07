const axios = require('axios');
const { Pool } = require('pg');

const API_URL = 'http://localhost:3005';
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:12345678@localhost:5432/flapapay_db' });

async function verifyZMWFee() {
    console.log('--- Starting ZMW Fee Verification ---');
    try {
        // 1. Register User
        const email = `zmw_fee_test_${Date.now()}@example.com`;
        const regRes = await axios.post(`${API_URL}/auth/register`, { email, password: 'Password123!', fullName: 'ZMW Fee Tester' });
        const token = regRes.data.token;
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Get ZMW Wallet
        const walletsRes = await axios.get(`${API_URL}/wallets`, authHeader);
        const zmwWallet = walletsRes.data.find(w => w.currency === 'ZMW');
        if (!zmwWallet) throw new Error('No ZMW wallet');

        // 3. Deposit 100 ZMW
        console.log(`Depositing 100 ZMW to wallet ${zmwWallet.id}...`);
        await axios.post(`${API_URL}/wallets/deposit`, { walletId: zmwWallet.id, amount: 100 }, authHeader);

        // 4. Issue Card (Amount: 10 ZMW)
        console.log('Issuing card for 10 ZMW...');
        await axios.post(`${API_URL}/v1/issuing/cards`, { amount: 10, currency: 'ZMW' }, authHeader);

        // 5. Check Balance
        const finalWallets = await axios.get(`${API_URL}/wallets`, authHeader);
        const finalZMW = finalWallets.data.find(w => w.currency === 'ZMW');

        const expectedBalance = 100 - (10 + 9.20); // 80.80
        console.log(`Final ZMW Balance: ${finalZMW.balance}`);
        console.log(`Expected Balance: ${expectedBalance.toFixed(2)}`);

        // Floating point comparison
        if (Math.abs(parseFloat(finalZMW.balance) - expectedBalance) < 0.01) {
            console.log('SUCCESS: Fee deduction is correct (9.20 ZMW).');
        } else {
            console.error('FAILURE: Fee deduction incorrect.');
        }

    } catch (err) {
        console.error('Test Failed:', err.response?.data || err.message);
    } finally {
        await pool.end();
    }
}

verifyZMWFee();
