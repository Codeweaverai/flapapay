import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    CreditCard,
    Eye,
    Receipt,
    RefreshCw,
    Search,
    Users,
    Wallet,
    X,
    Zap
} from 'lucide-react';
import { api } from '../../lib/axios';

interface CurrencyMetric {
    currency: string;
    total: number;
    entries?: number;
    wallets?: number;
    total_balance?: number;
}

interface DashboardStats {
    users: number;
    merchants?: number;
    transactions: number;
    volumes: CurrencyMetric[];
    revenue: CurrencyMetric[];
    wallets?: CurrencyMetric[];
    summary?: {
        volume_total: number;
        revenue_total: number;
        wallet_balance_total: number;
        active_wallet_currencies: number;
    };
}

interface TransactionRecord {
    id: string;
    reference: string;
    amount: number | string;
    currency: string;
    type: string;
    status: string;
    description: string;
    created_at: string;
    debit_wallet_id?: string | null;
    credit_wallet_id?: string | null;
    debit_wallet_currency?: string | null;
    credit_wallet_currency?: string | null;
    sender_name?: string | null;
    sender_email?: string | null;
    sender_role?: string | null;
    sender_avatar?: string | null;
    sender_merchant_name?: string | null;
    receiver_name?: string | null;
    receiver_email?: string | null;
    receiver_role?: string | null;
    receiver_avatar?: string | null;
    receiver_merchant_name?: string | null;
    funding_source_type?: string | null;
    funding_source_brand?: string | null;
    funding_source_last4?: string | null;
}

interface LedgerLeg {
    label: string;
    party: string;
    meta: string;
    currency: string;
    walletId?: string | null;
    amount: number;
}

const asArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const normalizeMetricRows = (value: unknown): CurrencyMetric[] => asArray<Record<string, unknown>>(value).map((row) => ({
    currency: String(row.currency || 'N/A'),
    total: parseAmount(row.total),
    entries: row.entries == null ? undefined : Number(row.entries) || 0,
    wallets: row.wallets == null ? undefined : Number(row.wallets) || 0,
    total_balance: row.total_balance == null ? undefined : parseAmount(row.total_balance as number | string)
}));

const normalizeTransactionRows = (value: unknown): TransactionRecord[] => asArray<Record<string, unknown>>(value).map((row) => ({
    id: String(row.id || ''),
    reference: String(row.reference || row.transaction_reference || ''),
    amount: row.amount as number | string,
    currency: String(row.currency || ''),
    type: String(row.type || row.transaction_type || ''),
    status: String(row.status || ''),
    description: String(row.description || ''),
    created_at: String(row.created_at || ''),
    debit_wallet_id: row.debit_wallet_id as string | null | undefined,
    credit_wallet_id: row.credit_wallet_id as string | null | undefined,
    debit_wallet_currency: row.debit_wallet_currency as string | null | undefined,
    credit_wallet_currency: row.credit_wallet_currency as string | null | undefined,
    sender_name: row.sender_name as string | null | undefined,
    sender_email: row.sender_email as string | null | undefined,
    sender_role: row.sender_role as string | null | undefined,
    sender_avatar: row.sender_avatar as string | null | undefined,
    sender_merchant_name: row.sender_merchant_name as string | null | undefined,
    receiver_name: row.receiver_name as string | null | undefined,
    receiver_email: row.receiver_email as string | null | undefined,
    receiver_role: row.receiver_role as string | null | undefined,
    receiver_avatar: row.receiver_avatar as string | null | undefined,
    receiver_merchant_name: row.receiver_merchant_name as string | null | undefined,
    funding_source_type: row.funding_source_type as string | null | undefined,
    funding_source_brand: row.funding_source_brand as string | null | undefined,
    funding_source_last4: row.funding_source_last4 as string | null | undefined
}));

const normalizeStats = (value: unknown): DashboardStats | null => {
    if (!value || typeof value !== 'object') return null;
    const raw = value as Record<string, unknown>;

    return {
        users: Number(raw.users) || 0,
        merchants: raw.merchants == null ? undefined : Number(raw.merchants) || 0,
        transactions: Number(raw.transactions) || 0,
        volumes: normalizeMetricRows(raw.volumes),
        revenue: normalizeMetricRows(raw.revenue),
        wallets: normalizeMetricRows(raw.wallets),
        summary: raw.summary && typeof raw.summary === 'object'
            ? {
                volume_total: parseAmount((raw.summary as Record<string, unknown>).volume_total as number | string),
                revenue_total: parseAmount((raw.summary as Record<string, unknown>).revenue_total as number | string),
                wallet_balance_total: parseAmount((raw.summary as Record<string, unknown>).wallet_balance_total as number | string),
                active_wallet_currencies: Number((raw.summary as Record<string, unknown>).active_wallet_currencies) || 0
            }
            : undefined
    };
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
}).format(value);

const parseAmount = (value: number | string | undefined | null) => Number.parseFloat(String(value || 0)) || 0;

const metricLabel = (rows: CurrencyMetric[] | undefined, preferred: string[]) => {
    if (!rows || rows.length === 0) {
        return { currency: 'N/A', total: 0, subtitle: 'No ledger activity yet.' };
    }

    const picked = preferred
        .map((currency) => rows.find((row) => row.currency === currency))
        .find(Boolean) || rows[0];

    const total = rows.reduce((sum, row) => sum + parseAmount(row.total), 0);
    return {
        currency: picked?.currency || 'N/A',
        total: parseAmount(picked?.total),
        subtitle: `${rows.length} currencies tracked • aggregate ${formatNumber(total)}`
    };
};

const statusStyles = (status: string) => {
    switch ((status || '').toUpperCase()) {
        case 'COMPLETED':
        case 'SUCCESSFUL':
            return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: CheckCircle2 };
        case 'PENDING':
            return { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: Clock };
        default:
            return { bg: 'bg-red-500/10', text: 'text-red-600', icon: AlertCircle };
    }
};

const transactionDirectionIcon = (type: string) => {
    if (['WITHDRAWAL', 'TRANSFER', 'SETTLEMENT', 'CARD_ISSUANCE'].includes((type || '').toUpperCase())) {
        return ArrowUpRight;
    }
    return ArrowDownLeft;
};

const canReverseTransaction = (transaction: TransactionRecord) => {
    const type = (transaction.type || '').toUpperCase();
    return transaction.status === 'COMPLETED'
        && Boolean(transaction.debit_wallet_id)
        && Boolean(transaction.credit_wallet_id)
        && !['FEE', 'ESCROW_FEE', 'WITHDRAWAL', 'DEPOSIT', 'CARD_FUNDING', 'CARD_ISSUANCE'].includes(type);
};

const partyLabel = (kind: 'sender' | 'receiver', transaction: TransactionRecord) => {
    if (kind === 'sender') {
        return transaction.sender_merchant_name || transaction.sender_name || (transaction.debit_wallet_id ? 'Wallet holder' : 'External source');
    }
    return transaction.receiver_merchant_name || transaction.receiver_name || (transaction.credit_wallet_id ? 'Wallet holder' : 'External destination');
};

const partyMeta = (kind: 'sender' | 'receiver', transaction: TransactionRecord) => {
    if (kind === 'sender') {
        return transaction.sender_email
            || transaction.sender_role
            || transaction.debit_wallet_currency
            || transaction.funding_source_brand
            || 'System ledger';
    }
    return transaction.receiver_email
        || transaction.receiver_role
        || transaction.credit_wallet_currency
        || 'System ledger';
};

const ledgerLegs = (transaction: TransactionRecord): { debit: LedgerLeg; credit: LedgerLeg } => ({
    debit: {
        label: 'Debit',
        party: partyLabel('sender', transaction),
        meta: partyMeta('sender', transaction),
        currency: transaction.debit_wallet_currency || transaction.currency || 'N/A',
        walletId: transaction.debit_wallet_id,
        amount: parseAmount(transaction.amount)
    },
    credit: {
        label: 'Credit',
        party: partyLabel('receiver', transaction),
        meta: partyMeta('receiver', transaction),
        currency: transaction.credit_wallet_currency || transaction.currency || 'N/A',
        walletId: transaction.credit_wallet_id,
        amount: parseAmount(transaction.amount)
    }
});

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
    const [reversingId, setReversingId] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, transactionsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/transactions', { params: { limit: 16, offset: 0 } })
            ]);
            setStats(normalizeStats(statsRes.data?.stats || statsRes.data));
            setTransactions(normalizeTransactionRows(transactionsRes.data));
        } catch (err) {
            console.error('Failed to fetch admin dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const volumeMetric = useMemo(() => metricLabel(stats?.volumes, ['ZMW', 'USD']), [stats]);
    const revenueMetric = useMemo(() => metricLabel(stats?.revenue, ['ZMW', 'USD']), [stats]);
    const filteredTransactions = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return transactions;

        return transactions.filter((transaction) => [
            transaction.reference,
            transaction.currency,
            transaction.type,
            transaction.status,
            transaction.sender_name,
            transaction.sender_email,
            transaction.sender_merchant_name,
            transaction.receiver_name,
            transaction.receiver_email,
            transaction.receiver_merchant_name,
            transaction.description
        ].some((field) => String(field || '').toLowerCase().includes(term)));
    }, [transactions, searchTerm]);

    const ledgerSnapshot = useMemo(() => {
        const completed = transactions.filter((transaction) => (transaction.status || '').toUpperCase() === 'COMPLETED').length;
        const pending = transactions.filter((transaction) => (transaction.status || '').toUpperCase() === 'PENDING').length;
        const currencies = new Set(transactions.map((transaction) => transaction.currency).filter(Boolean)).size;
        const merchants = new Set(
            transactions.flatMap((transaction) => [
                transaction.sender_merchant_name,
                transaction.receiver_merchant_name
            ].filter(Boolean) as string[])
        ).size;

        return { completed, pending, currencies, merchants };
    }, [transactions]);

    const handleReverse = async (transaction: TransactionRecord) => {
        if (!canReverseTransaction(transaction)) return;
        if (!confirm(`Reverse transaction ${transaction.reference || transaction.id}?`)) return;

        try {
            setReversingId(transaction.id);
            await api.post(`/admin/transactions/${transaction.id}/reverse`);
            await fetchDashboardData();
            setSelectedTransaction(null);
        } catch (err) {
            console.error('Failed to reverse transaction', err);
            alert('Failed to reverse transaction.');
        } finally {
            setReversingId(null);
        }
    };

    if (loading) {
        return (
            <div className="rounded-[36px] border border-gray-100 bg-white/85 p-10 text-sm font-bold text-slate-500 shadow-sm">
                Loading admin intelligence...
            </div>
        );
    }

    const cards = [
        {
            label: 'Total Users',
            value: formatNumber(stats?.users || 0),
            subtitle: `${formatNumber(stats?.merchants || 0)} merchants onboarded`,
            icon: Users,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            accent: 'from-orange-500/15 to-amber-500/5'
        },
        {
            label: 'Total Transactions',
            value: formatNumber(stats?.transactions || 0),
            subtitle: `${stats?.summary?.active_wallet_currencies || stats?.wallets?.length || 0} wallet currencies active`,
            icon: CreditCard,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            accent: 'from-sky-500/15 to-blue-500/5'
        },
        {
            label: `Total Volume (${volumeMetric.currency})`,
            value: `${volumeMetric.currency} ${formatNumber(volumeMetric.total)}`,
            subtitle: volumeMetric.subtitle,
            icon: Wallet,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            accent: 'from-emerald-500/15 to-teal-500/5'
        },
        {
            label: `Platform Revenue (${revenueMetric.currency})`,
            value: `${revenueMetric.currency} ${formatNumber(revenueMetric.total)}`,
            subtitle: revenueMetric.subtitle,
            icon: Zap,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            accent: 'from-amber-500/20 to-orange-500/5'
        }
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <div key={card.label} className="group relative overflow-hidden rounded-[32px] border border-gray-100 bg-white/90 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                        <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${card.accent} opacity-80`} />
                        <div className={`absolute -right-8 -top-8 h-32 w-32 ${card.bg} rounded-full blur-[60px] opacity-40 transition-opacity group-hover:opacity-100`} />

                        <div className="relative z-10 flex items-center justify-between mb-8">
                            <div className={`${card.bg} ${card.color} rounded-2xl p-4`}>
                                <card.icon className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                            <h3 className="text-3xl font-black tracking-[-0.04em] text-slate-900">{card.value}</h3>
                            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{card.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <section className="rounded-[36px] border border-gray-100 bg-white/90 p-8 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Live Ledger</p>
                            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Merchant and platform transactions</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-500">All merchant and platform transactions in one view.</p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Search reference, merchant, user, currency..."
                                    className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-200 focus:ring-4 focus:ring-orange-100 sm:min-w-[280px]"
                                />
                            </div>
                            <button
                                onClick={() => navigate('/admin/transactions')}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition-all hover:bg-slate-800"
                            >
                                Open full ledger
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
                        <div className="rounded-[26px] border border-gray-100 bg-slate-50/80 px-5 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Visible Flows</p>
                            <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{formatNumber(filteredTransactions.length)}</p>
                            <p className="mt-1 text-xs font-bold text-slate-500">Live rows after search and ledger filters</p>
                        </div>
                        <div className="rounded-[26px] border border-gray-100 bg-slate-50/80 px-5 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Completed</p>
                            <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{formatNumber(ledgerSnapshot.completed)}</p>
                            <p className="mt-1 text-xs font-bold text-slate-500">{formatNumber(ledgerSnapshot.pending)} pending movements under review</p>
                        </div>
                        <div className="rounded-[26px] border border-gray-100 bg-slate-50/80 px-5 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Merchant Reach</p>
                            <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{formatNumber(ledgerSnapshot.merchants)}</p>
                            <p className="mt-1 text-xs font-bold text-slate-500">Merchant entities visible in the current ledger set</p>
                        </div>
                        <div className="rounded-[26px] border border-gray-100 bg-slate-50/80 px-5 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Currencies</p>
                            <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{formatNumber(ledgerSnapshot.currencies)}</p>
                            <p className="mt-1 text-xs font-bold text-slate-500">ZMW, USD, NGN, GBP, EUR and additional wallet rails</p>
                        </div>
                    </div>

                    <div className="mt-8 overflow-hidden rounded-[30px] border border-gray-100 bg-white">
                        <div className="hidden grid-cols-[0.9fr_0.95fr_1.2fr_1fr_0.78fr_0.62fr] gap-4 border-b border-gray-100 bg-slate-50/80 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 lg:grid">
                            <span>Reference</span>
                            <span>Date</span>
                            <span>Debit / Credit View</span>
                            <span>Description</span>
                            <span>Status</span>
                            <span>Action</span>
                        </div>

                        <div className="divide-y divide-gray-100 bg-white">
                            {filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => {
                                const icon = transactionDirectionIcon(transaction.type);
                                const status = statusStyles(transaction.status);
                                const reversible = canReverseTransaction(transaction);
                                const legs = ledgerLegs(transaction);
                                return (
                                    <div key={transaction.id} className="px-6 py-5 transition-colors hover:bg-slate-50/70">
                                        <div className="grid gap-5 lg:grid-cols-[0.9fr_0.95fr_1.2fr_1fr_0.78fr_0.62fr] lg:items-center">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                                                        <Receipt className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-black text-slate-900">{transaction.reference || transaction.id}</p>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{transaction.type}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-900">{new Date(transaction.created_at).toLocaleDateString()}</p>
                                                <p className="mt-1 truncate text-xs font-bold text-slate-500">{new Date(transaction.created_at).toLocaleTimeString()}</p>
                                            </div>

                                            <div className="grid gap-3 xl:grid-cols-2">
                                                {[legs.debit, legs.credit].map((leg) => (
                                                    <div key={leg.label} className="rounded-[22px] border border-gray-100 bg-slate-50/80 px-4 py-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{leg.label}</p>
                                                                <p className="mt-1 truncate text-sm font-black text-slate-900">{leg.party}</p>
                                                                <p className="mt-1 truncate text-xs font-bold text-slate-500">{leg.meta}</p>
                                                            </div>
                                                            <div className={`rounded-2xl px-3 py-2 text-right ${leg.label === 'Debit' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.14em]">{leg.currency}</p>
                                                                <p className="mt-1 text-sm font-black">{formatNumber(leg.amount)}</p>
                                                            </div>
                                                        </div>
                                                        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                            {leg.walletId ? `${leg.label.toLowerCase()} wallet ${leg.currency} • ${leg.walletId.slice(0, 8)}...` : `${leg.label} external rail`}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-700">{transaction.description || 'No description provided.'}</p>
                                                <p className="mt-2 truncate text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                    {transaction.funding_source_brand
                                                        ? `${transaction.funding_source_brand}${transaction.funding_source_last4 ? ` •••• ${transaction.funding_source_last4}` : ''}`
                                                        : 'Ledger movement'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${status.bg} ${status.text}`}>
                                                    {React.createElement(icon, { className: 'h-4 w-4' })}
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-slate-900">{transaction.currency} {formatNumber(parseAmount(transaction.amount))}</p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${status.bg} ${status.text}`}>
                                                            <status.icon className="h-3 w-3" />
                                                            {transaction.status}
                                                        </span>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{transaction.type}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 lg:justify-end">
                                                <button
                                                    onClick={() => setSelectedTransaction(transaction)}
                                                    className="inline-flex items-center justify-center rounded-2xl border border-gray-100 bg-white px-3 py-2 text-slate-600 transition-all hover:border-orange-200 hover:text-orange-500"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleReverse(transaction)}
                                                    disabled={!reversible || reversingId === transaction.id}
                                                    className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all ${reversible ? 'bg-orange-500 text-white hover:bg-orange-600' : 'cursor-not-allowed bg-slate-100 text-slate-400'}`}
                                                >
                                                    <RefreshCw className={`h-3.5 w-3.5 ${reversingId === transaction.id ? 'animate-spin' : ''}`} />
                                                    Reverse
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="px-6 py-16 text-center text-sm font-bold italic text-slate-500">
                                    No transactions match the current search.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-[36px] border border-gray-100 bg-white/90 p-8 shadow-sm">
                    <h2 className="mb-8 text-xl font-black text-slate-900">Revenue by currency</h2>
                    <div className="space-y-6">
                        {stats?.revenue?.length ? stats.revenue.map((row) => {
                            const maxValue = Math.max(...stats.revenue.map((item) => parseAmount(item.total)), 1);
                            const width = (parseAmount(row.total) / maxValue) * 100;
                            return (
                                <div key={row.currency} className="flex items-center gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 font-black text-orange-500">
                                        {row.currency}
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-500">{row.currency} Revenue</span>
                                            <span className="text-sm font-black text-slate-900">{formatNumber(parseAmount(row.total))}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(width, 4)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-sm font-bold italic text-slate-500">No revenue recorded yet.</p>
                        )}
                    </div>
                </section>

                <section className="rounded-[36px] border border-gray-100 bg-white/90 p-8 shadow-sm">
                    <h2 className="mb-8 text-xl font-black text-slate-900">Volume by currency</h2>
                    <div className="space-y-6">
                        {stats?.volumes?.length ? stats.volumes.map((row) => {
                            const totalValue = stats.volumes.reduce((sum, item) => sum + parseAmount(item.total), 0) || 1;
                            const width = (parseAmount(row.total) / totalValue) * 100;
                            return (
                                <div key={row.currency} className="flex items-center gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 font-black text-orange-500">
                                        {row.currency}
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-500">{row.currency} Volume</span>
                                            <span className="text-sm font-black text-slate-900">{formatNumber(parseAmount(row.total))}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.max(width, 4)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-sm font-bold italic text-slate-500">No volume recorded yet.</p>
                        )}
                    </div>
                </section>
            </div>

            {selectedTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl overflow-hidden rounded-[36px] border border-gray-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Transaction detail</p>
                                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{selectedTransaction.reference || selectedTransaction.id}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="rounded-2xl border border-gray-100 p-3 text-slate-500 transition-all hover:text-slate-900"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid gap-6 p-8 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="space-y-6">
                                <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">Ledger amount</p>
                                    <p className="mt-3 text-4xl font-black">{selectedTransaction.currency} {formatNumber(parseAmount(selectedTransaction.amount))}</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]">{selectedTransaction.type}</span>
                                        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]">{selectedTransaction.status}</span>
                                        {selectedTransaction.funding_source_brand && (
                                            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]">
                                                {selectedTransaction.funding_source_brand} {selectedTransaction.funding_source_last4 ? `•••• ${selectedTransaction.funding_source_last4}` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[28px] border border-gray-100 bg-slate-50/70 p-5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Debit side</p>
                                        <p className="mt-2 text-lg font-black text-slate-900">{partyLabel('sender', selectedTransaction)}</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">{partyMeta('sender', selectedTransaction)}</p>
                                        <p className="mt-4 text-xs font-bold text-slate-400">Wallet: {selectedTransaction.debit_wallet_currency || 'External'}{selectedTransaction.debit_wallet_id ? ` • ${selectedTransaction.debit_wallet_id.slice(0, 8)}...` : ''}</p>
                                    </div>
                                    <div className="rounded-[28px] border border-gray-100 bg-slate-50/70 p-5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Credit side</p>
                                        <p className="mt-2 text-lg font-black text-slate-900">{partyLabel('receiver', selectedTransaction)}</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">{partyMeta('receiver', selectedTransaction)}</p>
                                        <p className="mt-4 text-xs font-bold text-slate-400">Wallet: {selectedTransaction.credit_wallet_currency || 'External'}{selectedTransaction.credit_wallet_id ? ` • ${selectedTransaction.credit_wallet_id.slice(0, 8)}...` : ''}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-[28px] border border-gray-100 bg-white p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Description</p>
                                    <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{selectedTransaction.description || 'No description provided.'}</p>
                                </div>

                                <div className="rounded-[28px] border border-gray-100 bg-white p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Admin actions</p>
                                    <div className="mt-4 space-y-3">
                                        <button
                                            onClick={() => handleReverse(selectedTransaction)}
                                            disabled={!canReverseTransaction(selectedTransaction) || reversingId === selectedTransaction.id}
                                            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.16em] transition-all ${canReverseTransaction(selectedTransaction) ? 'bg-orange-500 text-white hover:bg-orange-600' : 'cursor-not-allowed bg-slate-100 text-slate-400'}`}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${reversingId === selectedTransaction.id ? 'animate-spin' : ''}`} />
                                            Reverse transaction
                                        </button>
                                        <button
                                            onClick={() => navigate('/admin/transactions')}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-100 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-700 transition-all hover:border-orange-200 hover:text-orange-500"
                                        >
                                            <Receipt className="h-4 w-4" />
                                            Open full ledger
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-gray-100 bg-orange-50/70 p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">Compliance note</p>
                                    <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                                        Reversal is only enabled for completed wallet-to-wallet ledger movements with both debit and credit wallets present. External deposits, withdrawals, and fee-only entries remain view-only here.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
