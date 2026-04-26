import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { BookOpen, ArrowLeft, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

type EntryType = 'fee_collected' | 'split_credit' | 'refund_reversal' | 'payout_disbursed' | 'adjustment';

interface LedgerEntry {
    id: string;
    entry_type: string;
    charge_id: string | null;
    account_id: string | null;
    account_name: string | null;
    amount: number;
    currency: string;
    direction: 'credit' | 'debit';
    description: string | null;
    livemode: boolean;
    created_at: string;
}

interface LedgerSummary {
    total_credits: number;
    total_debits: number;
    net_balance: number;
    currency: string;
}

const ENTRY_LABELS: Record<string, { label: string; color: string }> = {
    fee_collected:    { label: 'Platform Fee',       color: 'bg-amber-50 text-amber-700 border border-amber-100' },
    split_credit:     { label: 'Split Credit',       color: 'bg-blue-50 text-blue-700 border border-blue-100' },
    refund_reversal:  { label: 'Refund Reversal',    color: 'bg-orange-50 text-orange-600 border border-orange-100' },
    payout_disbursed: { label: 'Payout Disbursed',   color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    adjustment:       { label: 'Adjustment',         color: 'bg-purple-50 text-purple-600 border border-purple-100' },
};

function fmt(n: number | null | undefined, currency = 'ZMW') {
    // Amounts are in smallest currency unit (ngwe) — divide by 100 for display
    return `${currency} ${((n ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toDateInput(d: Date) {
    return d.toISOString().slice(0, 10);
}

export default function ConnectLedgerPage() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [summary, setSummary] = useState<LedgerSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [from, setFrom] = useState(toDateInput(thirtyDaysAgo));
    const [to, setTo] = useState(toDateInput(today));
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 25;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { from, to, limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) };
            if (typeFilter !== 'all') params.entry_type = typeFilter;
            const res = await api.get('/v1/connect/ledger', { params });
            setEntries(res.data.entries ?? []);
            setSummary(res.data.summary ?? null);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [from, to, typeFilter, page]);

    useEffect(() => { load(); }, [load]);

    function handleDateFilter(e: React.FormEvent) {
        e.preventDefault();
        setPage(1);
        load();
    }

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans selection:bg-amber-200">
            <div className="hidden md:block w-72 shrink-0 border-r border-amber-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto relative">
                <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-amber-200 rounded-2xl text-amber-600 hover:text-amber-700 hover:border-amber-300 shadow-sm transition-all active:scale-95">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">Financial Journal</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Connect Ledger</h1>
                            <p className="text-sm text-gray-600">Platform fee collection and payout journal</p>
                        </div>
                        <button onClick={load} className="p-2.5 bg-white border border-amber-200 rounded-2xl text-amber-600 hover:text-amber-700 hover:border-amber-300 shadow-sm transition-all active:scale-95">
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* Summary cards */}
                    {summary && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-6 hover:shadow-md hover:border-amber-300 transition-all">
                                <div className="flex items-center gap-2 text-amber-600 mb-3">
                                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                                        <TrendingUp size={15} className="text-amber-600" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Total Credits</span>
                                </div>
                                <p className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent tracking-tight">{fmt(summary.total_credits, summary.currency)}</p>
                                <p className="text-xs text-amber-600/60 mt-1">Fees collected + adjustments</p>
                            </div>
                            <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 hover:shadow-md hover:border-orange-300 transition-all">
                                <div className="flex items-center gap-2 text-orange-600 mb-3">
                                    <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                                        <TrendingDown size={15} className="text-orange-600" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Total Debits</span>
                                </div>
                                <p className="text-xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{fmt(summary.total_debits, summary.currency)}</p>
                                <p className="text-xs text-orange-600/60 mt-1">Payouts disbursed + refund reversals</p>
                            </div>
                            <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-5">
                                <div className="flex items-center gap-2 text-yellow-600 mb-2">
                                    <DollarSign size={16} className="text-yellow-600" />
                                    <span className="text-xs font-semibold uppercase tracking-wide">Net Balance</span>
                                </div>
                                <p className={`text-xl font-black ${summary.net_balance >= 0 ? 'bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent' : 'text-orange-600'}`}>
                                    {fmt(summary.net_balance, summary.currency)}
                                </p>
                                <p className="text-xs text-yellow-600/60 mt-1">Credits minus debits</p>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <form onSubmit={handleDateFilter} className="flex flex-wrap gap-3 mb-5 items-end">
                        <div>
                            <label className="block text-xs font-medium text-amber-700/80 mb-1">From</label>
                            <input
                                type="date"
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                                className="border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-gray-800"
                                style={{ colorScheme: 'light' }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-amber-700/80 mb-1">To</label>
                            <input
                                type="date"
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                className="border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-gray-800"
                                style={{ colorScheme: 'light' }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-amber-700/80 mb-1">Type</label>
                            <select
                                value={typeFilter}
                                onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                                className="border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-amber-800"
                            >
                                <option value="all">All Types</option>
                                <option value="fee_collected">Platform Fee</option>
                                <option value="split_credit">Split Credit</option>
                                <option value="refund_reversal">Refund Reversal</option>
                                <option value="payout_disbursed">Payout Disbursed</option>
                                <option value="adjustment">Adjustment</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
                        >
                            Apply
                        </button>
                    </form>

                    {/* Entries table */}
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-amber-600/70">
                            <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-amber-600/70">
                            <BookOpen size={36} className="mb-3 opacity-30" />
                            <p className="text-sm">No ledger entries for this period</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wide">Date</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wide">Type</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wide">Sub-merchant</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wide">Description</th>
                                            <th className="text-right px-5 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wide">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-50">
                                        {entries.map(entry => {
                                            const cfg = ENTRY_LABELS[entry.entry_type] ?? { label: entry.entry_type, color: 'bg-amber-50 text-amber-600' };
                                            return (
                                                <tr key={entry.id} className="hover:bg-amber-50/50 transition-colors">
                                                    <td className="px-5 py-3.5 text-amber-700/70 text-xs whitespace-nowrap">
                                                        {new Date(entry.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-amber-800 text-xs">
                                                        {entry.account_name || entry.account_id?.slice(0, 8) || '—'}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-amber-700/60 text-xs max-w-xs truncate">
                                                        {entry.description || entry.charge_id || '—'}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <span className={`font-semibold tabular-nums ${entry.direction === 'credit' ? 'text-amber-600' : 'text-orange-600'}`}>
                                                            {entry.direction === 'credit' ? '+' : '−'}{fmt(entry.amount, entry.currency)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4 text-sm text-amber-700/70">
                                <span>Page {page}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 disabled:opacity-40 transition-all"
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={entries.length < PAGE_SIZE}
                                        className="px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 disabled:opacity-40 transition-all"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
