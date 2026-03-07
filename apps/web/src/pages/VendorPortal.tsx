import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { TrendingUp, CreditCard, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

export const VendorPortal: React.FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!accountId) return;
            try {
                const res = await api.get(`/v1/connect/accounts/${accountId}/stats`);
                setStats(res.data);
            } catch (err) {
                console.error('Failed to fetch vendor stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [accountId]);

    return (
        <div className="min-h-screen bg-white flex text-gray-900 font-['Inter']">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

                <div className="max-w-6xl mx-auto">
                    <header className="mb-12">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-600/10 rounded-xl">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-xs font-black tracking-[0.3em] text-emerald-600 uppercase">Vendor Portal Secure</span>
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Your Store Performance</h1>
                        <p className="text-gray-500 mt-2 font-medium">Real-time revenue sharing and payout status.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Revenue</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-gray-400 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-gray-900">{loading ? '...' : stats?.volume}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-emerald-600 text-xs font-bold">
                                <span>Gross volume before fees</span>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Platform Fees</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-gray-400 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-orange-600">-{loading ? '...' : stats?.fees}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-gray-400 text-xs font-bold">
                                <span>Fees paid to marketplace</span>
                            </div>
                        </div>
                        <div className="bg-orange-600 p-8 rounded-[2.5rem] border border-orange-500 shadow-xl shadow-orange-600/20 relative overflow-hidden group">
                            <p className="text-orange-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Your Net Earnings</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-orange-100 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-white">{loading ? '...' : stats?.net}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-orange-100 text-xs font-bold">
                                <span>Ready for withdrawal</span>
                            </div>
                        </div>
                    </div>

                    {/* Balance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                    <Clock className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h4 className="text-xl font-black text-gray-900">Pending Settlement</h4>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-gray-400 font-bold text-xl">ZK</span>
                                <span className="text-5xl font-black text-gray-900">{loading ? '...' : stats?.balance?.pending}</span>
                            </div>
                            <p className="text-gray-500 text-sm italic">Funds currently in the T+2 settlement window.</p>
                        </div>

                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-orange-500/10 rounded-2xl">
                                    <CreditCard className="w-6 h-6 text-orange-600" />
                                </div>
                                <h4 className="text-xl font-black text-gray-900">Available for Payout</h4>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-gray-400 font-bold text-xl">ZK</span>
                                <span className="text-5xl font-black text-gray-900">{loading ? '...' : stats?.balance?.available}</span>
                            </div>
                            <p className="text-gray-500 text-sm italic">Funds settled and available to withdrawal to your mobile wallet.</p>

                            <button className="w-full mt-10 h-16 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-xl">
                                <TrendingUp className="w-5 h-5 text-orange-500" />
                                Request Withdrawal
                                <ExternalLink className="w-4 h-4 ml-2 opacity-30 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
