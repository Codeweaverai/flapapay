/**
 * SubscriptionEmailService
 * ─────────────────────────────────────────────────────────────────────────────
 * Transactional email notifications for subscription lifecycle events.
 * Uses Resend (already configured in the platform).
 *
 * Triggered by SubscriptionRenewalService at these points:
 *   • invoice.payment_failed    → sendPaymentFailed()
 *   • subscription.canceled     → sendSubscriptionCanceled()
 *   • subscription.trial_ended  → sendTrialEndedEmail()
 *   • trial ending in 3 days    → sendTrialEndingReminder()
 *   • invoice.payment_succeeded → sendRenewalReceipt()
 *
 * All emails are no-ops when RESEND_API_KEY is absent (dev / sandbox).
 */

'use strict';

const { Resend } = require('resend');

const resend   = new Resend(process.env.RESEND_API_KEY);
const FROM     = process.env.RESEND_FROM
    ? `FlapaPay <${process.env.RESEND_FROM}>`
    : 'FlapaPay <noreply@flapabay.com>';

// ── Shared HTML chrome ────────────────────────────────────────────────────────
function wrap(content) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; margin:0; padding:0; }
  .container { max-width:580px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.07); }
  .header { background:#111; padding:32px 40px; }
  .header h1 { color:#f97316; font-size:22px; margin:0; font-weight:900; letter-spacing:-0.5px; }
  .header p  { color:#888; font-size:13px; margin:6px 0 0; }
  .body { padding:36px 40px; color:#374151; font-size:15px; line-height:1.7; }
  .card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:20px 24px; margin:24px 0; }
  .card .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e5e7eb; }
  .card .row:last-child { border-bottom:none; }
  .card .label { color:#6b7280; font-size:13px; }
  .card .value { font-weight:700; color:#111; font-size:14px; }
  .btn { display:inline-block; background:#111; color:#fff!important; text-decoration:none; padding:14px 28px; border-radius:10px; font-weight:700; font-size:15px; margin:20px 0; }
  .btn:hover { background:#f97316; }
  .badge-failed  { display:inline-block; background:#fee2e2; color:#dc2626; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
  .badge-success { display:inline-block; background:#dcfce7; color:#16a34a; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
  .footer { background:#f3f4f6; padding:20px 40px; font-size:12px; color:#9ca3af; border-top:1px solid #e5e7eb; }
</style></head><body>
<div class="container">
  <div class="header">
    <h1>FlapaPay</h1>
    <p>Subscription Billing</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    FlapaPay · Zambia · You're receiving this because you have an active subscription.
    <br>To update your payment details visit your subscription portal.
  </div>
</div></body></html>`;
}

function currencySymbol(currency) {
    if (!currency) return 'K';
    const c = currency.toUpperCase();
    if (c === 'ZMW') return 'K';
    if (c === 'NGN') return '₦';
    return '$';
}

async function send(to, subject, html) {
    if (!process.env.RESEND_API_KEY) return; // silent no-op without key
    try {
        await resend.emails.send({ from: FROM, to, subject, html });
    } catch (err) {
        console.error(`[SubscriptionEmail] Failed to send "${subject}" to ${to}:`, err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment failed — sent to customer when a charge fails
// ─────────────────────────────────────────────────────────────────────────────
async function sendPaymentFailed({ customerEmail, customerName, productName, amount, currency, nextRetryDate, merchantName }) {
    const sym     = currencySymbol(currency);
    const retryStr = nextRetryDate ? `We'll automatically retry on <strong>${new Date(nextRetryDate).toDateString()}</strong>.` : '';

    await send(customerEmail, `Payment failed — ${productName}`, wrap(`
        <p>Hi ${customerName || 'there'},</p>
        <p>
            We were unable to process your subscription payment for
            <strong>${productName}</strong> with <strong>${merchantName}</strong>.
            <span class="badge-failed">Payment Failed</span>
        </p>
        <div class="card">
            <div class="row"><span class="label">Plan</span><span class="value">${productName}</span></div>
            <div class="row"><span class="label">Amount</span><span class="value">${sym}${parseFloat(amount).toLocaleString()} ${currency}</span></div>
            <div class="row"><span class="label">Status</span><span class="value">Failed</span></div>
        </div>
        <p>${retryStr} To avoid interruption, please update your payment method in your subscription portal.</p>
        <p style="color:#6b7280;font-size:13px;">If this was unexpected, please contact ${merchantName} for assistance.</p>
    `));
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription canceled — sent when dunning exhausts all retries
// ─────────────────────────────────────────────────────────────────────────────
async function sendSubscriptionCanceled({ customerEmail, customerName, productName, merchantName, reason }) {
    await send(customerEmail, `Your ${productName} subscription has been canceled`, wrap(`
        <p>Hi ${customerName || 'there'},</p>
        <p>
            Your subscription to <strong>${productName}</strong> with
            <strong>${merchantName}</strong> has been <strong>canceled</strong>
            because we were unable to collect payment after multiple attempts.
        </p>
        <div class="card">
            <div class="row"><span class="label">Plan</span><span class="value">${productName}</span></div>
            <div class="row"><span class="label">Reason</span><span class="value">${reason === 'dunning_exhausted' ? 'Payment collection failed' : reason || 'Canceled'}</span></div>
        </div>
        <p>To reactivate, contact <strong>${merchantName}</strong> and they can create a new subscription for you.</p>
    `));
}

// ─────────────────────────────────────────────────────────────────────────────
// Trial ending in N days — proactive warning
// ─────────────────────────────────────────────────────────────────────────────
async function sendTrialEndingReminder({ customerEmail, customerName, productName, trialEndDate, amount, currency, merchantName }) {
    const sym      = currencySymbol(currency);
    const endStr   = new Date(trialEndDate).toDateString();
    const amountStr = `${sym}${parseFloat(amount).toLocaleString()} ${currency}`;

    await send(customerEmail, `Your free trial ends on ${endStr}`, wrap(`
        <p>Hi ${customerName || 'there'},</p>
        <p>
            Your free trial for <strong>${productName}</strong> with
            <strong>${merchantName}</strong> ends on <strong>${endStr}</strong>.
        </p>
        <div class="card">
            <div class="row"><span class="label">Plan</span><span class="value">${productName}</span></div>
            <div class="row"><span class="label">Trial Ends</span><span class="value">${endStr}</span></div>
            <div class="row"><span class="label">Billing Starts</span><span class="value">${amountStr} / billing period</span></div>
        </div>
        <p>No action needed — billing starts automatically after the trial. If you'd like to cancel before then, contact <strong>${merchantName}</strong>.</p>
    `));
}

// ─────────────────────────────────────────────────────────────────────────────
// Trial ended — sent when trial converts to active
// ─────────────────────────────────────────────────────────────────────────────
async function sendTrialEndedEmail({ customerEmail, customerName, productName, amount, currency, merchantName }) {
    const sym = currencySymbol(currency);

    await send(customerEmail, `Your ${productName} trial has ended — billing started`, wrap(`
        <p>Hi ${customerName || 'there'},</p>
        <p>
            Your free trial for <strong>${productName}</strong> has ended and
            your paid subscription with <strong>${merchantName}</strong> is now active.
        </p>
        <div class="card">
            <div class="row"><span class="label">Plan</span><span class="value">${productName}</span></div>
            <div class="row"><span class="label">Amount</span><span class="value">${sym}${parseFloat(amount).toLocaleString()} ${currency} / billing period</span></div>
            <div class="row"><span class="label">Status</span><span class="value badge-success">Active</span></div>
        </div>
        <p>Thank you for continuing with <strong>${merchantName}</strong>.</p>
    `));
}

// ─────────────────────────────────────────────────────────────────────────────
// Renewal receipt — sent on every successful charge
// ─────────────────────────────────────────────────────────────────────────────
async function sendRenewalReceipt({ customerEmail, customerName, productName, amount, currency, invoiceNumber, nextBillingDate, discountAmount, taxAmount, merchantName }) {
    const sym      = currencySymbol(currency);
    const discount = parseFloat(discountAmount || 0);
    const tax      = parseFloat(taxAmount || 0);
    const total    = parseFloat(amount);

    await send(customerEmail, `Receipt — ${productName} renewed`, wrap(`
        <p>Hi ${customerName || 'there'},</p>
        <p>
            Your <strong>${productName}</strong> subscription with
            <strong>${merchantName}</strong> has been successfully renewed.
            <span class="badge-success">Paid</span>
        </p>
        <div class="card">
            <div class="row"><span class="label">Invoice</span><span class="value">${invoiceNumber || '—'}</span></div>
            <div class="row"><span class="label">Plan</span><span class="value">${productName}</span></div>
            ${discount > 0 ? `<div class="row"><span class="label">Discount</span><span class="value" style="color:#16a34a">−${sym}${discount.toFixed(2)} ${currency}</span></div>` : ''}
            ${tax > 0 ? `<div class="row"><span class="label">VAT (16%)</span><span class="value">${sym}${tax.toFixed(2)} ${currency}</span></div>` : ''}
            <div class="row"><span class="label">Total Charged</span><span class="value">${sym}${total.toFixed(2)} ${currency}</span></div>
            ${nextBillingDate ? `<div class="row"><span class="label">Next Billing</span><span class="value">${new Date(nextBillingDate).toDateString()}</span></div>` : ''}
        </div>
        <p style="color:#6b7280;font-size:13px;">Please keep this email as your payment receipt.</p>
    `));
}

module.exports = {
    sendPaymentFailed,
    sendSubscriptionCanceled,
    sendTrialEndingReminder,
    sendTrialEndedEmail,
    sendRenewalReceipt,
};
