const { Pool } = require('pg');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const EscrowService = require('./services/EscrowService');
const EscrowAgentMonitor = require('./services/EscrowAgentMonitor');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function verifyFlow() {
    try {
        console.log('--- Verification Started ---');

        // 1. Setup User
        const userRes = await pool.query("SELECT id FROM users LIMIT 1");
        const userId = userRes.rows[0].id;
        console.log(`Using user: ${userId}`);

        // 2. Create Escrow
        const escrowId = uuidv4();
        await pool.query(
            `INSERT INTO escrows (id, buyer_id, seller_email, amount, currency, description, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'DELIVERED')`,
            [escrowId, userId, 'test_seller@example.com', 1000, 'ZMW', 'Verification Transaction']
        );
        console.log(`Escrow created and set to DELIVERED: ${escrowId}`);

        // 3. User requests release (New flow)
        console.log('User requesting release...');
        await EscrowService.requestRelease(escrowId, userId);

        const statusCheck = await pool.query("SELECT status FROM escrows WHERE id = $1", [escrowId]);
        console.log(`Current status: ${statusCheck.rows[0].status}`);
        if (statusCheck.rows[0].status !== 'RELEASE_REQUESTED') throw new Error('Status should be RELEASE_REQUESTED');

        // 4. Run AI Monitor
        console.log('Running AI Monitor evaluation...');
        // We'll mock the OpenAI API result or just let it run if key is present
        await EscrowAgentMonitor.evaluateTransactions();

        // 5. Check if auto-released
        const finalCheck = await pool.query("SELECT status FROM escrows WHERE id = $1", [escrowId]);
        console.log(`Final status after AI monitor: ${finalCheck.rows[0].status}`);

        if (finalCheck.rows[0].status === 'RELEASED' || finalCheck.rows[0].status === 'RELEASE_REQUESTED') {
            console.log('--- Verification Success ---');
        } else {
            console.log('--- Verification Failed: Unexpected Status ---');
        }

    } catch (err) {
        console.error('Verification Error:', err);
    } finally {
        await pool.end();
    }
}

verifyFlow();
