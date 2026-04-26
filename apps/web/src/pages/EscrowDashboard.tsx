import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { Button } from '../components/ui/Button';

export const EscrowDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [escrows, setEscrows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEscrows = async () => {
            try {
                const res = await api.get('/escrows');
                setEscrows(res.data || []);
            } catch (err) {
                console.error('Failed to fetch escrows:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEscrows();
    }, []);

    const getStatusColor = (status: string) => {
        const colors: any = {
            'CREATED': 'bg-blue-100 text-blue-600',
            'FUNDED': 'bg-emerald-100 text-emerald-600',
            'AWAITING_DELIVERY': 'bg-yellow-100 text-yellow-600',
            'DELIVERED': 'bg-purple-100 text-purple-600',
            'RELEASED': 'bg-gray-100 text-gray-600',
            'DISPUTED': 'bg-red-100 text-red-600',
            'REFUNDED': 'bg-orange-100 text-orange-600',
            'CANCELLED': 'bg-gray-200 text-gray-400'
        };
        return colors[status] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-100" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <Sidebar />
            <main className="flex-1 min-h-screen p-6 md:p-8 md:ml-72 relative overflow-x-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/20 via-blue-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <header className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Marketplace Escrow</h1>
                            <p className="text-gray-500 mt-1">Secure peer-to-peer transactions</p>
                        </div>
                        <Button
                            onClick={() => navigate('/escrow/create')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Escrow
                        </Button>
                    </header>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {/* Total Secured Volume */}
                        <div className="bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.7c0 4.66-3 9.03-7 10.12-4-1.09-7-5.46-7-10.12V6.3l7-3.12z" />
                                </svg>
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs font-medium opacity-80">Total Secured Volume</p>
                                </div>
                                <p className="text-3xl font-bold">
                                    {escrows.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toLocaleString()}
                                    <span className="text-lg font-normal opacity-80 ml-1">ZMW</span>
                                </p>
                                <p className="mt-2 text-sm opacity-75">Across {escrows.length} transaction(s)</p>
                            </div>
                        </div>

                        {/* Buying */}
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <p className="text-xs font-medium opacity-80">Buying</p>
                            </div>
                            <p className="text-3xl font-bold">{escrows.filter(e => e.buyer_id).length}</p>
                            <p className="mt-2 text-sm opacity-75">Items awaiting delivery</p>
                        </div>

                        {/* Selling */}
                        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-xs font-medium opacity-80">Selling</p>
                            </div>
                            <p className="text-3xl font-bold">{escrows.filter(e => e.seller_id).length}</p>
                            <p className="mt-2 text-sm opacity-75">Funds secured by FlapaPay</p>
                        </div>
                    </div>

                    {/* Active Transactions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Active Transactions</h2>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">All</button>
                                <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">Pending</button>
                                <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">Disputed</button>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="p-16 text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading your transactions...</p>
                                </div>
                            ) : escrows.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-semibold mb-2">No escrow transactions found</p>
                                    <p className="text-sm text-gray-400 mb-6">Create your first escrow to trade safely with anyone.</p>
                                    <Button
                                        onClick={() => navigate('/escrow/create')}
                                        className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-600"
                                    >
                                        Create First Escrow
                                    </Button>
                                </div>
                            ) : (
                                escrows.map(escrow => (
                                    <div
                                        key={escrow.id}
                                        onClick={() => navigate(`/escrow/${escrow.id}`)}
                                        className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(escrow.status)}`}>
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                                    {escrow.description || 'General Merchandise'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">{escrow.seller_email}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusColor(escrow.status)}`}>{escrow.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-gray-900">{escrow.amount} <span className="text-sm font-normal text-gray-400">{escrow.currency}</span></p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(escrow.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
