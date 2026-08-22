/**
 * EmailService — centralised email dispatcher for FlapaPay
 *
 * All outbound email goes through this service so that:
 *  - The sender address uses the Resend-verified mailbox configured in RESEND_FROM
 *  - Template rendering is co-located with the dispatch logic
 *  - Failures are caught and logged without crashing the caller
 *
 * Usage:
 *   const EmailService = require('./services/EmailService');
 *   await EmailService.sendOtp(email, { code: '483921', context: 'mobile money verification' });
 */

require('dotenv').config();
const { Resend } = require('resend');

// ── Email template renderers ─────────────────────────────────────────────────
const { renderOtpEmail }            = require('../emails/OtpEmail');
const { renderForgotPasswordEmail } = require('../emails/ForgotPasswordEmail');
const { renderTransferEmail }       = require('../emails/TransferEmail');
const { renderInvoiceEmail }        = require('../emails/InvoiceEmail');
const { renderRequestMoneyEmail }   = require('../emails/RequestMoneyEmail');
const { renderConnectInviteEmail }  = require('../emails/ConnectInviteEmail');

// ── Resend client ────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);
const FALLBACK_FROM = 'FlapaPay <onboarding@resend.dev>';
const FROM   = process.env.RESEND_FROM
    ? `FlapaPay <${process.env.RESEND_FROM}>`
    : FALLBACK_FROM;

// ── Core dispatch ────────────────────────────────────────────────────────────

/**
 * Low-level send. All public methods funnel through here.
 * Errors are caught, logged, and re-thrown so callers can decide
 * whether to surface them to the user.
 */
async function send({ to, subject, html, attachments, replyTo }) {
    const payload = {
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
    };
    if (attachments?.length) payload.attachments = attachments;
    if (replyTo) payload.reply_to = replyTo;

    try {
        let result = await resend.emails.send(payload);

        if (
            result?.error?.name === 'validation_error' &&
            /domain is not verified/i.test(result.error.message || '') &&
            payload.from !== FALLBACK_FROM
        ) {
            const fallbackPayload = {
                ...payload,
                from: FALLBACK_FROM,
                reply_to: replyTo || process.env.RESEND_FROM || undefined,
            };
            console.warn('[EmailService] Retrying email with Resend fallback sender');
            result = await resend.emails.send(fallbackPayload);
        }

        if (result.error) {
            console.error('[EmailService] Resend error:', result.error);
            throw new Error(result.error.message || 'Email send failed');
        }
        return result;
    } catch (err) {
        console.error('[EmailService] Failed to send email to', to, '—', err.message);
        throw err;
    }
}

// ── OTP ──────────────────────────────────────────────────────────────────────

/**
 * Send a one-time verification code.
 *
 * @param {string} email
 * @param {object} opts
 * @param {string} opts.code             6-digit OTP string
 * @param {string} opts.context          Human-readable context, e.g. "mobile money verification"
 * @param {string} [opts.recipientName]  Optional name for personalised greeting
 * @param {number} [opts.expiresIn=10]   Minutes until expiry
 */
async function sendOtp(email, { code, context, recipientName = '', expiresIn = 10 }) {
    return send({
        to: email,
        subject: `${code} is your FlapaPay verification code`,
        html: await renderOtpEmail({ code, context, recipientName, expiresIn }),
    });
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Password reset email.
 */
async function sendPasswordReset(email, { resetLink }) {
    return send({
        to: email,
        subject: 'Reset your FlapaPay password',
        html: await renderForgotPasswordEmail({ userEmail: email, resetLink }),
    });
}

// ── Transfers ────────────────────────────────────────────────────────────────

/**
 * Transfer confirmation — call once for sender, once for receiver.
 *
 * @param {string} email
 * @param {object} data  { type, senderName, receiverName, amount, currency, reference, description, date }
 * @param {Array}  [attachments]  PDF receipt attachments
 */
async function sendTransferNotification(email, data, attachments = []) {
    const isSender = data.type === 'SENDER';
    return send({
        to: email,
        subject: isSender
            ? `Transfer Successful: ${data.currency} ${data.amount} sent to ${data.receiverName}`
            : `You received ${data.currency} ${data.amount} from ${data.senderName}`,
        html: await renderTransferEmail(data),
        attachments,
    });
}

// ── Invoices ─────────────────────────────────────────────────────────────────

/**
 * Invoice sent to payer.
 */
async function sendInvoiceEmail(email, data, attachments = []) {
    return send({
        to: email,
        subject: `Invoice ${data.invoiceNumber || ''} from ${data.businessName || 'FlapaPay'}`,
        html: await renderInvoiceEmail(data),
        attachments,
    });
}

// ── Request money ────────────────────────────────────────────────────────────

/**
 * Payment request notification.
 */
async function sendRequestMoneyEmail(email, data) {
    return send({
        to: email,
        subject: `${data.requesterName} is requesting ${data.currency} ${data.amount} from you`,
        html: await renderRequestMoneyEmail(data),
    });
}

// ── Connect / Sub-merchant ───────────────────────────────────────────────────

/**
 * Invite a sub-merchant to complete hosted onboarding.
 *
 * @param {string} email
 * @param {object} opts
 * @param {string} opts.platformName    Inviting platform name
 * @param {string} opts.platformColor   Hex brand colour (optional)
 * @param {string} opts.inviteUrl       Full hosted onboarding URL
 * @param {string} [opts.businessName]  Pre-filled business name
 * @param {string} [opts.expiresAt]     Human-readable expiry, e.g. "7 days"
 */
async function sendConnectInvite(email, { platformName, platformColor, inviteUrl, businessName, expiresAt = '7 days' }) {
    return send({
        to: email,
        subject: `You're invited to join ${platformName} and start accepting payments`,
        html: await renderConnectInviteEmail({ platformName, platformColor, inviteUrl, businessName, recipientEmail: email, expiresAt }),
    });
}

/**
 * KYC status update — approved or rejected.
 *
 * @param {string} email
 * @param {object} opts
 * @param {string} opts.accountName      Business or individual name
 * @param {'approved'|'rejected'} opts.status
 * @param {string} [opts.reason]         Required when status=rejected
 * @param {string} [opts.dashboardUrl]   Link back to the sub-merchant portal
 */
async function sendKycUpdate(email, { accountName, status, reason, dashboardUrl }) {
    const approved = status === 'approved';
    const subject  = approved
        ? `Your FlapaPay account is verified — you can now accept payments`
        : `Action required: your FlapaPay verification needs attention`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,sans-serif;">
      <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.08);">
        <div style="background:${approved ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f97316,#ea580c)'};padding:36px 40px;text-align:center;">
          <p style="color:#fff;font-size:28px;font-weight:900;margin:0 0 4px;letter-spacing:-1px;">FlapaPay</p>
          <p style="color:rgba(255,255,255,.75);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin:0;">
            ${approved ? 'Account Verified' : 'Verification Update'}
          </p>
        </div>
        <div style="padding:40px;">
          <p style="font-size:32px;text-align:center;margin:0 0 16px;">${approved ? '✅' : '⚠️'}</p>
          <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 12px;">Hi ${accountName},</p>
          ${approved
            ? `<p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Your FlapaPay account has been <strong style="color:#16a34a;">approved and activated</strong>.
                You can now receive payments through your platform.
               </p>`
            : `<p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 16px;">
                Your KYC verification requires attention. Our team has reviewed your submitted documents and found an issue.
               </p>
               ${reason ? `<div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:14px 18px;margin:0 0 24px;">
                 <p style="color:#9a3412;font-size:13px;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Reason</p>
                 <p style="color:#7c2d12;font-size:14px;margin:0;">${reason}</p>
               </div>` : ''}
               <p style="color:#475569;font-size:13px;line-height:1.6;margin:0 0 24px;">
                 Please re-submit the required documents through your onboarding portal.
                 If you need assistance, contact your platform operator.
               </p>`
          }
          ${dashboardUrl ? `<div style="text-align:center;">
            <a href="${dashboardUrl}" style="background:${approved ? '#16a34a' : '#f97316'};color:#fff;padding:14px 32px;border-radius:14px;font-weight:900;font-size:14px;text-decoration:none;display:inline-block;">
              ${approved ? 'Go to My Dashboard' : 'Update My Documents'}
            </a>
          </div>` : ''}
        </div>
        <div style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
          <p style="color:#cbd5e1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0;">
            FlapaPay · Zambia
          </p>
        </div>
      </div>
    </body>
    </html>`;

    return send({ to: email, subject, html });
}

/**
 * Notify a sub-merchant that a payout has been sent.
 *
 * @param {string} email
 * @param {object} opts
 * @param {string} opts.accountName    Business name
 * @param {number} opts.amount         Amount in smallest unit (ngwee)
 * @param {string} opts.currency       e.g. ZMW
 * @param {string} opts.payoutMethod   e.g. "Airtel Money ••••4567" or "Zanaco ••••5678"
 * @param {string} opts.reference      Payout reference ID
 * @param {string} [opts.dashboardUrl]
 */
async function sendPayoutNotification(email, { accountName, amount, currency, payoutMethod, reference, dashboardUrl }) {
    const formatted = (amount / 100).toFixed(2);
    const subject   = `Payout of ${currency} ${formatted} sent to your account`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,sans-serif;">
      <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.08);">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:36px 40px;text-align:center;">
          <p style="color:#fff;font-size:28px;font-weight:900;margin:0 0 4px;letter-spacing:-1px;">FlapaPay</p>
          <p style="color:rgba(255,255,255,.75);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin:0;">Payout Sent</p>
        </div>
        <div style="padding:40px;text-align:center;">
          <p style="font-size:48px;margin:0 0 8px;">💸</p>
          <p style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Amount Sent</p>
          <p style="color:#0f172a;font-size:42px;font-weight:900;margin:0 0 4px;letter-spacing:-2px;">
            <span style="font-size:20px;font-weight:700;color:#94a3b8;">${currency} </span>${formatted}
          </p>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 32px;">to ${payoutMethod}</p>
          <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 24px;">
          <div style="text-align:left;">
            <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 12px;">Hi ${accountName},</p>
            <p style="color:#475569;font-size:13px;line-height:1.7;margin:0 0 20px;">
              Your payout has been processed and is on its way to your registered payout account.
              Depending on your payout method, funds typically arrive within 1 business day for mobile money
              or 2–3 business days for bank transfers.
            </p>
            <div style="background:#f8fafc;border-radius:12px;padding:14px 18px;margin:0 0 24px;">
              <p style="color:#94a3b8;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;">Reference</p>
              <p style="color:#0f172a;font-size:13px;font-weight:700;font-family:monospace;margin:0;">${reference}</p>
            </div>
            ${dashboardUrl ? `<div style="text-align:center;">
              <a href="${dashboardUrl}" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:14px;font-weight:900;font-size:14px;text-decoration:none;display:inline-block;">View Payout Details</a>
            </div>` : ''}
          </div>
        </div>
        <div style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
          <p style="color:#cbd5e1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0;">FlapaPay · Zambia</p>
        </div>
      </div>
    </body>
    </html>`;

    return send({ to: email, subject, html });
}

/**
 * Welcome email after hosted onboarding submission — account is under review.
 *
 * @param {string} email
 * @param {object} opts
 * @param {string} opts.accountName    Name of the individual or business
 * @param {string} opts.platformName   The platform they onboarded through
 * @param {string} [opts.dashboardUrl] Link to the sub-merchant portal
 */
async function sendOnboardingComplete(email, { accountName, platformName, dashboardUrl }) {
    const subject = `Welcome to ${platformName} — your application is under review`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,sans-serif;">
      <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.08);">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:36px 40px;text-align:center;">
          <p style="color:#fff;font-size:28px;font-weight:900;margin:0 0 4px;letter-spacing:-1px;">FlapaPay</p>
          <p style="color:rgba(255,255,255,.75);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin:0;">Application Received</p>
        </div>
        <div style="padding:40px;">
          <p style="font-size:48px;text-align:center;margin:0 0 24px;">🎉</p>
          <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 12px;">Hi ${accountName},</p>
          <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 20px;">
            Your onboarding application for <strong>${platformName}</strong> has been received and is currently under review
            by our compliance team. This process typically takes <strong>24–48 hours</strong>.
          </p>
          <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
            <p style="color:#9a3412;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">What happens next</p>
            <p style="color:#7c2d12;font-size:13px;line-height:1.6;margin:0 0 6px;">1. Our team reviews your KYC documents</p>
            <p style="color:#7c2d12;font-size:13px;line-height:1.6;margin:0 0 6px;">2. You receive an approval email when verified</p>
            <p style="color:#7c2d12;font-size:13px;line-height:1.6;margin:0;">3. Your account is activated and you can start accepting payments</p>
          </div>
          ${dashboardUrl ? `<div style="text-align:center;">
            <a href="${dashboardUrl}" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:14px;font-weight:900;font-size:14px;text-decoration:none;display:inline-block;">Track My Application</a>
          </div>` : ''}
        </div>
        <div style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
          <p style="color:#cbd5e1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0;">FlapaPay · Zambia</p>
        </div>
      </div>
    </body>
    </html>`;

    return send({ to: email, subject, html });
}

/**
 * Notify a platform operator that a sub-merchant's account has been suspended.
 */
async function sendAccountSuspended(email, { accountName, reason, platformName }) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,sans-serif;">
      <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.08);">
        <div style="background:linear-gradient(135deg,#ef4444,#b91c1c);padding:36px 40px;text-align:center;">
          <p style="color:#fff;font-size:28px;font-weight:900;margin:0 0 4px;letter-spacing:-1px;">FlapaPay</p>
          <p style="color:rgba(255,255,255,.75);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin:0;">Account Suspended</p>
        </div>
        <div style="padding:40px;">
          <p style="color:#0f172a;font-size:14px;line-height:1.7;margin:0 0 16px;">
            The connected account <strong>${accountName}</strong> on <strong>${platformName}</strong> has been suspended.
          </p>
          ${reason ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:14px 18px;margin:0 0 20px;">
            <p style="color:#991b1b;font-size:13px;font-weight:700;margin:0 0 4px;">Reason</p>
            <p style="color:#7f1d1d;font-size:13px;margin:0;">${reason}</p>
          </div>` : ''}
          <p style="color:#475569;font-size:13px;line-height:1.6;margin:0;">
            No new charges will be routed to this account until it is reactivated. Contact FlapaPay support if you believe this is an error.
          </p>
        </div>
        <div style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
          <p style="color:#cbd5e1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0;">FlapaPay · Zambia</p>
        </div>
      </div>
    </body>
    </html>`;

    return send({
        to: email,
        subject: `Account suspended: ${accountName}`,
        html,
    });
}

// ── OTP utility — generate a cryptographically random 6-digit code ────────────
function generateOtpCode() {
    const { randomInt } = require('crypto');
    return String(randomInt(100000, 999999));
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function sendJobApplicationConfirmation(email, { applicantName, jobTitle }) {
    const safeName = escapeHtml(applicantName || 'there');
    const safeJobTitle = escapeHtml(jobTitle || 'the role');
    return send({
        to: email,
        subject: `We received your application for ${jobTitle}`,
        html: `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;"><div style="max-width:600px;margin:32px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;"><div style="padding:28px 32px;background:#0f172a;color:#ffffff;"><p style="margin:0;color:#fb923c;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">FlapaPay Careers</p><h1 style="margin:12px 0 0;font-size:25px;line-height:1.2;">Application received</h1></div><div style="padding:32px;"><p style="font-size:16px;line-height:1.7;">Hello ${safeName},</p><p style="font-size:16px;line-height:1.7;">Thank you for applying for <strong>${safeJobTitle}</strong>. Your application has been recorded and will be reviewed by our recruitment team.</p><p style="font-size:16px;line-height:1.7;">If your experience matches the next stage, we will contact you using this email address.</p><p style="margin:28px 0 0;font-size:16px;line-height:1.7;">— The FlapaPay Team</p></div></div></body></html>`,
    });
}

async function sendRecruiterApplicationAlert(recipients, { applicantName, applicantEmail, jobTitle, department, applicationUrl }) {
    const safeName = escapeHtml(applicantName);
    const safeEmail = escapeHtml(applicantEmail);
    const safeJobTitle = escapeHtml(jobTitle);
    const safeDepartment = escapeHtml(department || 'Unassigned');
    const safeApplicationUrl = escapeHtml(applicationUrl);
    return send({
        to: recipients,
        subject: `New application: ${applicantName} for ${jobTitle}`,
        html: `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;"><div style="max-width:600px;margin:32px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;"><div style="padding:28px 32px;background:#0f172a;color:#ffffff;"><p style="margin:0;color:#fb923c;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">FlapaPay Recruitment</p><h1 style="margin:12px 0 0;font-size:25px;line-height:1.2;">New candidate application</h1></div><div style="padding:32px;"><p style="font-size:16px;line-height:1.7;margin-top:0;"><strong>${safeName}</strong> has applied for <strong>${safeJobTitle}</strong>.</p><table style="border-collapse:collapse;width:100%;font-size:14px;"><tr><td style="padding:10px 0;color:#64748b;width:120px;">Email</td><td style="padding:10px 0;font-weight:700;">${safeEmail}</td></tr><tr><td style="padding:10px 0;color:#64748b;">Department</td><td style="padding:10px 0;font-weight:700;">${safeDepartment}</td></tr></table><a href="${safeApplicationUrl}" style="display:inline-block;margin-top:24px;border-radius:10px;background:#f97316;color:#ffffff;padding:13px 18px;font-size:14px;font-weight:700;text-decoration:none;">Review application</a></div></div></body></html>`,
    });
}

// ── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
    send,
    sendOtp,
    sendPasswordReset,
    sendTransferNotification,
    sendInvoiceEmail,
    sendRequestMoneyEmail,
    sendConnectInvite,
    sendKycUpdate,
    sendPayoutNotification,
    sendOnboardingComplete,
    sendAccountSuspended,
    sendJobApplicationConfirmation,
    sendRecruiterApplicationAlert,
    generateOtpCode,
};
