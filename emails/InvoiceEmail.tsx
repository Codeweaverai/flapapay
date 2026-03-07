import {
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
} from '@react-email/components';
import * as React from 'react';

interface InvoiceEmailProps {
    merchantName: string;
    merchantLogo?: string;
    clientName: string;
    invoiceNumber: string;
    currency: string;
    totalAmount: string;
    paymentLink: string;
    message?: string;
}

export const InvoiceEmail = ({
    merchantName,
    merchantLogo,
    clientName,
    invoiceNumber,
    currency,
    totalAmount,
    paymentLink,
    message,
}: InvoiceEmailProps) => (
    <Html>
        <Head />
        <Preview>Invoice #{invoiceNumber} from {merchantName}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    {merchantLogo ? (
                        <Img src={merchantLogo} height="40" alt={merchantName} style={logo} />
                    ) : (
                        <Text style={logoFallback}>{merchantName}</Text>
                    )}
                    <Text style={headerLabel}>Official Communication</Text>
                </Section>

                <Section style={content}>
                    <Text style={greeting}>Dear {clientName},</Text>
                    <Text style={messageText}>
                        {message || "Please find attached your invoice. You can also pay online securely."}
                    </Text>

                    <Section style={summaryBlock}>
                        <Section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Section style={{ width: '50%', textAlign: 'left' }}>
                                <Text style={summaryLabel}>Amount Due</Text>
                                <Text style={amountValue}>{currency} {totalAmount}</Text>
                            </Section>
                            <Section style={{ width: '50%', textAlign: 'right' }}>
                                <Text style={summaryLabel}>Invoice №</Text>
                                <Text style={invoiceValue}>#{invoiceNumber}</Text>
                            </Section>
                        </Section>
                    </Section>

                    <Section style={sharingBlock}>
                        <Text style={sharingTitle}>Sharing & Payment</Text>
                        <Text style={sharingSubtitle}>Online Payment Link</Text>
                        <Section style={linkBox}>
                            <Text style={paymentUrl}>{paymentLink}</Text>
                        </Section>

                        <Section style={buttonContainer}>
                            <Button href={paymentLink} style={button}>
                                Authorize Secure Payment
                            </Button>
                        </Section>

                        <Hr style={divider} />
                        <Text style={sharingFooter}>
                            Sharing this link with the client will allow them to accept mobile money and card payments securely.
                        </Text>
                    </Section>

                    <Hr style={footerDivider} />
                    <Section style={attachmentPreview}>
                        <Text style={attachmentName}>Invoice-{invoiceNumber}.pdf</Text>
                        <Text style={attachmentLabel}>Digital Audit Attachment</Text>
                    </Section>
                </Section>

                <Section style={footer}>
                    <Text style={footerText}>Secured by FlapaPay Infrastructure</Text>
                </Section>
            </Container>
        </Body>
    </Html>
);

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
    textAlign: 'center' as const,
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
    textTransform: 'uppercase' as const,
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
    whiteSpace: 'pre-wrap' as const,
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
    textTransform: 'uppercase' as const,
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
    textTransform: 'uppercase' as const,
    letterSpacing: '3px',
    margin: '0 0 16px',
};

const sharingSubtitle = {
    color: 'rgba(255,255,255,0.2)',
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase' as const,
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
    wordBreak: 'break-all' as const,
};

const buttonContainer = {
    textAlign: 'left' as const,
    marginBottom: '24px',
};

const button = {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '14px 28px',
    borderRadius: '14px',
    fontWeight: '900',
    fontSize: '10px',
    textTransform: 'uppercase' as const,
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
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    margin: '0',
};

const footer = {
    backgroundColor: '#fafafa',
    padding: '24px',
    textAlign: 'center' as const,
    borderTop: '1px solid #f3f4f6',
};

const footerText = {
    color: '#d1d5db',
    fontSize: '9px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    margin: '0',
};

// Help with rendering on server
import { render } from '@react-email/render';
export const renderInvoiceEmail = (props: InvoiceEmailProps) => {
    return render(React.createElement(InvoiceEmail, props));
};
