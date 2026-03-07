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

const TransferEmail = ({
    type, // 'SENDER' or 'RECEIVER'
    senderName,
    receiverName,
    amount,
    currency,
    reference,
    description,
    date,
}) => {
    const isSender = type === 'SENDER';

    return React.createElement(Html, {},
        React.createElement(Head),
        React.createElement(Preview, {}, isSender
            ? `Your transfer to ${receiverName} was successful`
            : `You received ${currency} ${amount} from ${senderName}`
        ),
        React.createElement(Body, { style: main },
            React.createElement(Container, { style: container },
                React.createElement(Section, { style: header },
                    React.createElement(Heading, { style: logoFallback }, "FlapaPay"),
                    React.createElement(Text, { style: headerLabel }, "Transfer Confirmation")
                ),

                React.createElement(Section, { style: content },
                    React.createElement(Text, { style: greeting }, `Hello ${isSender ? senderName : receiverName},`),
                    React.createElement(Text, { style: messageText },
                        isSender
                            ? `Your transfer of ${currency} ${amount} to ${receiverName} has been processed successfully.`
                            : `Good news! ${senderName} has sent you ${currency} ${amount} directly to your FlapaPay wallet.`
                    ),

                    React.createElement(Section, { style: summaryBlock },
                        React.createElement(Section, { style: { display: 'flex', marginBottom: '16px' } },
                            React.createElement(Section, { style: { width: '50%', textAlign: 'left' } },
                                React.createElement(Text, { style: summaryLabel }, "Amount"),
                                React.createElement(Text, { style: amountValue }, `${currency} ${amount}`)
                            ),
                            React.createElement(Section, { style: { width: '50%', textAlign: 'right' } },
                                React.createElement(Text, { style: summaryLabel }, "Status"),
                                React.createElement(Text, { style: statusValue }, "Completed")
                            )
                        ),
                        React.createElement(Hr, { style: innerDivider }),
                        React.createElement(Section, { style: { marginTop: '16px' } },
                            React.createElement(Text, { style: summaryLabel }, "Transaction Reference"),
                            React.createElement(Text, { style: referenceValue }, reference)
                        )
                    ),

                    React.createElement(Section, { style: detailsBlock },
                        React.createElement(Text, { style: detailRow },
                            React.createElement(Text, { style: detailLabel }, isSender ? "Recipient: " : "Sender: "),
                            React.createElement(Text, { style: detailValue }, isSender ? receiverName : senderName)
                        ),
                        React.createElement(Text, { style: detailRow },
                            React.createElement(Text, { style: detailLabel }, "Description: "),
                            React.createElement(Text, { style: detailValue }, description || "Transfer")
                        ),
                        React.createElement(Text, { style: detailRow },
                            React.createElement(Text, { style: detailLabel }, "Date: "),
                            React.createElement(Text, { style: detailValue }, date || new Date().toLocaleString())
                        )
                    ),

                    React.createElement(Section, { style: actionSection },
                        React.createElement(Button, { href: "https://flapapay.com/dashboard", style: button },
                            "View My Dashboard"
                        )
                    ),

                    React.createElement(Hr, { style: footerDivider }),
                    React.createElement(Text, { style: footerNote },
                        "If you didn't authorize this transaction or have any questions, please contact our 24/7 support team immediately."
                    )
                ),

                React.createElement(Section, { style: footer },
                    React.createElement(Text, { style: footerText }, "Secured by FlapaPay Infrastructure")
                )
            )
        )
    );
};

// Styles (Adapted from InvoiceEmail.js for consistency)
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
    fontSize: '28px',
    fontWeight: '900',
    margin: '0',
};

const statusValue = {
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '900',
    margin: '0',
};

const innerDivider = {
    borderColor: '#e2e8f0',
    margin: '16px 0',
};

const referenceValue = {
    color: '#475569',
    fontFamily: 'monospace',
    fontSize: '12px',
    margin: '0',
};

const detailsBlock = {
    marginBottom: '32px',
};

const detailRow = {
    margin: '0 0 8px',
};

const detailLabel = {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 'bold',
};

const detailValue = {
    color: '#1e293b',
    fontSize: '12px',
    fontWeight: 'bold',
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

const renderTransferEmail = (props) => {
    return render(React.createElement(TransferEmail, props));
};

module.exports = { TransferEmail, renderTransferEmail };
