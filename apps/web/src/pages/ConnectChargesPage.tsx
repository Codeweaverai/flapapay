import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    CreditCard, TrendingUp, DollarSign, XCircle, CheckCircle2, Clock,
    RefreshCw, ChevronLeft, ChevronRight, Filter, ArrowUpRight,
    Layers, BarChart3, ArrowRight
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Charge {
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    description: string | null;
    application_fee_amount: number | null;
    livemode: boolean;
    created_at: string;
    account_id: string | null;
    account_business_name: string | null;
}

interface Summary {
    total_gmv: number;
    total_fees: number;
    total_count: number;
    succeeded_count: number;
    refunded_count: number;
}

interface Account {
    id: string;
    businessName: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
    succeeded:  { label: 'Succeeded',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
    pending:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-600 border-amber-100',       dot: 'bg-amber-400' },
    failed:     { label: 'Failed',     cls: 'bg-red-50 text-red-600 border-red-100',             dot: 'bg-red-500' },
    refunded:   { label: 'Refunded',   cls: 'bg-gray-100 text-gray-500 border-gray-200',         dot: 'bg-gray-400' },
    processing: { label: 'Processing', cls: 'bg-blue-50 text-blue-600 border-blue-100',          dot: 'bg-blue-400' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// Amounts from DB are in ngwe (smallest unit) — divide by 100 for ZMW display
function fmt(amount: number, currency = 'ZMW') {
    return (amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cleanDescription(desc: string | null) {
    if (!desc) return null;
    // Truncate long checkout session IDs
    return desc.replace(/(cs_test_|cs_live_)([a-f0-9]{8})[a-f0-9]*/gi, '$1$2…');
}

const LIMIT = 25;
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all bg-white';
const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConnectChargesPage() {
    const navigate = useNavigate();
    const [testMode, setTestMode] = useState<boolean>(() => {
        const stored = localStorage.getItem('connect_test_mode');
        return stored !== 'false'; // default to test
    });

    const [charges, setCharges]   = useState<Charge[]>([]);
    const [summary, setSummary]   = useState<Summary | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [total, setTotal]       = useState(0);
    const [offset, setOffset]     = useState(0);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);

    // Filters
    const [status, setStatus]     = useState('');
    const [accountId, setAccId]   = useState('');
    const [from, setFrom]         = useState('');
    const [to, setTo]             = useState('');

    const headers = { 'x-flapapay-test-mode': testMode ? 'true' : 'false' };

    const fetchCharges = useCallback(async (off = 0) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number> = { limit: LIMIT, offset: off };
            if (status)    params.status     = status;
            if (accountId) params.account_id = accountId;
            if (from)      params.from       = from;
            if (to)        params.to         = to;

            const res = await api.get('/v1/connect/charges', { params, headers });
            setCharges(res.data.charges ?? []);
            setSummary(res.data.summary ?? null);
            setTotal(res.data.total ?? 0);
            setOffset(off);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load charges');
        } finally {
            setLoading(false);
        }
    }, [status, accountId, from, to, testMode]);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await api.get('/v1/connect/accounts', { headers });
            // API returns { businessName } (camelCase)
            setAccounts(Array.isArray(res.data) ? res.data : []);
        } catch { /* silent */ }
    }, [testMode]);

    useEffect(() => { fetchAccounts(); },    [fetchAccounts]);
    useEffect(() => { fetchCharges(0); },   [fetchCharges]);

    const totalPages  = Math.ceil(total / LIMIT);
    const currentPage = Math.floor(offset / LIMIT) + 1;

    // Platform earned per charge: full amount for direct, fee only for split
    const platformEarned = (c: Charge) =>
        c.account_id ? (c.application_fee_amount ?? 0) : c.amount;

    // Seller net: only relevant for split charges
    const sellerNet = (c: Charge) =>
        c.account_id ? c.amount - (c.application_fee_amount ?? 0) : null;

    return (
        <div className="min-h-screen bg-[#F8F9FB] lg:pl-64 font-sans">
            <Sidebar isOpen={false} />

            <main className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/merchant/connect')}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors mb-2"
                        >
                            <ArrowRight className="w-3 h-3 rotate-180" /> Connect Dashboard
                        </button>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <CreditCard className="w-7 h-7 text-orange-500" />
                            Platform Charges
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">All charges processed through your marketplace</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mode toggle */}
                        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                            {(['test', 'live'] as const).map(m => {
                                const active = (m === 'test') === testMode;
                                return (
                                    <button key={m} onClick={() => setTestMode(m === 'test')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                                            active
                                                ? m === 'live' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                                : 'text-gray-400 hover:text-gray-700'
                                        }`}>
                                        {m}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => fetchCharges(offset)}
                            className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-colors shadow-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* ── KPI Cards ──────────────────────────────────────── */}
                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                label: 'Total GMV',
                                value: `ZMW ${fmt(summary.total_gmv)}`,
                                sub: `${summary.total_count.toLocaleString()} charges`,
                                icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
                                iconBg: 'bg-orange-100', bg: 'bg-white',
                            },
                            {
                                label: 'Platform Earned',
                                value: `ZMW ${fmt(summary.total_fees)}`,
                                sub: summary.total_gmv > 0
                                    ? `${((summary.total_fees / summary.total_gmv) * 100).toFixed(2)}% take rate`
                                    : '—',
                                icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
                                iconBg: 'bg-emerald-100', bg: 'bg-white',
                            },
                            {
                                label: 'Succeeded',
                                value: summary.succeeded_count.toLocaleString(),
                                sub: summary.total_count > 0
                                    ? `${((summary.succeeded_count / summary.total_count) * 100).toFixed(1)}% success rate`
                                    : '—',
                                icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
                                iconBg: 'bg-blue-100', bg: 'bg-white',
                            },
                            {
                                label: 'Refunded',
                                value: summary.refunded_count.toLocaleString(),
                                sub: summary.total_count > 0
                                    ? `${((summary.refunded_count / summary.total_count) * 100).toFixed(1)}% refund rate`
                                    : '—',
                                icon: <RefreshCw className="w-4 h-4 text-gray-400" />,
                                iconBg: 'bg-gray-100', bg: 'bg-white',
                            },
                        ].map(({ label, value, sub, icon, iconBg, bg }) => (
                            <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4`}>
                                <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                                    {icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                                    <p className="text-xl font-black text-gray-900 tabular-nums mt-0.5 truncate">{value}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Filters ────────────────────────────────────────── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filters</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className={labelCls}>Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                                <option value="">All statuses</option>
                                <option value="succeeded">Succeeded</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                                <option value="processing">Processing</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Sub-merchant</label>
                            <select value={accountId} onChange={e => setAccId(e.target.value)} className={inputCls}>
                                <option value="">All accounts</option>
                                {accounts.map(a => (
                                    // API returns businessName (camelCase)
                                    <option key={a.id} value={a.id}>{a.businessName || a.id.slice(0, 8)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>From</label>
                            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>To</label>
                            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* ── Table ──────────────────────────────────────────── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    {/* Table header bar */}
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-bold text-gray-700">
                                {loading ? 'Loading…' : `${total.toLocaleString()} charge${total !== 1 ? 's' : ''}`}
                            </span>
                            {!loading && testMode && (
                                <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">
                                    Test Mode
                                </span>
                            )}
                        </div>
                        {total > 0 && (
                            <span className="text-xs text-gray-400 font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                        )}
                    </div>

                    {/* States */}
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                            <XCircle className="w-8 h-8 text-red-300" />
                            <p className="text-sm font-semibold text-gray-500">{error}</p>
                            <button onClick={() => fetchCharges(0)}
                                className="text-xs font-bold text-orange-500 hover:text-orange-600">
                                Try again
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
                        </div>
                    ) : charges.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                                <Layers className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-400">No charges found</p>
                            <p className="text-xs text-gray-300">Try adjusting your filters or switching modes</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/70 border-b border-gray-100">
                                            {['Date', 'Charge', 'Sub-merchant', 'Method', 'Customer Paid', 'Platform Earned', 'Seller Net', 'Status', ''].map(h => (
                                                <th key={h} className={`px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider ${
                                                    ['Customer Paid', 'Platform Earned', 'Seller Net'].includes(h) ? 'text-right' : 'text-left'
                                                }`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {charges.map(charge => {
                                            const earned = platformEarned(charge);
                                            const seller = sellerNet(charge);
                                            const isSplit = !!charge.account_id;
                                            const desc = cleanDescription(charge.description);
                                            return (
                                                <tr key={charge.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    {/* Date */}
                                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                                        <p className="text-xs font-semibold text-gray-700">
                                                            {new Date(charge.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {new Date(charge.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </td>

                                                    {/* Charge ID + description */}
                                                    <td className="px-5 py-3.5 max-w-[160px]">
                                                        <p className="font-mono text-[10px] text-gray-400 truncate">{charge.id.slice(0, 18)}…</p>
                                                        {desc && (
                                                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{desc}</p>
                                                        )}
                                                    </td>

                                                    {/* Sub-merchant */}
                                                    <td className="px-5 py-3.5">
                                                        {isSplit ? (
                                                            <button
                                                                onClick={() => navigate(`/merchant/connect/vendor/${charge.account_id}`)}
                                                                className="flex items-center gap-1 text-orange-600 font-semibold hover:text-orange-700 text-xs"
                                                            >
                                                                {charge.account_business_name || 'Connected Account'}
                                                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </button>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                                                                Direct
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Method */}
                                                    <td className="px-5 py-3.5">
                                                        <span className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 rounded-lg text-[10px] font-semibold capitalize">
                                                            {charge.payment_method?.replace(/_/g, ' ') ?? '—'}
                                                        </span>
                                                    </td>

                                                    {/* Customer Paid */}
                                                    <td className="px-5 py-3.5 text-right">
                                                        <p className="font-bold text-gray-900 text-sm tabular-nums">
                                                            {charge.currency} {fmt(charge.amount, charge.currency)}
                                                        </p>
                                                    </td>

                                                    {/* Platform Earned */}
                                                    <td className="px-5 py-3.5 text-right">
                                                        <p className={`font-bold text-sm tabular-nums ${isSplit ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                            +{charge.currency} {fmt(earned, charge.currency)}
                                                        </p>
                                                        {isSplit && (
                                                            <p className="text-[9px] text-orange-400 font-semibold mt-0.5">commission</p>
                                                        )}
                                                    </td>

                                                    {/* Seller Net */}
                                                    <td className="px-5 py-3.5 text-right">
                                                        {seller !== null ? (
                                                            <p className="text-sm font-semibold text-blue-600 tabular-nums">
                                                                {charge.currency} {fmt(seller, charge.currency)}
                                                            </p>
                                                        ) : (
                                                            <span className="text-gray-300 text-sm">—</span>
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-5 py-3.5">
                                                        <StatusBadge status={charge.status} />
                                                    </td>

                                                    {/* Action */}
                                                    <td className="px-3 py-3.5">
                                                        {isSplit && (
                                                            <button
                                                                onClick={() => navigate(`/merchant/connect/vendor/${charge.account_id}`)}
                                                                className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-orange-50 hover:text-orange-500 text-gray-400 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
                                    <p className="text-xs text-gray-400 font-medium">
                                        Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={offset === 0}
                                            onClick={() => fetchCharges(Math.max(0, offset - LIMIT))}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="w-3 h-3" /> Previous
                                        </button>
                                        <button
                                            disabled={offset + LIMIT >= total}
                                            onClick={() => fetchCharges(offset + LIMIT)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-orange-200"
                                        >
                                            Next <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </main>
        </div>
    );
}
