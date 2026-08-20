const React = require('react');
const {
    Body, Container, Head, Heading, Html,
    Preview, Section, Text, Hr, Row, Column
} = require('@react-email/components');
const { render } = require('@react-email/render');

/**
 * OtpEmail — used for:
 *  - Sub-merchant onboarding mobile-money verification
 *  - Any future step-up auth or sensitive action confirmation
 *
 * Props:
 *  code           {string}  6-digit OTP
 *  context        {string}  Short description of why the code was sent
 *  recipientName  {string}  Optional name to personalise the greeting
 *  expiresIn      {number}  Minutes until expiry (default 10)
 */
const OtpEmail = ({ code = '000000', context = 'verification', recipientName = '', expiresIn = 10 }) => {
    const digits = String(code).split('');

    return React.createElement(Html, { lang: 'en' },
        React.createElement(Head),
        React.createElement(Preview, {}, `Your FlapaPay code: ${code} — expires in ${expiresIn} minutes`),
        React.createElement(Body, { style: styles.body },
            React.createElement(Container, { style: styles.container },

                // ── Header ──────────────────────────────────────────
                React.createElement(Section, { style: styles.header },
                    React.createElement(Text, { style: styles.logoText }, 'FlapaPay'),
                    React.createElement(Text, { style: styles.headerSub }, 'Secure Verification Code')
                ),

                // ── OTP digits ──────────────────────────────────────
                React.createElement(Section, { style: styles.otpSection },
                    React.createElement(Text, { style: styles.otpLabel }, 'Your one-time code'),
                    React.createElement(Row, { style: styles.digitRow },
                        ...digits.map((d, i) =>
                            React.createElement(Column, { key: i, style: styles.digitCell },
                                React.createElement(Text, { style: styles.digit }, d)
                            )
                        )
                    ),
                    React.createElement(Text, { style: styles.expiry },
                        `This code expires in ${expiresIn} minutes`
                    )
                ),

                React.createElement(Hr, { style: styles.divider }),

                // ── Context + instructions ───────────────────────────
                React.createElement(Section, { style: styles.body2 },
                    recipientName
                        ? React.createElement(Text, { style: styles.greeting }, `Hi ${recipientName},`)
                        : null,
                    React.createElement(Text, { style: styles.contextText },
                        `You requested this code for: `
                    ),
                    React.createElement(Text, { style: styles.contextBadge }, context),
                    React.createElement(Text, { style: styles.instructions },
                        `Enter this code on the FlapaPay page you were using. ` +
                        `Do not share it with anyone — FlapaPay staff will never ask for your code.`
                    )
                ),

                React.createElement(Hr, { style: styles.divider }),

                // ── Security note ────────────────────────────────────
                React.createElement(Section, { style: styles.securityBox },
                    React.createElement(Text, { style: styles.securityIcon }, '🔒'),
                    React.createElement(Text, { style: styles.securityText },
                        `If you did not request this code, you can safely ignore this email. ` +
                        `No action has been taken on your account.`
                    )
                ),

                // ── Footer ───────────────────────────────────────────
                React.createElement(Section, { style: styles.footer },
                    React.createElement(Text, { style: styles.footerText }, 'FlapaPay · Zambia'),
                    React.createElement(Text, { style: styles.footerSub }, 'The Unified Financial Operating Technology')
                )
            )
        )
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = {
    body: {
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        margin: 0,
        padding: 0,
    },
    container: {
        margin: '40px auto',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        maxWidth: '520px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    },
    header: {
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        padding: '36px 40px',
        textAlign: 'center',
    },
    logoText: {
        color: '#ffffff',
        fontSize: '28px',
        fontWeight: '900',
        margin: '0 0 4px 0',
        letterSpacing: '-1px',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '3px',
        margin: '0',
    },
    otpSection: {
        padding: '40px 40px 32px',
        textAlign: 'center',
    },
    otpLabel: {
        color: '#64748b',
        fontSize: '13px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        margin: '0 0 20px',
    },
    digitRow: {
        margin: '0 auto',
        width: 'auto',
    },
    digitCell: {
        padding: '0 5px',
    },
    digit: {
        backgroundColor: '#fff7ed',
        border: '2px solid #fed7aa',
        borderRadius: '12px',
        color: '#ea580c',
        fontSize: '36px',
        fontWeight: '900',
        width: '52px',
        height: '60px',
        lineHeight: '60px',
        textAlign: 'center',
        margin: '0',
        fontFamily: "'Courier New', Courier, monospace",
        letterSpacing: '0',
    },
    expiry: {
        color: '#94a3b8',
        fontSize: '12px',
        fontWeight: '600',
        margin: '20px 0 0',
    },
    divider: {
        borderColor: '#f1f5f9',
        margin: '0 40px',
    },
    body2: {
        padding: '28px 40px',
    },
    greeting: {
        color: '#0f172a',
        fontSize: '15px',
        fontWeight: '700',
        margin: '0 0 12px',
    },
    contextText: {
        color: '#64748b',
        fontSize: '13px',
        fontWeight: '600',
        margin: '0 0 6px',
    },
    contextBadge: {
        display: 'inline-block',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        color: '#15803d',
        fontSize: '12px',
        fontWeight: '700',
        padding: '4px 10px',
        margin: '0 0 16px',
    },
    instructions: {
        color: '#475569',
        fontSize: '13px',
        lineHeight: '1.7',
        margin: '0',
    },
    securityBox: {
        backgroundColor: '#fafafa',
        padding: '20px 40px',
        textAlign: 'center',
    },
    securityIcon: {
        fontSize: '20px',
        margin: '0 0 6px',
    },
    securityText: {
        color: '#94a3b8',
        fontSize: '11px',
        lineHeight: '1.6',
        margin: '0',
    },
    footer: {
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #f1f5f9',
        padding: '24px 40px',
        textAlign: 'center',
    },
    footerText: {
        color: '#cbd5e1',
        fontSize: '11px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        margin: '0 0 4px',
    },
    footerSub: {
        color: '#e2e8f0',
        fontSize: '10px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        margin: '0',
    },
};

const renderOtpEmail = (props) => render(React.createElement(OtpEmail, props));

module.exports = { OtpEmail, renderOtpEmail };
