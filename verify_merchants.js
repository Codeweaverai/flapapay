const axios = require('axios');

const BASE_URL = 'http://localhost:3005';
const ADMIN_EMAIL = 'mbolela.pule@outlook.com';
const ADMIN_PASSWORD = 'admin123';

async function verify() {
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.token;
        console.log('   Login successful. Token received.');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Test Listing Merchants
        console.log('\n2. Testing GET /admin/merchants...');
        const listRes = await axios.get(`${BASE_URL}/admin/merchants`, { headers });
        console.log(`   Found ${listRes.data.length} merchants.`);

        if (listRes.data.length > 0) {
            const merchant = listRes.data[0];
            console.log(`   Targeting merchant: ${merchant.business_name} (${merchant.id}) - Status: ${merchant.compliance_status}`);

            // 3. Test Updating Status
            console.log(`\n3. Testing PATCH /admin/merchants/${merchant.id}/compliance...`);

            // Toggle Status
            const newStatus = merchant.compliance_status === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
            const patchRes = await axios.patch(
                `${BASE_URL}/admin/merchants/${merchant.id}/compliance`,
                { status: newStatus, isLiveEnabled: newStatus === 'ACTIVE' },
                { headers }
            );
            console.log(`   Updated status to: ${patchRes.data.compliance_status}`);

            // Revert
            console.log('   Reverting status...');
            await axios.patch(
                `${BASE_URL}/admin/merchants/${merchant.id}/compliance`,
                { status: merchant.compliance_status, isLiveEnabled: merchant.is_live_enabled },
                { headers }
            );
            console.log(`   Reverted to: ${merchant.compliance_status}`);
        } else {
            console.log('   No merchants found to test update.');
        }

        console.log('\n✅ Verification Complete');

    } catch (err) {
        console.error('\n❌ Verification Failed:', err.response ? err.response.data : err.message);
    }
}

verify();
