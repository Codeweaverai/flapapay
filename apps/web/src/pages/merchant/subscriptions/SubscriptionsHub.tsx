import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';
import {
    Package, Users, TrendingUp, AlertCircle, RefreshCw, Wallet,
    DownloadCloud, ChevronRight, Tag, BarChart2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';

export default function SubscriptionsHub() {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [analytics, setAnalytics] = useState<any>(null);
    const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const headers = { 'Authorization': 'Bearer ' + token };
        Promise.all([
            api.get('/v1/analytics/subscriptions', { headers }).catch(() => null),
            api.get('/v1/subscriptions/invoices', { headers }).catch(() => ({ data: [] })),
            api.get('/v1/analytics/churn-cohorts', { headers }).catch(() => ({ data: [] })),
        ]).then(([analyticsRes, invRes, cohortRes]) => {
            setAnalytics(analyticsRes?.data?.data || analyticsRes?.data || null);
            const invoices = invRes.data?.data || invRes.data || [];
            setRecentInvoices(Array.isArray(invoices) ? invoices.slice(0, 8) : []);
            const cohortData = cohortRes.data?.data || cohortRes.data || [];
            setCohorts(Array.isArray(cohortData) ? cohortData : []);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, [token]);

    const fmt = (n: number) => n?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—';
    const pct = (n: number) => `${n >= 0 ? '+' : ''}${n?.toFixed(1) ?? '0'}%`;

    const statCards = [
        {
            label: 'MRR',
            value: analytics ? `K ${fmt(analytics.mrr)}` : '—',
            sub: analytics ? `ARR K ${fmt(analytics.arr)}` : '',
            icon: <Wallet className="w-5 h-5 text-orange-500" />,
            bg: 'bg-orange-50',
            trend: analytics?.mrr_growth_rate,
        },
        {
            label: 'Active Subscriptions',
            value: analytics?.active_subscriptions ?? '—',
            sub: analytics ? `+${analytics.new_this_month} this month` : '',
            icon: <TrendingUp className="w-5 h-5 text-green-500" />,
            bg: 'bg-green-50',
            trend: null,
        },
        {
            label: 'Avg Revenue / Sub',
            value: analytics ? `K ${fmt(analytics.avg_revenue_per_subscriber)}` : '—',
            sub: 'per billing period',
            icon: <BarChart2 className="w-5 h-5 text-blue-500" />,
            bg: 'bg-blue-50',
            trend: null,
        },
        {
            label: 'Churn Rate',
            value: analytics ? `${analytics.churn_rate?.toFixed(1)}%` : '—',
            sub: `${analytics?.canceled_this_month ?? 0} canceled this month`,
            icon: <AlertCircle className="w-5 h-5 text-red-400" />,
            bg: 'bg-red-50',
            trend: analytics ? -analytics.churn_rate : null,
        },
        {
            label: 'Revenue (30d)',
            value: analytics ? `K ${fmt(analytics.revenue_last_30d)}` : '—',
            sub: 'from paid invoices',
            icon: <DownloadCloud className="w-5 h-5 text-purple-500" />,
            bg: 'bg-purple-50',
            trend: null,
        },
    ];

    // 12-month forecast bar chart (relative heights)
    const forecast = analytics?.forecast_12m || [];
    const maxForecast = Math.max(...forecast.map((f: any) => f.projected_mrr), analytics?.mrr || 1);

    return (
        <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col font-sans relative overflow-hidden text-gray-600">
            <Sidebar isOpen={false} />
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

            <main className="flex-1 p-8 lg:p-12 z-10 overflow-y-auto w-full relative">

                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-3 flex items-center gap-3">
                        <RefreshCw className="w-10 h-10 text-orange-500 animate-[spin_10s_linear_infinite]" />
                        Subscription Billing
                    </h1>
                    <p className="text-gray-500 text-lg">Recurring revenue, subscribers, and billing insights.</p>
                </header>

                {/* Quick-nav tiles */}
                <div className="grid md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Products & Pricing', path: '/merchant/subscriptions/products', icon: <Package className="w-5 h-5 text-orange-500" />, color: 'hover:border-orange-500/40' },
                        { label: 'Customers', path: '/merchant/subscriptions/customers', icon: <Users className="w-5 h-5 text-blue-500" />, color: 'hover:border-blue-500/40' },
                        { label: 'Coupons', path: '/merchant/subscriptions/coupons', icon: <Tag className="w-5 h-5 text-green-500" />, color: 'hover:border-green-500/40' },
                        { label: 'Billing Settings', path: '/merchant/subscriptions/settings', icon: <RefreshCw className="w-5 h-5 text-purple-500" />, color: 'hover:border-purple-500/40' },
                    ].map(item => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center gap-3 p-5 bg-white border border-gray-100 rounded-2xl text-left font-bold text-gray-900 text-sm shadow-sm transition-all hover:shadow-md ${item.color}`}
                        >
                            <span className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                    {statCards.map((s, i) => (
                        <div key={i} className={`p-5 rounded-2xl border border-gray-100 shadow-sm ${s.bg || 'bg-white'} flex flex-col justify-between min-h-[110px]`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.icon}{s.label}</span>
                                {s.trend != null && (
                                    <span className={`text-[10px] font-black flex items-center gap-0.5 ${s.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {s.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {pct(Math.abs(s.trend))}
                                    </span>
                                )}
                            </div>
                            <div className="text-2xl font-black text-gray-900">{loading ? '—' : s.value}</div>
                            {s.sub && <div className="text-[10px] text-gray-400 font-medium mt-1">{s.sub}</div>}
                        </div>
                    ))}
                </div>

                {/* 12-month MRR forecast */}
                {!loading && forecast.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm mb-10">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-orange-500" />
                            12-Month MRR Forecast
                        </h3>
                        <div className="flex items-end gap-2 h-32">
                            {/* Current MRR bar */}
                            <div className="flex flex-col items-center gap-1">
                                <div
                                    className="w-8 bg-gray-900 rounded-t-lg"
                                    style={{ height: `${Math.max(4, ((analytics?.mrr || 0) / maxForecast) * 128)}px` }}
                                />
                                <span className="text-[9px] text-gray-400 font-bold">Now</span>
                            </div>
                            {forecast.map((f: any, i: number) => (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                    <div
                                        className="w-full bg-orange-400/80 rounded-t-lg transition-all hover:bg-orange-500"
                                        style={{ height: `${Math.max(4, (f.projected_mrr / maxForecast) * 128)}px` }}
                                        title={`K ${fmt(f.projected_mrr)}`}
                                    />
                                    <span className="text-[8px] text-gray-400 font-bold hidden sm:block">{f.month.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-6 mt-4 text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-900 inline-block" />Current MRR</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-400 inline-block" />Projected</span>
                            {analytics?.mrr_growth_rate != null && (
                                <span className="ml-auto font-black text-green-600">
                                    {analytics.mrr_growth_rate >= 0 ? '↑' : '↓'} {Math.abs(analytics.mrr_growth_rate).toFixed(1)}% avg monthly growth
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Churn Cohort Retention Table */}
                {!loading && cohorts.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm mb-10 overflow-x-auto">
                        <h3 className="text-lg font-black text-gray-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            Churn Cohort Retention
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">% of subscribers still active at 1, 3, 6, and 12 months after their cohort month.</p>
                        <table className="w-full text-left border-collapse min-w-[560px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest pr-6">Cohort</th>
                                    <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest text-center px-3">Started</th>
                                    <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest text-center px-3">M+1</th>
                                    <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest text-center px-3">M+3</th>
                                    <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest text-center px-3">M+6</th>
                                    <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest text-center px-3">M+12</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cohorts.map((c: any) => {
                                    const cell = (pct: number | null) => {
                                        if (pct == null) return <td className="py-3 px-3 text-center text-xs text-gray-300">—</td>;
                                        const bg =
                                            pct >= 80 ? 'bg-green-100 text-green-800' :
                                            pct >= 60 ? 'bg-yellow-50 text-yellow-800' :
                                            pct >= 40 ? 'bg-orange-50 text-orange-700' :
                                            'bg-red-50 text-red-700';
                                        return (
                                            <td className="py-3 px-3 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${bg}`}>
                                                    {pct.toFixed(0)}%
                                                </span>
                                            </td>
                                        );
                                    };
                                    return (
                                        <tr key={c.cohort_month} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 pr-6 font-mono text-sm text-gray-700 font-bold">{c.cohort_month}</td>
                                            <td className="py-3 px-3 text-center text-sm font-black text-gray-900">{c.cohort_size}</td>
                                            {cell(c.retention_1m)}
                                            {cell(c.retention_3m)}
                                            {cell(c.retention_6m)}
                                            {cell(c.retention_12m)}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-gray-400">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 inline-block" />≥80%</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-50 inline-block" />60–79%</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-50 inline-block" />40–59%</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-50 inline-block" />&lt;40%</span>
                        </div>
                    </div>
                )}

                {/* Recent Invoices */}
                <h3 className="text-xl font-black text-gray-900 mb-4">Recent Invoices</h3>
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Invoice</th>
                                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="p-5" />
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading…</td></tr>
                            ) : recentInvoices.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No invoices yet.</td></tr>
                            ) : recentInvoices.map(inv => (
                                <tr
                                    key={inv.id}
                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/merchant/subscriptions/invoices/${inv.id}`)}
                                >
                                    <td className="p-5 font-mono text-xs text-gray-400">{inv.invoice_number || inv.id.slice(0, 8)}</td>
                                    <td className="p-5 font-black text-gray-900">
                                        {inv.currency} {parseFloat(inv.amount || 0).toLocaleString()}
                                        {parseFloat(inv.discount_amount || 0) > 0 && (
                                            <span className="ml-1 text-green-600 text-xs font-bold">−{parseFloat(inv.discount_amount).toFixed(2)}</span>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                            inv.status === 'paid'   ? 'bg-green-100 text-green-700' :
                                            inv.status === 'failed' ? 'bg-red-100 text-red-700' :
                                            inv.status === 'uncollectible' ? 'bg-gray-200 text-gray-600' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>{inv.status}</span>
                                    </td>
                                    <td className="p-5 text-sm text-gray-500">{inv.customer_email || '—'}</td>
                                    <td className="p-5 text-sm text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                                    <td className="p-5 text-right"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
