import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/axios';
import {
    DollarSign, TrendingUp, ArrowDownLeft, FileText,
    LogOut, RefreshCw, Clock, CheckCircle, XCircle,
    AlertTriangle, ChevronRight, Send, Loader2, ShieldCheck,
    Upload, Eye, AlertCircle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubMerchantAccount {
    id: string;
    business_name: string;
    email: string;
    kyc_status: string;
    status: string;
    platform_merchant_id: string;
    balance: { available: number; pending: number };
}

interface Charge {
    id: string;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    created_at: string;
}

interface Payout {
    id: string;
    amount: number;
    currency: string;
    description: string | null;
    created_at: string;
}

interface Statement {
    id: string;
    period_start: string;
    period_end: string;
    total_charges_amount: number;
    total_refunds_amount: number;
    total_payouts_amount: number;
    platform_fees_amount: number;
    net_earnings: number;
    currency: string;
    emailed_at: string | null;
}

interface PayoutRequest {
    id: string;
    amount: number;
    currency: string;
    status: string;
    note: string | null;
    platform_note: string | null;
    created_at: string;
}

type Tab = 'overview' | 'charges' | 'payouts' | 'statements' | 'payout_request' | 'kyc';

// ─── Session storage helpers ─────────────────────────────────────────────────

const SESSION_KEY = 'fp_submerchant_token';

function getToken() { return localStorage.getItem(SESSION_KEY); }
function setToken(t: string) { localStorage.setItem(SESSION_KEY, t); }
function clearToken() { localStorage.removeItem(SESSION_KEY); }

function portalApi() {
    const token = getToken();
    return {
        get: (url: string, params?: any) => api.get(url, { headers: { Authorization: `Bearer ${token}` }, params }),
        post: (url: string, data?: any) => api.post(url, data, { headers: { Authorization: `Bearer ${token}` } }),
    };
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string, acct: SubMerchantAccount) => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/v1/connect/portal/login', { email, password });
            setToken(res.data.token);
            onLogin(res.data.token, res.data.account);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/40 via-amber-100/20 to-transparent rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-100/20 to-transparent rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none"></div>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden relative z-10">
                <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-8 py-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-extrabold text-xl tracking-tight">FlapaPay</h1>
                            <p className="text-orange-100 text-xs font-medium">Sub-merchant Portal</p>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all bg-gray-50"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all bg-gray-50"
                        />
                    </div>
                    {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 disabled:opacity-50 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                        {loading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Signing in…</span> : 'Sign In'}
                    </button>
                    <p className="text-center text-xs text-gray-400">
                        Don't have an account? Use your invite link to register.
                    </p>
                </form>
            </div>
        </div>
    );
}

// ─── KYC Status Banner ────────────────────────────────────────────────────────

function KYCBanner({ status }: { status: string }) {
    if (status === 'verified') return null;
    const configs = {
        unverified: { color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400', Icon: AlertTriangle, msg: 'Your account is pending identity verification. Please submit your KYC documents to start processing payments.' },
        pending_review: { color: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-400', Icon: Clock, msg: 'Your KYC documents are under review. We\'ll notify you once complete.' },
        rejected: { color: 'bg-rose-50 border-rose-200 text-rose-600', dot: 'bg-rose-400', Icon: XCircle, msg: 'Your KYC documents were rejected. Please resubmit the required documents.' },
    };
    const cfg = configs[status as keyof typeof configs];
    if (!cfg) return null;
    const { Icon } = cfg;
    return (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-6 ${cfg.color}`}>
            <div className="flex items-center gap-2 shrink-0">
                <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`}></span>
                <Icon size={16} />
            </div>
            <p className="text-sm font-semibold">{cfg.msg}</p>
        </div>
    );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────

export default function SubMerchantPortal() {
    const [token, setTokenState] = useState<string | null>(getToken);
    const [account, setAccount] = useState<SubMerchantAccount | null>(null);
    const [tab, setTab] = useState<Tab>('overview');

    const [charges, setCharges] = useState<Charge[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [statements, setStatements] = useState<Statement[]>([]);
    const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
    const [kycDocs, setKycDocs] = useState<any[]>([]);

    const [dataLoading, setDataLoading] = useState(false);
    const [authLoading, setAuthLoading] = useState(!!token);

    // Verify existing session on mount
    useEffect(() => {
        if (!token) { setAuthLoading(false); return; }
        portalApi().get('/v1/connect/portal/me')
            .then(res => setAccount(res.data))
            .catch(() => { clearToken(); setTokenState(null); })
            .finally(() => setAuthLoading(false));
    }, []);

    const loadTabData = useCallback(async (t: Tab) => {
        if (!token) return;
        setDataLoading(true);
        try {
            const p = portalApi();
            if (t === 'charges') {
                const r = await p.get('/v1/connect/portal/charges');
                setCharges(r.data.charges ?? []);
            } else if (t === 'payouts') {
                const r = await p.get('/v1/connect/portal/payouts');
                setPayouts(r.data.payouts ?? []);
            } else if (t === 'statements') {
                const r = await p.get('/v1/connect/portal/statements');
                setStatements(r.data.statements ?? []);
            } else if (t === 'payout_request') {
                const r = await p.get('/v1/connect/portal/payout-requests');
                setPayoutRequests(r.data.requests ?? []);
            } else if (t === 'kyc') {
                const r = await p.get('/v1/connect/portal/kyc');
                setKycDocs(r.data.documents ?? []);
            }
        } catch { /* ignore */ }
        finally { setDataLoading(false); }
    }, [token]);

    useEffect(() => {
        if (account && tab !== 'overview') loadTabData(tab);
    }, [tab, account, loadTabData]);

    function handleLogin(t: string, acct: SubMerchantAccount) {
        setTokenState(t);
        setAccount(acct);
    }

    function handleLogout() {
        clearToken();
        setTokenState(null);
        setAccount(null);
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] font-sans">
                <Loader2 size={28} className="animate-spin text-orange-500" />
            </div>
        );
    }

    if (!token || !account) return <LoginScreen onLogin={handleLogin} />;

    const { balance } = account;

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-orange-100">
            {/* Top nav */}
            <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="font-extrabold text-gray-900 tracking-tight">FlapaPay</span>
                            <span className="text-[10px] text-gray-400 ml-2 font-bold uppercase tracking-widest">Vendor Portal</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">{account.business_name}</p>
                            <p className="text-xs text-gray-400">{account.email}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100">Active</span>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-500 text-gray-400 rounded-2xl transition-all"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-8 relative">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-orange-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                <KYCBanner status={account.kyc_status} />

                {/* Balance cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-lg shadow-emerald-500/20 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6"></div>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle size={15} className="text-emerald-200" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Available Balance</span>
                        </div>
                        <p className="text-3xl font-extrabold tracking-tight">ZMW {balance.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-emerald-200 mt-1 font-medium">Ready for payout</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full -mr-4 -mt-4"></div>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock size={15} className="text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Pending Balance</span>
                        </div>
                        <p className="text-3xl font-extrabold tracking-tight text-gray-900">ZMW {balance.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">Settling soon</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white border border-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto shadow-sm">
                    {([
                        { id: 'overview', label: 'Overview', Icon: TrendingUp },
                        { id: 'charges', label: 'Charges', Icon: DollarSign },
                        { id: 'payouts', label: 'Payouts', Icon: ArrowDownLeft },
                        { id: 'statements', label: 'Statements', Icon: FileText },
                        { id: 'payout_request', label: 'Request Payout', Icon: Send },
                        { id: 'kyc', label: 'Documents', Icon: ShieldCheck },
                    ] as const).map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                                tab === id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div>
                    {tab === 'overview' && <OverviewTab account={account} />}
                    {tab === 'charges' && <ChargesTab charges={charges} loading={dataLoading} onRefresh={() => loadTabData('charges')} />}
                    {tab === 'payouts' && <PayoutsTab payouts={payouts} loading={dataLoading} onRefresh={() => loadTabData('payouts')} />}
                    {tab === 'statements' && <StatementsTab statements={statements} loading={dataLoading} onRefresh={() => loadTabData('statements')} />}
                    {tab === 'payout_request' && (
                        <PayoutRequestTab
                            account={account}
                            requests={payoutRequests}
                            loading={dataLoading}
                            onRefresh={() => loadTabData('payout_request')}
                            token={token}
                            onRequestCreated={() => loadTabData('payout_request')}
                        />
                    )}
                    {tab === 'kyc' && (
                        <KYCDocumentsTab
                            docs={kycDocs}
                            loading={dataLoading}
                            token={token!}
                            onRefresh={() => loadTabData('kyc')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Sub-tab components ────────────────────────────────────────────────────────

function OverviewTab({ account }: { account: SubMerchantAccount }) {
    const kycColors: Record<string, string> = {
        verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending_review: 'bg-blue-50 text-blue-700 border-blue-200',
        unverified: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        rejected: 'bg-red-50 text-red-600 border-red-200',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-800">Account Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Business Name</p>
                    <p className="font-semibold text-gray-800">{account.business_name}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-gray-700">{account.email}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${account.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {account.status}
                    </span>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">KYC Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${kycColors[account.kyc_status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {account.kyc_status.replace('_', ' ')}
                    </span>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account ID</p>
                    <p className="text-xs font-mono text-gray-400">{account.id}</p>
                </div>
            </div>
        </div>
    );
}

function ChargesTab({ charges, loading, onRefresh }: { charges: Charge[]; loading: boolean; onRefresh: () => void }) {
    if (loading) return <LoadingState />;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Recent Charges</h2>
                <button onClick={onRefresh} className="text-gray-400 hover:text-orange-500 transition-colors"><RefreshCw size={14} /></button>
            </div>
            {charges.length === 0 ? (
                <EmptyState icon={DollarSign} message="No charges yet" />
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {charges.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3 text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                                <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{c.description || c.id.slice(0, 12) + '…'}</td>
                                <td className="px-5 py-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${c.status === 'succeeded' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right font-semibold text-gray-800">{c.currency} {parseFloat(String(c.amount)).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function PayoutsTab({ payouts, loading, onRefresh }: { payouts: Payout[]; loading: boolean; onRefresh: () => void }) {
    if (loading) return <LoadingState />;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Payout History</h2>
                <button onClick={onRefresh} className="text-gray-400 hover:text-orange-500 transition-colors"><RefreshCw size={14} /></button>
            </div>
            {payouts.length === 0 ? (
                <EmptyState icon={ArrowDownLeft} message="No payouts yet" />
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {payouts.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-5 py-3 text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                                <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{p.description || '—'}</td>
                                <td className="px-5 py-3 text-right font-semibold text-emerald-600">{p.currency} {parseFloat(String(p.amount)).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function StatementsTab({ statements, loading, onRefresh }: { statements: Statement[]; loading: boolean; onRefresh: () => void }) {
    if (loading) return <LoadingState />;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Monthly Statements</h2>
                <button onClick={onRefresh} className="text-gray-400 hover:text-orange-500 transition-colors"><RefreshCw size={14} /></button>
            </div>
            {statements.length === 0 ? (
                <EmptyState icon={FileText} message="No statements generated yet" />
            ) : (
                <div className="divide-y divide-gray-50">
                    {statements.map(s => {
                        const periodLabel = new Date(s.period_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        return (
                            <div key={s.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800">{periodLabel}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                            <span>{s.total_charges_count ?? 0} charges · {s.currency} {parseFloat(String(s.total_charges_amount)).toLocaleString()}</span>
                                            <span>Fees: {s.currency} {parseFloat(String(s.platform_fees_amount)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-orange-600">
                                            {s.currency} {parseFloat(String(s.net_earnings)).toLocaleString()} net
                                        </p>
                                        {s.emailed_at && (
                                            <p className="text-xs text-gray-400 mt-1">Emailed {new Date(s.emailed_at).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PayoutRequestTab({
    account, requests, loading, onRefresh, token, onRequestCreated
}: {
    account: SubMerchantAccount;
    requests: PayoutRequest[];
    loading: boolean;
    onRefresh: () => void;
    token: string;
    onRequestCreated: () => void;
}) {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const hasPending = requests.some(r => r.status === 'pending');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) { setSubmitError('Enter a valid amount'); return; }
        setSubmitting(true);
        setSubmitError('');
        try {
            await api.post('/v1/connect/portal/payout-requests', { amount: parseFloat(amount), note: note || undefined }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAmount('');
            setNote('');
            setSubmitSuccess(true);
            onRequestCreated();
            setTimeout(() => setSubmitSuccess(false), 4000);
        } catch (err: any) {
            setSubmitError(err.response?.data?.error || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    }

    const STATUS_CFG: Record<string, { label: string; color: string }> = {
        pending:    { label: 'Pending Review', color: 'bg-yellow-50 text-yellow-700' },
        approved:   { label: 'Approved',       color: 'bg-blue-50 text-blue-700' },
        denied:     { label: 'Denied',          color: 'bg-red-50 text-red-600' },
        processing: { label: 'Processing',      color: 'bg-purple-50 text-purple-700' },
        completed:  { label: 'Completed',       color: 'bg-emerald-50 text-emerald-700' },
        failed:     { label: 'Failed',           color: 'bg-gray-100 text-gray-500' },
    };

    return (
        <div className="space-y-5">
            {/* Request form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-800 mb-4">Request a Payout</h2>
                {hasPending && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700 mb-4">
                        <Clock size={14} /> You already have a pending payout request. Wait for it to be reviewed before submitting another.
                    </div>
                )}
                {submitSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 mb-4">
                        <CheckCircle size={14} /> Your payout request has been submitted and is awaiting review.
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ZMW)</label>
                        <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                disabled={hasPending}
                                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Available: ZMW {account.balance.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                        <textarea
                            rows={2}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Reason for payout request…"
                            disabled={hasPending}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none disabled:bg-gray-50"
                        />
                    </div>
                    {submitError && <p className="text-sm text-red-500">{submitError}</p>}
                    <button
                        type="submit"
                        disabled={submitting || hasPending}
                        className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? 'Submitting…' : 'Submit Payout Request'}
                    </button>
                </form>
            </div>

            {/* Request history */}
            {loading ? <LoadingState /> : requests.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-800">Request History</h2>
                        <button onClick={onRefresh} className="text-gray-400 hover:text-orange-500 transition-colors"><RefreshCw size={14} /></button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {requests.map(r => {
                            const cfg = STATUS_CFG[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-500' };
                            return (
                                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                                    <div>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color} mr-2`}>{cfg.label}</span>
                                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                        {r.platform_note && (
                                            <p className="text-xs text-gray-400 mt-1 italic">"{r.platform_note}"</p>
                                        )}
                                    </div>
                                    <span className="font-semibold text-gray-800 text-sm">{r.currency} {parseFloat(String(r.amount)).toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center h-36 text-gray-400">
            <RefreshCw size={18} className="animate-spin mr-2" /> Loading…
        </div>
    );
}

function EmptyState({ icon: Icon, message }: { icon: React.FC<any>; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Icon size={32} className="mb-3 opacity-20" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

// ─── KYC Documents Tab ────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
    nrc: 'National ID (NRC)',
    passport: 'Passport',
    pacra_cert: 'PACRA Certificate',
    tpin_cert: 'TPIN Certificate',
    proof_of_address: 'Proof of Address',
};

const KYC_STATUS_CFG: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
    pending_review: { label: 'Under Review', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    approved:       { label: 'Approved',     color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle },
    rejected:       { label: 'Rejected',     color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
};

function KYCDocumentsTab({
    docs, loading, token, onRefresh
}: {
    docs: any[];
    loading: boolean;
    token: string;
    onRefresh: () => void;
}) {
    const [docType, setDocType] = useState('nrc');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!file) { setUploadError('Please select a file'); return; }
        setUploading(true);
        setUploadError('');
        setUploadSuccess(false);
        try {
            const formData = new FormData();
            formData.append('document_type', docType);
            formData.append('document', file);
            await api.post('/v1/connect/portal/kyc', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadSuccess(true);
            setFile(null);
            onRefresh();
        } catch (err: any) {
            setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Upload Form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Upload size={15} className="text-orange-500" />
                    </div>
                    <h2 className="font-bold text-gray-800">Submit KYC Document</h2>
                </div>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Document Type</label>
                        <select
                            value={docType}
                            onChange={e => setDocType(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all bg-gray-50"
                        >
                            {Object.entries(DOC_TYPE_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">File</label>
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all">
                            <Upload size={20} className="text-gray-300 mb-1" />
                            <span className="text-xs text-gray-400 font-medium">
                                {file ? file.name : 'Click to select file (JPG, PNG, PDF)'}
                            </span>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={e => setFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                    </div>
                    {uploadError && (
                        <div className="flex items-center gap-2 text-red-500 text-sm">
                            <AlertCircle size={14} />
                            {uploadError}
                        </div>
                    )}
                    {uploadSuccess && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                            <CheckCircle size={14} />
                            Document submitted for review.
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={uploading || !file}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 active:scale-95 transition-all text-sm"
                    >
                        {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload Document</>}
                    </button>
                </form>
            </div>

            {/* Submitted Documents */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={15} className="text-gray-400" />
                        <h2 className="font-bold text-gray-800">Submitted Documents</h2>
                    </div>
                    <button onClick={onRefresh} className="text-gray-400 hover:text-orange-500 transition-colors">
                        <RefreshCw size={14} />
                    </button>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 size={20} className="animate-spin text-orange-400" />
                    </div>
                ) : docs.length === 0 ? (
                    <EmptyState icon={FileText} message="No documents submitted yet" />
                ) : (
                    <div className="divide-y divide-gray-50">
                        {docs.map(doc => {
                            const cfg = KYC_STATUS_CFG[doc.status] ?? { label: doc.status, color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Clock };
                            const StatusIcon = cfg.icon;
                            return (
                                <div key={doc.id} className="px-5 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">
                                            {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {doc.file_name ?? 'Document'} · {new Date(doc.uploaded_at).toLocaleDateString()}
                                        </p>
                                        {doc.rejection_reason && (
                                            <p className="text-xs text-red-500 mt-1 font-medium">
                                                Rejection reason: {doc.rejection_reason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                                            <StatusIcon size={10} />
                                            {cfg.label}
                                        </span>
                                        {doc.file_url && (
                                            <a
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                                                title="View document"
                                            >
                                                <Eye size={14} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
