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

const InvoiceEmail = ({
    merchantName,
    merchantLogo,
    clientName,
    invoiceNumber,
    currency,
    totalAmount,
    paymentLink,
    message,
}) => {
    return React.createElement(Html, {},
        React.createElement(Head),
        React.createElement(Preview, {}, `Invoice #${invoiceNumber} from ${merchantName}`),
        React.createElement(Body, { style: main },
            React.createElement(Container, { style: container },
                React.createElement(Section, { style: header },
                    merchantLogo ?
                        React.createElement(Img, { src: merchantLogo, height: "40", alt: merchantName, style: logo }) :
                        React.createElement(Text, { style: logoFallback }, merchantName),
                    React.createElement(Text, { style: headerLabel }, "Official Communication")
                ),

                React.createElement(Section, { style: content },
                    React.createElement(Text, { style: greeting }, `Dear ${clientName},`),
                    React.createElement(Text, { style: messageText },
                        message || "Please find attached your invoice. You can also pay online securely."
                    ),

                    React.createElement(Section, { style: summaryBlock },
                        React.createElement(Section, { style: { display: 'flex' } },
                            React.createElement(Section, { style: { width: '50%', textAlign: 'left' } },
                                React.createElement(Text, { style: summaryLabel }, "Amount Due"),
                                React.createElement(Text, { style: amountValue }, `${currency} ${totalAmount}`)
                            ),
                            React.createElement(Section, { style: { width: '50%', textAlign: 'right' } },
                                React.createElement(Text, { style: summaryLabel }, "Invoice №"),
                                React.createElement(Text, { style: invoiceValue }, `#${invoiceNumber}`)
                            )
                        )
                    ),

                    React.createElement(Section, { style: sharingBlock },
                        React.createElement(Text, { style: sharingTitle }, "Sharing & Payment"),
                        React.createElement(Text, { style: sharingSubtitle }, "Online Payment Link"),
                        React.createElement(Section, { style: linkBox },
                            React.createElement(Text, { style: paymentUrl }, paymentLink)
                        ),

                        React.createElement(Section, { style: buttonContainer },
                            React.createElement(Button, { href: paymentLink, style: button },
                                "Authorize Secure Payment"
                            )
                        ),

                        React.createElement(Hr, { style: divider }),
                        React.createElement(Text, { style: sharingFooter },
                            "Sharing this link with the client will allow them to accept mobile money and card payments securely."
                        )
                    ),

                    React.createElement(Hr, { style: footerDivider }),
                    React.createElement(Section, { style: attachmentPreview },
                        React.createElement(Text, { style: attachmentName }, `Invoice-${invoiceNumber}.pdf`),
                        React.createElement(Text, { style: attachmentLabel }, "Digital Audit Attachment")
                    )
                ),

                React.createElement(Section, { style: footer },
                    React.createElement(Text, { style: footerText }, "Secured by FlapaPay Infrastructure")
                )
            )
        )
    );
};

const main = {
    backgroundColor: '#f9fafb',
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
};

const container = {
    margin: '40px auto',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    overflow: 'hidden',
    maxWidth: '600px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const header = {
    backgroundColor: '#000000',
    padding: '40px',
    textAlign: 'center',
};

const logo = {
    margin: '0 auto 16px',
};

const logoFallback = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '900',
    margin: '0 0 8px 0',
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
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 16px',
};

const messageText = {
    color: '#111827',
    fontSize: '18px',
    fontWeight: 'bold',
    lineHeight: '1.6',
    margin: '0 0 32px',
    whiteSpace: 'pre-wrap',
};

const summaryBlock = {
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '32px',
};

const summaryLabel = {
    color: '#9ca3af',
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '0 0 4px',
};

const amountValue = {
    color: '#f97316',
    fontSize: '24px',
    fontWeight: '900',
    margin: '0',
};

const invoiceValue = {
    color: '#111827',
    fontSize: '18px',
    fontWeight: '900',
    margin: '0',
};

const sharingBlock = {
    backgroundColor: '#000000',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '32px',
};

const sharingTitle = {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    margin: '0 0 16px',
};

const sharingSubtitle = {
    color: 'rgba(255,255,255,0.2)',
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '0 0 8px',
};

const linkBox = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '24px',
};

const paymentUrl = {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'monospace',
    fontSize: '11px',
    margin: '0',
    wordBreak: 'break-all',
};

const buttonContainer = {
    textAlign: 'left',
    marginBottom: '24px',
};

const button = {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '14px 28px',
    borderRadius: '14px',
    fontWeight: '900',
    fontSize: '10px',
    textTransform: 'uppercase',
    textDecoration: 'none',
    letterSpacing: '1px',
};

const divider = {
    borderColor: 'rgba(255,255,255,0.1)',
    margin: '0 0 16px',
};

const sharingFooter = {
    color: 'rgba(255,255,255,0.2)',
    fontSize: '10px',
    fontWeight: 'bold',
    margin: '0',
};

const footerDivider = {
    borderColor: '#f3f4f6',
    margin: '0 0 24px',
};

const attachmentPreview = {
    display: 'flex',
    alignItems: 'center',
    padding: '0 0 8px',
};

const attachmentName = {
    color: '#111827',
    fontSize: '14px',
    fontWeight: '900',
    margin: '0 0 4px',
};

const attachmentLabel = {
    color: '#9ca3af',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '0',
};

const footer = {
    backgroundColor: '#fafafa',
    padding: '24px',
    textAlign: 'center',
    borderTop: '1px solid #f3f4f6',
};

const footerText = {
    color: '#d1d5db',
    fontSize: '9px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    margin: '0',
};

const renderInvoiceEmail = (props) => {
    return render(React.createElement(InvoiceEmail, props));
};

module.exports = { InvoiceEmail, renderInvoiceEmail };
