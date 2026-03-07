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
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <main className="flex-1 ml-80 p-8 lg:p-12">
                <div className="max-w-6xl mx-auto">
                    <header className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Marketplace Escrow</h1>
                            <p className="text-gray-500 font-bold mt-1 uppercase text-xs tracking-widest">Secure Peer-to-Peer Transactions</p>
                        </div>
                        <Button
                            onClick={() => navigate('/escrow/create')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 font-black"
                        >
                            + Create New Escrow
                        </Button>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        <div className="bg-emerald-600 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.7c0 4.66-3 9.03-7 10.12-4-1.09-7-5.46-7-10.12V6.3l7-3.12z" /></svg>
                            </div>
                            <p className="text-emerald-100 font-bold uppercase text-xs tracking-widest mb-2">Total Secured Volume</p>
                            <p className="text-4xl font-black">
                                {escrows.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toLocaleString()}
                                <span className="text-xl font-normal opacity-80 ml-2">ZMW</span>
                            </p>
                            <p className="mt-4 text-sm text-emerald-100">Across {escrows.length} transaction(s)</p>
                        </div>
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-2">Buying</p>
                            <p className="text-4xl font-black text-gray-900">{escrows.filter(e => e.buyer_id).length}</p>
                            <p className="mt-4 text-sm text-gray-500">Items awaiting delivery</p>
                        </div>
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-2">Selling</p>
                            <p className="text-4xl font-black text-gray-900">{escrows.filter(e => e.seller_id).length}</p>
                            <p className="mt-4 text-sm text-gray-500">Funds secured by FlapaPay</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-black text-gray-900">Active Transactions</h2>
                            <div className="flex gap-2">
                                <span className="px-4 py-2 bg-white rounded-full text-xs font-bold text-gray-500 shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">All</span>
                                <span className="px-4 py-2 rounded-full text-xs font-bold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">Pending</span>
                                <span className="px-4 py-2 rounded-full text-xs font-bold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">Disputed</span>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="p-20 text-center text-gray-400">Loading your transactions...</div>
                            ) : escrows.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <p className="text-gray-500 font-bold">No escrow transactions found</p>
                                    <p className="text-sm text-gray-400 mt-2">Create your first escrow to trade safely with anyone.</p>
                                </div>
                            ) : (
                                escrows.map(escrow => (
                                    <div
                                        key={escrow.id}
                                        onClick={() => navigate(`/escrow/${escrow.id}`)}
                                        className="p-8 flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getStatusColor(escrow.status)}`}>
                                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors">
                                                    {escrow.description || 'General Merchandise'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{escrow.seller_email}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${getStatusColor(escrow.status)}`}>{escrow.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-900">{escrow.amount} <span className="text-sm font-normal text-gray-400">{escrow.currency}</span></p>
                                            <p className="text-xs font-bold text-gray-400 mt-1">Created {new Date(escrow.created_at).toLocaleDateString()}</p>
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
