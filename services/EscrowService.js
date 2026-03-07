const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { Resend } = require('resend');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678'
});

const resend = new Resend(process.env.RESEND_API_KEY);
const ESCROW_HOLD_WALLET_ID = '00000000-0000-0000-0000-000000000001';
const SYSTEM_FEE_WALLET_ID = '00000000-0000-0000-0000-000000000000';

class EscrowService {
    static async sendEscrowEmail(to, subject, html) {
        try {
            await resend.emails.send({
                from: 'FlapaPay Escrow <noreply@skillpulse.cloud>',
                to: [to],
                subject,
                html
            });
        } catch (e) {
            console.error('Failed to send escrow email:', e);
        }
    }

    // Workflow 1: Escrow Creation
    static async createEscrow(data, buyerId) {
        const { sellerEmail, amount, currency, description, instructions, deliveryTimeframe, inspectionPeriod } = data;

        // Find seller if they exist
        const sellerRes = await pool.query('SELECT id, full_name FROM users WHERE email = $1', [sellerEmail]);
        const sellerId = sellerRes.rows.length > 0 ? sellerRes.rows[0].id : null;
        const sellerName = sellerRes.rows.length > 0 ? sellerRes.rows[0].full_name : 'Valued Seller';

        const result = await pool.query(
            `INSERT INTO escrows 
            (buyer_id, seller_id, seller_email, amount, currency, description, instructions, delivery_timeframe, inspection_period, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'CREATED')
            RETURNING *`,
            [buyerId, sellerId, sellerEmail, amount, currency, description, instructions, deliveryTimeframe, inspectionPeriod]
        );

        const escrow = result.rows[0];

        // Send Notification Email
        if (sellerId) {
            await this.sendEscrowEmail(
                sellerEmail,
                `New Escrow Proposed: ${currency} ${amount}`,
                `<h1>New Escrow Transaction</h1>
                 <p>Hello ${sellerName}, a buyer has proposed an escrow transaction for "${description}".</p>
                 <p>Amount: ${currency} ${amount}</p>
                 <p>Please log in to FlapaPay to review and accept the terms.</p>`
            );
        } else {
            // Invite non-registered seller
            await this.sendEscrowEmail(
                sellerEmail,
                `Action Required: ${currency} ${amount} Waiting in Escrow`,
                `<h1>Welcome to FlapaPay Escrow</h1>
                 <p>You have been invited to a secure transaction for "${description}".</p>
                 <p>Amount: ${currency} ${amount}</p>
                 <p>To claim these funds, please register an account using this email: <a href="https://flapapay.com/signup">Sign Up Now</a></p>`
            );
        }

        return escrow;
    }

    // Workflow 2: Escrow Funding
    static async fundEscrow(escrowId, buyerId, options = {}) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const escrowRes = await client.query('SELECT * FROM escrows WHERE id = $1 AND buyer_id = $2 FOR UPDATE', [escrowId, buyerId]);
            if (escrowRes.rows.length === 0) throw new Error('Escrow not found or unauthorized');
            const escrow = escrowRes.rows[0];

            if (escrow.status !== 'CREATED' && escrow.status !== 'PENDING_PAYMENT') throw new Error('Escrow already funded or in terminal state');

            // Get Buyer Wallet
            const walletRes = await client.query('SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE', [buyerId, escrow.currency]);
            if (walletRes.rows.length === 0) throw new Error('Source wallet not found');
            const wallet = walletRes.rows[0];

            const txRef = uuidv4();

            if (options.source === 'card' && options.paymentMethodId) {
                const userRes = await client.query('SELECT stripe_customer_id FROM users WHERE id = $1', [buyerId]);
                const stripeCustomerId = userRes.rows[0]?.stripe_customer_id;
                if (!stripeCustomerId) throw new Error('No linked payment method exists.');

                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(parseFloat(escrow.amount) * 100),
                    currency: escrow.currency.toLowerCase(),
                    customer: stripeCustomerId,
                    payment_method: options.paymentMethodId,
                    off_session: true,
                    confirm: true,
                });

                if (paymentIntent.status !== 'succeeded') throw new Error('Card payment failed');

                await client.query(
                    `INSERT INTO ledger_entries 
                    (transaction_reference, debit_wallet_id, credit_wallet_id, amount, currency, description, transaction_type, status)
                    VALUES ($1, NULL, $2, $3, $4, $5, 'CARD_DEPOSIT', 'COMPLETED')`,
                    [uuidv4(), wallet.id, escrow.amount, escrow.currency, 'Card Deposit for Escrow Funding']
                );
            } else {
                if (parseFloat(wallet.balance) < parseFloat(escrow.amount)) throw new Error('Insufficient funds in wallet');
                await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [escrow.amount, wallet.id]);
            }

            await client.query(
                `INSERT INTO ledger_entries 
                (transaction_reference, debit_wallet_id, credit_wallet_id, amount, currency, description, transaction_type, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'ESCROW_FUNDING', 'COMPLETED')`,
                [txRef, wallet.id, ESCROW_HOLD_WALLET_ID, escrow.amount, escrow.currency, `Funding escrow ${escrowId.slice(0, 8)}`]
            );

            await client.query("UPDATE escrows SET status = 'FUNDED', updated_at = NOW() WHERE id = $1", [escrowId]);
            await client.query(
                'INSERT INTO escrow_transactions (escrow_id, transaction_type, amount, wallet_reference) VALUES ($1, $2, $3, $4)',
                [escrowId, 'FUNDING', escrow.amount, txRef]
            );

            await client.query('COMMIT');

            // Email Notifications (Triggered by Postgres but we also send emails here for immediate effect)
            if (escrow.seller_email) {
                await this.sendEscrowEmail(
                    escrow.seller_email,
                    `Funds Secured: Escrow ${escrowId.slice(0, 8)}`,
                    `<h1>Funds are Secured!</h1>
                     <p>The buyer has deposited ${escrow.currency} ${escrow.amount} for "${escrow.description}".</p>
                     <p>You can now proceed to ship the item or deliver the service.</p>`
                );
            }

            return { success: true };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    // Workflow 3: Seller Marks as Shipped
    static async markAsShipped(escrowId, sellerId, shipmentDetails = {}) {
        const result = await pool.query(
            "UPDATE escrows SET status = 'SHIPPED', updated_at = NOW() WHERE id = $1 AND seller_id = $2 AND status = 'FUNDED' RETURNING *",
            [escrowId, sellerId]
        );
        if (result.rows.length === 0) throw new Error('Escrow not found or invalid status');

        const escrow = result.rows[0];
        const buyerRes = await pool.query('SELECT email FROM users WHERE id = $1', [escrow.buyer_id]);

        await this.sendEscrowEmail(
            buyerRes.rows[0].email,
            `Item Shipped: Escrow ${escrowId.slice(0, 8)}`,
            `<h1>Item on the Way!</h1>
             <p>The seller has marked "${escrow.description}" as shipped.</p>
             <p>Track your shipment and confirm delivery once received to proceed.</p>`
        );

        return escrow;
    }

    // Workflow 4: Buyer Confirms Delivery
    static async confirmDelivery(escrowId, buyerId) {
        const result = await pool.query(
            "UPDATE escrows SET status = 'DELIVERED', updated_at = NOW() WHERE id = $1 AND buyer_id = $2 AND status = 'SHIPPED' RETURNING *",
            [escrowId, buyerId]
        );
        if (result.rows.length === 0) throw new Error('Escrow not found or invalid status');

        const escrow = result.rows[0];
        if (escrow.seller_email) {
            await this.sendEscrowEmail(
                escrow.seller_email,
                `Delivery Confirmed: Escrow ${escrowId.slice(0, 8)}`,
                `<h1>Delivery Confirmed</h1>
                 <p>The buyer has confirmed receipt of "${escrow.description}".</p>
                 <p>The transaction is now awaiting final release request.</p>`
            );
        }

        return escrow;
    }

    // Workflow 5: Release Request
    static async requestRelease(escrowId, buyerId) {
        const result = await pool.query(
            "UPDATE escrows SET status = 'RELEASE_REQUESTED', updated_at = NOW() WHERE id = $1 AND buyer_id = $2 AND status IN ('FUNDED', 'DELIVERED', 'SHIPPED') RETURNING *",
            [escrowId, buyerId]
        );
        if (result.rows.length === 0) throw new Error('Escrow not found or invalid status');
        return result.rows[0];
    }

    // Workflow 6: Admin Approval and Release
    static async approveRelease(escrowId, adminId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const adminRes = await client.query('SELECT role FROM users WHERE id = $1', [adminId]);
            if (adminRes.rows[0]?.role !== 'admin') throw new Error('Admin privileges required');

            const escrowRes = await client.query('SELECT * FROM escrows WHERE id = $1 FOR UPDATE', [escrowId]);
            const escrow = escrowRes.rows[0];
            if (!escrow || escrow.status !== 'RELEASE_REQUESTED') throw new Error('Invalid escrow or status');

            const sWalletRes = await client.query('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [escrow.seller_id, escrow.currency]);
            const sellerWalletId = sWalletRes.rows[0].id;

            const fee = (parseFloat(escrow.amount) * (parseFloat(escrow.escrow_fee_percent || 2) / 100)).toFixed(2);
            const netAmount = (parseFloat(escrow.amount) - parseFloat(fee)).toFixed(2);

            const txRef = uuidv4();
            // Move Net to Seller
            await client.query(
                `INSERT INTO ledger_entries 
                (transaction_reference, debit_wallet_id, credit_wallet_id, amount, currency, description, transaction_type, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'ESCROW_RELEASE', 'COMPLETED')`,
                [txRef, ESCROW_HOLD_WALLET_ID, sellerWalletId, netAmount, escrow.currency, `Payout for Escrow ${escrowId.slice(0, 8)}`]
            );
            await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [netAmount, sellerWalletId]);

            // Move Fee to System
            if (parseFloat(fee) > 0) {
                await client.query(
                    `INSERT INTO ledger_entries 
                    (transaction_reference, debit_wallet_id, credit_wallet_id, amount, currency, description, transaction_type, status)
                    VALUES ($1, $2, $3, $4, $5, $6, 'ESCROW_FEE', 'COMPLETED')`,
                    [uuidv4(), ESCROW_HOLD_WALLET_ID, SYSTEM_FEE_WALLET_ID, fee, escrow.currency, `Fee for Escrow ${escrowId.slice(0, 8)}`]
                );
            }

            await client.query("UPDATE escrows SET status = 'RELEASED', updated_at = NOW(), escrow_fee_amount = $2 WHERE id = $1", [escrowId, fee]);
            await client.query('COMMIT');

            // Final Payout Email
            await this.sendEscrowEmail(
                escrow.seller_email,
                `Funds Released! Escrow ${escrowId.slice(0, 8)}`,
                `<h1>You've Been Paid!</h1>
                 <p>Funds for "${escrow.description}" have been released to your wallet.</p>
                 <p>Net Amount: ${escrow.currency} ${netAmount}</p>`
            );

            return { success: true };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    // Workflow 7: Dispute Handling
    static async disputeEscrow(escrowId, userId, reason, evidenceUrl) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const escrowRes = await client.query('SELECT * FROM escrows WHERE id = $1', [escrowId]);
            const escrow = escrowRes.rows[0];
            if (!escrow || (escrow.buyer_id !== userId && escrow.seller_id !== userId)) throw new Error('Unauthorized');

            await client.query("UPDATE escrows SET status = 'DISPUTED', updated_at = NOW() WHERE id = $1", [escrowId]);
            await client.query(
                `INSERT INTO escrow_disputes (escrow_id, reason, evidence_url, status) 
                 VALUES ($1, $2, $3, 'OPEN')`,
                [escrowId, reason, evidenceUrl]
            );

            await client.query('COMMIT');
            return { success: true };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    // legacy bridge (renamed/optimized)
    static async markAsDelivered(escrowId, sellerId) {
        return this.markAsShipped(escrowId, sellerId);
    }
}

module.exports = EscrowService;
