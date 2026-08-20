const EmailService = require('./EmailService');

const DEFAULT_FRAUD_ALERT_EMAIL = process.env.FRAUD_ALERT_EMAIL || 'mbolela.pule@flapapay.com';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderFraudAlertEmail(payload = {}) {
    const title = escapeHtml(payload.title || 'Fraud alert');
    const message = escapeHtml(payload.message || 'A fraud alert requires review.');
    const severity = escapeHtml(String(payload.severity || 'medium').toUpperCase());
    const reference = escapeHtml(payload.reference || 'N/A');
    const caseId = escapeHtml(payload.case_id || 'N/A');
    const rail = escapeHtml(payload.rail || 'platform');
    const score = escapeHtml(payload.score ?? 'N/A');
    const action = escapeHtml(payload.action || 'review');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.08);">
        <div style="background:linear-gradient(135deg,#dc2626,#ea580c);padding:32px 36px;text-align:center;">
          <p style="color:#fff;font-size:28px;font-weight:900;margin:0 0 6px;letter-spacing:-1px;">FlapaPay</p>
          <p style="color:rgba(255,255,255,.75);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:3px;margin:0;">Fraud Escalation Alert</p>
        </div>
        <div style="padding:36px;">
          <h1 style="color:#0f172a;font-size:22px;font-weight:900;margin:0 0 14px;">${title}</h1>
          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 22px;">${message}</p>
          <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:18px;padding:18px 20px;margin:0 0 22px;">
            <p style="margin:0 0 8px;color:#9a3412;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;">Escalation Snapshot</p>
            <p style="margin:0;color:#7c2d12;font-size:13px;line-height:1.8;">
              <strong>Severity:</strong> ${severity}<br/>
              <strong>Case ID:</strong> ${caseId}<br/>
              <strong>Reference:</strong> ${reference}<br/>
              <strong>Rail:</strong> ${rail}<br/>
              <strong>Score:</strong> ${score}<br/>
              <strong>Action:</strong> ${action}
            </p>
          </div>
          <p style="color:#475569;font-size:13px;line-height:1.7;margin:0;">
            Review this case in the FlapaPay Admin Fraud Ops desk and decide whether to clear, maintain hold, or confirm fraud.
          </p>
        </div>
      </div>
    </body>
    </html>`;
}

module.exports = {
    async queueAlert(db, { fraudCaseId = null, channel = 'admin_notification', recipient = 'internal', payload = {} }) {
        const alertRes = await db.query(
            `INSERT INTO fraud_alerts (fraud_case_id, channel, recipient, status, payload)
             VALUES ($1, $2, $3, 'queued', $4::jsonb)
             RETURNING *`,
            [fraudCaseId, channel, recipient, JSON.stringify(payload || {})]
        );

        if (channel === 'admin_notification') {
            const title = payload.title || 'Fraud alert';
            const message = payload.message || 'A fraud alert requires review.';
            await db.query(
                `INSERT INTO admin_notifications (title, message, type, read, created_at)
                 VALUES ($1, $2, 'security', FALSE, NOW())`,
                [title, message]
            );
        }

        if (channel === 'email') {
            const emailTo = recipient && recipient !== 'internal'
                ? recipient
                : DEFAULT_FRAUD_ALERT_EMAIL;
            try {
                await EmailService.send({
                    to: emailTo,
                    subject: payload.subject || payload.title || 'Fraud escalation alert',
                    html: renderFraudAlertEmail({
                        ...payload,
                        case_id: payload.case_id || fraudCaseId
                    })
                });
                await db.query(
                    `UPDATE fraud_alerts
                     SET status = 'sent', sent_at = NOW(), error = NULL
                     WHERE id = $1`,
                    [alertRes.rows[0]?.id]
                );
            } catch (err) {
                await db.query(
                    `UPDATE fraud_alerts
                     SET status = 'failed', error = $2
                     WHERE id = $1`,
                    [alertRes.rows[0]?.id, err.message]
                );
            }
        }

        return {
            fraudCaseId,
            channel,
            recipient,
            payload,
            status: 'queued',
            id: alertRes.rows[0]?.id || null
        };
    }
};
