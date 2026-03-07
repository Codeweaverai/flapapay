const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3005';
const USER_EMAIL = 'mbolela.pule@outlook.com'; // Using the admin/merchant user
const USER_PASSWORD = 'admin123';

async function verifyInvoices() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASSWORD
        });
        const token = loginRes.data.token;
        console.log('   Login successful.');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create a Test Invoice
        console.log('\n2. Creating Test Invoice...');
        const invoiceData = {
            clientName: "Test Client",
            clientEmail: "test@example.com",
            clientAddress: "123 Test St",
            invoiceNumber: `TEST-${Date.now()}`,
            currency: "USD",
            items: [
                { description: "Web Development", quantity: 1, price: 500 },
                { description: "Hosting", quantity: 12, price: 20 }
            ],
            dueDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        };

        const createRes = await axios.post(`${BASE_URL}/v1/invoices`, invoiceData, { headers });
        const invoiceId = createRes.data.id;
        console.log(`   Invoice created: ${invoiceId}`);

        // 3. Test PDF Download
        console.log('\n3. Testing PDF Download...');
        try {
            const pdfRes = await axios.get(`${BASE_URL}/v1/invoices/${invoiceId}/pdf`, {
                headers,
                responseType: 'arraybuffer'
            }); // Binary data

            const pdfPath = path.join(__dirname, 'test_invoice_output.pdf');
            fs.writeFileSync(pdfPath, pdfRes.data);
            console.log(`   ✅ PDF downloaded successfully (${pdfRes.data.length} bytes). saved to ${pdfPath}`);
        } catch (pdfErr) {
            console.error('   ❌ PDF Download Failed:', pdfErr.message);
            if (pdfErr.response) console.error('   Server Response:', pdfErr.response.status, pdfErr.response.statusText);
        }

        // 4. Test Email Sending
        console.log('\n4. Testing Email Sending...');
        try {
            const sendRes = await axios.post(`${BASE_URL}/v1/invoices/${invoiceId}/send`,
                { subject: "Test Invoice", body: "Here is your invoice.", cc: "manager@example.com" },
                { headers }
            );
            console.log('   ✅ Email sent successfully:', sendRes.data);
        } catch (emailErr) {
            console.log('   ℹ️ Email send attempt finished (Expected failure if API Key is invalid).');
            if (emailErr.response) {
                console.log(`   Server Response: ${emailErr.response.status} - ${JSON.stringify(emailErr.response.data)}`);
            } else {
                console.error('   Error:', emailErr.message);
            }
        }

        console.log('\n✅ Verification Script Completed');

    } catch (err) {
        console.error('\n❌ Critical Failure:', err.message);
        if (err.response) console.error('Response:', err.response.data);
    }
}

verifyInvoices();
