const axios = require('axios');

const API_URL = 'http://localhost:3005';

// Use your actual credentials - UPDATE THESE!
const EMAIL = 'mbolela.pule@outlook.com'; // Your registered email
const PASSWORD = 'admin123'; // Your password
const PIN = '1520'; // Your PIN for 2FA

async function testVirtualCardIssuance() {
    let token;
    
    try {
        // 1. Login (gets partial token)
        console.log('=== Step 1: Logging in ===');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        
        if (loginRes.data.pinRequired) {
            console.log('PIN required, verifying...');
            const verifyRes = await axios.post(`${API_URL}/auth/verify-pin`, {
                partialToken: loginRes.data.partialToken,
                pin: PIN
            });
            token = verifyRes.data.token;
            console.log('✓ Login successful (with PIN)');
        } else {
            token = loginRes.data.token;
            console.log('✓ Login successful');
        }
        console.log('Token:', token.substring(0, 50) + '...\n');

        // 2. Check Wallet Balance
        console.log('=== Step 2: Checking Wallet Balance ===');
        const walletRes = await axios.get(`${API_URL}/wallets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Wallets:', JSON.stringify(walletRes.data, null, 2));
        
        const usdWallet = walletRes.data.find(w => w.currency === 'USD');
        if (!usdWallet) {
            console.error('✗ No USD wallet found!');
            return;
        }
        console.log(`✓ USD Wallet Balance: ${usdWallet.balance} USD\n`);

        // 3. List Existing Cards
        console.log('=== Step 3: Listing Existing Cards ===');
        const listRes1 = await axios.get(`${API_URL}/v1/issuing/cards`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✓ Existing cards: ${listRes1.data.length}`);
        if (listRes1.data.length > 0) {
            listRes1.data.forEach(card => {
                console.log(`  - ${card.id}: ${card.last4} (${card.currency}) - ${card.status}`);
            });
        }
        console.log();

        // 4. Issue New Card
        console.log('=== Step 4: Issuing New Virtual Card ===');
        console.log('Request: amount=50, currency=USD');
        const createRes = await axios.post(`${API_URL}/v1/issuing/cards`, {
            amount: 50,
            currency: 'USD'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✓ Card created successfully!');
        console.log('Card Details:', JSON.stringify(createRes.data, null, 2));
        console.log();

        // 5. Verify Card in List
        console.log('=== Step 5: Verifying Card in List ===');
        const listRes2 = await axios.get(`${API_URL}/v1/issuing/cards`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✓ Total cards now: ${listRes2.data.length}`);
        
        const newCard = listRes2.data.find(c => c.id === createRes.data.id);
        if (newCard) {
            console.log('✓ SUCCESS: New card found in list!');
            console.log('Final Card State:', JSON.stringify(newCard, null, 2));
        } else {
            console.error('✗ FAILED: New card not found in list.');
        }

    } catch (error) {
        console.error('\n=== ERROR ===');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        
        // Common issues diagnosis
        console.error('\n=== DIAGNOSIS ===');
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('Authentication failed. Check your email/password or token expiry.');
        } else if (error.response?.status === 400) {
            console.error('Bad request. Check wallet balance and input data.');
        } else if (error.response?.status === 500) {
            console.error('Server error. Check Mastercard API credentials and connectivity.');
            console.error('Verify .env has correct MASTERCARD_CONSUMER_KEY and key file path.');
        }
    }
}

testVirtualCardIssuance();
