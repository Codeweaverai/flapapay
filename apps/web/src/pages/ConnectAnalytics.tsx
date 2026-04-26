import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { TrendingUp, DollarSign, RefreshCw, ArrowLeft, BarChart2 } from 'lucide-react';

type Period = '7d' | '30d' | '90d';

interface AnalyticsData {
    period: string;
    summary: {
        total_gmv: number;
        total_fees: number;
        total_charges: number;
        total_refunded: number;
        refund_count: number;
    };
    daily_gmv: { date: string; gmv: number; fees: number }[];
    daily_payouts: { date: string; volume: number }[];
    top_accounts: { id: string; business_name: string; volume: number; fees: number; count: number }[];
}

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
            className={`h-full rounded-full ${color}`}
            style={{ width: max > 0 ? `${Math.min(100, (value / max) * 100)}%` : '0%' }}
        />
    </div>
);

const SimpleBarChart: React.FC<{
    data: { date: string; primary: number; secondary?: number }[];
    primaryLabel: string;
    secondaryLabel?: string;
    primaryColor: string;
    secondaryColor?: string;
    currency?: string;
}> = ({ data, primaryLabel, secondaryLabel, primaryColor, secondaryColor, currency = 'ZK' }) => {
    const maxPrimary = Math.max(...data.map(d => d.primary), 1);
    const maxSecondary = secondaryLabel ? Math.max(...data.map(d => d.secondary || 0), 1) : 1;
    const maxAll = Math.max(maxPrimary, maxSecondary);
    const [hovered, setHovered] = useState<number | null>(null);

    if (data.length === 0) return (
        <div className="flex items-center justify-center h-40 text-gray-300 text-sm font-medium">No data for this period</div>
    );

    return (
        <div className="relative">
            {hovered !== null && data[hovered] && (
                <div className="absolute z-10 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 pointer-events-none"
                    style={{ top: 0, left: `${(hovered / data.length) * 100}%`, transform: 'translateX(-50%)' }}>
                    <p className="font-black">{new Date(data[hovered].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-orange-300">{primaryLabel}: {currency} {data[hovered].primary.toLocaleString()}</p>
                    {secondaryLabel && <p className="text-emerald-300">{secondaryLabel}: {currency} {(data[hovered].secondary || 0).toLocaleString()}</p>}
                </div>
            )}
            <div className="flex items-end gap-1 h-36 pt-8">
                {data.map((d, i) => (
                    <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer group"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        {secondaryLabel && (
                            <div
                                className={`w-full rounded-t-sm opacity-70 transition-opacity group-hover:opacity-100 ${secondaryColor}`}
                                style={{ height: `${maxAll > 0 ? ((d.secondary || 0) / maxAll) * 100 : 0}%` }}
                            />
                        )}
                        <div
                            className={`w-full rounded-t-sm transition-opacity group-hover:opacity-100 ${primaryColor}`}
                            style={{ height: `${maxAll > 0 ? (d.primary / maxAll) * 100 : 0}%` }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-gray-400 font-bold">
                {data.length > 0 && <span>{new Date(data[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                {data.length > 1 && <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
            </div>
        </div>
    );
};

export const ConnectAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState<Period>('30d');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTestMode] = useState(() => localStorage.getItem('connect_test_mode') === 'true');

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/v1/connect/analytics?period=${period}`, {
                    headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' }
                });
                setData(res.data);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [period, isTestMode]);

    const maxTopVolume = data ? Math.max(...data.top_accounts.map(a => a.volume), 1) : 1;

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/30 via-amber-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-100/20 to-transparent rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/merchant/connect')}
                                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-gray-500 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="p-2 bg-orange-600/10 rounded-xl">
                                        <BarChart2 className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <span className="text-xs font-black tracking-[0.3em] text-orange-600 uppercase">Platform Intelligence</span>
                                </div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Connect Analytics</h1>
                                <p className="text-gray-500 mt-1 font-medium text-sm">Revenue, GMV, and sub-merchant performance.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {loading && <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />}
                            <div className="flex bg-gray-50 border border-gray-100 rounded-2xl p-1">
                                {(['7d', '30d', '90d'] as Period[]).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${period === p ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </header>

                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                        {[
                            { label: 'Marketplace GMV', value: `ZK ${(data?.summary.total_gmv || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Platform Revenue', value: `ZK ${(data?.summary.total_fees || 0).toLocaleString()}`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
                            { label: 'Total Charges', value: (data?.summary.total_charges || 0).toLocaleString(), icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Refund Volume', value: `ZK ${(data?.summary.total_refunded || 0).toLocaleString()}`, icon: RefreshCw, color: 'text-red-500', bg: 'bg-red-50' },
                            { label: 'Fee Rate', value: data?.summary.total_gmv ? `${((data.summary.total_fees / data.summary.total_gmv) * 100).toFixed(1)}%` : '—', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                        ].map(({ label, value, icon: Icon, color, bg }) => (
                            <div key={label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-500/20 transition-all duration-300">
                                <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center mb-4`}>
                                    <Icon className={`w-4.5 h-4.5 ${color}`} />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                <p className={`text-2xl font-extrabold ${loading ? 'text-gray-300' : 'text-gray-900'} tracking-tight`}>
                                    {loading ? '···' : value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        {/* GMV + Fees Chart */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg">GMV & Fee Revenue</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Daily breakdown for the period</p>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5 text-indigo-600">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> GMV
                                    </span>
                                    <span className="flex items-center gap-1.5 text-orange-500">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span> Fees
                                    </span>
                                </div>
                            </div>
                            {loading ? (
                                <div className="h-36 bg-gray-50 rounded-2xl animate-pulse"></div>
                            ) : (
                                <SimpleBarChart
                                    data={(data?.daily_gmv || []).map(d => ({ date: d.date, primary: d.gmv, secondary: d.fees }))}
                                    primaryLabel="GMV" secondaryLabel="Fees"
                                    primaryColor="bg-indigo-500" secondaryColor="bg-orange-400"
                                />
                            )}
                        </div>

                        {/* Payout Volume Chart */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg">Payout Volume</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Sub-merchant disbursements</p>
                                </div>
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Payouts
                                </span>
                            </div>
                            {loading ? (
                                <div className="h-36 bg-gray-50 rounded-2xl animate-pulse"></div>
                            ) : (
                                <SimpleBarChart
                                    data={(data?.daily_payouts || []).map(d => ({ date: d.date, primary: d.volume }))}
                                    primaryLabel="Payouts" primaryColor="bg-emerald-500"
                                />
                            )}
                        </div>
                    </div>

                    {/* Top Sub-merchants Table */}
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                            <h2 className="font-black text-xl text-gray-900">Top Sub-merchants</h2>
                            <p className="text-gray-500 text-sm mt-1">Ranked by transaction volume for the period</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Business</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Volume</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Fees</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Charges</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td colSpan={6} className="px-8 py-4">
                                                    <div className="h-5 bg-gray-100 rounded-lg animate-pulse w-full"></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : data?.top_accounts.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-16 text-center text-gray-400 font-medium italic">
                                                No transaction data for this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        data?.top_accounts.map((account, i) => (
                                            <tr key={account.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-5 text-sm font-black text-gray-400">#{i + 1}</td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-600 font-black text-sm">
                                                            {account.business_name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <span className="font-black text-gray-900 text-sm">{account.business_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right font-mono font-bold text-gray-900 text-sm">
                                                    ZK {account.volume.toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5 text-right font-mono font-bold text-orange-600 text-sm">
                                                    ZK {account.fees.toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5 text-right font-bold text-gray-500 text-sm">{account.count}</td>
                                                <td className="px-8 py-5 w-40">
                                                    <MiniBar value={account.volume} max={maxTopVolume} color="bg-orange-500" />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
