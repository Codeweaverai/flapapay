import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { Sidebar } from '../components/layout/Sidebar';
import {
    TrendingUp, Zap, CheckCircle2, Tag, BarChart3, ArrowDownLeft,
    ArrowUpRight, CreditCard, Smartphone, Globe, Clock, ArrowRight,
    RefreshCw, Layers, Wallet, AlertCircle
} from 'lucide-react';

// ── Bar chart ──────────────────────────────────────────────────────────────────
const BarChart: React.FC<{ data: { label: string; value: number }[]; color?: string }> = ({ data, color = 'bg-orange-400' }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex items-end gap-1.5 h-32">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
                    <div
                        title={`ZMW ${d.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        className={`w-full ${color} rounded-t-lg transition-all duration-700 group-hover:opacity-70`}
                        style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
                    />
                    <p className="text-[9px] font-bold text-gray-400 uppercase truncate w-full text-center">{d.label}</p>
                </div>
            ))}
        </div>
    );
};

// ── SVG Donut ─────────────────────────────────────────────────────────────────
const Donut: React.FC<{ pct: number; color: string; label: string; sub: string }> = ({ pct, color, label, sub }) => {
    const r = 34; const c = 2 * Math.PI * r;
    return (
        <div className="flex flex-col items-center gap-2">
            <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
                <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={`${(pct / 100) * c} ${c}`} strokeDashoffset={c / 4}
                    strokeLinecap="round" className="transition-all duration-1000" />
                <text x="42" y="47" textAnchor="middle" fontSize="13" fontWeight="800" fill="#111">{pct}%</text>
            </svg>
            <p className="text-sm font-bold text-gray-900">{label}</p>
            <p className="text-[10px] text-gray-400 font-medium">{sub}</p>
        </div>
    );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const KPI: React.FC<{
    label: string; value: string; sub?: string;
    icon: React.ReactNode; accent: string; bg: string;
}> = ({ label, value, sub, icon, accent, bg }) => (
    <div className={`${bg} rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3`}>
        <div className={`w-9 h-9 ${accent} rounded-xl flex items-center justify-center`}>{icon}</div>
        <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-gray-900 tabular-nums">{value}</p>
            {sub && <p className="text-[10px] text-gray-400 font-medium mt-0.5">{sub}</p>}
        </div>
    </div>
);

export const AdvancedAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('90d');
    const [mode, setMode] = useState<'test' | 'live'>('test');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await api.get('/merchants/stats', { params: { mode, period } });
                setData(res.data);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [period, mode]);

    // ── Derived values ────────────────────────────────────────────────────────
    const stats            = data?.stats || [];
    const recentActivity   = data?.recentActivity || [];
    const volumeHistory    = data?.volumeHistory || [];
    const methodBreakdown  = data?.methodBreakdown || [];
    const totalCount       = data?.totalCount ?? 0;
    const splitCount       = data?.splitCount ?? 0;
    const directCount      = data?.directCount ?? 0;
    const rawBalance       = (data?.rawBalance ?? 0) / 100;      // convert ngwe → ZMW
    const pendingBalance   = (data?.pendingBalance ?? 0) / 100;

    const earningsStat = stats.find((s: any) => s.label?.includes('Earnings') || s.label?.includes('Volume'));
    const earningsZMW  = parseFloat((earningsStat?.value || '0').replace(/[^0-9.]/g, '')) || 0;
    const successRate  = stats.find((s: any) => s.label?.includes('Success'))?.value || '100%';

    const periodDays  = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const dailyAvg    = totalCount > 0 ? earningsZMW / periodDays : 0;
    const weeklyAvg   = dailyAvg * 7;
    const proj30d     = dailyAvg * 30;

    const avgTicket = totalCount > 0 ? earningsZMW / totalCount : 0;

    const chartData = volumeHistory.length > 0
        ? volumeHistory
        : Array.from({ length: 7 }, (_, i) => ({ label: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], value: 0 }));

    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const peakHours = [
        { label: '8–10am', pct: 12 }, { label: '10–12', pct: 18 }, { label: '12–2pm', pct: 24 },
        { label: '2–4pm', pct: 20 }, { label: '4–6pm', pct: 16 }, { label: '6–8pm', pct: 10 },
    ];
    const peakMax = Math.max(...peakHours.map(h => h.pct));

    return (
        <div className="min-h-screen bg-[#F8F9FB] lg:pl-64 font-sans">
            <Sidebar isOpen={false} />

            <main className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/merchant/dashboard')}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors mb-2"
                        >
                            <ArrowRight className="w-3 h-3 rotate-180" /> Merchant Dashboard
                        </button>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <BarChart3 className="w-7 h-7 text-orange-500" />
                            Analytics
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Payment performance &amp; revenue insights</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Mode toggle */}
                        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                            {(['test', 'live'] as const).map(m => (
                                <button key={m} onClick={() => setMode(m)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                                        mode === m ? (m === 'live' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white') : 'text-gray-400 hover:text-gray-700'
                                    }`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                        {/* Period toggle */}
                        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                            {(['7d', '30d', '90d'] as const).map(p => (
                                <button key={p} onClick={() => setPeriod(p)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                                        period === p ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'
                                    }`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setLoading(true); api.get('/merchants/stats', { params: { mode, period } }).then(r => setData(r.data)).finally(() => setLoading(false)); }}
                            className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-colors shadow-sm">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* ── KPI Row ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPI label="Net Earnings" value={`ZMW ${fmt(earningsZMW)}`}
                        sub={`${period} period`}
                        icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
                        accent="bg-orange-100" bg="bg-white" />
                    <KPI label="Transactions" value={loading ? '—' : totalCount.toString()}
                        sub={`${successRate} success`}
                        icon={<Zap className="w-4 h-4 text-blue-500" />}
                        accent="bg-blue-100" bg="bg-white" />
                    <KPI label="Avg. Ticket" value={`ZMW ${fmt(avgTicket)}`}
                        sub="per transaction"
                        icon={<Tag className="w-4 h-4 text-purple-500" />}
                        accent="bg-purple-100" bg="bg-white" />
                    <KPI label="Success Rate" value={loading ? '—' : successRate}
                        sub="all time"
                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        accent="bg-emerald-100" bg="bg-white" />
                </div>

                {/* ── Volume + Methods ─────────────────────────────────────── */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Volume chart */}
                    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Payment Volume</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Merchant earnings over time (ZMW)</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-orange-500 px-2.5 py-1 rounded-lg">
                                {mode.toUpperCase()} · {period}
                            </span>
                        </div>
                        {loading ? (
                            <div className="h-32 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <BarChart data={chartData} color="bg-orange-400" />
                        )}
                    </div>

                    {/* Payment methods */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-gray-900 mb-5">Payment Methods</h2>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
                            </div>
                        ) : methodBreakdown.length === 0 ? (
                            <div className="py-10 text-center">
                                <Layers className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-xs font-medium text-gray-400">No data yet</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {methodBreakdown.map((m: any) => {
                                    const total = methodBreakdown.reduce((a: number, c: any) => a + c.count, 0);
                                    const pct = total > 0 ? Math.round((m.count / total) * 100) : 0;
                                    const isCard = m.label === 'Cards';
                                    return (
                                        <div key={m.label}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    {isCard
                                                        ? <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                                                        : <Smartphone className="w-3.5 h-3.5 text-orange-500" />}
                                                    <span className="text-xs font-semibold text-gray-700">{m.label}</span>
                                                </div>
                                                <span className="text-xs text-gray-400 font-medium">{m.count} txns · {pct}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${isCard ? 'bg-blue-400' : 'bg-orange-400'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Revenue Velocity + Balance ───────────────────────────── */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Revenue Velocity */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-gray-900 mb-1">Revenue Velocity</h2>
                        <p className="text-xs text-gray-400 mb-6">Average ZMW earned per day over the {period} period</p>
                        <div className="divide-y divide-gray-50">
                            {[
                                { label: 'Daily Average', value: `ZMW ${fmt(dailyAvg)}`, icon: <Clock className="w-4 h-4 text-gray-400" />, highlight: false },
                                { label: 'Weekly Average', value: `ZMW ${fmt(weeklyAvg)}`, icon: <BarChart3 className="w-4 h-4 text-blue-400" />, highlight: false },
                                { label: '30-day Projection', value: `ZMW ${fmt(proj30d)}`, icon: <TrendingUp className="w-4 h-4 text-orange-500" />, highlight: true },
                            ].map(row => (
                                <div key={row.label} className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-2.5">
                                        {row.icon}
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{row.label}</p>
                                    </div>
                                    <p className={`text-lg font-black tabular-nums ${row.highlight ? 'text-orange-500' : 'text-gray-900'}`}>{row.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Balance Breakdown */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-gray-900 mb-1">Balance Breakdown</h2>
                        <p className="text-xs text-gray-400 mb-6">Available vs. pending settlement funds</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Available</p>
                                    <p className="text-2xl font-black text-gray-900 tabular-nums mt-0.5">ZMW {fmt(rawBalance)}</p>
                                </div>
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pending Settlement</p>
                                    <p className="text-2xl font-black text-gray-900 tabular-nums mt-0.5">ZMW {fmt(pendingBalance)}</p>
                                </div>
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Recent Activity ──────────────────────────────────────── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Last 10 charges in {mode} mode</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <div className="w-6 h-6 border-2 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="py-14 text-center">
                            <AlertCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-400">No transactions yet in {mode} mode</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100">
                                    {['Status', 'Description', 'Method', 'Customer Paid', 'Your Earnings', 'Date'].map(h => (
                                        <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentActivity.map((tx: any) => {
                                    const gross    = parseFloat(tx.grossAmount  || 0) / 100;
                                    const earned   = parseFloat(tx.merchantNet  || 0) / 100;
                                    const subEarned = parseFloat(tx.submerchantNet || 0) / 100;
                                    const ok       = tx.status === 'succeeded';
                                    const label    = tx.isSplit
                                        ? 'Marketplace Sale'
                                        : tx.description?.replace(/^Checkout(?:\sSession)?\s(cs_test_\S{8}).*/i, 'Checkout …$1') || 'Payment';
                                    const method   = (tx.method || 'mobile_money').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                    {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                    {ok ? 'Success' : 'Failed'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-gray-800">{label}</p>
                                                {tx.isSplit && (
                                                    <p className="text-[10px] text-orange-500 font-semibold mt-0.5">Platform commission · seller gets ZMW {fmt(subEarned)}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    {method.toLowerCase().includes('card')
                                                        ? <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                                                        : <Smartphone className="w-3.5 h-3.5 text-orange-400" />}
                                                    <span className="text-xs text-gray-600 font-medium">{method}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-gray-900 tabular-nums text-sm">
                                                ZMW {fmt(gross)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`font-black tabular-nums text-sm ${tx.isSplit ? 'text-orange-500' : 'text-emerald-600'}`}>
                                                    +ZMW {fmt(earned)}
                                                </span>
                                                {tx.isSplit && (
                                                    <span className="ml-2 text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">SPLIT</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-gray-400">
                                                {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Transaction Types + Peak Hours ──────────────────────── */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Transaction Types donut */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-gray-900 mb-1">Transaction Types</h2>
                        <p className="text-xs text-gray-400 mb-6">Direct vs. split marketplace payments</p>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
                            </div>
                        ) : (splitCount + directCount) === 0 ? (
                            <div className="py-8 text-center">
                                <Layers className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-xs font-medium text-gray-400">No transactions in this period</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-around py-4">
                                <Donut
                                    pct={Math.round((directCount / (splitCount + directCount)) * 100)}
                                    color="#F97316" label="Direct" sub={`${directCount} txns`}
                                />
                                <div className="w-px h-24 bg-gray-100" />
                                <Donut
                                    pct={Math.round((splitCount / (splitCount + directCount)) * 100)}
                                    color="#10B981" label="Marketplace" sub={`${splitCount} txns`}
                                />
                            </div>
                        )}
                    </div>

                    {/* Peak hours */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Peak Transaction Hours</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Busiest windows during the business day</p>
                            </div>
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wide">Zambia · CAT</span>
                        </div>
                        <div className="flex items-end gap-2 h-24">
                            {peakHours.map(h => (
                                <div key={h.label} className="flex flex-col items-center gap-1.5 flex-1">
                                    <div
                                        className="w-full bg-blue-400 rounded-t-lg transition-all duration-700 hover:bg-blue-500"
                                        style={{ height: `${(h.pct / peakMax) * 100}%` }}
                                        title={`${h.label}: ${h.pct}%`}
                                    />
                                    <p className="text-[8px] font-bold text-gray-400 text-center">{h.label}</p>
                                    <p className="text-[8px] font-bold text-blue-500">{h.pct}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Geographic Distribution ──────────────────────────────── */}
                <div className="bg-gray-900 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Globe className="w-4 h-4 text-orange-400" /> Geographic Distribution
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">Transaction volume by region (Zambia) · indicative</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { city: 'Lusaka',       pct: 58, color: '#F97316' },
                            { city: 'Copperbelt',   pct: 22, color: '#3B82F6' },
                            { city: 'Livingstone',  pct: 12, color: '#10B981' },
                            { city: 'Other Regions',pct:  8, color: '#8B5CF6' },
                        ].map(item => (
                            <div key={item.city}>
                                <div className="flex justify-between text-xs font-semibold mb-1.5">
                                    <span className="text-gray-400">{item.city}</span>
                                    <span className="text-white">{item.pct}%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                                </div>
                                <p className="text-[10px] text-gray-600 mt-1.5">of total volume</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Insights strip ───────────────────────────────────────── */}
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-orange-500 rounded-2xl p-5 text-white space-y-2">
                        <TrendingUp className="w-5 h-5 text-orange-200" />
                        <h3 className="font-bold text-sm">Revenue Insight</h3>
                        <p className="text-xs text-orange-100 leading-relaxed">
                            {totalCount > 0
                                ? `You've processed ${totalCount} transactions this period${splitCount > 0 ? ` including ${splitCount} marketplace split${splitCount > 1 ? 's' : ''}` : ''}. Average ticket: ZMW ${fmt(avgTicket)}.`
                                : 'Process your first transaction to unlock revenue insights and trends.'}
                        </p>
                    </div>
                    <div className="bg-blue-600 rounded-2xl p-5 text-white space-y-2">
                        <Clock className="w-5 h-5 text-blue-200" />
                        <h3 className="font-bold text-sm">Settlement Speed</h3>
                        <p className="text-xs text-blue-100 leading-relaxed">
                            T+1 settlement means funds arrive the next business day. Contact support to upgrade to instant settlement.
                        </p>
                    </div>
                    <div className="bg-emerald-600 rounded-2xl p-5 text-white space-y-2">
                        <Globe className="w-5 h-5 text-emerald-200" />
                        <h3 className="font-bold text-sm">FX Opportunity</h3>
                        <p className="text-xs text-emerald-100 leading-relaxed">
                            Accept USD, EUR, and GBP via your FX wallets. Competitive ZMW rates locked for merchants.
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
};
