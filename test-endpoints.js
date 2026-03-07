const axios = require('axios');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const API_URL = 'http://localhost:3005';
const EMAIL = 'test@example.com';
const PASSWORD = 'password123';

// DB Config for Reset
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function resetPassword() {
    console.log('Resetting password...');
    const hash = await bcrypt.hash(PASSWORD, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, EMAIL]);
    console.log('Password reset done.');
    await pool.end();
}

async function testEndpoints() {
    await resetPassword();

    try {
        console.log('1. Logging in...');
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: EMAIL,
                password: PASSWORD
            });
            token = loginRes.data.token;
            console.log('Login successful');
        } catch (e) {
            console.log('Login failed: ' + e.message);
            if (e.response) console.log(JSON.stringify(e.response.data));
            return;
        }

        console.log('2. Testing /users/search...');
        try {
            const searchRes = await axios.get(`${API_URL}/users/search?query=test`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Search OK: ' + searchRes.data.length + ' results');
        } catch (err) {
            console.log('Search FAIL ' + err.response?.status);
            if (err.response?.data) {
                console.log('ERROR DETAILS: ' + JSON.stringify(err.response.data));
            }
        }

        console.log('3. Testing /payments/methods...');
        try {
            const methodsRes = await axios.get(`${API_URL}/payments/methods`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Methods OK: ' + methodsRes.data.methods?.length + ' cards');
        } catch (err) {
            console.log('Methods FAIL ' + err.response?.status);
            if (err.response?.data) {
                console.log('ERROR DETAILS: ' + JSON.stringify(err.response.data));
            }
        }

    } catch (error) {
        console.log('Global Error: ' + error.message);
    }
}

testEndpoints();
