const React = require('react');
const { Document, Page, Text, View, Image, StyleSheet, Font } = require('@react-pdf/renderer');

// Define styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        letterSpacing: -0.5,
    },
    statusBadge: {
        backgroundColor: '#ECFDF5',
        color: '#10B981',
        padding: '4 12',
        borderRadius: 8,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: 8,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    amountContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        marginBottom: 30,
    },
    amountValue: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#111827',
    },
    amountLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 5,
        fontWeight: 'bold',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    detailItem: {
        width: '45%',
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 9,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    footer: {
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 20,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 9,
        color: '#D1D5DB',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});

const TransferReceiptDocument = ({ transfer, sender, receiver }) => {
    return React.createElement(Document, {},
        React.createElement(Page, { size: "A4", style: styles.page },
            // Header
            React.createElement(View, { style: styles.header },
                React.createElement(View, {},
                    React.createElement(Text, { style: styles.title }, "Transfer Receipt"),
                    React.createElement(View, { style: styles.statusBadge },
                        React.createElement(Text, {}, "Completed")
                    )
                ),
                React.createElement(View, { style: { alignItems: 'flex-end' } },
                    React.createElement(Text, { style: { fontSize: 14, fontWeight: 'bold' } }, "FlapaPay"),
                    React.createElement(Text, { style: { fontSize: 9, color: '#9CA3AF', marginTop: 4 } }, `Date: ${new Date(transfer.created_at || Date.now()).toLocaleString()}`),
                    React.createElement(Text, { style: { fontSize: 9, color: '#9CA3AF', marginTop: 2 } }, `Ref: ${transfer.transaction_reference}`)
                )
            ),

            // Amount Banner
            React.createElement(View, { style: styles.amountContainer },
                React.createElement(Text, { style: styles.amountValue }, `${transfer.currency} ${parseFloat(transfer.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`),
                React.createElement(Text, { style: styles.amountLabel }, "Total Amount Sent")
            ),

            // Details Section
            React.createElement(View, { style: styles.section },
                React.createElement(Text, { style: styles.sectionTitle }, "Transaction Details"),
                React.createElement(View, { style: styles.detailsGrid },
                    React.createElement(View, { style: styles.detailItem },
                        React.createElement(Text, { style: styles.detailLabel }, "Sender"),
                        React.createElement(Text, { style: styles.detailValue }, sender.full_name),
                        React.createElement(Text, { style: { fontSize: 9, color: '#6B7280', marginTop: 2 } }, sender.email)
                    ),
                    React.createElement(View, { style: styles.detailItem },
                        React.createElement(Text, { style: styles.detailLabel }, "Recipient"),
                        React.createElement(Text, { style: styles.detailValue }, receiver.full_name),
                        React.createElement(Text, { style: { fontSize: 9, color: '#6B7280', marginTop: 2 } }, receiver.email)
                    ),
                    React.createElement(View, { style: styles.detailItem },
                        React.createElement(Text, { style: styles.detailLabel }, "Payment Method"),
                        React.createElement(Text, { style: styles.detailValue }, transfer.payment_method?.toUpperCase() || 'WALLET')
                    ),
                    React.createElement(View, { style: styles.detailItem },
                        React.createElement(Text, { style: styles.detailLabel }, "Description"),
                        React.createElement(Text, { style: styles.detailValue }, transfer.description || "Transfer")
                    )
                )
            ),

            // Legal/Security Section
            React.createElement(View, { style: { marginTop: 40, padding: 20, backgroundColor: '#F3F4F6', borderRadius: 12 } },
                React.createElement(Text, { style: { fontSize: 8, color: '#9CA3AF', lineHeight: 1.5 } },
                    "This receipt is a digital confirmation of your transaction. FlapaPay ensures all transfers are encrypted and processed through secure banking protocols. For any inquiries, please contact support@flapapay.com with your transaction reference number."
                )
            ),

            // Footer
            React.createElement(View, { style: styles.footer },
                React.createElement(Text, { style: styles.footerText }, "Secured by FlapaPay Infrastructure")
            )
        )
    );
};

module.exports = { TransferReceiptDocument };
