const React = require('react');
const { Document, Page, Text, View, StyleSheet } = require('@react-pdf/renderer');

const styles = StyleSheet.create({
    page: {
        padding: 36,
        backgroundColor: '#FFFDF8',
        fontFamily: 'Helvetica',
        color: '#111827',
    },
    header: {
        padding: 24,
        borderRadius: 24,
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
        marginBottom: 24,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FEF3C7',
        color: '#B45309',
        padding: '5 12',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 11,
        color: '#6B7280',
        lineHeight: 1.5,
    },
    amountCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 24,
        padding: 28,
        marginBottom: 22,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 10,
        color: '#9A3412',
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    amount: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#111827',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    item: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
    },
    label: {
        fontSize: 9,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        marginBottom: 6,
        fontWeight: 'bold',
    },
    value: {
        fontSize: 12,
        color: '#111827',
        fontWeight: 'bold',
        lineHeight: 1.35,
    },
    footer: {
        marginTop: 18,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        textAlign: 'center',
    },
    footerText: {
        fontSize: 9,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
});

const PaymentLinkReceiptDocument = ({ link, ledgerEntry, feeAmount, providerLabel }) => {
    const paymentAmount = Number(link?.amount || ledgerEntry?.amount || 0);
    const currency = String(link?.currency || ledgerEntry?.currency || 'ZMW').toUpperCase();
    const grossTotal = Number(ledgerEntry?.amount || paymentAmount);
    const totalCharged = Number(ledgerEntry?.total_charged || (paymentAmount + Number(feeAmount || 0)));
    const dateValue = ledgerEntry?.created_at || new Date().toISOString();

    return React.createElement(
        Document,
        {},
        React.createElement(
            Page,
            { size: 'A4', style: styles.page },
            React.createElement(
                View,
                { style: styles.header },
                React.createElement(Text, { style: styles.badge }, 'Payment Receipt'),
                React.createElement(Text, { style: styles.title }, 'Payment Complete'),
                React.createElement(
                    Text,
                    { style: styles.subtitle },
                    `Successfully paid ${currency} ${paymentAmount.toFixed(2)} to ${link?.merchant_name || 'the merchant'}.`
                )
            ),
            React.createElement(
                View,
                { style: styles.amountCard },
                React.createElement(Text, { style: styles.amountLabel }, 'Amount Received'),
                React.createElement(Text, { style: styles.amount }, `${currency} ${grossTotal.toFixed(2)}`)
            ),
            React.createElement(
                View,
                { style: styles.grid },
                React.createElement(
                    View,
                    { style: styles.item },
                    React.createElement(Text, { style: styles.label }, 'Merchant'),
                    React.createElement(Text, { style: styles.value }, link?.merchant_name || 'FlapaPay Merchant')
                ),
                React.createElement(
                    View,
                    { style: styles.item },
                    React.createElement(Text, { style: styles.label }, 'Reference'),
                    React.createElement(Text, { style: styles.value }, ledgerEntry?.transaction_reference || 'N/A')
                ),
                React.createElement(
                    View,
                    { style: styles.item },
                    React.createElement(Text, { style: styles.label }, 'Payment Amount'),
                    React.createElement(Text, { style: styles.value }, `${currency} ${paymentAmount.toFixed(2)}`)
                ),
                React.createElement(
                    View,
                    { style: styles.item },
                    React.createElement(Text, { style: styles.label }, 'Transaction Fee'),
                    React.createElement(Text, { style: styles.value }, `${currency} ${Number(feeAmount || 0).toFixed(2)}`)
                ),
                React.createElement(
                    View,
                    { style: styles.item },
                    React.createElement(Text, { style: styles.label }, 'Total Charged'),
                    React.createElement(Text, { style: styles.value }, `${currency} ${totalCharged.toFixed(2)}`)
                ),
                React.createElement(
                    View,
                    { style: styles.item },
                    React.createElement(Text, { style: styles.label }, 'Payment Method'),
                    React.createElement(Text, { style: styles.value }, providerLabel || 'Card')
                )
            ),
            React.createElement(
                View,
                { style: styles.item },
                React.createElement(Text, { style: styles.label }, 'Date'),
                React.createElement(Text, { style: styles.value }, new Date(dateValue).toLocaleString())
            ),
            React.createElement(
                View,
                { style: { marginTop: 18, padding: 18, backgroundColor: '#FFFBEB', borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A' } },
                React.createElement(
                    Text,
                    { style: { fontSize: 9, color: '#B45309', lineHeight: 1.5 } },
                    'This receipt confirms successful payment completion on FlapaPay. Keep it for your records and support inquiries.'
                )
            ),
            React.createElement(
                View,
                { style: styles.footer },
                React.createElement(Text, { style: styles.footerText }, 'Secured by FlapaPay')
            )
        )
    );
};

module.exports = { PaymentLinkReceiptDocument };
