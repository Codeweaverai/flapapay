const React = require('react');
const {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Button
} = require('@react-email/components');
const { render } = require('@react-email/render');

const RequestMoneyEmail = ({
    requesterName,
    requesterEmail,
    amount,
    currency,
    description,
    paymentLink,
}) => {
    return React.createElement(Html, {},
        React.createElement(Head),
        React.createElement(Preview, {}, `${requesterName} is requesting ${currency} ${amount}`),
        React.createElement(Body, { style: main },
            React.createElement(Container, { style: container },
                React.createElement(Section, { style: header },
                    React.createElement(Heading, { style: logoFallback }, "FlapaPay"),
                    React.createElement(Text, { style: headerLabel }, "Money Request")
                ),

                React.createElement(Section, { style: content },
                    React.createElement(Text, { style: greeting }, `Hello,`),
                    React.createElement(Text, { style: messageText },
                        `${requesterName} (${requesterEmail}) has requested a payment from you.`
                    ),

                    React.createElement(Section, { style: summaryBlock },
                        React.createElement(Section, { style: { display: 'flex', marginBottom: '16px' } },
                            React.createElement(Section, { style: { width: '100%', textAlign: 'center' } },
                                React.createElement(Text, { style: summaryLabel }, "Requested Amount"),
                                React.createElement(Text, { style: amountValue }, `${currency} ${amount}`)
                            )
                        ),
                        React.createElement(Hr, { style: innerDivider }),
                        React.createElement(Section, { style: { marginTop: '16px' } },
                            React.createElement(Text, { style: summaryLabel }, "Note from Requester"),
                            React.createElement(Text, { style: referenceValue }, description || "No note provided")
                        )
                    ),

                    React.createElement(Section, { style: actionSection },
                        React.createElement(Button, { href: paymentLink, style: button },
                            "Pay This Request"
                        )
                    ),

                    React.createElement(Text, { style: infoText },
                        "You can pay this request using your FlapaPay balance or a linked card. If you don't recognize this person, you can safely ignore this email."
                    ),

                    React.createElement(Hr, { style: footerDivider }),
                    React.createElement(Text, { style: footerNote },
                        "Questions? Our 24/7 support team is here to help."
                    )
                ),

                React.createElement(Section, { style: footer },
                    React.createElement(Text, { style: footerText }, "Secured by FlapaPay Infrastructure")
                )
            )
        )
    );
};

// Styles (Matching TransferEmail.js)
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
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

const header = {
    backgroundColor: '#000000',
    padding: '40px',
    textAlign: 'center',
};

const logoFallback = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '900',
    margin: '0 0 8px 0',
    letterSpacing: '-1px',
};

const headerLabel = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    margin: '0',
};

const content = {
    padding: '40px',
};

const greeting = {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 16px',
};

const messageText = {
    color: '#0f172a',
    fontSize: '20px',
    fontWeight: '900',
    lineHeight: '1.4',
    margin: '0 0 32px',
};

const summaryBlock = {
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '32px',
    border: '1px solid #f1f5f9',
};

const summaryLabel = {
    color: '#94a3b8',
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '0 0 4px',
};

const amountValue = {
    color: '#f97316',
    fontSize: '32px',
    fontWeight: '900',
    margin: '0',
};

const innerDivider = {
    borderColor: '#e2e8f0',
    margin: '16px 0',
};

const referenceValue = {
    color: '#475569',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0',
};

const actionSection = {
    textAlign: 'center',
    marginBottom: '32px',
};

const button = {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '16px',
    fontWeight: '900',
    fontSize: '12px',
    textTransform: 'uppercase',
    textDecoration: 'none',
    letterSpacing: '1px',
};

const infoText = {
    color: '#64748b',
    fontSize: '12px',
    textAlign: 'center',
    margin: '0 0 24px',
    lineHeight: '1.6',
};

const footerDivider = {
    borderColor: '#f1f5f9',
    margin: '0 0 24px',
};

const footerNote = {
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: 'bold',
    textAlign: 'center',
};

const footer = {
    backgroundColor: '#f8fafc',
    padding: '24px',
    textAlign: 'center',
    borderTop: '1px solid #f1f5f9',
};

const footerText = {
    color: '#cbd5e1',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    margin: '0',
};

const renderRequestMoneyEmail = (props) => {
    return render(React.createElement(RequestMoneyEmail, props));
};

module.exports = { RequestMoneyEmail, renderRequestMoneyEmail };
