const React = require('react');
const { Document, Page, Text, View, Image, StyleSheet, Font } = require('@react-pdf/renderer');

// Define styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111111',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 10,
        color: '#666666',
        marginTop: 5,
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingVertical: 8,
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    cellDescription: {
        width: '50%',
        paddingLeft: 8,
        fontSize: 10,
        color: '#374151',
    },
    cellQty: {
        width: '15%',
        textAlign: 'center',
        fontSize: 10,
        color: '#374151',
    },
    cellPrice: {
        width: '15%',
        textAlign: 'right',
        fontSize: 10,
        color: '#374151',
    },
    cellTotal: {
        width: '20%',
        textAlign: 'right',
        paddingRight: 8,
        fontSize: 10,
        color: '#111827',
        fontWeight: 'bold',
    },
    totalSection: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 5,
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        fontSize: 10,
        color: '#666666',
        marginRight: 10,
    },
    totalValue: {
        width: 100,
        textAlign: 'right',
        fontSize: 10,
        color: '#111111',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#999999',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10,
    }
});

const InvoiceDocument = ({ invoice, items, merchant, link }) => {
    return React.createElement(Document, {},
        React.createElement(Page, { size: "A4", style: styles.page },
            // Header
            React.createElement(View, { style: styles.header },
                React.createElement(View, {},
                    React.createElement(Text, { style: styles.title }, "INVOICE"),
                    React.createElement(Text, { style: styles.subtitle }, `#${invoice.invoice_number}`),
                    React.createElement(Text, { style: styles.subtitle }, `Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`)
                ),
                React.createElement(View, { style: { alignItems: 'flex-end' } },
                    invoice.logo_url ? React.createElement(Image, { src: invoice.logo_url, style: { width: 50, height: 50, marginBottom: 5 } }) : null,
                    React.createElement(Text, { style: { fontSize: 12, fontWeight: 'bold' } }, invoice.sender_name || "FlapaPay Merchant"),
                    React.createElement(Text, { style: styles.subtitle }, invoice.sender_address || "Business Address"),
                    React.createElement(Text, { style: styles.subtitle }, invoice.sender_phone || "support@flapapay.com")
                )
            ),

            // Bill To
            React.createElement(View, { style: { marginBottom: 30 } },
                React.createElement(Text, { style: { fontSize: 10, color: '#9CA3AF', marginBottom: 5, textTransform: 'uppercase' } }, "Bill To"),
                React.createElement(Text, { style: { fontSize: 14, fontWeight: 'bold', color: '#111827' } }, invoice.client_name),
                React.createElement(Text, { style: { fontSize: 10, color: '#4B5563', marginTop: 2 } }, invoice.client_email),
                React.createElement(Text, { style: { fontSize: 10, color: '#4B5563', marginTop: 2 } }, invoice.client_address || '')
            ),

            // Table Header
            React.createElement(View, { style: styles.headerRow },
                React.createElement(Text, { style: [styles.cellDescription, { fontWeight: 'bold' }] }, "Description"),
                React.createElement(Text, { style: [styles.cellQty, { fontWeight: 'bold' }] }, "Qty"),
                React.createElement(Text, { style: [styles.cellPrice, { fontWeight: 'bold' }] }, "Price"),
                React.createElement(Text, { style: [styles.cellTotal, { fontWeight: 'bold' }] }, "Total")
            ),

            // Table Rows
            items.map((item, index) => (
                React.createElement(View, { style: styles.row, key: index },
                    React.createElement(Text, { style: styles.cellDescription }, item.description),
                    React.createElement(Text, { style: styles.cellQty }, item.quantity),
                    React.createElement(Text, { style: styles.cellPrice }, parseFloat(item.price).toFixed(2)),
                    React.createElement(Text, { style: styles.cellTotal }, parseFloat(item.amount).toFixed(2))
                )
            )),

            // Totals
            React.createElement(View, { style: styles.totalSection },
                React.createElement(View, { style: styles.totalRow },
                    React.createElement(Text, { style: styles.totalLabel }, "Subtotal"),
                    React.createElement(Text, { style: styles.totalValue }, `${invoice.currency} ${parseFloat(invoice.subtotal).toFixed(2)}`)
                ),
                invoice.discount_amount > 0 && React.createElement(View, { style: styles.totalRow },
                    React.createElement(Text, { style: styles.totalLabel }, "Discount"),
                    React.createElement(Text, { style: { ...styles.totalValue, color: '#DC2626' } }, `- ${invoice.currency} ${parseFloat(invoice.discount_amount).toFixed(2)}`)
                ),
                React.createElement(View, { style: styles.totalRow },
                    React.createElement(Text, { style: styles.totalLabel }, `Tax (${parseFloat(invoice.tax_rate || 0).toFixed(0)}%)`),
                    React.createElement(Text, { style: styles.totalValue }, `${invoice.currency} ${parseFloat(invoice.tax_amount).toFixed(2)}`)
                ),
                React.createElement(View, { style: { ...styles.totalRow, marginTop: 5 } },
                    React.createElement(Text, { style: { ...styles.totalLabel, fontSize: 14, fontWeight: 'bold', color: '#000' } }, "Total"),
                    React.createElement(Text, { style: { ...styles.totalValue, fontSize: 14, fontWeight: 'bold', color: '#000' } }, `${invoice.currency} ${parseFloat(invoice.total_amount).toFixed(2)}`)
                )
            ),

            // Payment Advice Section
            React.createElement(View, { style: { marginTop: 40, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 20, borderStyle: 'dashed' } },
                React.createElement(Text, { style: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' } }, "PAYMENT ADVICE"),
                React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
                    React.createElement(View, { style: { width: '45%' } },
                        React.createElement(Text, { style: { fontSize: 10, fontWeight: 'bold' } }, "To:"),
                        React.createElement(Text, { style: { fontSize: 10, marginTop: 4 } }, invoice.sender_name || "FlapaPay Merchant"),
                        React.createElement(Text, { style: { fontSize: 10, marginTop: 2 } }, invoice.sender_address || "Business Address")
                    ),
                    React.createElement(View, { style: { width: '45%' } },
                        React.createElement(Text, { style: { fontSize: 10 } }, `Customer: ${invoice.client_name}`),
                        React.createElement(Text, { style: { fontSize: 10, marginTop: 2 } }, `Invoice Number: ${invoice.invoice_number}`),
                        React.createElement(Text, { style: { fontSize: 10, marginTop: 2 } }, `Amount Due: ${invoice.currency} ${parseFloat(invoice.total_amount).toFixed(2)}`),
                        React.createElement(Text, { style: { fontSize: 10, marginTop: 2 } }, `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`),
                        React.createElement(Text, { style: { fontSize: 10, marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 2 } }, "Amount Enclosed: ________________")
                    )
                ),
                React.createElement(Text, { style: { fontSize: 8, marginTop: 10, textAlign: 'center', color: '#666' } }, "Enter the amount you are paying above.")
            ),

            // Footer
            React.createElement(View, { style: styles.footer },
                React.createElement(Text, {}, "Thank you for your business. Please pay within 30 days."),
                link ? React.createElement(Text, { style: { marginTop: 5 } }, `Payment Link: ${link}`) : null
            )
        )
    );
};

module.exports = { InvoiceDocument };
