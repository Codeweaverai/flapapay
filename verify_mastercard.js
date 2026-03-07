const axios = require('axios');

const API_URL = 'http://localhost:3005';
const EMAIL = 'test@example.com';
const PASSWORD = 'password123';

async function verifyMastercard() {
    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. List Cards (Initial)
        console.log('2. Listing cards (Initial)...');
        const listRes1 = await axios.get(`${API_URL}/v1/issuing/cards`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Initial count: ${listRes1.data.length}`);

        // 3. Issue New Card
        console.log('3. Issuing new card...');
        const createRes = await axios.post(`${API_URL}/v1/issuing/cards`, {
            amount: 50,
            currency: 'USD'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Card created:', createRes.data.id, createRes.data.brand, createRes.data.last4);

        // 4. List Cards (Verify)
        console.log('4. Listing cards (After Creation)...');
        const listRes2 = await axios.get(`${API_URL}/v1/issuing/cards`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Final count: ${listRes2.data.length}`);

        const newCard = listRes2.data.find(c => c.id === createRes.data.id);
        if (newCard) {
            console.log('Verification SUCCESS: New card found in list.');
            console.log('Card Details:', JSON.stringify(newCard, null, 2));
        } else {
            console.error('Verification FAILED: New card not found in list.');
        }

    } catch (error) {
        console.error('Verification Error:', error.response ? error.response.data : error.message);
    }
}

verifyMastercard();
