const React = require('react');
const {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Button
} = require('@react-email/components');
const { render } = require('@react-email/render');

// ─────────────────────────────────────────────
// Email sent to the RECIPIENT (unregistered)
// ─────────────────────────────────────────────
const ClaimFundsEmail = ({
    senderName,
    amount,
    currency,
    description,
    claimUrl,
    expiresAt,
}) => {
    const currencySymbol = currency === 'ZMW' ? 'K' : currency === 'NGN' ? '₦' : '$';

    return React.createElement(Html, {},
        React.createElement(Head),
        React.createElement(Preview, {},
            `${senderName} sent you ${currencySymbol}${amount} — claim your funds on FlapaPay`
        ),
        React.createElement(Body, { style: main },
            React.createElement(Container, { style: container },

                // Header
                React.createElement(Section, { style: header },
                    React.createElement(Heading, { style: logoFallback }, "FlapaPay"),
                    React.createElement(Text, { style: headerLabel }, "You have received money")
                ),

                // Content
                React.createElement(Section, { style: content },
                    React.createElement(Text, { style: greeting }, `Hello,`),
                    React.createElement(Text, { style: messageText },
                        `${senderName} has sent you money via FlapaPay.`
                    ),

                    // Amount block
                    React.createElement(Section, { style: amountBlock },
                        React.createElement(Text, { style: amountLabel }, "Amount Waiting For You"),
                        React.createElement(Text, { style: amountValue },
                            `${currencySymbol}${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        ),
                        React.createElement(Text, { style: currencyBadge }, currency),
                        description ? React.createElement(React.Fragment, {},
                            React.createElement(Hr, { style: innerDivider }),
                            React.createElement(Text, { style: noteText }, `"${description}"`)
                        ) : null
                    ),

                    React.createElement(Text, { style: instructionText },
                        `To collect your funds, create a free FlapaPay account using this email address. Your money will be automatically deposited to your new wallet.`
                    ),

                    // CTA
                    React.createElement(Section, { style: ctaSection },
                        React.createElement(Button, { href: claimUrl, style: ctaButton },
                            "Claim Your Funds →"
                        )
                    ),

                    React.createElement(Text, { style: orText }, "or copy this link into your browser:"),
                    React.createElement(Text, { style: linkText }, claimUrl),

                    React.createElement(Hr, { style: footerDivider }),

                    React.createElement(Text, { style: expiryNote },
                        `⏱ This payment expires on ${expiresAt}. If unclaimed, the funds will be returned to ${senderName}.`
                    ),

                    React.createElement(Text, { style: footerNote },
                        "If you were not expecting this payment, you can safely ignore this email. No account will be created without your action."
                    )
                ),

                // Footer
                React.createElement(Section, { style: footer },
                    React.createElement(Text, { style: footerText }, "Secured by FlapaPay Infrastructure")
                )
            )
        )
    );
};

// ─────────────────────────────────────────────
// Email sent to the SENDER confirming escrow
// ─────────────────────────────────────────────
const PendingPaymentConfirmEmail = ({
    senderName,
    recipientEmail,
    amount,
    currency,
    description,
    reference,
    expiresAt,
}) => {
    const currencySymbol = currency === 'ZMW' ? 'K' : currency === 'NGN' ? '₦' : '$';

    return React.createElement(Html, {},
        React.createElement(Head),
        React.createElement(Preview, {},
            `Payment of ${currencySymbol}${amount} to ${recipientEmail} is pending — they'll be notified to claim it`
        ),
        React.createElement(Body, { style: main },
            React.createElement(Container, { style: container },

                React.createElement(Section, { style: pendingHeader },
                    React.createElement(Heading, { style: logoFallback }, "FlapaPay"),
                    React.createElement(Text, { style: headerLabel }, "Payment Pending — Held in Escrow")
                ),

                React.createElement(Section, { style: content },
                    React.createElement(Text, { style: greeting }, `Hello ${senderName},`),
                    React.createElement(Text, { style: messageText },
                        `Your payment has been sent and is waiting to be claimed. We've notified the recipient by email.`
                    ),

                    React.createElement(Section, { style: summaryBlock },
                        React.createElement(Section, { style: summaryRow },
                            React.createElement(Text, { style: summaryLabel }, "Amount Sent"),
                            React.createElement(Text, { style: summaryValue },
                                `${currencySymbol}${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`
                            )
                        ),
                        React.createElement(Hr, { style: innerDivider }),
                        React.createElement(Section, { style: summaryRow },
                            React.createElement(Text, { style: summaryLabel }, "To"),
                            React.createElement(Text, { style: summaryValue }, recipientEmail)
                        ),
                        React.createElement(Hr, { style: innerDivider }),
                        React.createElement(Section, { style: summaryRow },
                            React.createElement(Text, { style: summaryLabel }, "Status"),
                            React.createElement(Text, { style: pendingStatus }, "PENDING — AWAITING CLAIM")
                        ),
                        React.createElement(Hr, { style: innerDivider }),
                        React.createElement(Section, { style: summaryRow },
                            React.createElement(Text, { style: summaryLabel }, "Reference"),
                            React.createElement(Text, { style: referenceValue }, reference)
                        ),
                        description ? React.createElement(React.Fragment, {},
                            React.createElement(Hr, { style: innerDivider }),
                            React.createElement(Section, { style: summaryRow },
                                React.createElement(Text, { style: summaryLabel }, "Note"),
                                React.createElement(Text, { style: summaryValue }, description)
                            )
                        ) : null,
                        React.createElement(Hr, { style: innerDivider }),
                        React.createElement(Section, { style: summaryRow },
                            React.createElement(Text, { style: summaryLabel }, "Expires"),
                            React.createElement(Text, { style: summaryValue }, expiresAt)
                        )
                    ),

                    React.createElement(Text, { style: instructionText },
                        `Once the recipient registers with FlapaPay using that email address, the funds will be automatically credited to their wallet and you'll receive a confirmation.`
                    ),

                    React.createElement(Text, { style: instructionText },
                        `If the recipient does not claim the funds before ${expiresAt}, the payment will expire and the full amount will be automatically refunded to your wallet.`
                    ),

                    React.createElement(Hr, { style: footerDivider }),
                    React.createElement(Text, { style: footerNote },
                        "If you did not initiate this payment, please contact our support team immediately."
                    )
                ),

                React.createElement(Section, { style: footer },
                    React.createElement(Text, { style: footerText }, "Secured by FlapaPay Infrastructure")
                )
            )
        )
    );
};

// ─────────────────────────────────────────────
// Email when funds are claimed (to new user)
// ─────────────────────────────────────────────
const FundsCreditedEmail = ({
    recipientName,
    senderName,
    amount,
    currency,
}) => {
    const currencySymbol = currency === 'ZMW' ? 'K' : currency === 'NGN' ? '₦' : '$';

    return React.createElement(Html, {},
        React.createElement(Head),
        React.createElement(Preview, {},
            `${currencySymbol}${amount} from ${senderName} has been credited to your FlapaPay wallet`
        ),
        React.createElement(Body, { style: main },
            React.createElement(Container, { style: container },

                React.createElement(Section, { style: successHeader },
                    React.createElement(Heading, { style: logoFallback }, "FlapaPay"),
                    React.createElement(Text, { style: headerLabel }, "Funds Credited to Your Wallet")
                ),

                React.createElement(Section, { style: content },
                    React.createElement(Text, { style: greeting }, `Welcome, ${recipientName}!`),
                    React.createElement(Text, { style: messageText },
                        `Your pending payment from ${senderName} has been automatically credited to your new FlapaPay wallet.`
                    ),

                    React.createElement(Section, { style: amountBlock },
                        React.createElement(Text, { style: amountLabel }, "Credited to Your Wallet"),
                        React.createElement(Text, { style: amountValue },
                            `${currencySymbol}${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        ),
                        React.createElement(Text, { style: currencyBadge }, currency)
                    ),

                    React.createElement(Section, { style: ctaSection },
                        React.createElement(Button, { href: "https://app.flapapay.com/dashboard", style: ctaButton },
                            "View My Wallet →"
                        )
                    ),

                    React.createElement(Hr, { style: footerDivider }),
                    React.createElement(Text, { style: footerNote },
                        "Welcome to FlapaPay — the fastest way to move money across Africa."
                    )
                ),

                React.createElement(Section, { style: footer },
                    React.createElement(Text, { style: footerText }, "Secured by FlapaPay Infrastructure")
                )
            )
        )
    );
};

// ─────────────────────────────────────────────
// Email when payment expires (refund to sender)
// ─────────────────────────────────────────────
const PaymentExpiredEmail = ({
    senderName,
    recipientEmail,
    amount,
    currency,
    reference,
}) => {
    const currencySymbol = currency === 'ZMW' ? 'K' : currency === 'NGN' ? '₦' : '$';

    return React.createElement(Html, {},
        React.createElement(Head),
        React.createElement(Preview, {},
            `Your payment of ${currencySymbol}${amount} to ${recipientEmail} has expired — funds refunded`
        ),
        React.createElement(Body, { style: main },
            React.createElement(Container, { style: container },

                React.createElement(Section, { style: expiredHeader },
                    React.createElement(Heading, { style: logoFallback }, "FlapaPay"),
                    React.createElement(Text, { style: headerLabel }, "Payment Expired — Funds Refunded")
                ),

                React.createElement(Section, { style: content },
                    React.createElement(Text, { style: greeting }, `Hello ${senderName},`),
                    React.createElement(Text, { style: messageText },
                        `Your pending payment to ${recipientEmail} has expired because the recipient did not register within the 30-day window.`
                    ),

                    React.createElement(Section, { style: summaryBlock },
                        React.createElement(Section, { style: summaryRow },
                            React.createElement(Text, { style: summaryLabel }, "Amount Refunded"),
                            React.createElement(Text, { style: summaryValue },
                                `${currencySymbol}${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`
                            )
                        ),
                        React.createElement(Hr, { style: innerDivider }),
                        React.createElement(Section, { style: summaryRow },
                            React.createElement(Text, { style: summaryLabel }, "Original Recipient"),
                            React.createElement(Text, { style: summaryValue }, recipientEmail)
                        ),
                        React.createElement(Hr, { style: innerDivider }),
                        React.createElement(Section, { style: summaryRow },
                            React.createElement(Text, { style: summaryLabel }, "Reference"),
                            React.createElement(Text, { style: referenceValue }, reference)
                        )
                    ),

                    React.createElement(Text, { style: instructionText },
                        `The funds including the original transaction fee have been refunded to your wallet. You may try sending again.`
                    ),

                    React.createElement(Hr, { style: footerDivider }),
                    React.createElement(Text, { style: footerNote },
                        "Questions? Contact our support team."
                    )
                ),

                React.createElement(Section, { style: footer },
                    React.createElement(Text, { style: footerText }, "Secured by FlapaPay Infrastructure")
                )
            )
        )
    );
};

// ── Styles ──────────────────────────────────────
const main = {
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
};
const container = {
    margin: '40px auto',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    overflow: 'hidden',
    maxWidth: '600px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
};
const header = { backgroundColor: '#000000', padding: '40px', textAlign: 'center' };
const pendingHeader = { backgroundColor: '#f97316', padding: '40px', textAlign: 'center' };
const successHeader = { backgroundColor: '#10b981', padding: '40px', textAlign: 'center' };
const expiredHeader = { backgroundColor: '#64748b', padding: '40px', textAlign: 'center' };
const logoFallback = { color: '#ffffff', fontSize: '28px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1px' };
const headerLabel = { color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '3px', margin: '0' };
const content = { padding: '40px' };
const greeting = { color: '#64748b', fontSize: '14px', fontWeight: 'bold', margin: '0 0 16px' };
const messageText = { color: '#0f172a', fontSize: '20px', fontWeight: '900', lineHeight: '1.4', margin: '0 0 32px' };
const amountBlock = { backgroundColor: '#fff7ed', borderRadius: '20px', padding: '28px', textAlign: 'center', marginBottom: '32px', border: '2px solid #fed7aa' };
const amountLabel = { color: '#94a3b8', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px' };
const amountValue = { color: '#f97316', fontSize: '40px', fontWeight: '900', margin: '0 0 4px', letterSpacing: '-1px' };
const currencyBadge = { color: '#f97316', fontSize: '12px', fontWeight: '900', margin: '0', textTransform: 'uppercase', letterSpacing: '2px' };
const noteText = { color: '#475569', fontSize: '14px', fontStyle: 'italic', margin: '0', textAlign: 'center' };
const instructionText = { color: '#475569', fontSize: '14px', lineHeight: '1.7', margin: '0 0 20px' };
const ctaSection = { textAlign: 'center', margin: '32px 0' };
const ctaButton = { backgroundColor: '#f97316', color: '#ffffff', padding: '18px 40px', borderRadius: '16px', fontWeight: '900', fontSize: '14px', textDecoration: 'none', letterSpacing: '0.5px', display: 'inline-block' };
const orText = { color: '#94a3b8', fontSize: '11px', textAlign: 'center', margin: '0 0 8px', fontWeight: 'bold' };
const linkText = { color: '#f97316', fontSize: '11px', textAlign: 'center', margin: '0 0 32px', wordBreak: 'break-all', fontFamily: 'monospace' };
const expiryNote = { color: '#92400e', backgroundColor: '#fef3c7', padding: '12px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', margin: '0 0 16px' };
const summaryBlock = { backgroundColor: '#f8fafc', borderRadius: '20px', padding: '24px', marginBottom: '32px', border: '1px solid #f1f5f9' };
const summaryRow = { display: 'flex', marginBottom: '4px' };
const summaryLabel = { color: '#94a3b8', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' };
const summaryValue = { color: '#1e293b', fontSize: '14px', fontWeight: '900', margin: '0' };
const pendingStatus = { color: '#f97316', fontSize: '12px', fontWeight: '900', margin: '0', textTransform: 'uppercase', letterSpacing: '1px' };
const referenceValue = { color: '#475569', fontFamily: 'monospace', fontSize: '12px', margin: '0' };
const innerDivider = { borderColor: '#e2e8f0', margin: '12px 0' };
const footerDivider = { borderColor: '#f1f5f9', margin: '0 0 24px' };
const footerNote = { color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', margin: '0' };
const footer = { backgroundColor: '#f8fafc', padding: '24px', textAlign: 'center', borderTop: '1px solid #f1f5f9' };
const footerText = { color: '#cbd5e1', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', margin: '0' };

// ── Render helpers ──────────────────────────────
const renderClaimFundsEmail = (props) => render(React.createElement(ClaimFundsEmail, props));
const renderPendingPaymentConfirmEmail = (props) => render(React.createElement(PendingPaymentConfirmEmail, props));
const renderFundsCreditedEmail = (props) => render(React.createElement(FundsCreditedEmail, props));
const renderPaymentExpiredEmail = (props) => render(React.createElement(PaymentExpiredEmail, props));

module.exports = {
    ClaimFundsEmail,
    PendingPaymentConfirmEmail,
    FundsCreditedEmail,
    PaymentExpiredEmail,
    renderClaimFundsEmail,
    renderPendingPaymentConfirmEmail,
    renderFundsCreditedEmail,
    renderPaymentExpiredEmail,
};
