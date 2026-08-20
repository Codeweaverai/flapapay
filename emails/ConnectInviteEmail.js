const React = require('react');
const {
    Body, Button, Container, Head, Hr,
    Html, Preview, Section, Text
} = require('@react-email/components');
const { render } = require('@react-email/render');

/**
 * ConnectInviteEmail — sent when a platform operator invites a sub-merchant
 *
 * Props:
 *  platformName   {string}  Name of the inviting platform
 *  platformColor  {string}  Hex colour (optional, defaults to FlapaPay orange)
 *  inviteUrl      {string}  The hosted onboarding link
 *  businessName   {string}  Pre-filled business name (optional)
 *  recipientEmail {string}  Shown in the greeting
 *  expiresAt      {string}  Human-readable expiry e.g. "7 days"
 */
const ConnectInviteEmail = ({
    platformName = 'Our Platform',
    platformColor = '#f97316',
    inviteUrl = '#',
    businessName = '',
    recipientEmail = '',
    expiresAt = '7 days',
}) => {
    return React.createElement(Html, { lang: 'en' },
        React.createElement(Head),
        React.createElement(Preview, {}, `You're invited to join ${platformName} and start accepting payments`),
        React.createElement(Body, { style: styles.body },
            React.createElement(Container, { style: styles.container },

                // ── Header ──────────────────────────────────────────
                React.createElement(Section, { style: { ...styles.header, background: `linear-gradient(135deg, ${platformColor} 0%, #ea580c 100%)` } },
                    React.createElement(Text, { style: styles.poweredBy }, 'Powered by FlapaPay'),
                    React.createElement(Text, { style: styles.platformName }, platformName),
                    React.createElement(Text, { style: styles.headerSub }, 'Seller Onboarding Invitation')
                ),

                // ── Body ────────────────────────────────────────────
                React.createElement(Section, { style: styles.content },
                    React.createElement(Text, { style: styles.greeting },
                        recipientEmail ? `Hello${businessName ? `, ${businessName}` : ''},` : 'Hello,'
                    ),
                    React.createElement(Text, { style: styles.intro },
                        `You've been invited to connect your business to ${platformName} and start accepting payments through FlapaPay.`
                    ),

                    // What to expect bullets
                    React.createElement(Section, { style: styles.bulletBox },
                        React.createElement(Text, { style: styles.bulletTitle }, 'What you\'ll need to complete:'),
                        ...[
                            '✓  Business or personal identity (NRC / PACRA)',
                            '✓  Contact details and business address',
                            '✓  Payout method — mobile money or bank account',
                            '✓  Accept FlapaPay Terms of Service',
                        ].map((line, i) =>
                            React.createElement(Text, { key: i, style: styles.bullet }, line)
                        )
                    ),

                    React.createElement(Section, { style: styles.ctaSection },
                        React.createElement(Button, {
                            href: inviteUrl,
                            style: { ...styles.ctaButton, backgroundColor: platformColor }
                        }, 'Start Onboarding →')
                    ),

                    React.createElement(Text, { style: styles.linkHint },
                        'Or copy this link into your browser:'
                    ),
                    React.createElement(Text, { style: styles.linkDisplay }, inviteUrl),

                    React.createElement(Hr, { style: styles.divider }),
                    React.createElement(Text, { style: styles.expiry },
                        `⏱  This invitation expires in ${expiresAt}. After that, contact ${platformName} for a new link.`
                    )
                ),

                // ── Footer ───────────────────────────────────────────
                React.createElement(Section, { style: styles.footer },
                    React.createElement(Text, { style: styles.footerText }, `${platformName} uses FlapaPay Connect`),
                    React.createElement(Text, { style: styles.footerSub }, 'FlapaPay · Zambia · The Unified Financial Operating Technology')
                )
            )
        )
    );
};

const styles = {
    body: {
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    },
    container: {
        margin: '40px auto',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        maxWidth: '580px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    },
    header: {
        padding: '40px',
        textAlign: 'center',
    },
    poweredBy: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: '10px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '3px',
        margin: '0 0 8px',
    },
    platformName: {
        color: '#ffffff',
        fontSize: '30px',
        fontWeight: '900',
        letterSpacing: '-1px',
        margin: '0 0 6px',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        margin: '0',
    },
    content: {
        padding: '40px',
    },
    greeting: {
        color: '#0f172a',
        fontSize: '16px',
        fontWeight: '700',
        margin: '0 0 16px',
    },
    intro: {
        color: '#334155',
        fontSize: '15px',
        lineHeight: '1.7',
        margin: '0 0 28px',
    },
    bulletBox: {
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '32px',
        borderLeft: '4px solid #f97316',
    },
    bulletTitle: {
        color: '#0f172a',
        fontSize: '12px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        margin: '0 0 12px',
    },
    bullet: {
        color: '#475569',
        fontSize: '13px',
        fontWeight: '600',
        lineHeight: '1.6',
        margin: '0 0 6px',
    },
    ctaSection: {
        textAlign: 'center',
        marginBottom: '20px',
    },
    ctaButton: {
        color: '#ffffff',
        padding: '16px 40px',
        borderRadius: '16px',
        fontWeight: '900',
        fontSize: '15px',
        textDecoration: 'none',
        letterSpacing: '0.5px',
        display: 'inline-block',
    },
    linkHint: {
        color: '#94a3b8',
        fontSize: '11px',
        textAlign: 'center',
        margin: '16px 0 6px',
    },
    linkDisplay: {
        color: '#475569',
        fontSize: '11px',
        fontWeight: '600',
        textAlign: 'center',
        wordBreak: 'break-all',
        margin: '0 0 24px',
    },
    divider: {
        borderColor: '#f1f5f9',
        margin: '8px 0 20px',
    },
    expiry: {
        color: '#94a3b8',
        fontSize: '12px',
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
        fontWeight: '700',
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

const renderConnectInviteEmail = (props) => render(React.createElement(ConnectInviteEmail, props));

module.exports = { ConnectInviteEmail, renderConnectInviteEmail };
