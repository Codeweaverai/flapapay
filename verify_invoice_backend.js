const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

const API_BASE = 'http://localhost:3005';

async function verifyBackend() {
    try {
        console.log('--- Starting Backend Verification ---');

        // 1. Create a test invoice directly in DB to avoid auth for now
        console.log('Creating test invoice...');
        const userRes = await pool.query('SELECT id FROM users LIMIT 1');
        const userId = userRes.rows[0].id;

        const invRes = await pool.query(`
            INSERT INTO invoices (
                user_id, client_name, client_email, invoice_number, 
                invoice_date, due_date, subtotal, total_amount, currency, status, allows_installments
            ) VALUES ($1, $2, $3, $4, NOW(), NOW() + interval '7 days', $5, $5, $6, 'SENT', true)
            RETURNING id, total_amount
        `, [userId, 'Test Client', 'test@example.com', 'TEST-INV-101', 1000.00, 'USD']);

        const invoiceId = invRes.rows[0].id;
        console.log(`Test invoice created: ${invoiceId}`);

        // 2. Verify Public Get
        console.log('\nTesting GET /v1/public/invoices/:id...');
        const getRes = await axios.get(`${API_BASE}/v1/public/invoices/${invoiceId}`);
        console.log('Result:', getRes.data.invoice_number === 'TEST-INV-101' ? 'PASS' : 'FAIL');
        console.log('Allows Installments:', getRes.data.allows_installments);

        // 3. Verify Payment Intent
        console.log('\nTesting POST /v1/public/invoices/:id/intent (Partial Payment)...');
        const intentRes = await axios.post(`${API_BASE}/v1/public/invoices/${invoiceId}/intent`, {
            amount: 400.00,
            email: 'test@example.com'
        });
        console.log('Intent Result:', intentRes.data.clientSecret ? 'PASS' : 'FAIL');

        // 4. Verify Payment Confirmation
        console.log('\nTesting POST /v1/public/invoices/:id/confirm...');
        const confirmRes = await axios.post(`${API_BASE}/v1/public/invoices/${invoiceId}/confirm`, {
            paymentIntentId: 'pi_test_12345',
            amount: 400.00,
            paymentMethod: 'card'
        });
        console.log('Confirm Result:', confirmRes.data.success ? 'PASS' : 'FAIL');
        console.log('Fully Paid:', confirmRes.data.isFullyPaid);

        // 5. Verify DB state after partial payment
        const checkRes = await pool.query('SELECT total_paid, status FROM invoices WHERE id = $1', [invoiceId]);
        console.log('\nFinal DB Check:');
        console.log('Total Paid:', checkRes.rows[0].total_paid);
        console.log('Status:', checkRes.rows[0].status);
        console.log('Test Partial Payment PASSED if Total Paid is 400 and Status is SENT');

        // Clean up
        await pool.query('DELETE FROM invoice_payments WHERE invoice_id = $1', [invoiceId]);
        await pool.query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
        console.log('\n--- Verification Complete ---');

    } catch (err) {
        console.error('Verification failed:', err.response?.data || err.message);
    } finally {
        await pool.end();
    }
}

verifyBackend();
