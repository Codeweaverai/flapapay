import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { api } from '../lib/axios';
import { Search, Plus, TrendingUp, Users, DollarSign, ExternalLink } from 'lucide-react';

export const ConnectDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [subMerchants, setSubMerchants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTestMode, setIsTestMode] = useState(() => localStorage.getItem('connect_test_mode') === 'true');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const config = {
                    headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' }
                };
                const [statsRes, accountsRes] = await Promise.all([
                    api.get('/v1/connect/stats', config),
                    api.get('/v1/connect/accounts', config)
                ]);
                setStats(statsRes.data);
                setSubMerchants(accountsRes.data);
            } catch (err) {
                console.error('Failed to fetch connect data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        localStorage.setItem('connect_test_mode', isTestMode.toString());
    }, [isTestMode]);

    return (
        <div className="min-h-screen bg-white flex text-gray-900 font-['Inter']">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto relative">
                {/* Ambient Glows - Light Mode */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

                <div className="max-w-6xl mx-auto">
                    <header className="flex justify-between items-end mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-600/10 rounded-xl">
                                    <ExternalLink className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-xs font-black tracking-[0.3em] text-orange-600 uppercase">Marketplace Engine</span>
                            </div>
                            <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Connect</h1>
                            <p className="text-gray-500 mt-2 font-medium">Manage your ecosystem of sellers and automated splits.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl p-1.5 h-14">
                                <button
                                    onClick={() => setIsTestMode(false)}
                                    className={`px-6 h-full rounded-xl text-xs font-black tracking-widest uppercase transition-all ${!isTestMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Live
                                </button>
                                <button
                                    onClick={() => setIsTestMode(true)}
                                    className={`px-6 h-full rounded-xl text-xs font-black tracking-widest uppercase transition-all ${isTestMode ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Test
                                </button>
                            </div>
                            <Button
                                size="lg"
                                className="rounded-2xl h-14 px-8 bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-xl shadow-orange-600/20 group transition-all"
                                onClick={() => navigate('/merchant/connect/onboard')}
                            >
                                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                                Add Sub-merchant
                            </Button>
                        </div>
                    </header>

                    {/* Connect Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-orange-500/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <Users className="w-16 h-16" />
                            </div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Sellers</p>
                            <h3 className="text-4xl font-black text-gray-900">{loading ? '...' : stats?.totalSubMerchants}</h3>
                            <div className="mt-4 flex items-center text-emerald-600 text-xs font-bold">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                <span>Organic Growth</span>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-orange-500/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <DollarSign className="w-16 h-16" />
                            </div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Marketplace GMV</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-gray-400 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-gray-900">{loading ? '...' : stats?.marketplaceGMV}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-orange-500/50 text-xs font-bold">
                                <span>Aggregate Seller Volume</span>
                            </div>
                        </div>
                        <div className="bg-orange-600 p-8 rounded-[2.5rem] border border-orange-500 shadow-xl shadow-orange-600/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-white/10 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-16 h-16" />
                            </div>
                            <p className="text-orange-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Platform Revenue</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-orange-100 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-white">{loading ? '...' : stats?.platformRevenue}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-orange-100/80 text-xs font-bold">
                                <span>Platform Fees Collected</span>
                            </div>
                        </div>
                    </div>

                    {/* Sub-merchants Table */}
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-sm overflow-hidden mb-12">
                        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h2 className="font-black text-2xl text-gray-900 tracking-tight">Connected Accounts</h2>
                                <p className="text-gray-500 text-sm mt-1">Sellers using your platform infrastructure.</p>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search ecosystem..."
                                    className="pl-11 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all w-64 text-gray-900"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Business Profile</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Verification</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Volume (ZK)</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Platform Fee</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {subMerchants.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-600 font-black">
                                                        {sub.businessName?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900">{sub.businessName}</p>
                                                        <p className="text-[11px] text-gray-400 font-mono tracking-tight">{sub.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-[0.15em] uppercase border ${sub.status === 'ACTIVE'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-orange-50 text-orange-600 border-orange-100'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-right font-mono text-gray-900 font-bold">{sub.volume}</td>
                                            <td className="px-10 py-6 text-right font-mono text-orange-600 font-bold">{sub.fees}</td>
                                            <td className="px-10 py-6 text-right">
                                                <button
                                                    onClick={() => navigate(`/merchant/connect/vendor/${sub.id}`)}
                                                    className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all hover:scale-110 active:scale-95"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {subMerchants.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-20 text-center text-gray-400 font-medium italic">
                                                No sub-merchants found in your ecosystem.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* How It Works (Educational Section) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Programmatic Onboarding</h3>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    Use our Connect API to create sub-merchants automatically when sellers join your platform. No manual verification needed if they stay within sandbox limits.
                                </p>
                                <code className="block bg-white/10 p-4 rounded-xl text-orange-400 text-xs font-mono border border-white/10">
                                    POST /v1/connect/accounts
                                </code>
                            </div>
                            <div className="absolute -right-10 -bottom-10 opacity-10 text-[10rem] rotate-12">📦</div>
                        </div>
                        <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-emerald-600/20">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Custom Split Fees</h3>
                                <p className="text-emerald-50 mb-6 leading-relaxed">
                                    Determine your own platform fee for every transaction. Collect it automatically in your primary marketplace wallet on every charge.
                                </p>
                                <div className="flex gap-2">
                                    <div className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold border border-white/20 tracking-widest">5% FIXED</div>
                                    <div className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold border border-white/20 tracking-widest">TIERED PRICING</div>
                                </div>
                            </div>
                            <div className="absolute -right-10 -bottom-10 opacity-10 text-[10rem] -rotate-12">💸</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
