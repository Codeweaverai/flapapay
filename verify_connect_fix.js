const axios = require('axios');

async function verify() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNzU1ZTY1NC0yZmQ5LTRhMDktYmYyMC1hMGUwNWVmN2QyYjYiLCJpYXQiOjE3NDA1ODQzMDksImV4cCI6MTc0MDY3MDcwOX0.RThO8zUisvC3-8Q4M5eT8F8G7Z7-p-9z_XJ-5L2Fz9E'; // Mocking or using existing token if possible

    console.log("Verifying /v1/connect/accounts with test mode header...");
    try {
        const res = await axios.get('http://localhost:3005/v1/connect/accounts', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-flapapay-test-mode': 'true'
            }
        });
        console.log("Status:", res.status);
        console.log("Accounts found:", res.data.length);
        if (res.data.length > 0) {
            console.log("First account email:", res.data[0].email);
        } else {
            console.log("No accounts found with test mode header.");
        }
    } catch (err) {
        console.error("Verification failed:", err.response?.data || err.message);
    }
}

verify();
