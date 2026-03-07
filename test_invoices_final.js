const axios = require('axios');

const API_BASE = 'http://localhost:3005';
const MERCHANT_TOKEN = 'YOUR_MOCK_TOKEN_IF_NEEDED'; // The server often uses Bearer token, but I'll see if I can bypass for health check or use a known one.

async function verifyInvoices() {
    console.log('--- Starting Invoice System Verification ---');

    try {
        // 1. Create Invoice
        console.log('1. Creating Invoice...');
        const createRes = await axios.post(`${API_BASE}/v1/invoices`, {
            clientName: 'Verification Client',
            clientEmail: 'verify@test.com',
            items: [{ description: 'Test Item', quantity: 2, price: 500, amount: 1000 }],
            taxRate: 10,
            discountAmount: 100,
            currency: 'USD'
        }, {
            headers: { 'Authorization': 'Bearer ' + 'TOKEN_NOT_NEEDED_IN_MOCK_AUTH' } // unified-server.js mock auth might accept anything or specific ones
        });

        const invoice = createRes.data;
        console.log('Invoice created:', invoice.id);
        console.log('Subtotal: $1000');
        console.log('Tax Rate: 10%');
        console.log('Discount: $100');
        console.log('Expected Taxable: $900');
        console.log('Expected Tax: $90');
        console.log('Expected Total: $990');
        console.log('Actual Total:', invoice.total_amount);

        if (parseFloat(invoice.total_amount) === 990) {
            console.log('✅ Calculation Correct!');
        } else {
            console.log('❌ Calculation Incorrect!');
        }

        // 2. Fetch Public Detail
        console.log('\n2. Fetching Public Data...');
        const publicRes = await axios.get(`${API_BASE}/v1/public/invoices/${invoice.id}`);
        console.log('Public Data Status:', publicRes.status);
        console.log('Tax Rate in Public Data:', publicRes.data.tax_rate);
        console.log('Discount in Public Data:', publicRes.data.discount_amount);

        if (publicRes.data.tax_rate == 10 && publicRes.data.discount_amount == 100) {
            console.log('✅ Public Data Fields Correct!');
        } else {
            console.log('❌ Public Data Fields Missing or Incorrect!');
        }

        // 3. Check PDF Endpoint
        console.log('\n3. Checking PDF Endpoint...');
        const pdfRes = await axios.get(`${API_BASE}/v1/invoices/${invoice.id}/pdf`, { responseType: 'arraybuffer' });
        console.log('PDF Endpoint Status:', pdfRes.status);
        if (pdfRes.status === 200 && pdfRes.headers['content-type'] === 'application/pdf') {
            console.log('✅ PDF Generation Endpoint Working!');
        } else {
            console.log('❌ PDF Generation Failed!');
        }

        console.log('\n--- Verification Complete ---');
    } catch (error) {
        console.error('Verification failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

verifyInvoices();
