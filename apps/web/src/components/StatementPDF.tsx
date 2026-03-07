import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 50,
        backgroundColor: '#fff',
        fontFamily: 'Helvetica',
    },
    headerBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        paddingBottom: 20,
    },
    companyInfo: {
        flex: 1,
    },
    brandName: {
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    companySub: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
    statementTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    metaInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        padding: 15,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    metaLabel: {
        fontSize: 8,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        gap: 10,
    },
    summaryCard: {
        flex: 1,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
    },
    table: {
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0f172a',
        padding: 8,
        borderRadius: 4,
    },
    headerCell: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    cell: {
        fontSize: 8,
        color: '#334155',
    },
    amountCredit: {
        color: '#059669',
        fontWeight: 'bold',
    },
    amountDebit: {
        color: '#dc2626',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 50,
        right: 50,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 15,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
        lineHeight: 1.5,
    }
});

interface StatementPDFProps {
    data: {
        wallet: { currency: string; balance: string; id: string };
        transactions: Array<{
            created_at: string;
            transaction_reference: string;
            description: string;
            amount: string;
            flow_type: 'CREDIT' | 'DEBIT';
        }>;
        user: { fullName: string; email: string };
        generatedAt: string;
    };
}

export const StatementPDF: React.FC<StatementPDFProps> = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header Banner */}
            <View style={styles.headerBanner}>
                <View style={styles.companyInfo}>
                    <Text style={styles.brandName}>FLAPAPAY</Text>
                    <Text style={styles.companySub}>Global Multi-Currency Financial Services</Text>
                </View>
                <View>
                    <Text style={styles.statementTitle}>ACCOUNT STATEMENT</Text>
                    <Text style={{ fontSize: 10, textAlign: 'right', color: '#666', marginTop: 5 }}>
                        Period: Last 30 Days
                    </Text>
                </View>
            </View>

            {/* Account Info */}
            <View style={styles.metaInfo}>
                <View>
                    <Text style={styles.metaLabel}>Account Holder</Text>
                    <Text style={styles.metaValue}>{data.user.fullName}</Text>
                    <Text style={[styles.cell, { marginTop: 2 }]}>{data.user.email}</Text>
                </View>
                <View style={{ textAlign: 'right' }}>
                    <Text style={styles.metaLabel}>Wallet Details</Text>
                    <Text style={styles.metaValue}>{data.wallet.currency} Account</Text>
                    <Text style={[styles.cell, { marginTop: 2 }]}>ID: ...{data.wallet.id.slice(-8)}</Text>
                </View>
            </View>

            {/* Summary */}
            <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                    <Text style={styles.metaLabel}>Current Balance</Text>
                    <Text style={[styles.metaValue, { fontSize: 16 }]}>{data.wallet.balance} {data.wallet.currency}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.metaLabel}>Total Credits</Text>
                    <Text style={[styles.metaValue, { color: '#059669' }]}>
                        {data.transactions.filter(t => t.flow_type === 'CREDIT').reduce((acc, t) => acc + parseFloat(t.amount), 0).toFixed(2)}
                    </Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.metaLabel}>Total Debits</Text>
                    <Text style={[styles.metaValue, { color: '#dc2626' }]}>
                        {data.transactions.filter(t => t.flow_type === 'DEBIT').reduce((acc, t) => acc + parseFloat(t.amount), 0).toFixed(2)}
                    </Text>
                </View>
            </View>

            {/* Transactions Table */}
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>Transaction History</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { width: '20%' }]}>Date</Text>
                    <Text style={[styles.headerCell, { width: '40%' }]}>Description / Reference</Text>
                    <Text style={[styles.headerCell, { width: '20%', textAlign: 'right' }]}>Amount</Text>
                    <Text style={[styles.headerCell, { width: '20%', textAlign: 'right' }]}>Type</Text>
                </View>

                {data.transactions.map((tx, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={[styles.cell, { width: '20%' }]}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                        <View style={{ width: '40%' }}>
                            <Text style={[styles.cell, { fontWeight: 'bold' }]}>{tx.description}</Text>
                            <Text style={[styles.cell, { color: '#94a3b8', fontSize: 6 }]}>{tx.transaction_reference}</Text>
                        </View>
                        <Text style={[
                            styles.cell,
                            { width: '20%', textAlign: 'right' },
                            tx.flow_type === 'CREDIT' ? styles.amountCredit : styles.amountDebit
                        ]}>
                            {tx.flow_type === 'CREDIT' ? '+' : '-'}{parseFloat(tx.amount).toFixed(2)}
                        </Text>
                        <Text style={[styles.cell, { width: '20%', textAlign: 'right' }]}>{tx.flow_type}</Text>
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    This is a computer generated document. No signature is required.
                    FlapaPay is regulated by relevant financial authorities.
                    Please report any discrepancies within 14 days of the statement date.
                </Text>
                <Text style={[styles.footerText, { marginTop: 10, fontWeight: 'bold' }]}>
                    www.flapapay.com | Support: help@flapapay.com
                </Text>
            </View>
        </Page>
    </Document>
);
