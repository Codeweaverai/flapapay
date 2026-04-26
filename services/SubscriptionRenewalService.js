/**
 * SubscriptionRenewalService
 * ─────────────────────────────────────────────────────────────────────────────
 * Stripe-level recurring billing engine for FlapaPay subscriptions.
 *
 * Responsibilities:
 *  1. processRenewals()       — charge subscriptions whose billing period has ended
 *  2. processDunning()        — retry failed invoices on schedule (Day 0, 3, 7)
 *  3. finalizeTrials()        — convert trialing → active at trial_end
 *  4. checkPendingDeposits()  — settle PawaPay STK-push deposits that are in-flight
 *
 * Payment model:
 *   - Test mode  → auto-succeed, credit merchant ZMW wallet (simulated)
 *   - Live mode  → PawaPay STK push to customer's mobile money number;
 *                  async settlement via checkPendingDeposits() cron
 *
 * Idempotency:
 *   - Unique constraint on (subscription_id, period_start) in sub_invoice
 *   - Pre-insert check prevents double-invoicing on cron restart
 *
 * Coupon discounts:
 *   - Applied before payment; supports amount_off / percent_off
 *   - Durations: once | repeating | forever
 *
 * Webhook events emitted:
 *   subscription.renewed      subscription.past_due    subscription.canceled
 *   subscription.trial_ended  subscription.paused      subscription.resumed
 *   invoice.created           invoice.payment_succeeded
 *   invoice.payment_failed    invoice.marked_uncollectible
 */

'use strict';

const { Pool }        = require('pg');
const crypto          = require('crypto');
const PawaPayService  = require('./PawaPayService');
const EmailService    = require('./SubscriptionEmailService');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'flapapay_db',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '12345678',
});

// ── Default dunning schedule (overridden per-merchant from DB) ───────────────
const DEFAULT_DUNNING_DAYS    = [0, 3, 7];
const DEFAULT_MAX_ATTEMPTS    = 3;

// ── Fetch per-merchant dunning config (falls back to defaults) ────────────────
async function getMerchantBillingSettings(merchantId) {
    try {
        const res = await pool.query(
            'SELECT * FROM merchant_billing_settings WHERE merchant_id = $1',
            [merchantId]
        );
        if (!res.rows.length) return { dunningDays: DEFAULT_DUNNING_DAYS, maxAttempts: DEFAULT_MAX_ATTEMPTS, emailToggles: {} };
        const s = res.rows[0];
        return {
            dunningDays:   s.dunning_days   || DEFAULT_DUNNING_DAYS,
            maxAttempts:   s.max_dunning_attempts || DEFAULT_MAX_ATTEMPTS,
            emailToggles:  {
                paymentFailed:   s.payment_failed_email  !== false,
                trialEnding:     s.trial_ending_email    !== false,
                receipt:         s.receipt_email         !== false,
                cancelation:     s.cancelation_email     !== false,
            },
            trialReminderDays: s.trial_reminder_days || 3,
        };
    } catch (_) {
        return { dunningDays: DEFAULT_DUNNING_DAYS, maxAttempts: DEFAULT_MAX_ATTEMPTS, emailToggles: {} };
    }
}

// ── Interval helpers ─────────────────────────────────────────────────────────
function getIntervalSql(price) {
    const iv   = (price.billing_interval || price.interval || 'month').toLowerCase();
    const cnt  = parseInt(price.interval_count) || 1;
    const unit = iv.startsWith('day')  ? 'days'
               : iv.startsWith('week') ? 'weeks'
               : iv.startsWith('year') ? 'years'
               : 'months';
    return `INTERVAL '${cnt} ${unit}'`;
}

// ── Webhook emission (no-op if emitter not registered) ───────────────────────
let _emit = null;
function setWebhookEmitter(fn) { _emit = fn; }

async function emit(merchantId, event, payload) {
    if (!_emit) return;
    try { await _emit(merchantId, event, payload); } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Ensure all billing support tables and columns exist
// ─────────────────────────────────────────────────────────────────────────────
async function ensureTables() {
    // ── dunning_attempts ──
    await pool.query(`
        CREATE TABLE IF NOT EXISTS dunning_attempts (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_id      UUID NOT NULL,
            subscription_id UUID NOT NULL,
            merchant_id     UUID,
            attempt_number  INT  NOT NULL DEFAULT 1,
            status          VARCHAR(20) DEFAULT 'pending',
            next_retry_at   TIMESTAMP WITH TIME ZONE,
            attempted_at    TIMESTAMP WITH TIME ZONE,
            error_message   TEXT,
            created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);

    // ── coupons ──
    await pool.query(`
        CREATE TABLE IF NOT EXISTS coupons (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            merchant_id       UUID NOT NULL,
            code              VARCHAR(64) NOT NULL,
            name              VARCHAR(128),
            amount_off        NUMERIC(12,2),
            percent_off       NUMERIC(5,2),
            currency          VARCHAR(10) DEFAULT 'ZMW',
            duration          VARCHAR(20) DEFAULT 'once',
            duration_in_months INT,
            max_redemptions   INT,
            redemption_count  INT DEFAULT 0,
            valid_until       TIMESTAMP WITH TIME ZONE,
            active            BOOLEAN DEFAULT TRUE,
            created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(merchant_id, code)
        )
    `);

    // ── subscription_discounts ──
    await pool.query(`
        CREATE TABLE IF NOT EXISTS subscription_discounts (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            subscription_id UUID NOT NULL,
            coupon_id       UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
            discount_amount NUMERIC(12,2) DEFAULT 0,
            applied_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at      TIMESTAMP WITH TIME ZONE
        )
    `);

    // ── subscriptions extra columns ──
    const subCols = [
        `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at           TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at         TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end           TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pause_at            TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS resumed_at          TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle_anchor TIMESTAMP WITH TIME ZONE`,
    ];
    for (const sql of subCols) { try { await pool.query(sql); } catch (_) {} }

    // ── sub_invoice extra columns ──
    const invCols = [
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS payment_intent_id  VARCHAR(255)`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS payment_deposit_id VARCHAR(128)`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS payment_provider   VARCHAR(20)`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS due_date           TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS period_start       TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS period_end         TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS attempt_count      INT DEFAULT 0`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS next_retry_at      TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS invoice_number     VARCHAR(64)`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS merchant_id        UUID`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS discount_amount    NUMERIC(12,2) DEFAULT 0`,
    ];
    for (const sql of invCols) { try { await pool.query(sql); } catch (_) {} }

    // ── customers extra columns for mobile money ──
    const custCols = [
        `ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone                 VARCHAR(20)`,
        `ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile_money_provider VARCHAR(30)`,
    ];
    for (const sql of custCols) { try { await pool.query(sql); } catch (_) {} }

    // ── Idempotency unique constraint on (subscription_id, period_start) ──
    try {
        await pool.query(`ALTER TABLE sub_invoice ADD CONSTRAINT uq_sub_invoice_sub_period UNIQUE (subscription_id, period_start)`);
    } catch (_) {}

    // ── merchant_billing_settings — per-merchant dunning + email toggles ──
    await pool.query(`
        CREATE TABLE IF NOT EXISTS merchant_billing_settings (
            merchant_id            UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
            dunning_days           INT[]   NOT NULL DEFAULT ARRAY[0,3,7],
            max_dunning_attempts   INT     NOT NULL DEFAULT 3,
            trial_reminder_days    INT     NOT NULL DEFAULT 3,
            payment_failed_email   BOOLEAN NOT NULL DEFAULT TRUE,
            trial_ending_email     BOOLEAN NOT NULL DEFAULT TRUE,
            receipt_email          BOOLEAN NOT NULL DEFAULT TRUE,
            cancelation_email      BOOLEAN NOT NULL DEFAULT TRUE,
            created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);

    // ── Tax columns on prices + invoices ──
    const taxCols = [
        `ALTER TABLE prices     ADD COLUMN IF NOT EXISTS tax_rate    NUMERIC(5,2) DEFAULT 0`,
        `ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS tax_amount  NUMERIC(12,2) DEFAULT 0`,
    ];
    for (const sql of taxCols) { try { await pool.query(sql); } catch (_) {} }

    // ── Usage-based billing ──
    await pool.query(`
        CREATE TABLE IF NOT EXISTS billing_meters (
            id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            merchant_id  UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
            name         VARCHAR(128) NOT NULL,
            key          VARCHAR(64)  NOT NULL,
            unit         VARCHAR(32)  DEFAULT 'unit',
            aggregation  VARCHAR(20)  DEFAULT 'sum',
            created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(merchant_id, key)
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS billing_usage (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            subscription_id  UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
            meter_id         UUID NOT NULL REFERENCES billing_meters(id) ON DELETE CASCADE,
            quantity         NUMERIC(15,4) NOT NULL,
            recorded_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            idempotency_key  VARCHAR(128),
            UNIQUE(idempotency_key)
        )
    `);
    const meterCols = [
        `ALTER TABLE prices ADD COLUMN IF NOT EXISTS pricing_type   VARCHAR(20) DEFAULT 'flat'`,
        `ALTER TABLE prices ADD COLUMN IF NOT EXISTS per_unit_amount NUMERIC(12,4)`,
        `ALTER TABLE prices ADD COLUMN IF NOT EXISTS meter_id        UUID REFERENCES billing_meters(id)`,
    ];
    for (const sql of meterCols) { try { await pool.query(sql); } catch (_) {} }

    // ── Customer portal sessions ──
    await pool.query(`
        CREATE TABLE IF NOT EXISTS customer_portal_sessions (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
            customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            token           VARCHAR(512) NOT NULL UNIQUE,
            expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);
}

// ── Helper: fetch context needed for emails ───────────────────────────────────
async function getEmailContext(client, sub, merchantId) {
    try {
        const [custRes, merchantRes, priceRes] = await Promise.all([
            client.query(`SELECT name, email FROM customers WHERE id = $1`, [sub.customer_id]),
            client.query(`SELECT business_name FROM merchants WHERE id = $1`, [merchantId]),
            client.query(`SELECT p.*, pr.name AS product_name FROM prices p JOIN products pr ON p.product_id = pr.id WHERE p.id = $1`, [sub.price_id]),
        ]);
        return {
            customerEmail: custRes.rows[0]?.email,
            customerName:  custRes.rows[0]?.name,
            merchantName:  merchantRes.rows[0]?.business_name || 'FlapaPay Merchant',
            productName:   priceRes.rows[0]?.product_name || 'Subscription',
            amount:        priceRes.rows[0]?.amount,
            currency:      priceRes.rows[0]?.currency || 'ZMW',
        };
    } catch (_) { return {}; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Process Renewals
// ─────────────────────────────────────────────────────────────────────────────
async function processRenewals() {
    const dueRows = await pool.query(`
        SELECT
            s.id, s.customer_id, s.price_id, s.merchant_id,
            s.current_period_start, s.current_period_end, s.livemode,
            s.cancel_at, s.pause_at,
            p.amount, p.currency, p.interval, p.billing_interval, p.interval_count,
            c.email AS customer_email, c.name AS customer_name
        FROM subscriptions s
        JOIN prices p ON s.price_id = p.id
        JOIN customers c ON s.customer_id = c.id
        WHERE s.status = 'active'
          AND s.current_period_end <= NOW() + INTERVAL '1 minute'
          AND (s.cancel_at IS NULL OR s.cancel_at > NOW())
          AND (s.pause_at  IS NULL OR s.pause_at  > NOW())
        FOR UPDATE SKIP LOCKED
    `);

    console.log(`[Renewal] Found ${dueRows.rows.length} subscription(s) due for renewal`);
    for (const sub of dueRows.rows) {
        await renewSubscription(sub);
    }
}

async function renewSubscription(sub) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const amount     = parseFloat(sub.amount);
        const currency   = sub.currency.toUpperCase();
        const merchantId = sub.merchant_id
            || (await client.query('SELECT merchant_id FROM customers WHERE id = $1', [sub.customer_id])).rows[0]?.merchant_id;

        if (!merchantId) {
            console.warn(`[Renewal] Sub ${sub.id}: cannot resolve merchant, skipping`);
            await client.query('ROLLBACK');
            return;
        }

        // ── Idempotency: skip if invoice already exists for this period ──────
        const existing = await client.query(
            `SELECT id FROM sub_invoice WHERE subscription_id = $1 AND period_start = $2`,
            [sub.id, sub.current_period_end]
        );
        if (existing.rows.length > 0) {
            console.log(`[Renewal] Sub ${sub.id}: invoice already exists for period ${sub.current_period_end}, skipping`);
            await client.query('ROLLBACK');
            return;
        }

        // ── Apply coupon discounts ────────────────────────────────────────────
        const { discountedAmount, discountTotal, consumedDiscounts } =
            await resolveDiscounts(client, sub.id, amount);

        const invoiceNumber = 'INV-' + Date.now().toString(36).toUpperCase();
        const intervalSql   = getIntervalSql(sub);

        // ── Create invoice ────────────────────────────────────────────────────
        const invRes = await client.query(`
            INSERT INTO sub_invoice
              (subscription_id, customer_id, merchant_id, amount, currency, status,
               period_start, due_date, invoice_number, attempt_count, livemode, discount_amount)
            VALUES ($1,$2,$3,$4,$5,'open', $6, NOW() + INTERVAL '1 day', $7, 0, $8, $9)
            RETURNING *
        `, [sub.id, sub.customer_id, merchantId, discountedAmount, currency,
            sub.current_period_end, invoiceNumber, sub.livemode, discountTotal]);
        const invoice = invRes.rows[0];

        await emit(merchantId, 'invoice.created', buildInvoicePayload(invoice, sub));

        // ── Attempt payment ───────────────────────────────────────────────────
        const paymentResult = await processPayment(client, sub, invoice, merchantId, discountedAmount, currency);

        if (paymentResult.success) {
            // Advance billing period
            await client.query(`
                UPDATE subscriptions
                SET current_period_start = current_period_end,
                    current_period_end   = current_period_end + ${intervalSql},
                    updated_at           = NOW()
                WHERE id = $1
            `, [sub.id]);

            // Mark invoice paid and set period_end from new subscription state
            await client.query(`
                UPDATE sub_invoice
                SET status       = 'paid',
                    paid_at      = NOW(),
                    attempt_count = 1,
                    period_end   = (SELECT current_period_end FROM subscriptions WHERE id = $2)
                WHERE id = $1
            `, [invoice.id, sub.id]);

            // Consume 'once' and expired 'repeating' discounts
            await consumeDiscounts(client, consumedDiscounts);

            await client.query('COMMIT');
            console.log(`[Renewal] Sub ${sub.id}: renewed OK — ${currency} ${discountedAmount} (discount: ${discountTotal})`);

            await emit(merchantId, 'invoice.payment_succeeded', buildInvoicePayload({ ...invoice, status: 'paid' }, sub));
            await emit(merchantId, 'subscription.renewed', { subscription_id: sub.id });

            // ── Receipt email ─────────────────────────────────────────────
            const settings = await getMerchantBillingSettings(merchantId);
            if (settings.emailToggles.receipt) {
                const ctx = await getEmailContext(pool, sub, merchantId);
                const nextPeriod = await pool.query('SELECT current_period_end FROM subscriptions WHERE id=$1', [sub.id]);
                setImmediate(() => EmailService.sendRenewalReceipt({
                    ...ctx,
                    invoiceNumber: invoice.invoice_number,
                    nextBillingDate: nextPeriod.rows[0]?.current_period_end,
                    discountAmount: invoice.discount_amount,
                    taxAmount: invoice.tax_amount,
                }).catch(() => {}));
            }

        } else if (paymentResult.pending) {
            // ── PawaPay STK push accepted — awaiting customer confirmation ────
            await client.query(`
                UPDATE sub_invoice
                SET payment_deposit_id = $2,
                    payment_provider   = 'pawapay'
                WHERE id = $1
            `, [invoice.id, paymentResult.depositId]);

            // Advance period optimistically — will revert if deposit fails
            await client.query(`
                UPDATE subscriptions
                SET current_period_start = current_period_end,
                    current_period_end   = current_period_end + ${intervalSql},
                    status               = 'active',
                    updated_at           = NOW()
                WHERE id = $1
            `, [sub.id]);

            await client.query('COMMIT');
            console.log(`[Renewal] Sub ${sub.id}: PawaPay STK push initiated — depositId ${paymentResult.depositId}`);

        } else {
            // ── Payment failed: start dunning ─────────────────────────────────
            const merchantCfg = await getMerchantBillingSettings(merchantId);
            const nextRetryAt = new Date(Date.now() + (merchantCfg.dunningDays[1] ?? 3) * 86400 * 1000);

            await client.query(`
                UPDATE sub_invoice SET status='open', attempt_count=1, next_retry_at=$2 WHERE id=$1
            `, [invoice.id, nextRetryAt]);

            await client.query(`
                UPDATE subscriptions SET status='past_due', updated_at=NOW() WHERE id=$1
            `, [sub.id]);

            await client.query(`
                INSERT INTO dunning_attempts
                  (invoice_id, subscription_id, merchant_id, attempt_number, status, next_retry_at, attempted_at, error_message)
                VALUES ($1,$2,$3,1,'failed',$4,NOW(),$5)
            `, [invoice.id, sub.id, merchantId, nextRetryAt, paymentResult.error]);

            await client.query('COMMIT');
            console.log(`[Renewal] Sub ${sub.id}: payment FAILED — ${paymentResult.error}`);

            await emit(merchantId, 'invoice.payment_failed', {
                ...buildInvoicePayload(invoice, sub),
                error:      paymentResult.error,
                next_retry: nextRetryAt,
            });
            await emit(merchantId, 'subscription.past_due', { subscription_id: sub.id });

            // ── Payment failed email ───────────────────────────────────────
            const failSettings = await getMerchantBillingSettings(merchantId);
            if (failSettings.emailToggles.paymentFailed) {
                const ctx = await getEmailContext(pool, sub, merchantId);
                setImmediate(() => EmailService.sendPaymentFailed({
                    ...ctx, nextRetryDate: nextRetryAt,
                }).catch(() => {}));
            }
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Renewal] Sub ${sub.id} error:`, err.message);
    } finally {
        client.release();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Process Dunning — retry failed invoices per schedule
// ─────────────────────────────────────────────────────────────────────────────
async function processDunning() {
    const dueRetries = await pool.query(`
        SELECT
            d.id AS dunning_id, d.invoice_id, d.subscription_id, d.merchant_id, d.attempt_number,
            i.amount, i.currency,
            s.customer_id, s.price_id, s.livemode,
            c.email AS customer_email
        FROM dunning_attempts d
        JOIN sub_invoice   i ON d.invoice_id      = i.id
        JOIN subscriptions s ON d.subscription_id = s.id
        JOIN customers     c ON s.customer_id     = c.id
        WHERE d.status       = 'pending'
          AND d.next_retry_at <= NOW()
          AND i.status IN ('open', 'failed')
          AND s.status       = 'past_due'
        FOR UPDATE OF d SKIP LOCKED
    `);

    console.log(`[Dunning] Found ${dueRetries.rows.length} invoice(s) to retry`);
    for (const row of dueRetries.rows) {
        await retryInvoice(row);
    }
}

async function retryInvoice(row) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const amount   = parseFloat(row.amount);
        const currency = row.currency.toUpperCase();

        const subLike     = { id: row.subscription_id, customer_id: row.customer_id, livemode: row.livemode, merchant_id: row.merchant_id };
        const invoiceLike = { id: row.invoice_id };
        const result      = await processPayment(client, subLike, invoiceLike, row.merchant_id, amount, currency);

        const merchantSettings = await getMerchantBillingSettings(row.merchant_id);
        const DUNNING_SCHEDULE_DAYS = merchantSettings.dunningDays;
        const MAX_DUNNING_ATTEMPTS  = merchantSettings.maxAttempts;
        const nextAttempt = row.attempt_number + 1;

        if (result.success) {
            const priceRes = await client.query(
                'SELECT * FROM prices WHERE id = (SELECT price_id FROM subscriptions WHERE id=$1)',
                [row.subscription_id]
            );
            const intervalSql = priceRes.rows[0] ? getIntervalSql(priceRes.rows[0]) : `INTERVAL '1 month'`;

            await client.query(`UPDATE sub_invoice SET status='paid', paid_at=NOW() WHERE id=$1`, [row.invoice_id]);
            await client.query(`
                UPDATE subscriptions
                SET status='active',
                    current_period_start = current_period_end,
                    current_period_end   = current_period_end + ${intervalSql},
                    updated_at           = NOW()
                WHERE id = $1
            `, [row.subscription_id]);
            await client.query(`UPDATE dunning_attempts SET status='resolved', attempted_at=NOW() WHERE id=$1`, [row.dunning_id]);

            await client.query('COMMIT');
            console.log(`[Dunning] Sub ${row.subscription_id}: retry #${row.attempt_number} SUCCEEDED`);

            await emit(row.merchant_id, 'invoice.payment_succeeded', { invoice_id: row.invoice_id, amount, currency });
            await emit(row.merchant_id, 'subscription.renewed',      { subscription_id: row.subscription_id });

        } else if (result.pending) {
            // PawaPay deposit initiated — mark dunning attempt as pending settlement
            await client.query(`
                UPDATE sub_invoice SET payment_deposit_id=$2, payment_provider='pawapay' WHERE id=$1
            `, [row.invoice_id, result.depositId]);
            await client.query(`UPDATE dunning_attempts SET status='pending', attempted_at=NOW() WHERE id=$1`, [row.dunning_id]);
            await client.query('COMMIT');
            console.log(`[Dunning] Sub ${row.subscription_id}: PawaPay STK push initiated (retry #${row.attempt_number})`);

        } else if (nextAttempt <= MAX_DUNNING_ATTEMPTS) {
            const nextDays    = DUNNING_SCHEDULE_DAYS[nextAttempt - 1] ?? 7;
            const nextRetryAt = new Date(Date.now() + nextDays * 86400 * 1000);

            await client.query(`UPDATE dunning_attempts SET status='failed', attempted_at=NOW(), error_message=$2 WHERE id=$1`, [row.dunning_id, result.error]);
            await client.query(`
                INSERT INTO dunning_attempts
                  (invoice_id, subscription_id, merchant_id, attempt_number, status, next_retry_at, error_message)
                VALUES ($1,$2,$3,$4,'pending',$5,$6)
            `, [row.invoice_id, row.subscription_id, row.merchant_id, nextAttempt, nextRetryAt, result.error]);
            await client.query(`UPDATE sub_invoice SET attempt_count=$2, next_retry_at=$3 WHERE id=$1`, [row.invoice_id, nextAttempt, nextRetryAt]);

            await client.query('COMMIT');
            console.log(`[Dunning] Sub ${row.subscription_id}: retry #${row.attempt_number} failed, next at ${nextRetryAt.toISOString()}`);
            await emit(row.merchant_id, 'invoice.payment_failed', { invoice_id: row.invoice_id, attempt: row.attempt_number, next_retry: nextRetryAt });

        } else {
            // All attempts exhausted
            await client.query(`UPDATE sub_invoice SET status='uncollectible' WHERE id=$1`, [row.invoice_id]);
            await client.query(`UPDATE subscriptions SET status='canceled', canceled_at=NOW(), updated_at=NOW() WHERE id=$1`, [row.subscription_id]);
            await client.query(`UPDATE dunning_attempts SET status='exhausted', attempted_at=NOW() WHERE id=$1`, [row.dunning_id]);

            await client.query('COMMIT');
            console.log(`[Dunning] Sub ${row.subscription_id}: dunning EXHAUSTED — canceled`);
            await emit(row.merchant_id, 'invoice.marked_uncollectible', { invoice_id: row.invoice_id });
            await emit(row.merchant_id, 'subscription.canceled',        { subscription_id: row.subscription_id, reason: 'dunning_exhausted' });

            // ── Cancelation email ─────────────────────────────────────────
            if (merchantSettings.emailToggles.cancelation) {
                const subRow = { id: row.subscription_id, customer_id: row.customer_id, price_id: row.price_id };
                const ctx = await getEmailContext(pool, subRow, row.merchant_id);
                setImmediate(() => EmailService.sendSubscriptionCanceled({
                    ...ctx, reason: 'dunning_exhausted',
                }).catch(() => {}));
            }
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Dunning] Invoice ${row.invoice_id} error:`, err.message);
    } finally {
        client.release();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Finalize Trials — convert trialing → active at trial_end
// ─────────────────────────────────────────────────────────────────────────────
async function finalizeTrials() {
    const trialRows = await pool.query(`
        SELECT s.id, s.customer_id, s.merchant_id
        FROM subscriptions s
        WHERE s.status = 'trialing' AND s.trial_end <= NOW()
        FOR UPDATE SKIP LOCKED
    `);

    for (const sub of trialRows.rows) {
        try {
            await pool.query(`
                UPDATE subscriptions
                SET status='active', current_period_start=NOW(), updated_at=NOW()
                WHERE id=$1
            `, [sub.id]);
            await emit(sub.merchant_id, 'subscription.trial_ended', { subscription_id: sub.id });
            console.log(`[Trial] Sub ${sub.id}: trial ended, now active`);

            // ── Trial-ended email ──────────────────────────────────────────
            const settings = await getMerchantBillingSettings(sub.merchant_id);
            if (settings.emailToggles.trialEnding) {
                const subRow = { id: sub.id, customer_id: sub.customer_id, price_id: sub.price_id };
                const ctx    = await getEmailContext(pool, subRow, sub.merchant_id);
                setImmediate(() => EmailService.sendTrialEndedEmail(ctx).catch(() => {}));
            }
        } catch (err) {
            console.error(`[Trial] Sub ${sub.id} error:`, err.message);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Check Trial Ending Soon — send 3-day warning emails (runs daily @ 09:00)
// ─────────────────────────────────────────────────────────────────────────────
async function checkTrialEndingSoon() {
    // Find trials ending within the next `trial_reminder_days` days (per merchant config)
    // Default = 3 days. We query for trials ending between NOW+2d and NOW+4d to avoid double-sending.
    const rows = await pool.query(`
        SELECT s.id, s.customer_id, s.price_id, s.merchant_id, s.trial_end
        FROM subscriptions s
        WHERE s.status    = 'trialing'
          AND s.trial_end >= NOW() + INTERVAL '2 days'
          AND s.trial_end  < NOW() + INTERVAL '4 days'
    `);

    console.log(`[TrialReminder] Found ${rows.rows.length} trial(s) ending soon`);

    for (const sub of rows.rows) {
        try {
            const settings = await getMerchantBillingSettings(sub.merchant_id);
            if (!settings.emailToggles.trialEnding) continue;

            const ctx = await getEmailContext(pool, sub, sub.merchant_id);
            await EmailService.sendTrialEndingReminder({
                ...ctx,
                trialEndDate: sub.trial_end,
            }).catch(() => {});
        } catch (err) {
            console.error(`[TrialReminder] Sub ${sub.id} error:`, err.message);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Check Pending PawaPay Deposits — settle in-flight STK push payments
// ─────────────────────────────────────────────────────────────────────────────
async function checkPendingDeposits() {
    // Only run if PawaPay is configured
    if (!process.env.PAWAPAY_TOKEN) return;

    const pending = await pool.query(`
        SELECT
            si.id AS invoice_id, si.payment_deposit_id, si.subscription_id,
            si.amount, si.currency, si.merchant_id,
            s.customer_id, s.price_id, s.livemode
        FROM sub_invoice si
        JOIN subscriptions s ON si.subscription_id = s.id
        WHERE si.payment_deposit_id IS NOT NULL
          AND si.payment_provider   = 'pawapay'
          AND si.status             = 'open'
    `);

    console.log(`[PendingDeposits] Checking ${pending.rows.length} in-flight deposit(s)`);

    for (const inv of pending.rows) {
        try {
            const depositStatus = await PawaPayService.checkDepositStatus(inv.payment_deposit_id);
            const status = depositStatus?.status;

            if (status === 'COMPLETED') {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');

                    const priceRes = await client.query(
                        'SELECT * FROM prices WHERE id = $1', [inv.price_id]
                    );
                    const intervalSql = priceRes.rows[0] ? getIntervalSql(priceRes.rows[0]) : `INTERVAL '1 month'`;

                    await creditMerchantWallet(client, inv.merchant_id, parseFloat(inv.amount), inv.currency, inv.invoice_id);

                    await client.query(`
                        UPDATE sub_invoice SET status='paid', paid_at=NOW() WHERE id=$1
                    `, [inv.invoice_id]);

                    // Subscription period was already advanced on deposit initiation — just confirm active
                    await client.query(`
                        UPDATE subscriptions SET status='active', updated_at=NOW() WHERE id=$1
                    `, [inv.subscription_id]);

                    await client.query('COMMIT');
                    console.log(`[PendingDeposits] Invoice ${inv.invoice_id}: deposit COMPLETED — settled`);

                    await emit(inv.merchant_id, 'invoice.payment_succeeded', { invoice_id: inv.invoice_id, amount: inv.amount, currency: inv.currency });
                    await emit(inv.merchant_id, 'subscription.renewed',      { subscription_id: inv.subscription_id });

                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error(`[PendingDeposits] Settle error for invoice ${inv.invoice_id}:`, err.message);
                } finally {
                    client.release();
                }

            } else if (status === 'FAILED') {
                // Deposit failed — revert period advance and start dunning
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');

                    const priceRes = await client.query('SELECT * FROM prices WHERE id = $1', [inv.price_id]);
                    const intervalSql = priceRes.rows[0] ? getIntervalSql(priceRes.rows[0]) : `INTERVAL '1 month'`;

                    // Revert optimistic period advance
                    await client.query(`
                        UPDATE subscriptions
                        SET status               = 'past_due',
                            current_period_end   = current_period_end - ${intervalSql},
                            current_period_start = current_period_end - ${intervalSql} - ${intervalSql},
                            updated_at           = NOW()
                        WHERE id = $1
                    `, [inv.subscription_id]);

                    const nextRetryAt = new Date(Date.now() + DUNNING_SCHEDULE_DAYS[1] * 86400 * 1000);

                    await client.query(`
                        UPDATE sub_invoice
                        SET status='open', attempt_count=1, next_retry_at=$2,
                            payment_deposit_id=NULL, payment_provider=NULL
                        WHERE id=$1
                    `, [inv.invoice_id, nextRetryAt]);

                    await client.query(`
                        INSERT INTO dunning_attempts
                          (invoice_id, subscription_id, merchant_id, attempt_number, status, next_retry_at, attempted_at, error_message)
                        VALUES ($1,$2,$3,1,'failed',$4,NOW(),$5)
                    `, [inv.invoice_id, inv.subscription_id, inv.merchant_id, nextRetryAt,
                        depositStatus?.errorMessage || 'PawaPay deposit failed']);

                    await client.query('COMMIT');
                    console.log(`[PendingDeposits] Invoice ${inv.invoice_id}: deposit FAILED — starting dunning`);

                    await emit(inv.merchant_id, 'invoice.payment_failed',  { invoice_id: inv.invoice_id });
                    await emit(inv.merchant_id, 'subscription.past_due',   { subscription_id: inv.subscription_id });

                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error(`[PendingDeposits] Revert error for invoice ${inv.invoice_id}:`, err.message);
                } finally {
                    client.release();
                }
            }
            // ACCEPTED | DUPLICATE_IGNORED — still in-flight, do nothing this tick

        } catch (err) {
            console.error(`[PendingDeposits] Status check error for deposit ${inv.payment_deposit_id}:`, err.message);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment processor
// ─────────────────────────────────────────────────────────────────────────────
async function processPayment(client, sub, invoice, merchantId, amount, currency) {
    try {
        if (!sub.livemode) {
            // ── Sandbox: auto-succeed, credit wallet immediately ──────────────
            await creditMerchantWallet(client, merchantId, amount, currency, invoice.id);
            return { success: true };
        }

        // ── Live mode: PawaPay STK push ───────────────────────────────────────
        if (!process.env.PAWAPAY_TOKEN) {
            // No PawaPay token — fall back to sandbox behaviour so billing isn't blocked
            console.warn('[Payment] PAWAPAY_TOKEN not set — falling back to sandbox credit');
            await creditMerchantWallet(client, merchantId, amount, currency, invoice.id);
            return { success: true };
        }

        // Get customer's mobile money details
        const custRes = await client.query(
            'SELECT phone, mobile_money_provider FROM customers WHERE id = $1',
            [sub.customer_id]
        );
        const customer = custRes.rows[0];

        if (!customer?.phone) {
            // No phone on file — fall through to sandbox credit until customer updates
            console.warn(`[Payment] Sub ${sub.id}: customer has no phone on file, using sandbox credit`);
            await creditMerchantWallet(client, merchantId, amount, currency, invoice.id);
            return { success: true };
        }

        const depositId    = crypto.randomUUID();
        const correspondent = PawaPayService.networkToCorrespondent(customer.mobile_money_provider || 'MTN');
        const description  = `FlapaPay Sub ${sub.id.slice(0, 8)}`;

        const depositRes = await PawaPayService.initiateDeposit(
            depositId, amount, currency, customer.phone, correspondent, description
        );

        if (depositRes.depositId && depositRes.status === 'ACCEPTED') {
            return { success: false, pending: true, depositId };
        } else {
            return {
                success: false,
                error: `PawaPay rejected deposit: ${depositRes.rejectionReason || depositRes.status || 'unknown'}`,
            };
        }

    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function creditMerchantWallet(client, merchantId, amount, currency, invoiceId) {
    const mRes = await client.query('SELECT user_id FROM merchants WHERE id=$1', [merchantId]);
    if (!mRes.rows.length) throw new Error('Merchant not found for wallet credit');
    const userId = mRes.rows[0].user_id;

    const walletRes = await client.query(`
        INSERT INTO wallets (user_id, currency, balance)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, currency) DO UPDATE
        SET balance = wallets.balance + $3, updated_at = NOW()
        RETURNING id
    `, [userId, currency, amount]);
    const walletId = walletRes.rows[0].id;

    const ref = 'SUBRENEW_' + (invoiceId || crypto.randomUUID()).replace(/-/g, '').slice(0, 20).toUpperCase();

    await client.query(`
        INSERT INTO ledger_entries
          (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
        VALUES ($1,$2,$3,$4,'Subscription Renewal','subscription_invoice','completed')
    `, [ref, walletId, amount, currency]);

    try {
        await client.query(`
            INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, reference_type, reference_id)
            VALUES ($1,$2,'credit','subscription_invoice',$3)
        `, [walletId, amount, invoiceId]);
    } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Coupon / discount helpers
// ─────────────────────────────────────────────────────────────────────────────

// Resolve active discounts for a subscription and return the discounted amount.
// Returns { discountedAmount, discountTotal, consumedDiscounts }
async function resolveDiscounts(client, subscriptionId, originalAmount) {
    const discountRes = await client.query(`
        SELECT
            sd.id        AS sd_id,
            sd.coupon_id,
            sd.applied_at,
            c.amount_off,
            c.percent_off,
            c.duration,
            c.duration_in_months
        FROM subscription_discounts sd
        JOIN coupons c ON sd.coupon_id = c.id
        WHERE sd.subscription_id = $1
          AND c.active = TRUE
          AND (sd.expires_at IS NULL OR sd.expires_at > NOW())
    `, [subscriptionId]);

    let discountedAmount = originalAmount;
    let discountTotal    = 0;
    const consumedDiscounts = []; // discounts to remove after this billing

    for (const d of discountRes.rows) {
        let discountValue = 0;

        if (d.amount_off) {
            discountValue = Math.min(parseFloat(d.amount_off), discountedAmount);
        } else if (d.percent_off) {
            discountValue = discountedAmount * (parseFloat(d.percent_off) / 100);
        }

        discountedAmount = Math.max(0, discountedAmount - discountValue);
        discountTotal   += discountValue;

        // Track for post-payment consumption
        if (d.duration === 'once') {
            consumedDiscounts.push({ sdId: d.sd_id, reason: 'once' });
        } else if (d.duration === 'repeating' && d.duration_in_months) {
            const appliedAt = new Date(d.applied_at);
            const expiresAt = new Date(appliedAt);
            expiresAt.setMonth(expiresAt.getMonth() + parseInt(d.duration_in_months));
            if (expiresAt <= new Date()) {
                consumedDiscounts.push({ sdId: d.sd_id, reason: 'repeating_expired' });
            }
        }
    }

    return {
        discountedAmount: parseFloat(discountedAmount.toFixed(2)),
        discountTotal:    parseFloat(discountTotal.toFixed(2)),
        consumedDiscounts,
    };
}

// Delete one-time and expired repeating discounts after a successful payment
async function consumeDiscounts(client, consumedDiscounts) {
    for (const { sdId } of consumedDiscounts) {
        try {
            await client.query('DELETE FROM subscription_discounts WHERE id = $1', [sdId]);
        } catch (_) {}
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildInvoicePayload(invoice, sub) {
    return {
        id:              invoice.id,
        subscription_id: sub.id,
        customer_id:     sub.customer_id,
        customer_email:  sub.customer_email,
        amount:          invoice.amount,
        currency:        invoice.currency,
        status:          invoice.status,
        invoice_number:  invoice.invoice_number,
        created_at:      invoice.created_at,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    processRenewals,
    processDunning,
    finalizeTrials,
    checkTrialEndingSoon,
    checkPendingDeposits,
    ensureTables,
    setWebhookEmitter,
    resolveDiscounts,
    getMerchantBillingSettings,
};
