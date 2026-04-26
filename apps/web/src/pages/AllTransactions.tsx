import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';

interface Transaction {
    id: string;
    amount: string;
    currency: string;
    description: string;
    transaction_type: 'DEPOSIT' | 'TRANSFER' | 'WITHDRAWAL';
    created_at: string;
    transaction_reference: string;
    credit_wallet_id?: string;
    debit_wallet_id?: string;
    fee_amount?: string;
    status?: string;
}

interface Wallet {
    id: string;
    currency: string;
    balance: string;
}

export const AllTransactions: React.FC = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (token) {
                try {
                    const [meRes, txRes] = await Promise.all([
                        api.get('/auth/me'),
                        api.get('/transactions')
                    ]);
                    setWallets(meRes.data.wallets || []);
                    setTransactions(txRes.data || []);
                } catch (error) {
                    console.error('Failed to load transactions', error);
                    if (error instanceof Error && 'response' in error && 
                        (error as any).response?.status === 403) logout();
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [token, logout]);

    const getTransactionStatus = (tx: Transaction) => {
        return tx.status || 'completed';
    };

    const isInflow = (tx: Transaction) => {
        const isCredit = wallets.some(w => w.id === tx.credit_wallet_id);
        const isDebit = wallets.some(w => w.id === tx.debit_wallet_id);
        return tx.transaction_type === 'DEPOSIT' || (isCredit && !isDebit);
    };

    const filteredTransactions = transactions.filter(tx => {
        if (filter !== 'all' && tx.transaction_type !== filter) return false;
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                tx.description?.toLowerCase().includes(search) ||
                tx.transaction_reference.toLowerCase().includes(search) ||
                tx.currency.toLowerCase().includes(search)
            );
        }
        return true;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-100" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            {/* Sidebar */}
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 min-h-screen p-6 md:p-8 relative overflow-x-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/20 via-emerald-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
                            </div>
                            <p className="text-gray-500 mt-1">Complete history of your financial activity</p>
                        </div>
                    </header>

                    {/* Filters & Search */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search by description, reference, or currency..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Filter Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                                        filter === 'all'
                                            ? 'bg-black text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('DEPOSIT')}
                                    className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                                        filter === 'DEPOSIT'
                                            ? 'bg-emerald-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Deposits
                                </button>
                                <button
                                    onClick={() => setFilter('TRANSFER')}
                                    className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                                        filter === 'TRANSFER'
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Transfers
                                </button>
                                <button
                                    onClick={() => setFilter('WITHDRAWAL')}
                                    className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                                        filter === 'WITHDRAWAL'
                                            ? 'bg-red-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Withdrawals
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/20">
                            <p className="text-xs font-medium opacity-80">Total Transactions</p>
                            <p className="text-2xl font-bold mt-1">{filteredTransactions.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20">
                            <p className="text-xs font-medium opacity-80">Deposits</p>
                            <p className="text-2xl font-bold mt-1">{filteredTransactions.filter(tx => tx.transaction_type === 'DEPOSIT').length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20">
                            <p className="text-xs font-medium opacity-80">Transfers</p>
                            <p className="text-2xl font-bold mt-1">{filteredTransactions.filter(tx => tx.transaction_type === 'TRANSFER').length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl p-4 text-white shadow-lg shadow-red-500/20">
                            <p className="text-xs font-medium opacity-80">Withdrawals</p>
                            <p className="text-2xl font-bold mt-1">{filteredTransactions.filter(tx => tx.transaction_type === 'WITHDRAWAL').length}</p>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {filteredTransactions.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 font-medium">No transactions found</p>
                                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredTransactions.map((tx) => {
                                    const isCredit = isInflow(tx);
                                    return (
                                        <div
                                            key={tx.id}
                                            onClick={() => setSelectedTx(tx)}
                                            className="p-5 flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                                    isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                    {isCredit ? (
                                                        <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-900 text-base">
                                                            {tx.transaction_type === 'DEPOSIT' ? 'Money Added' :
                                                             tx.transaction_type === 'WITHDRAWAL' ? 'Withdrawal' :
                                                             isCredit ? 'Payment Received' : 'Payment Sent'}
                                                        </p>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase tracking-wider">
                                                            {tx.transaction_type}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 font-medium mt-0.5 line-clamp-1">
                                                        {tx.description || 'Transaction processed successfully'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[11px] text-gray-400 font-medium">
                                                            {formatDate(tx.created_at)} • {formatTime(tx.created_at)}
                                                        </p>
                                                        <span className="text-[11px] text-gray-300">•</span>
                                                        <span className="text-[11px] font-mono text-gray-400 uppercase">
                                                            Ref: {tx.transaction_reference?.slice(0, 8)}...
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold text-lg ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {isCredit ? '+' : '-'}{parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="flex justify-end gap-1 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tx.currency}</span>
                                                    <span className={`text-[10px] font-bold ${
                                                        isCredit ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
                                                    } px-2 py-0.5 rounded-full`}>
                                                        {isCredit ? 'Received' : 'Sent'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
                                <button
                                    onClick={() => setSelectedTx(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="text-center mb-8">
                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 ${
                                    isInflow(selectedTx) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                }`}>
                                    {isInflow(selectedTx) ? (
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    ) : (
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                    )}
                                </div>
                                <p className={`text-3xl font-bold ${isInflow(selectedTx) ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {isInflow(selectedTx) ? '+' : '-'}{parseFloat(selectedTx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedTx.currency}
                                </p>
                                <p className="text-gray-500 text-sm mt-2">{selectedTx.description || 'Transaction'}</p>
                            </div>

                            <div className="space-y-4 bg-gray-50 rounded-2xl p-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Type</span>
                                    <span className="font-bold text-gray-900">{selectedTx.transaction_type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Status</span>
                                    <span className="font-bold text-emerald-600 capitalize">{getTransactionStatus(selectedTx)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Date</span>
                                    <span className="font-bold text-gray-900">{formatDate(selectedTx.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Time</span>
                                    <span className="font-bold text-gray-900">{formatTime(selectedTx.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Reference</span>
                                    <span className="font-mono text-xs font-bold text-gray-900">{selectedTx.transaction_reference}</span>
                                </div>
                                {selectedTx.fee_amount && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-sm">Fee</span>
                                        <span className="font-bold text-gray-900">{selectedTx.fee_amount} {selectedTx.currency}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-8 pb-8">
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
