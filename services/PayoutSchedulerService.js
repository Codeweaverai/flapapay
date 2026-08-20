/**
 * FlapaPay Connect — Payout Scheduler Service
 *
 * Runs every hour via node-cron.
 * For every payout_schedule whose next_run_at <= NOW():
 *   1. Fetch all connected accounts for that platform merchant
 *   2. For each account with available balance >= threshold, trigger a payout
 *   3. Advance next_run_at by the schedule interval
 *
 * Retry logic (Task 1.2):
 *   - On PawaPay failure, writes to payout_retry_log
 *   - RetryWorker (also called hourly) re-attempts failed payouts up to 2 times
 *   - After 2 failures, emits payout.failed webhook and notifies platform
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const PawaPayService = require('./PawaPayService');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678'
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addInterval(date, schedule) {
    const d = new Date(date);
    switch (schedule) {
        case 'daily':   d.setDate(d.getDate() + 1); break;
        case 'weekly':  d.setDate(d.getDate() + 7); break;
        case 'monthly': d.setMonth(d.getMonth() + 1); break;
    }
    return d;
}

// ─── Webhook retry backoff schedule (minutes) ────────────────────────────────
// Attempts: 1→5min, 2→30min, 3→2hr, 4→5hr, 5→10hr (then permanently_failed)
const WEBHOOK_RETRY_DELAYS_MIN = [5, 30, 120, 300, 600];
const WEBHOOK_MAX_RETRIES = WEBHOOK_RETRY_DELAYS_MIN.length;

// ─── Ensure webhook_deliveries has retry columns ─────────────────────────────
async function ensureWebhookRetryColumns() {
    const cols = [
        `ALTER TABLE webhook_deliveries ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'delivered'`,
        `ALTER TABLE webhook_deliveries ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0`,
        `ALTER TABLE webhook_deliveries ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE webhook_deliveries ADD COLUMN IF NOT EXISTS last_error TEXT`,
    ];
    for (const sql of cols) { try { await pool.query(sql); } catch (_) {} }
    // Index for retry worker performance
    try {
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry
            ON webhook_deliveries (status, next_retry_at) WHERE status = 'failed'`);
    } catch (_) {}
}

// ─── Webhook emitter — signs, delivers, and marks for retry on failure ────────
async function emitWebhookForMerchant(merchantId, event, payload) {
    try {
        const endpointsRes = await pool.query(
            `SELECT * FROM webhook_endpoints
             WHERE merchant_id = $1 AND enabled = TRUE
               AND (events @> ARRAY[$2]::text[] OR events @> ARRAY['*']::text[])`,
            [merchantId, event]
        );
        if (endpointsRes.rows.length === 0) return;

        const crypto = require('crypto');
        const axios  = require('axios');

        for (const ep of endpointsRes.rows) {
            const ts   = Math.floor(Date.now() / 1000);
            const body = JSON.stringify({ id: uuidv4(), event, data: payload, created: ts });
            // Stripe-style signature: t={timestamp},v1={hmac}
            const rawSig = `t=${ts},v1=${crypto.createHmac('sha256', ep.signing_secret).update(`${ts}.${body}`).digest('hex')}`;
            const deliveryId = uuidv4();

            try {
                const res = await axios.post(ep.url, JSON.parse(body), {
                    headers: {
                        'Content-Type':       'application/json',
                        'x-flapapay-signature': rawSig,
                        'x-flapapay-event':     event,
                        'x-flapapay-delivery':  deliveryId,
                    },
                    timeout: 10000,
                });

                await pool.query(
                    `INSERT INTO webhook_deliveries
                       (id, endpoint_id, event, payload, response_status, response_body, status, retry_count, delivered_at)
                     VALUES ($1,$2,$3,$4,$5,$6,'delivered',0,NOW())`,
                    [deliveryId, ep.id, event, body, res.status, JSON.stringify(res.data).slice(0, 500)]
                );

            } catch (err) {
                const nextRetryAt = new Date(Date.now() + WEBHOOK_RETRY_DELAYS_MIN[0] * 60 * 1000);
                await pool.query(
                    `INSERT INTO webhook_deliveries
                       (id, endpoint_id, event, payload, response_status, response_body,
                        status, retry_count, next_retry_at, last_error, delivered_at)
                     VALUES ($1,$2,$3,$4,$5,$6,'failed',0,$7,$8,NOW())`,
                    [deliveryId, ep.id, event, body,
                     err.response?.status || 0,
                     (err.message || 'timeout').slice(0, 500),
                     nextRetryAt,
                     (err.message || 'timeout').slice(0, 255)]
                );
                console.warn(`[Webhook] Delivery to ${ep.url} failed — scheduled retry at ${nextRetryAt.toISOString()}`);
            }
        }
    } catch (err) {
        console.error('[Webhook Emitter] Error:', err.message);
    }
}

// ─── Auto-retry failed webhook deliveries ─────────────────────────────────────
// Called every 5 minutes by cron. Exponential backoff, max 5 attempts.
async function retryFailedWebhooks() {
    const dueRows = await pool.query(`
        SELECT wd.*, we.url, we.signing_secret
        FROM webhook_deliveries wd
        JOIN webhook_endpoints we ON we.id = wd.endpoint_id
        WHERE wd.status      = 'failed'
          AND wd.retry_count  < $1
          AND wd.next_retry_at <= NOW()
        ORDER BY wd.next_retry_at ASC
        LIMIT 100
    `, [WEBHOOK_MAX_RETRIES]);

    if (dueRows.rows.length === 0) return;
    console.log(`[WebhookRetry] Retrying ${dueRows.rows.length} failed delivery(s)`);

    const crypto = require('crypto');
    const axios  = require('axios');

    for (const delivery of dueRows.rows) {
        const newRetryCount = delivery.retry_count + 1;
        const payload = typeof delivery.payload === 'string'
            ? JSON.parse(delivery.payload) : delivery.payload;

        // Re-sign with a fresh timestamp
        const ts     = Math.floor(Date.now() / 1000);
        const body   = JSON.stringify({ ...payload, created: ts });
        const rawSig = `t=${ts},v1=${crypto.createHmac('sha256', delivery.signing_secret).update(`${ts}.${body}`).digest('hex')}`;

        try {
            const res = await axios.post(delivery.url, JSON.parse(body), {
                headers: {
                    'Content-Type':        'application/json',
                    'x-flapapay-signature': rawSig,
                    'x-flapapay-event':     delivery.event,
                    'x-flapapay-delivery':  delivery.id,
                    'x-flapapay-retry-num': String(newRetryCount),
                },
                timeout: 10000,
            });

            await pool.query(
                `UPDATE webhook_deliveries
                 SET status='delivered', retry_count=$1, response_status=$2,
                     response_body=$3, delivered_at=NOW(), next_retry_at=NULL
                 WHERE id=$4`,
                [newRetryCount, res.status, JSON.stringify(res.data).slice(0, 500), delivery.id]
            );
            console.log(`[WebhookRetry] Delivery ${delivery.id} succeeded on attempt ${newRetryCount}`);

        } catch (err) {
            const isPermanent = newRetryCount >= WEBHOOK_MAX_RETRIES;
            const nextStatus  = isPermanent ? 'permanently_failed' : 'failed';
            const nextRetry   = isPermanent
                ? null
                : new Date(Date.now() + (WEBHOOK_RETRY_DELAYS_MIN[newRetryCount] ?? 600) * 60 * 1000);

            await pool.query(
                `UPDATE webhook_deliveries
                 SET status=$1, retry_count=$2, next_retry_at=$3,
                     response_status=$4, last_error=$5
                 WHERE id=$6`,
                [nextStatus, newRetryCount, nextRetry,
                 err.response?.status || 0,
                 (err.message || 'timeout').slice(0, 255),
                 delivery.id]
            );

            if (isPermanent) {
                console.error(`[WebhookRetry] Delivery ${delivery.id} PERMANENTLY FAILED after ${newRetryCount} attempts`);
            }
        }
    }
}

// ─── Execute a single payout to a connected account ──────────────────────────
async function executePayout(accountId, amount, currency, platformMerchantId, scheduleId) {
    const client = await pool.connect();
    try {
        // 1. Get the default payout method + account email for this account
        const acctRes = await pool.query(`SELECT email, business_name FROM connected_accounts WHERE id = $1`, [accountId]);
        const acctEmail = acctRes.rows[0]?.email || null;
        const acctBizName = acctRes.rows[0]?.business_name || 'there';

        const methodRes = await client.query(
            `SELECT * FROM connected_account_payout_methods
             WHERE connected_account_id = $1 AND is_default = TRUE
             ORDER BY created_at DESC LIMIT 1`,
            [accountId]
        );

        if (methodRes.rows.length === 0) {
            console.warn(`[Scheduler] Account ${accountId} has no default payout method — skipping`);
            return { status: 'skipped', reason: 'no_payout_method' };
        }

        const method = methodRes.rows[0];
        const details = typeof method.details === 'string' ? JSON.parse(method.details) : method.details;

        // 2. Deduct balance atomically
        await client.query('BEGIN');
        const balRes = await client.query(
            'SELECT (pending_amount + available_amount) as total FROM balances WHERE merchant_id = $1 FOR UPDATE',
            [accountId]
        );

        if (balRes.rows.length === 0 || parseFloat(balRes.rows[0].total) < amount) {
            await client.query('ROLLBACK');
            return { status: 'skipped', reason: 'insufficient_funds' };
        }

        await client.query(
            'UPDATE balances SET pending_amount = pending_amount - $2 WHERE merchant_id = $1',
            [accountId, amount]
        );

        const payoutId = uuidv4();
        const transferRes = await client.query(
            `INSERT INTO transfers (id, source_merchant_id, destination_merchant_id, amount, currency, type, status, metadata)
             VALUES ($1, $2, NULL, $3, $4, 'PAYOUT', 'PENDING', $5) RETURNING id`,
            [payoutId, accountId, amount, currency, JSON.stringify({ scheduled: true, schedule_id: scheduleId })]
        );

        await client.query('COMMIT');

        // 3. Initiate PawaPay disbursement
        let pawaPayStatus = 'SIMULATED';
        try {
            if (method.type === 'mobile_money' && details.number && details.network) {
                const correspondent = PawaPayService.networkToCorrespondent(details.network);
                const result = await PawaPayService.initiateConnectPayout(
                    payoutId, amount, currency, details.number, correspondent
                );
                pawaPayStatus = result.status || 'ACCEPTED';
                await pool.query(
                    "UPDATE transfers SET status = $1, metadata = metadata || $2 WHERE id = $3",
                    [
                        pawaPayStatus === 'ACCEPTED' ? 'PROCESSING' : 'FAILED',
                        JSON.stringify({ pawapay_status: pawaPayStatus }),
                        payoutId
                    ]
                );
                if (pawaPayStatus !== 'ACCEPTED') throw new Error(`PawaPay rejected payout: ${pawaPayStatus}`);
            } else {
                // No live payout method configured — mark simulated success
                await pool.query("UPDATE transfers SET status = 'COMPLETED' WHERE id = $1", [payoutId]);
            }
        } catch (pawaErr) {
            // Log for retry
            await pool.query(
                `INSERT INTO payout_retry_log (id, transfer_id, account_id, amount, currency, payout_method, attempt, error, next_retry_at)
                 VALUES ($1,$2,$3,$4,$5,$6,1,$7, NOW() + INTERVAL '30 minutes')`,
                [uuidv4(), payoutId, accountId, amount, currency, JSON.stringify(details), pawaErr.message]
            );
            console.warn(`[Scheduler] Payout ${payoutId} queued for retry: ${pawaErr.message}`);
            await emitWebhookForMerchant(platformMerchantId, 'payout.initiated', { payout_id: payoutId, account_id: accountId, amount, status: 'retry_queued' });
            return { status: 'retry_queued', payoutId };
        }

        // 4. Emit webhook
        await emitWebhookForMerchant(platformMerchantId, 'payout.completed', {
            payout_id: payoutId, account_id: accountId, amount, currency, status: 'COMPLETED'
        });

        // 5. Write ledger entry
        pool.query(
            `INSERT INTO connect_ledger
                (platform_merchant_id, entry_type, charge_id, account_id, amount, currency, direction, description, livemode)
             VALUES ($1, 'payout_disbursed', $2, $3, $4, $5, 'debit', $6, $7)`,
            [
                platformMerchantId,
                payoutId,
                accountId,
                amount,
                currency,
                `Payout disbursed to account ${accountId}`,
                false
            ]
        ).catch(err => console.error('[Scheduler] Ledger write failed:', err.message));

        // 6. Email sub-merchant
        if (acctEmail) {
            try {
                const { Resend } = require('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);
                resend.emails.send({
                    from: 'FlapaPay <noreply@flapapay.com>',
                    to: [acctEmail],
                    subject: `Your payout of ${currency} ${amount.toLocaleString()} has been sent`,
                    html: `<p>Hi ${acctBizName},</p><p>We've processed a payout of <strong>${currency} ${amount.toLocaleString()}</strong> to your registered mobile money account.</p><p>You should receive the funds within a few minutes depending on your network operator.</p><p>Reference: <code>${payoutId}</code></p><p>— The FlapaPay Team</p>`,
                }).catch(e => console.error('[Email] Payout notification failed:', e.message));
            } catch { /* resend not available */ }
        }

        return { status: 'completed', payoutId };
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`[Scheduler] executePayout error for ${accountId}:`, err.message);
        return { status: 'error', error: err.message };
    } finally {
        client.release();
    }
}

// ─── Main scheduler tick — called by cron every hour ─────────────────────────
async function runSchedulerTick() {
    console.log('[PayoutScheduler] Running tick at', new Date().toISOString());
    try {
        // Fetch all due schedules
        const dueRes = await pool.query(
            `SELECT ps.*, ca.id as account_id, ca.platform_merchant_id,
                    (b.pending_amount + b.available_amount) as total_balance
             FROM payout_schedules ps
             JOIN connected_accounts ca ON ca.id = ps.account_id
             LEFT JOIN balances b ON b.merchant_id = ca.id
             WHERE ps.enabled = TRUE
               AND ps.next_run_at <= NOW()`,
        );

        console.log(`[PayoutScheduler] ${dueRes.rows.length} schedule(s) due`);

        for (const schedule of dueRes.rows) {
            const balance = parseFloat(schedule.total_balance || 0);
            const threshold = parseFloat(schedule.min_threshold);

            if (balance < threshold) {
                console.log(`[PayoutScheduler] Account ${schedule.account_id}: balance ${balance} < threshold ${threshold}, skipping`);
            } else {
                console.log(`[PayoutScheduler] Triggering payout for account ${schedule.account_id}: ${balance} ${schedule.currency}`);
                await executePayout(
                    schedule.account_id,
                    balance,
                    schedule.currency,
                    schedule.platform_merchant_id,
                    schedule.id
                );
            }

            // Advance next_run_at regardless of whether payout was triggered
            const nextRun = addInterval(new Date(), schedule.schedule);
            await pool.query(
                'UPDATE payout_schedules SET next_run_at = $1, last_run_at = NOW() WHERE id = $2',
                [nextRun, schedule.id]
            );
        }
    } catch (err) {
        console.error('[PayoutScheduler] Tick error:', err.message);
    }
}

// ─── Retry worker — retries failed payouts ────────────────────────────────────
async function runRetryWorker() {
    try {
        const retries = await pool.query(
            `SELECT rl.*, ca.platform_merchant_id,
                    m.details as payout_method_details
             FROM payout_retry_log rl
             JOIN connected_accounts ca ON ca.id = rl.account_id
             WHERE rl.resolved = FALSE
               AND rl.attempt < 3
               AND rl.next_retry_at <= NOW()`,
        );

        for (const retry of retries.rows) {
            console.log(`[RetryWorker] Retrying payout ${retry.transfer_id} (attempt ${retry.attempt + 1})`);
            try {
                const method = typeof retry.payout_method === 'string'
                    ? JSON.parse(retry.payout_method)
                    : retry.payout_method;

                if (method?.number && method?.network) {
                    const correspondent = PawaPayService.networkToCorrespondent(method.network);
                    const result = await PawaPayService.initiateConnectPayout(
                        retry.transfer_id, retry.amount, retry.currency, method.number, correspondent
                    );
                    if (result.status === 'ACCEPTED') {
                        await pool.query(
                            "UPDATE transfers SET status = 'PROCESSING' WHERE id = $1",
                            [retry.transfer_id]
                        );
                        await pool.query(
                            'UPDATE payout_retry_log SET resolved = TRUE WHERE id = $1',
                            [retry.id]
                        );
                        await emitWebhookForMerchant(retry.platform_merchant_id, 'payout.completed', {
                            payout_id: retry.transfer_id, account_id: retry.account_id,
                            amount: retry.amount, currency: retry.currency
                        });
                        continue;
                    }
                }
                throw new Error('Retry payout rejected or no valid method');
            } catch (retryErr) {
                const newAttempt = retry.attempt + 1;
                if (newAttempt >= 3) {
                    // Final failure — mark resolved (failed), notify platform
                    await pool.query(
                        `UPDATE payout_retry_log SET attempt = $1, resolved = TRUE, error = $2 WHERE id = $3`,
                        [newAttempt, retryErr.message, retry.id]
                    );
                    await pool.query(
                        "UPDATE transfers SET status = 'FAILED' WHERE id = $1",
                        [retry.transfer_id]
                    );
                    // Refund balance to sub-merchant
                    await pool.query(
                        'UPDATE balances SET available_amount = available_amount + $2 WHERE merchant_id = $1',
                        [retry.account_id, retry.amount]
                    );
                    await emitWebhookForMerchant(retry.platform_merchant_id, 'payout.failed', {
                        payout_id: retry.transfer_id, account_id: retry.account_id,
                        amount: retry.amount, currency: retry.currency,
                        reason: retryErr.message
                    });
                    console.error(`[RetryWorker] Payout ${retry.transfer_id} PERMANENTLY FAILED after 3 attempts`);
                } else {
                    await pool.query(
                        `UPDATE payout_retry_log SET attempt = $1, error = $2, next_retry_at = NOW() + INTERVAL '30 minutes' WHERE id = $3`,
                        [newAttempt, retryErr.message, retry.id]
                    );
                }
            }
        }
    } catch (err) {
        console.error('[RetryWorker] Error:', err.message);
    }
}

module.exports = { runSchedulerTick, runRetryWorker, executePayout, emitWebhookForMerchant, retryFailedWebhooks, ensureWebhookRetryColumns };
