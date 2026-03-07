import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#fff',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 20,
    },
    logo: {
        width: 120,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        marginTop: 20,
        color: '#333',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginBottom: 30,
    },
    statCard: {
        width: '30%',
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    statLabel: {
        fontSize: 8,
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    table: {
        width: 'auto',
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    tableHeader: {
        backgroundColor: '#000',
        color: '#fff',
        borderRadius: 4,
    },
    tableCell: {
        fontSize: 9,
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 10,
        color: '#999',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 20,
    },
});

interface ReportPDFProps {
    data: {
        assets: Array<{ currency: string; balance: string }>;
        distribution: Array<{ name: string; value: number }>;
        dailyActivity: Array<{ date: string; inflow: number; outflow: number }>;
    };
}

export const ReportPDF: React.FC<ReportPDFProps> = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Financial Report</Text>
                    <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString()}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: 'bold' }}>FLAPAPAY</Text>
            </View>

            {/* Asset Summary */}
            <Text style={styles.sectionTitle}>Wallet Balances</Text>
            <View style={styles.statsContainer}>
                {data.assets.map((asset) => (
                    <View key={asset.currency} style={styles.statCard}>
                        <Text style={styles.statLabel}>{asset.currency} Balance</Text>
                        <Text style={styles.statValue}>{asset.balance}</Text>
                    </View>
                ))}
            </View>

            {/* Transaction Activity Summary */}
            <Text style={styles.sectionTitle}>Transaction Distribution</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { color: '#fff' }]}>Transaction Type</Text>
                    <Text style={[styles.tableCell, { color: '#fff', textAlign: 'right' }]}>Total Count</Text>
                </View>
                {data.distribution.map((item) => (
                    <View key={item.name} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{item.name}</Text>
                        <Text style={[styles.tableCell, { textAlign: 'right' }]}>{item.value}</Text>
                    </View>
                ))}
            </View>

            <View style={{ marginTop: 40, padding: 20, backgroundColor: '#000', borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
                    This report provides a verified snapshot of your FlapaPay financial activity.
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Secure Multi-Currency Financial Services</Text>
                <Text style={{ marginTop: 4 }}>© {new Date().getFullYear()} FlapaPay Inc. All rights reserved.</Text>
            </View>
        </Page>
    </Document>
);
