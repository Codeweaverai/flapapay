import React, { useState, useEffect } from 'react';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    Receipt,
    X,
    RefreshCw
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Button } from '../../components/ui/Button';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface TransactionRecord {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    description: string;
    created_at: string;
    sender_name?: string;
    sender_email?: string;
    receiver_name?: string;
    receiver_email?: string;
    user_name?: string; // Fallback
    user_email?: string; // Fallback
    sender_avatar?: string;
    receiver_avatar?: string;
}

// PDF Styles
const styles = StyleSheet.create({
    page: { padding: 30, backgroundColor: '#f5f5f5' },
    header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#f97316' },
    section: { marginBottom: 15 },
    label: { fontSize: 10, color: '#666', marginBottom: 4 },
    value: { fontSize: 14, color: '#000' },
    amount: { fontSize: 32, fontWeight: 'bold', color: '#000', marginVertical: 20 },
    footer: { position: 'absolute', bottom: 30, left: 30, right: 30, fontSize: 10, textAlign: 'center', color: '#999' }
});

const TransactionReceipt = ({ t }: { t: TransactionRecord }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>FlapaPay Receipt</Text>
                <Text style={styles.label}>Transaction ID: {t.id}</Text>
                <Text style={styles.label}>Date: {new Date(t.created_at).toLocaleString()}</Text>
            </View>
            <View style={styles.section}>
                <Text style={styles.label}>Amount</Text>
                <Text style={styles.amount}>{t.amount} {t.currency}</Text>
                <Text style={styles.value}>Status: {t.status}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <View>
                    <Text style={styles.label}>Sender</Text>
                    <Text style={styles.value}>{t.sender_name || 'System'}</Text>
                    <Text style={styles.label}>{t.sender_email || 'N/A'}</Text>
                </View>
                <View>
                    <Text style={styles.label}>Recipient</Text>
                    <Text style={styles.value}>{t.receiver_name || 'System'}</Text>
                    <Text style={styles.label}>{t.receiver_email || 'N/A'}</Text>
                </View>
            </View>
            <View style={styles.section}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.value}>{t.description || 'No description provided.'}</Text>
            </View>
            <Text style={styles.footer}>Reference: {t.reference}</Text>
        </Page>
    </Document>
);

export const AdminTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/admin/transactions');
            setTransactions(res.data);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleReverse = async (id: string) => {
        if (!confirm('Are you sure you want to reverse this transaction? This action will move funds back to the sender.')) return;
        try {
            await api.post(`/admin/transactions/${id}/reverse`);
            alert('Transaction reversed successfully.');
            fetchTransactions();
            setSelectedTransaction(null);
        } catch (err) {
            console.error('Reversal failed', err);
            alert('Failed to reverse transaction.');
        }
    };

    const handleDownloadReceipt = async (t: TransactionRecord) => {
        const blob = await pdf(<TransactionReceipt t={t} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${t.reference || t.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'successful':
                return { bg: 'bg-green-500/10', text: 'text-green-500', icon: CheckCircle2 };
            case 'pending':
                return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: Clock };
            default:
                return { bg: 'bg-red-500/10', text: 'text-red-500', icon: AlertCircle };
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch =
            t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.sender_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.receiver_email?.toLowerCase().includes(searchTerm.toLowerCase());

        const date = new Date(t.created_at);
        const matchesStart = !startDate || date >= new Date(startDate);
        const matchesEnd = !endDate || date <= new Date(new Date(endDate).setHours(23, 59, 59, 999));

        return matchesSearch && matchesStart && matchesEnd;
    });

    const handleExportCSV = () => {
        const headers = ['Date', 'Reference', 'Type', 'Amount', 'Currency', 'Sender', 'Sender Email', 'Receiver', 'Receiver Email', 'Status', 'Description'];
        const csvRows = filteredTransactions.map(t => [
            new Date(t.created_at).toLocaleString(),
            t.reference || t.id,
            t.type,
            t.amount,
            t.currency,
            t.sender_name || 'System',
            t.sender_email || 'N/A',
            t.receiver_name || 'System',
            t.receiver_email || 'N/A',
            t.status,
            t.description || ''
        ]);

        const csvContent = [headers, ...csvRows].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-gray-500 font-bold text-center py-20">Polling global ledger nodes...</div>;

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">Global Ledger</h1>
                    <p className="text-slate-500 font-bold">Comprehensive audit trail of all platform-wide movement of funds.</p>
                </div>
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Search</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Hash, ID, Email..."
                                className="bg-white border border-slate-200 rounded-xl pl-12 pr-6 py-2.5 font-bold focus:ring-2 focus:ring-orange-500 text-slate-900 placeholder-gray-400 text-sm min-w-[240px]"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">From</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">To</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-500 text-slate-900 text-sm"
                        />
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="bg-orange-500 hover:bg-orange-600 px-6 py-2.5 rounded-xl font-black text-slate-900 shadow-xl shadow-orange-500/20 transition-all flex items-center gap-2 text-sm h-[42px]"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <th className="px-4 py-6">Ref / Hash</th>
                            <th className="px-4 py-6">Origin (Sender)</th>
                            <th className="px-4 py-6">Asset & Value</th>
                            <th className="px-4 py-6">Destination (Receiver)</th>
                            <th className="px-4 py-6">Status</th>
                            <th className="px-4 py-6 text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredTransactions.map((t) => {
                            const styles = getStatusStyles(t.status);
                            return (
                                <tr
                                    key={t.id}
                                    onClick={() => setSelectedTransaction(t)}
                                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-4 py-6 font-mono text-[10px] text-orange-500/80 font-bold">
                                        {t.reference ? t.reference.slice(0, 12) : t.id.slice(0, 8)}...
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="flex items-center gap-3">
                                            {t.sender_avatar ? (
                                                <img src={`http://localhost:3005${t.sender_avatar}`} alt={t.sender_name || 'System'} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center font-black text-white text-[10px] text-center border border-slate-200 flex-shrink-0">
                                                    {t.type === 'FEE' ? 'FEE' : (t.type === 'CARD_FUNDING' ? 'CARD' : (t.sender_name ? t.sender_name.charAt(0) : 'SYS'))}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-black text-slate-900 text-xs max-w-[140px] truncate" title={t.type === 'FEE' ? 'Transaction Fee' : (t.sender_name || t.user_name || 'Inbound Card Transaction')}>
                                                    {t.type === 'FEE' ? 'Transaction Fee' : (t.sender_name || t.user_name || 'Inbound Card Transaction')}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-bold max-w-[140px] truncate" title={t.type === 'FEE' ? 'System Deduction' : (t.sender_email || t.user_email || 'System Payment Gateway')}>
                                                    {t.type === 'FEE' ? 'System Deduction' : (t.sender_email || t.user_email || 'System Payment Gateway')}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg flex-shrink-0 ${t.type === 'DEBIT' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                                {t.type === 'DEBIT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-slate-900 leading-tight">{parseFloat(t.amount.toString()).toLocaleString()} {t.currency}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-tight">{t.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="flex items-center gap-3">
                                            {t.receiver_avatar ? (
                                                <img src={`http://localhost:3005${t.receiver_avatar}`} alt={t.receiver_name || 'System'} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center font-black text-slate-600 border border-slate-200 flex-shrink-0 text-[10px]">
                                                    {t.type === 'FEE' ? 'SYS' : (t.type === 'CARD_FUNDING' ? 'CARD' : (t.receiver_name ? t.receiver_name.charAt(0) : 'E/SYS'))}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-black text-slate-900 text-xs max-w-[140px] truncate" title={t.type === 'FEE' ? 'Platform Vault' : (t.type === 'CARD_FUNDING' ? 'User Card' : (t.receiver_name || 'External / System'))}>
                                                    {t.type === 'FEE' ? 'Platform Vault' : (t.type === 'CARD_FUNDING' ? 'User Card' : (t.receiver_name || 'External / System'))}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-bold max-w-[140px] truncate" title={t.type === 'FEE' ? 'Revenue Account' : (t.type === 'CARD_FUNDING' ? 'Internal Virtual Card' : (t.receiver_email || 'N/A'))}>
                                                    {t.type === 'FEE' ? 'Revenue Account' : (t.type === 'CARD_FUNDING' ? 'Internal Virtual Card' : (t.receiver_email || 'N/A'))}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${styles.bg} ${styles.text} text-[9px] font-black uppercase tracking-wider whitespace-nowrap`}>
                                            <styles.icon className="w-2.5 h-2.5" />
                                            {t.status}
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <p className="text-xs font-black text-slate-900">{new Date(t.created_at).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredTransactions.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                            <Receipt className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-slate-500 font-bold">No transactions match your current search/date criteria.</p>
                    </div>
                )}
            </div>

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setSelectedTransaction(null)} className="p-2 bg-white hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className={`p-3 rounded-2xl ${getStatusStyles(selectedTransaction.status).bg} ${getStatusStyles(selectedTransaction.status).text}`}>
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900">Transaction Details</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                                        ID: {selectedTransaction.id}
                                    </p>
                                </div>
                            </div>

                            <div className="my-10 p-8 bg-white rounded-3xl border border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-yellow-500"></div>
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Total Amount</span>
                                <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">
                                    {parseFloat(selectedTransaction.amount.toString()).toLocaleString()} <span className="text-orange-500">{selectedTransaction.currency}</span>
                                </h3>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getStatusStyles(selectedTransaction.status).bg} ${getStatusStyles(selectedTransaction.status).text} text-[10px] font-black uppercase tracking-wider`}>
                                    {selectedTransaction.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
                                <div className="flex items-center gap-4">
                                    {selectedTransaction.sender_avatar ? (
                                        <img src={`http://localhost:3005${selectedTransaction.sender_avatar}`} alt={selectedTransaction.sender_name || 'System'} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center font-black text-white text-sm border border-slate-200">
                                            {selectedTransaction.type === 'FEE' ? 'FEE' : (selectedTransaction.type === 'CARD_FUNDING' ? 'CARD' : (selectedTransaction.sender_name ? selectedTransaction.sender_name.charAt(0) : 'SYS'))}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-slate-500 font-bold mb-1">Origin (Sender)</p>
                                        <p className="text-slate-900 font-bold text-lg">
                                            {selectedTransaction.type === 'FEE' ? 'Transaction Fee' : (selectedTransaction.sender_name || selectedTransaction.user_name || 'Inbound Card Transaction')}
                                        </p>
                                        <p className="text-slate-600">
                                            {selectedTransaction.type === 'FEE' ? 'System Deduction' : (selectedTransaction.sender_email || selectedTransaction.user_email || 'System Payment Gateway')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {selectedTransaction.receiver_avatar ? (
                                        <img src={`http://localhost:3005${selectedTransaction.receiver_avatar}`} alt={selectedTransaction.receiver_name || 'System'} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center font-black text-slate-600 text-xl border border-slate-200">
                                            {selectedTransaction.type === 'FEE' ? 'SYS' : (selectedTransaction.receiver_name ? selectedTransaction.receiver_name.charAt(0) : 'E')}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-slate-500 font-bold mb-1">Destination (Recipient)</p>
                                        <p className="text-slate-900 font-bold text-lg">
                                            {selectedTransaction.type === 'FEE' ? 'Platform Vault' : (selectedTransaction.receiver_name || 'External / System')}
                                        </p>
                                        <p className="text-slate-600">
                                            {selectedTransaction.type === 'FEE' ? 'Revenue Account' : (selectedTransaction.receiver_email || 'N/A')}
                                        </p>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-500 font-bold mb-1">Description / Memo</p>
                                    <p className="text-slate-900 font-medium bg-white p-4 rounded-xl border border-slate-200">
                                        {selectedTransaction.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={() => handleDownloadReceipt(selectedTransaction)}
                                    className="flex-1 bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download Receipt
                                </Button>
                                {selectedTransaction.status === 'COMPLETED' && (
                                    <Button
                                        onClick={() => handleReverse(selectedTransaction.id)}
                                        className="flex-1 bg-white text-red-500 border border-slate-200 hover:bg-red-500/10 flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" /> Reverse Transaction
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
