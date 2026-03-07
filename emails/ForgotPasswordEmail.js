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

const ForgotPasswordEmail = ({
    userEmail,
    resetLink,
}) => {
    return React.createElement(Html, {},
        React.createElement(Head),
        React.createElement(Preview, {}, "Reset your FlapaPay password"),
        React.createElement(Body, { style: main },
            React.createElement(Container, { style: container },
                React.createElement(Section, { style: header },
                    React.createElement(Heading, { style: logoFallback }, "FlapaPay"),
                    React.createElement(Text, { style: headerLabel }, "Security Department")
                ),

                React.createElement(Section, { style: content },
                    React.createElement(Text, { style: greeting }, `Hello,`),
                    React.createElement(Text, { style: messageText },
                        "We received a request to reset your FlapaPay password. If you didn't make this request, you can safely ignore this email."
                    ),

                    React.createElement(Section, { style: actionSection },
                        React.createElement(Button, { href: resetLink, style: button },
                            "Reset My Password"
                        )
                    ),

                    React.createElement(Text, { style: linkText },
                        "Or copy and paste this link into your browser:"
                    ),
                    React.createElement(Text, { style: linkDisplay }, resetLink),

                    React.createElement(Hr, { style: footerDivider }),
                    React.createElement(Text, { style: footerNote },
                        "This link will expire in 1 hour. For your security, never share this link with anyone."
                    )
                ),

                React.createElement(Section, { style: footer },
                    React.createElement(Text, { style: footerText }, "The Unified Financial Operating Technology")
                )
            )
        )
    );
};

// Styles (Matching TransferEmail.js for brand consistency)
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
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: '1.4',
    margin: '0 0 32px',
};

const actionSection = {
    textAlign: 'center',
    marginBottom: '32px',
};

const button = {
    backgroundColor: '#f97316',
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '16px',
    fontWeight: '900',
    fontSize: '14px',
    textTransform: 'uppercase',
    textDecoration: 'none',
    letterSpacing: '1px',
};

const linkText = {
    color: '#94a3b8',
    fontSize: '12px',
    margin: '32px 0 8px',
    textAlign: 'center',
};

const linkDisplay = {
    color: '#0f172a',
    fontSize: '12px',
    fontWeight: 'bold',
    textAlign: 'center',
    wordBreak: 'break-all',
};

const footerDivider = {
    borderColor: '#f1f5f9',
    margin: '32px 0 24px',
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

const renderForgotPasswordEmail = (props) => {
    return render(React.createElement(ForgotPasswordEmail, props));
};

module.exports = { ForgotPasswordEmail, renderForgotPasswordEmail };
