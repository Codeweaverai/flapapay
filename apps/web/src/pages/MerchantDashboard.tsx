import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import ReactCountryFlag from 'react-country-flag';
import {
    Zap, ArrowDownLeft, ArrowUpRight, Copy, Eye, EyeOff,
    RefreshCw, ShieldCheck, ShieldAlert, ChevronDown, Check,
    Wallet, BarChart3, Link2, Layers, Lock, TrendingUp,
    FlaskConical, Smartphone, Building2, RotateCcw, X,
    CreditCard, Activity, ArrowRight, Clock, CheckCircle2, Code, BookOpen
} from 'lucide-react';

export const MerchantDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [dashboardMode, setDashboardMode] = useState<'TEST' | 'LIVE'>('TEST');
    const [stats, setStats] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [apiKeys, setApiKeys] = useState<{
        test: { public: string; secret: string };
        live: { public: string; secret: string }
    } | null>(null);
    const [merchant, setMerchant] = useState<any>(null);
    const [balance, setBalance] = useState<any>(null);
    const [showKYCModal, setShowKYCModal] = useState(false);
    const [kycForm, setKycForm] = useState({
        legalName: '', pacraNumber: '', tpin: '',
        directorName: '', directorNRC: '', registeredAddress: ''
    });
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [settleForm, setSettleForm] = useState({ amount: '', targetWalletId: '', fxRate: 27.5 });
    const [showSecret, setShowSecret] = useState(false);
    const [loading, setLoading] = useState(true);
    const [wallets, setWallets] = useState<any[]>([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({ walletId: '', amount: '', destinationType: 'MOBILE_MONEY', accountNumber: '' });
    const [showWalletDropdown, setShowWalletDropdown] = useState(false);
    const [testLedger, setTestLedger] = useState<any[]>([]);
    const [testLedgerTotal, setTestLedgerTotal] = useState(0);
    const [testLedgerLoading, setTestLedgerLoading] = useState(false);
    const [liveWallets, setLiveWallets] = useState<any[]>([]);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statusRes, keysRes, statsRes] = await Promise.all([
                api.get('/merchants/status'),
                api.get('/merchants/keys'),
                api.get('/merchants/stats', { params: { mode: dashboardMode.toLowerCase() } })
            ]);

            if (statusRes.data.complianceStatus) {
                setMerchant({
                    ...statusRes.data.merchant,
                    compliance_status: statusRes.data.complianceStatus,
                    is_live_enabled: statusRes.data.isLiveEnabled,
                });
            }

            setApiKeys(keysRes.data);

            if (keysRes.data?.test?.secret) localStorage.setItem('merchant_sk_test', keysRes.data.test.secret);
            if (keysRes.data?.live?.secret) localStorage.setItem('merchant_sk_live', keysRes.data.live.secret);

            setStats(statsRes.data.stats);
            setRecentActivity(statsRes.data.recentActivity);

            const walletRes = await api.get('/wallets', { params: { mode: dashboardMode.toLowerCase() } });
            setWallets(walletRes.data);

            const liveWalletRes = await api.get('/wallets', { params: { mode: 'live' } });
            setLiveWallets(liveWalletRes.data);

            if (dashboardMode === 'TEST') {
                setTestLedgerLoading(true);
                try {
                    const ledgerRes = await api.get('/merchants/test-ledger', { params: { limit: 15 } });
                    setTestLedger(ledgerRes.data.entries || []);
                    setTestLedgerTotal(ledgerRes.data.total_credited || 0);
                } catch { } finally {
                    setTestLedgerLoading(false);
                }
            } else {
                setTestLedger([]);
            }

            setBalance({ currency: 'ZMW', available: statsRes.data.rawBalance });
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    const rollKey = async () => {
        if (!window.confirm('Are you sure? Old keys will stop working immediately.')) return;
        try {
            await api.post('/merchants/keys/roll', { type: dashboardMode.toLowerCase() });
            fetchDashboardData();
            alert('Keys rolled successfully');
        } catch { alert('Failed to roll keys'); }
    };

    useEffect(() => { fetchDashboardData(); }, [dashboardMode]);

    const handleKYCSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/merchants/compliance', {
                legalName: kycForm.legalName, pacraNumber: kycForm.pacraNumber,
                tpin: kycForm.tpin, directorName: kycForm.directorName,
                directorNRC: kycForm.directorNRC, registeredAddress: kycForm.registeredAddress,
                documents: []
            });
            alert('KYC documents submitted successfully!');
            setShowKYCModal(false);
            fetchDashboardData();
        } catch { alert('Failed to submit KYC'); }
    };

    const handleSettleToWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const selectedWallet = wallets.find(w => w.id === settleForm.targetWalletId);
            const isFX = selectedWallet?.currency !== (balance?.currency || 'ZMW');
            const isTestMode = dashboardMode === 'TEST';
            await api.post('/merchants/transfer-to-wallet', {
                amount: parseFloat(settleForm.amount), walletId: settleForm.targetWalletId,
                applyFX: isFX, fxRate: isFX ? settleForm.fxRate : 1, isTestMode
            });
            setShowSettleModal(false);
            fetchDashboardData();
            alert(isTestMode ? 'Test funds moved to test wallet successfully!' : 'Funds moved to wallet successfully!');
        } catch (err: any) { alert(err.response?.data?.error || 'Transfer failed'); }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/wallets/withdraw', {
                walletId: withdrawForm.walletId, amount: parseFloat(withdrawForm.amount),
                destinationType: withdrawForm.destinationType,
                destinationDetails: { account: withdrawForm.accountNumber }
            });
            setShowWithdrawModal(false);
            fetchDashboardData();
            alert('Withdrawal initiated! Funds will arrive shortly.');
        } catch (err: any) { alert(err.response?.data?.error || 'Withdrawal failed'); }
    };

    const copyKey = (val: string, id: string) => {
        if (!val) return;
        navigator.clipboard.writeText(val);
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const isApproved = merchant?.compliance_status === 'ACTIVE' || merchant?.is_live_enabled;
    const isPending  = merchant?.compliance_status === 'PENDING';
    const currentKeys = dashboardMode === 'TEST' ? apiKeys?.test : apiKeys?.live;

    const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-gray-300';
    const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

    // ─── Quick actions ────────────────────────────────────────────────────────
    const quickActions = [
        { title: 'Escrow',         desc: 'Secure milestone payments', Icon: Layers,   path: '/escrow',                           accent: 'text-orange-600',  bg: 'bg-orange-50',  border: 'hover:border-orange-200' },
        { title: 'Subscriptions',  desc: 'Recurring billing',         Icon: RefreshCw,path: '/merchant/subscriptions',           accent: 'text-violet-600',  bg: 'bg-violet-50',  border: 'hover:border-violet-200' },
        { title: 'Connect',        desc: 'Sub-merchants & splits',    Icon: Link2,    path: '/merchant/connect',                 accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
        { title: 'Webhooks',       desc: 'Event delivery',            Icon: Activity, path: '/merchant/connect/webhooks',        accent: 'text-blue-600',    bg: 'bg-blue-50',    border: 'hover:border-blue-200' },
        { title: 'Compliance',     desc: 'Business verification',     Icon: ShieldCheck,path:'/merchant/compliance-requirements',accent: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'hover:border-indigo-200' },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex font-sans">
            {/* Sidebar */}
            <div className="hidden md:block w-64 shrink-0 sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 min-h-screen overflow-x-hidden">
                <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-8">

                    {/* ── Header ─────────────────────────────────────────── */}
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    {merchant?.business_name || 'Merchant Dashboard'}
                                </h1>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                    dashboardMode === 'TEST'
                                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dashboardMode === 'TEST' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                    {dashboardMode}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-semibold text-gray-700">{merchant?.business_name || '—'}</p>
                                <p className="text-xs text-gray-400">
                                    ID: <span className="font-mono text-gray-500">{merchant?.account_id || '—'}</span>
                                    <span className="mx-2 text-gray-200">·</span>
                                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Mode toggle */}
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-0.5 shadow-sm">
                                {(['TEST', 'LIVE'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setDashboardMode(m)}
                                        className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                            dashboardMode === m
                                                ? 'bg-gray-900 text-white shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        {m === 'TEST' ? 'Test' : 'Live'}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate('/developers')}
                                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                                >
                                    <Code className="w-4 h-4" /> Developers
                                </button>
                                <button
                                    onClick={() => navigate('/documentation')}
                                    className="flex items-center gap-2 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200 hover:border-orange-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                                >
                                    <BookOpen className="w-4 h-4" /> Docs
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* ── Loading ─────────────────────────────────────────── */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                            <div className="w-10 h-10 border-[3px] border-gray-100 border-t-orange-500 rounded-full animate-spin" />
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Loading dashboard…</p>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* ── Live gate ───────────────────────────────── */}
                            {dashboardMode === 'LIVE' && !isApproved && (
                                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isPending ? 'bg-amber-50' : 'bg-gray-50'}`}>
                                        {isPending ? <Clock className="w-7 h-7 text-amber-500" /> : <Lock className="w-7 h-7 text-gray-400" />}
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                                        {isPending ? 'KYC Under Review' : 'Unlock Live Payments'}
                                    </h2>
                                    <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-8">
                                        {isPending
                                            ? 'Our compliance team is reviewing your documents. This usually takes 24–48 hours.'
                                            : 'Complete business verification to accept real payments and settle funds.'}
                                    </p>
                                    {!isPending && (
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                            <button
                                                onClick={() => navigate('/merchant/onboarding')}
                                                className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-8 py-3 rounded-xl transition-all"
                                            >
                                                Start Verification
                                            </button>
                                            <button
                                                onClick={() => setDashboardMode('TEST')}
                                                className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-8 py-3 rounded-xl hover:bg-gray-50 transition-all"
                                            >
                                                Stay in Test Mode
                                            </button>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 gap-4 mt-10 max-w-sm mx-auto">
                                        {[['PACRA Details', ShieldCheck], ['Settlement Account', Wallet], ['Identity (NRC)', CreditCard]].map(([t, Icon]: any, i) => (
                                            <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                                                <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">{t}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Main content ─────────────────────────────── */}
                            {(dashboardMode === 'TEST' || isApproved) && (<>

                                {/* ── Hero row: Balance + Trust ──────────── */}
                                <div className="grid lg:grid-cols-3 gap-5">

                                    {/* Balance card */}
                                    <div className="lg:col-span-2 bg-[#111] rounded-2xl p-8 text-white relative overflow-hidden">
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
                                            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-400/5 rounded-full blur-3xl" />
                                        </div>

                                        <div className="relative z-10 flex flex-col h-full justify-between min-h-[180px]">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                                        dashboardMode === 'TEST'
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                        {dashboardMode === 'TEST' ? 'TEST BALANCE' : 'LIVE BALANCE'}
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xl font-medium text-gray-400">{balance?.currency}</span>
                                                    <span className="text-5xl font-bold tracking-tight tabular-nums">
                                                        {(Number(balance?.available || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mt-8">
                                                <button
                                                    onClick={() => setShowSettleModal(true)}
                                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                                                >
                                                    <ArrowDownLeft className="w-4 h-4" />
                                                    {dashboardMode === 'TEST' ? 'Settle to Test Wallet' : 'Settle to Wallet'}
                                                </button>
                                                {dashboardMode === 'LIVE' && (
                                                    <button
                                                        onClick={() => setShowWithdrawModal(true)}
                                                        className="flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/20 text-orange-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" /> Withdraw
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* FP badge */}
                                        <div className="absolute top-7 right-7 w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-xs font-bold text-white/30 tracking-tight">FP</div>
                                    </div>

                                    {/* Compliance / trust card */}
                                    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Business Trust</p>
                                            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                                                isApproved ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                                            }`}>
                                                {isApproved
                                                    ? <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                                                    : <ShieldAlert className="w-8 h-8 text-amber-500 shrink-0" />
                                                }
                                                <div>
                                                    <p className={`text-sm font-semibold ${isApproved ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                        {isApproved ? 'Verified & Active' : 'Action Required'}
                                                    </p>
                                                    <p className={`text-xs mt-0.5 ${isApproved ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {merchant?.compliance_status || 'PENDING'}
                                                    </p>
                                                </div>
                                            </div>
                                            {merchant?.admin_kyc_notes && (
                                                <div className="mt-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-500 italic leading-relaxed">
                                                    "{merchant.admin_kyc_notes}"
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => navigate('/merchant/compliance-requirements')}
                                            className="mt-5 w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
                                        >
                                            {isApproved ? 'View Requirements' : 'Review Requirements'}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* ── Quick actions ──────────────────────── */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</p>
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                        {quickActions.map(({ title, desc, Icon, path, accent, bg, border }) => (
                                            <button
                                                key={path}
                                                onClick={() => navigate(path)}
                                                className={`group p-5 bg-white border border-gray-100 ${border} rounded-2xl text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                                            >
                                                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110`}>
                                                    <Icon className={`w-4 h-4 ${accent}`} />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
                                                <p className="text-[11px] text-gray-400 leading-snug">{desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Stats grid ─────────────────────────── */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {stats.map((stat: any, idx: number) => (
                                        <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                                                    {stat.label.includes('Volume') ? <BarChart3 className="w-4 h-4 text-orange-500" />
                                                     : stat.label.includes('Balance') ? <Wallet className="w-4 h-4 text-blue-500" />
                                                     : stat.label.includes('Transaction') ? <Zap className="w-4 h-4 text-violet-500" />
                                                     : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                                                </div>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    stat.trend === 'up'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-orange-50 text-orange-600'
                                                }`}>{stat.change}</span>
                                            </div>
                                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                                            <p className="text-2xl font-bold text-gray-900 tabular-nums">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* ── Wallets + Live Transactions side by side ── */}
                                <div className="grid lg:grid-cols-2 gap-6 mb-6">

                                        {/* Wallets */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-5">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Personal Wallets</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {dashboardMode === 'TEST' ? 'Simulated test funds' : 'Live settlement balances'}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                                                    dashboardMode === 'TEST'
                                                        ? 'text-amber-600 bg-amber-50 border-amber-200'
                                                        : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                                }`}>{dashboardMode}</span>
                                            </div>

                                            {(() => {
                                                const walletTheme: Record<string, { bg: string; accent: string; country: string; label: string }> = {
                                                    ZMW: { bg: 'bg-emerald-500',  accent: 'bg-emerald-400', country: 'ZM', label: 'Zambian Kwacha' },
                                                    USD: { bg: 'bg-orange-500',   accent: 'bg-orange-400',  country: 'US', label: 'US Dollar' },
                                                    EUR: { bg: 'bg-blue-600',     accent: 'bg-blue-500',    country: 'EU', label: 'Euro' },
                                                    GBP: { bg: 'bg-purple-600',   accent: 'bg-purple-500',  country: 'GB', label: 'British Pound' },
                                                    KES: { bg: 'bg-rose-500',     accent: 'bg-rose-400',    country: 'KE', label: 'Kenyan Shilling' },
                                                    NGN: { bg: 'bg-indigo-600',   accent: 'bg-indigo-500',  country: 'NG', label: 'Nigerian Naira' },
                                                    GHS: { bg: 'bg-teal-500',     accent: 'bg-teal-400',    country: 'GH', label: 'Ghanaian Cedi' },
                                                    TZS: { bg: 'bg-cyan-600',     accent: 'bg-cyan-500',    country: 'TZ', label: 'Tanzanian Shilling' },
                                                    ZAR: { bg: 'bg-yellow-500',   accent: 'bg-yellow-400',  country: 'ZA', label: 'South African Rand' },
                                                };
                                                return wallets.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {wallets.map(w => {
                                                            const t = walletTheme[w.currency] ?? { bg: 'bg-gray-700', accent: 'bg-gray-600', country: 'UN', label: w.currency };
                                                            return (
                                                                <div key={w.id} className={`${t.bg} rounded-2xl p-5 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-default`}>
                                                                    {/* decorative circle */}
                                                                    <div className={`absolute -top-6 -right-6 w-24 h-24 ${t.accent} rounded-full opacity-30`} />
                                                                    <div className={`absolute -bottom-8 -right-2 w-32 h-32 ${t.accent} rounded-full opacity-20`} />

                                                                    <div className="relative z-10">
                                                                        {/* Top row: flag + active badge */}
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
                                                                                <ReactCountryFlag
                                                                                    countryCode={t.country}
                                                                                    svg
                                                                                    style={{ width: '1.6rem', height: '1.6rem', borderRadius: '4px', objectFit: 'cover' }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-[9px] font-bold text-white/80 bg-white/15 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                                                {dashboardMode === 'TEST' ? 'TEST' : 'LIVE'}
                                                                            </span>
                                                                        </div>

                                                                        {/* Currency + label */}
                                                                        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-0.5">{t.label}</p>
                                                                        <p className="text-white font-black text-lg tracking-tight">{w.currency}</p>

                                                                        {/* Balance */}
                                                                        <div className="mt-3 pt-3 border-t border-white/15">
                                                                            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">Balance</p>
                                                                            <p className="text-white font-black text-2xl tabular-nums leading-none">
                                                                                {Number(w.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="border border-dashed border-gray-200 rounded-xl py-10 text-center">
                                                        <Wallet className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                                                        <p className="text-xs font-medium text-gray-400">No wallets found</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                    {/* ── Activity feed ─────────────────── */}
                                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-full">
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                            <p className="text-sm font-semibold text-gray-900">Live Transactions</p>
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        </div>

                                        {/* Mini sparkline */}
                                        <div className="px-5 pt-4 pb-3 border-b border-gray-50">
                                            <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                                <span>Activity Trend</span>
                                                <span className="text-emerald-500">+12.5%</span>
                                            </div>
                                            <div className="flex items-end gap-1 h-10">
                                                {[30, 45, 25, 60, 40, 75, 50, 65, 45, 80].map((h, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 bg-orange-100 hover:bg-orange-400 rounded-t transition-colors cursor-default"
                                                        style={{ height: `${h}%` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto max-h-[420px]">
                                            {recentActivity.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                                                    <Activity className="w-8 h-8 text-gray-300 mb-2" />
                                                    <p className="text-xs font-medium text-gray-400">No transactions yet</p>
                                                </div>
                                            ) : recentActivity.map((activity: any, idx: number) => {
                                                const isDeduction = activity.method === 'wallet_transfer';
                                                const isSuccess   = activity.status === 'succeeded';
                                                const isSplit     = activity.isSplit;
                                                const fmt = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                // amounts from backend are in ngwe — divide by 100 for display
                                                const gross          = parseFloat(activity.grossAmount  || 0) / 100;
                                                const merchantEarned = parseFloat(activity.merchantNet  || 0) / 100;
                                                const subEarned      = parseFloat(activity.submerchantNet || 0) / 100;
                                                const label = activity.description
                                                    || (isSplit ? 'Marketplace Sale' : (activity.method || 'Payment').replace(/_/g, ' '));

                                                return (
                                                    <div key={activity.id || idx} className="rounded-xl bg-gray-50/60 p-3 space-y-1.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                                    isSuccess
                                                                        ? isDeduction ? 'bg-red-100' : 'bg-emerald-100'
                                                                        : 'bg-amber-100'
                                                                }`}>
                                                                    {isDeduction
                                                                        ? <ArrowUpRight  className={`w-3.5 h-3.5 ${isSuccess ? 'text-red-500' : 'text-amber-500'}`} />
                                                                        : <ArrowDownLeft className={`w-3.5 h-3.5 ${isSuccess ? 'text-emerald-600' : 'text-amber-500'}`} />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold text-gray-800 truncate max-w-[140px] capitalize">{label}</p>
                                                                    <p className="text-[10px] text-gray-400 uppercase tracking-tight">
                                                                        {new Date(activity.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                {/* Top line: gross paid by customer */}
                                                                <p className="text-[10px] text-gray-400 font-medium">Customer paid</p>
                                                                <p className="text-xs font-bold text-gray-900 tabular-nums">
                                                                    {activity.currency} {fmt(gross)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Earning breakdown row */}
                                                        {isSplit ? (
                                                            <div className="flex gap-2 pt-1 border-t border-gray-100">
                                                                <div className="flex-1 bg-orange-50 rounded-lg px-2 py-1 text-center">
                                                                    <p className="text-[9px] text-orange-400 font-semibold uppercase tracking-wide">Your commission</p>
                                                                    <p className="text-[11px] font-black text-orange-600 tabular-nums">+{activity.currency} {fmt(merchantEarned)}</p>
                                                                </div>
                                                                <div className="flex-1 bg-blue-50 rounded-lg px-2 py-1 text-center">
                                                                    <p className="text-[9px] text-blue-400 font-semibold uppercase tracking-wide">Seller received</p>
                                                                    <p className="text-[11px] font-black text-blue-600 tabular-nums">{activity.currency} {fmt(subEarned)}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                                                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Your earnings</p>
                                                                <p className={`text-[11px] font-black tabular-nums ${isSuccess ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                                    +{activity.currency} {fmt(merchantEarned)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="px-5 py-3 border-t border-gray-50">
                                            <button
                                                onClick={() => navigate('/merchant/analytics')}
                                                className="w-full text-xs font-semibold text-gray-400 hover:text-gray-900 flex items-center justify-center gap-1.5 transition-colors py-1"
                                            >
                                                Advanced Analytics <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Below row: Test Ledger + API Keys ── */}
                                <div className="space-y-6">

                                        {/* Test ledger */}
                                        {dashboardMode === 'TEST' && (
                                            <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
                                                <div className="flex items-center justify-between mb-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                                                            <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">Test Ledger</p>
                                                            <p className="text-[10px] text-amber-500 font-medium">Simulated — not withdrawable</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-400 font-medium">Total Credited</p>
                                                        <p className="text-sm font-bold text-amber-600 tabular-nums">
                                                            ZMW {Number(testLedgerTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {testLedgerLoading ? (
                                                    <div className="flex justify-center py-8">
                                                        <div className="w-5 h-5 border-2 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
                                                    </div>
                                                ) : testLedger.length === 0 ? (
                                                    <div className="py-8 text-center">
                                                        <p className="text-xs font-medium text-gray-400">No test transactions yet</p>
                                                        <p className="text-[11px] text-gray-300 mt-1">Settle test funds to see entries here</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-gray-50">
                                                        {testLedger.map((entry: any) => {
                                                            const isCredit = !!entry.credit_wallet_id;
                                                            const typeLabels: Record<string, string> = {
                                                                SETTLEMENT: 'Test Settlement', DEPOSIT: 'Test Deposit',
                                                                TRANSFER: 'Test Transfer',     WITHDRAWAL: 'Test Withdrawal',
                                                            };
                                                            return (
                                                                <div key={entry.id} className="flex items-center justify-between py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCredit ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                                                            {isCredit
                                                                                ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                                                                                : <ArrowUpRight  className="w-3.5 h-3.5 text-red-400" />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-800">{typeLabels[entry.transaction_type] || entry.transaction_type}</p>
                                                                            <p className="text-[10px] text-gray-400">{new Date(entry.created_at).toLocaleString()}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className={`text-sm font-semibold tabular-nums ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                            {isCredit ? '+' : '−'}{entry.currency || 'ZMW'} {Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </p>
                                                                        <span className="text-[9px] font-semibold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">TEST</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* API Keys */}
                                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                                                        <span className="text-[9px] font-bold text-white tracking-tight">API</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900">Authentication Keys</p>
                                                </div>
                                                <button
                                                    onClick={rollKey}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <RotateCcw className="w-3 h-3" /> Rotate
                                                </button>
                                            </div>
                                            <div className="p-6 space-y-5">
                                                {[
                                                    { label: 'Publishable Key', value: currentKeys?.public,  id: 'pk', secret: false },
                                                    { label: 'Secret Key',      value: currentKeys?.secret, id: 'sk', secret: true  },
                                                ].map(k => (
                                                    <div key={k.id}>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <label className={labelCls}>{k.label}</label>
                                                            <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide">Verified</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono text-[11px] text-gray-500 overflow-hidden relative">
                                                                {k.secret && !showSecret
                                                                    ? <span className="blur-[4px] select-none">{k.value || 'sk_not_provisioned'}</span>
                                                                    : <span className="truncate block">{k.value || 'Not provisioned'}</span>}
                                                            </div>
                                                            <div className="flex gap-1.5 shrink-0">
                                                                {k.secret && (
                                                                    <button
                                                                        onClick={() => setShowSecret(!showSecret)}
                                                                        className="w-9 h-9 bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                                                                    >
                                                                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => copyKey(k.value || '', k.id)}
                                                                    className="w-9 h-9 bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors"
                                                                >
                                                                    {copiedKey === k.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                </div>
                            </>)}
                        </div>
                    )}
                </div>
            </main>

            {/* ── Modals ─────────────────────────────────────────────────────── */}
            {/* Shared modal backdrop */}
            {(showKYCModal || showWithdrawModal || showSettleModal) && (
                <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={() => { setShowKYCModal(false); setShowWithdrawModal(false); setShowSettleModal(false); }} />
            )}

            {/* KYC Modal */}
            {showKYCModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl pointer-events-auto overflow-hidden">
                        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Business Verification</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Complete KYC to unlock Live Mode</p>
                            </div>
                            <button onClick={() => setShowKYCModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleKYCSubmit} className="p-8 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Legal Business Name</label>
                                    <input type="text" required className={inputCls} placeholder="e.g. FlapaPay Zambia Ltd" value={kycForm.legalName} onChange={e => setKycForm({ ...kycForm, legalName: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>PACRA Number</label>
                                    <input type="text" required className={inputCls} placeholder="100…" value={kycForm.pacraNumber} onChange={e => setKycForm({ ...kycForm, pacraNumber: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>TPIN</label>
                                    <input type="text" required className={inputCls} placeholder="1234567890" value={kycForm.tpin} onChange={e => setKycForm({ ...kycForm, tpin: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>Managing Director</label>
                                    <input type="text" required className={inputCls} placeholder="Full Legal Name" value={kycForm.directorName} onChange={e => setKycForm({ ...kycForm, directorName: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>Director NRC</label>
                                    <input type="text" required className={inputCls} placeholder="123456/78/1" value={kycForm.directorNRC} onChange={e => setKycForm({ ...kycForm, directorNRC: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Registered Address</label>
                                    <textarea required rows={3} className={inputCls + ' resize-none'} placeholder="Street Address, City, Zambia" value={kycForm.registeredAddress} onChange={e => setKycForm({ ...kycForm, registeredAddress: e.target.value })} />
                                </div>
                            </div>

                            <div className="mt-5 p-4 bg-gray-900 rounded-xl text-sm text-gray-400 leading-relaxed">
                                <span className="text-orange-400 font-semibold">Notice: </span>
                                By submitting, you confirm the accuracy of all information and agree to our{' '}
                                <span className="text-white underline cursor-pointer">Merchant Services Agreement</span>.
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowKYCModal(false)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 text-sm transition-colors">Cancel</button>
                                <button type="submit" className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm shadow-sm transition-all">Submit for Review</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Withdraw Funds</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Transfer to bank or mobile money</p>
                            </div>
                            <button onClick={() => setShowWithdrawModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleWithdraw} className="p-6 space-y-5">
                            <div>
                                <label className={labelCls}>Source Wallet <span className="text-emerald-500 normal-case font-medium">(Live Only)</span></label>
                                {liveWallets.length === 0 && <p className="text-xs text-gray-400 italic mb-2">No live wallets found.</p>}
                                <div className="space-y-2">
                                    {liveWallets.map(w => (
                                        <button key={w.id} type="button" onClick={() => setWithdrawForm({ ...withdrawForm, walletId: w.id })}
                                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${withdrawForm.walletId === w.id ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{w.currency === 'ZMW' ? '🇿🇲' : '🇺🇸'}</span>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{w.currency} Live Wallet</p>
                                                    <p className="text-[10px] text-gray-400">Bal: {Number(w.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>
                                            {withdrawForm.walletId === w.id && <Check className="w-4 h-4 text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Amount</label>
                                <div className="relative">
                                    <input type="number" required className={inputCls + ' text-2xl font-bold pr-16 py-4'} placeholder="0.00" value={withdrawForm.amount} onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-300 uppercase">{liveWallets.find(w => w.id === withdrawForm.walletId)?.currency || 'ZMW'}</span>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Channel</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[{ id: 'MOBILE_MONEY', Icon: Smartphone, label: 'Mobile Money' }, { id: 'BANK', Icon: Building2, label: 'Bank Transfer' }].map(ch => (
                                        <button key={ch.id} type="button" onClick={() => setWithdrawForm({ ...withdrawForm, destinationType: ch.id })}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-semibold transition-all ${withdrawForm.destinationType === ch.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                                            <ch.Icon className="w-5 h-5" />
                                            {ch.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>{withdrawForm.destinationType === 'MOBILE_MONEY' ? 'Recipient Mobile' : 'Bank Account'}</label>
                                <input type="text" required className={inputCls} placeholder={withdrawForm.destinationType === 'MOBILE_MONEY' ? '097…' : 'Account number'} value={withdrawForm.accountNumber} onChange={e => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })} />
                            </div>

                            <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl text-sm transition-all mt-2">
                                Send Funds
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Settle Modal */}
            {showSettleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto">
                        <div className={`flex items-center justify-between px-6 py-5 border-b border-gray-100 rounded-t-2xl ${dashboardMode === 'TEST' ? 'bg-amber-50/30' : 'bg-emerald-50/30'}`}>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Settle Funds</h2>
                                <p className={`text-xs mt-0.5 font-medium ${dashboardMode === 'TEST' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {dashboardMode === 'TEST' ? 'Test Platform → Test Wallet' : 'Live Platform → Live Wallet'}
                                </p>
                            </div>
                            <button onClick={() => setShowSettleModal(false)} className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 transition-colors border border-gray-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSettleToWallet} className="p-6 space-y-5">
                            {/* Balance display */}
                            <div className="bg-gray-900 rounded-xl p-5 text-white">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Available Balance</p>
                                <p className="text-3xl font-bold tabular-nums">
                                    {balance?.currency} {(Number(balance?.available || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Wallet select */}
                            <div className="relative">
                                <label className={labelCls}>Destination Wallet</label>
                                <button type="button" onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                                    className="w-full flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors">
                                    {settleForm.targetWalletId ? (
                                        (() => {
                                            const sel = wallets.find(w => w.id === settleForm.targetWalletId);
                                            return <span>{sel?.currency} Wallet — bal. {Number(sel?.balance).toLocaleString()}</span>;
                                        })()
                                    ) : <span className="text-gray-400">Select a wallet…</span>}
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showWalletDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showWalletDropdown && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                                        {wallets.map(w => (
                                            <button key={w.id} type="button"
                                                onClick={() => { setSettleForm({ ...settleForm, targetWalletId: w.id }); setShowWalletDropdown(false); }}
                                                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                                                <span className="font-medium text-gray-900">{w.currency} Wallet</span>
                                                {settleForm.targetWalletId === w.id && <Check className="w-4 h-4 text-emerald-500" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Amount */}
                            <div>
                                <label className={labelCls}>Amount to Move</label>
                                <div className="relative">
                                    <input type="number" required className={inputCls + ' text-2xl font-bold pr-16 py-4'} placeholder="0.00" value={settleForm.amount} onChange={e => setSettleForm({ ...settleForm, amount: e.target.value })} />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-300 uppercase">{balance?.currency || 'ZMW'}</span>
                                </div>
                                {settleForm.amount && !isNaN(Number(settleForm.amount)) && (
                                    <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> No fees — instant transfer
                                    </p>
                                )}
                            </div>

                            {/* FX notice */}
                            {settleForm.targetWalletId && wallets.find(w => w.id === settleForm.targetWalletId)?.currency !== balance?.currency && (
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm">
                                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">FX Conversion</p>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xl font-bold text-orange-800 tabular-nums">{(parseFloat(settleForm.amount || '0') / settleForm.fxRate).toFixed(2)} USD</span>
                                        <span className="text-xs text-orange-500">1 USD = {settleForm.fxRate} ZMW</span>
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={!settleForm.targetWalletId || !settleForm.amount || parseFloat(settleForm.amount) <= 0}
                                className={`w-full font-semibold py-3.5 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    dashboardMode === 'TEST'
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}>
                                Confirm Settlement
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
