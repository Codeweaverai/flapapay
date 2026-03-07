const axios = require('axios');
const fs = require('fs');

async function verifyPdf() {
    try {
        console.log('--- Testing PDF Download ---');
        const invoiceId = '0d1225d2-6dc7-47e6-90bb-154cb3a0e609'; // ID from user request
        const url = `http://localhost:3005/v1/invoices/${invoiceId}/pdf`;

        const response = await axios.get(url, { responseType: 'arraybuffer' });

        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Content-Length:', response.headers['content-length']);

        if (response.headers['content-type'] === 'application/pdf' && response.data.length > 0) {
            console.log('PASS: PDF received successfully.');
            fs.writeFileSync('test_invoice.pdf', response.data);
            console.log('Saved to test_invoice.pdf');
        } else {
            console.log('FAIL: Did not receive a valid PDF.');
        }
    } catch (err) {
        console.error('Test failed:', err.response?.status, err.message);
    }
}

verifyPdf();
