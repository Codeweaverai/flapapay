import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    ArrowLeft, RefreshCw, Download, TrendingUp, DollarSign,
    PieChart, ArrowUpRight, ArrowDownLeft, BarChart2
} from 'lucide-react';

type GroupBy = 'day' | 'week' | 'month';

interface EarningsSummary {
    charge_fees: number;
    refund_reversals: number;
    total_credits: number;
    total_debits: number;
    net_earnings: number;
    transaction_count: number;
}

interface BreakdownRow {
    period: string;
    fee_income: number;
    payouts_out: number;
    transactions: number;
}

interface TopAccount {
    account_id: string;
    business_name: string;
    fees_earned: number;
    payouts_sent: number;
    transaction_count: number;
}

interface EarningsData {
    period: { from: string; to: string; groupBy: string; currency: string };
    summary: EarningsSummary;
    breakdown: BreakdownRow[];
    top_accounts: TopAccount[];
}

function fmt(n: number, currency = 'ZMW') {
    // Amounts stored in smallest currency unit (ngwe) — divide by 100 for display
    return `${currency} ${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toDateInput(d: Date) {
    return d.toISOString().slice(0, 10);
}

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: max > 0 ? `${Math.min(100, (value / max) * 100)}%` : '0%' }} />
    </div>
);

export default function ConnectEarningsPage() {
    const navigate = useNavigate();
    const [data, setData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState<GroupBy>('month');
    const [exporting, setExporting] = useState(false);

    const today = new Date();
    const yearAgo = new Date(today);
    yearAgo.setFullYear(today.getFullYear() - 1);

    const [from, setFrom] = useState(toDateInput(yearAgo));
    const [to, setTo] = useState(toDateInput(today));
    const [isTestMode] = useState(() => localStorage.getItem('connect_test_mode') === 'true');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/connect/platform/earnings', {
                params: { from, to, groupBy, currency: 'ZMW' },
                headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' },
            });
            setData(res.data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [from, to, groupBy, isTestMode]);

    useEffect(() => { load(); }, [load]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/v1/connect/platform/earnings/export', {
                params: { from, to, currency: 'ZMW' },
                headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `flapapay_earnings_${from}_${to}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch { alert('Export failed.'); }
        finally { setExporting(false); }
    };

    const maxBreakdown = data ? Math.max(...data.breakdown.map(r => r.fee_income), 1) : 1;
    const maxTopFees = data ? Math.max(...data.top_accounts.map(a => a.fees_earned), 1) : 1;

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-100/25 via-orange-100/15 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-100/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate('/merchant/connect')} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all active:scale-95">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <PieChart className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-violet-500 uppercase">Revenue Intelligence</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Platform Earnings</h1>
                            <p className="text-sm text-gray-500">Fee income, payouts disbursed, and top contributors</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={load} disabled={loading} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 shadow-sm transition-all active:scale-95 disabled:opacity-50">
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:text-violet-600 hover:border-violet-200 shadow-sm transition-all active:scale-95 disabled:opacity-50">
                                <Download size={15} />
                                {exporting ? 'Exporting…' : 'Export CSV'}
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 mb-6 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">From</label>
                            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                                className="border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 bg-gray-50 transition-all" />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">To</label>
                            <input type="date" value={to} onChange={e => setTo(e.target.value)}
                                className="border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 bg-gray-50 transition-all" />
                        </div>
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
                            {(['day', 'week', 'month'] as GroupBy[]).map(g => (
                                <button key={g} onClick={() => setGroupBy(g)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${groupBy === g ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                        <button onClick={load} className="px-5 py-2 bg-violet-500 text-white rounded-2xl text-xs font-bold hover:bg-violet-600 shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 active:scale-95 transition-all">
                            Apply
                        </button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Net Earnings', value: fmt(data?.summary.net_earnings || 0), icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', border: 'hover:border-violet-200' },
                            { label: 'Fee Income', value: fmt(data?.summary.charge_fees || 0), icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50', border: 'hover:border-orange-200' },
                            { label: 'Payouts Out', value: fmt(data?.summary.total_debits || 0), icon: ArrowDownLeft, color: 'text-blue-600', bg: 'bg-blue-50', border: 'hover:border-blue-200' },
                            { label: 'Transactions', value: (data?.summary.transaction_count || 0).toLocaleString(), icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
                        ].map(({ label, value, icon: Icon, color, bg, border }) => (
                            <div key={label} className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-6 transition-all ${border}`}>
                                <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center mb-4`}>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                                <p className={`text-2xl font-extrabold tracking-tight ${loading ? 'text-gray-200' : 'text-gray-900'}`}>
                                    {loading ? '···' : value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Bar chart — earnings breakdown */}
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-7 mb-6 hover:shadow-lg hover:border-orange-500/20 transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-extrabold text-gray-900 text-lg tracking-tight">Fee Income by {groupBy}</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Revenue earned per {groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month'}</p>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5 text-violet-600"><span className="w-2 h-2 bg-violet-500 rounded-full"></span>Fees</span>
                                <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2 h-2 bg-blue-400 rounded-full"></span>Payouts</span>
                            </div>
                        </div>
                        {loading ? (
                            <div className="h-36 bg-gray-50 rounded-2xl animate-pulse"></div>
                        ) : data?.breakdown.length === 0 ? (
                            <div className="h-36 flex items-center justify-center text-gray-300 text-sm">No data for this period</div>
                        ) : (
                            <div className="flex items-end gap-1 h-36 pt-4">
                                {data!.breakdown.map((row, i) => {
                                    const feeH = maxBreakdown > 0 ? (row.fee_income / maxBreakdown) * 100 : 0;
                                    const payH = maxBreakdown > 0 ? (row.payouts_out / maxBreakdown) * 100 : 0;
                                    const label = new Date(row.period).toLocaleDateString('en-GB', groupBy === 'day' ? { day: 'numeric', month: 'short' } : { month: 'short', year: '2-digit' });
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group cursor-pointer">
                                            <div className="w-full rounded-t-sm bg-blue-300 opacity-60 group-hover:opacity-90 transition-opacity" style={{ height: `${payH}%` }} />
                                            <div className="w-full rounded-t-sm bg-violet-500 group-hover:bg-violet-600 transition-colors" style={{ height: `${feeH}%` }} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {data && data.breakdown.length > 0 && (
                            <div className="flex justify-between mt-2 text-[9px] text-gray-400 font-bold">
                                <span>{new Date(data.breakdown[0].period).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}</span>
                                {data.breakdown.length > 1 && <span>{new Date(data.breakdown[data.breakdown.length - 1].period).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}</span>}
                            </div>
                        )}
                    </div>

                    {/* Top sub-merchants by fees */}
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                        <div className="px-7 py-6 border-b border-gray-100 bg-gray-50/40">
                            <h2 className="font-extrabold text-gray-900 text-lg tracking-tight">Top Contributors</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Sub-merchants generating the most platform fees</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/60">
                                    <tr>
                                        <th className="px-7 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">#</th>
                                        <th className="px-7 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business</th>
                                        <th className="px-7 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Fees Earned</th>
                                        <th className="px-7 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Payouts Sent</th>
                                        <th className="px-7 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Txns</th>
                                        <th className="px-7 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}><td colSpan={6} className="px-7 py-4"><div className="h-5 bg-gray-100 rounded-lg animate-pulse"></div></td></tr>
                                        ))
                                    ) : !data?.top_accounts.length ? (
                                        <tr><td colSpan={6} className="px-7 py-16 text-center text-gray-400 font-medium italic">No earnings data for this period.</td></tr>
                                    ) : data.top_accounts.map((acct, i) => (
                                        <tr key={acct.account_id} className="hover:bg-orange-50/30 transition-colors">
                                            <td className="px-7 py-5 text-sm font-bold text-gray-400">#{i + 1}</td>
                                            <td className="px-7 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 font-extrabold text-sm">
                                                        {acct.business_name[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-sm">{acct.business_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-7 py-5 text-right font-mono font-bold text-violet-600 text-sm">
                                                {fmt(acct.fees_earned)}
                                            </td>
                                            <td className="px-7 py-5 text-right font-mono font-bold text-blue-500 text-sm">
                                                {fmt(acct.payouts_sent)}
                                            </td>
                                            <td className="px-7 py-5 text-right font-bold text-gray-500 text-sm">{acct.transaction_count}</td>
                                            <td className="px-7 py-5 w-40">
                                                <MiniBar value={acct.fees_earned} max={maxTopFees} color="bg-gradient-to-r from-violet-400 to-violet-500" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
