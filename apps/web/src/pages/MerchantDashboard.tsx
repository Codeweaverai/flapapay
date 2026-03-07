import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';



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
        legalName: '',
        pacraNumber: '',
        tpin: '',
        directorName: '',
        directorNRC: '',
        registeredAddress: ''
    });
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [settleForm, setSettleForm] = useState({ amount: '', targetWalletId: '', fxRate: 27.5 }); // Mock fixed rate ZMW->USD for demo
    const [showSecret, setShowSecret] = useState(false);
    const [loading, setLoading] = useState(true);
    const [wallets, setWallets] = useState<any[]>([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({ walletId: '', amount: '', destinationType: 'MOBILE_MONEY', accountNumber: '' });
    const [showWalletDropdown, setShowWalletDropdown] = useState(false);

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
                    // If balance isn't in statusRes, we might need to fetch it separately or ensure status gives it
                });
            }

            // If statusRes doesn't have balance, we might need /wallets or another call
            // But let's assume we want to use the merchant object we just formatted.

            setApiKeys(keysRes.data);
            setStats(statsRes.data.stats);
            setRecentActivity(statsRes.data.recentActivity);

            const walletRes = await api.get('/wallets');
            setWallets(walletRes.data);

            // Available Balance should always come from rawBalance (platform balance)
            setBalance({
                currency: 'ZMW',
                available: statsRes.data.rawBalance
            });
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
        } catch (err) {
            alert('Failed to roll keys');
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [dashboardMode]);

    const handleKYCSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/merchants/compliance', {
                legalName: kycForm.legalName,
                pacraNumber: kycForm.pacraNumber,
                tpin: kycForm.tpin,
                directorName: kycForm.directorName,
                directorNRC: kycForm.directorNRC,
                registeredAddress: kycForm.registeredAddress,
                documents: [] // Mocked for now
            });
            alert('KYC documents submitted successfully!');
            setShowKYCModal(false);
            fetchDashboardData();
        } catch (err) {
            alert('Failed to submit KYC');
        }
    };

    const handleSettleToWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (dashboardMode === 'TEST') {
                await new Promise(resolve => setTimeout(resolve, 800));

                // Simulate frontend deduction with 1% fee
                const baseAmount = parseFloat(settleForm.amount);
                const fee = parseFloat((baseAmount * 0.01).toFixed(2));
                const totalDeduction = baseAmount + fee;

                setBalance((prev: any) => ({ ...prev, available: Math.max(0, prev.available - totalDeduction) }));

                // Add fake records to recent activity (settlement + fee)
                setRecentActivity((prev: any[]) => [
                    {
                        id: `sim_fee_${Date.now()}`,
                        amount: fee.toFixed(2),
                        currency: balance?.currency || 'ZMW',
                        status: 'succeeded',
                        method: 'platform_fee',
                        created_at: new Date().toISOString(),
                        type: 'deduction'
                    },
                    {
                        id: `sim_settle_${Date.now()}`,
                        amount: baseAmount.toFixed(2),
                        currency: balance?.currency || 'ZMW',
                        status: 'succeeded',
                        method: 'wallet_transfer',
                        created_at: new Date().toISOString(),
                        type: 'deduction'
                    },
                    ...prev
                ].slice(0, 5)); // Keep only 5

                setShowSettleModal(false);
                alert(`Test transaction complete! Deducted ${baseAmount} ZMW + ${fee} ZMW fee.`);
                return;
            }

            const selectedWallet = wallets.find(w => w.id === settleForm.targetWalletId);
            const isFX = selectedWallet?.currency !== balance?.currency;

            await api.post('/merchants/transfer-to-wallet', {
                amount: parseFloat(settleForm.amount),
                walletId: settleForm.targetWalletId,
                applyFX: isFX,
                fxRate: isFX ? settleForm.fxRate : 1
            });

            setShowSettleModal(false);
            fetchDashboardData();
            alert('Funds moved to wallet successfully!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Transfer failed');
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/wallets/withdraw', {
                walletId: withdrawForm.walletId,
                amount: parseFloat(withdrawForm.amount),
                destinationType: withdrawForm.destinationType,
                destinationDetails: {
                    account: withdrawForm.accountNumber
                }
            });
            setShowWithdrawModal(false);
            fetchDashboardData();
            alert('Withdrawal initiated! Funds will arrive shortly.');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Withdrawal failed');
        }
    };

    const isApproved = merchant?.compliance_status === 'ACTIVE' || merchant?.is_live_enabled;
    const isPending = merchant?.compliance_status === 'PENDING';
    const currentKeys = dashboardMode === 'TEST' ? apiKeys?.test : apiKeys?.live;

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex font-sans selection:bg-orange-100 selection:text-orange-900">
            {/* Sidebar with enhanced styling */}
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-x-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/20 via-amber-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 py-8 relative">
                    {/* Header Section */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black tracking-tight text-gray-900">
                                    {merchant?.business_name || 'Merchant Dashboard'}
                                </h1>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${dashboardMode === 'TEST' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dashboardMode === 'TEST' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                                    {dashboardMode} MODE
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                                <span>Platform ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900 font-bold">{merchant?.account_id || '---'}</code></span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Mode Toggle Switch */}
                            <div className="bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl flex gap-1 border border-gray-200/50">
                                <button
                                    onClick={() => setDashboardMode('TEST')}
                                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${dashboardMode === 'TEST' ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Test
                                </button>
                                <button
                                    onClick={() => setDashboardMode('LIVE')}
                                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${dashboardMode === 'LIVE' ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Live
                                </button>
                            </div>

                            <Button
                                onClick={() => navigate('/pay-links')}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl px-8 py-3 shadow-lg shadow-orange-500/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                            >
                                <span className="mr-2">⚡</span> Quick Pay
                            </Button>
                        </div>
                    </header>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                            <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing your business data...</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Live Mode Gate Overlay (Conditional) */}
                            {dashboardMode === 'LIVE' && !isApproved && (
                                <div className="bg-white/40 backdrop-blur-md rounded-[40px] border border-orange-100 shadow-xl overflow-hidden relative group">
                                    <div className="p-12 text-center space-y-8 relative z-10">
                                        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 transition-transform duration-500">
                                            <span className="text-4xl">{isPending ? '⏳' : '🔒'}</span>
                                        </div>
                                        <div className="max-w-2xl mx-auto space-y-4">
                                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                                                {isPending ? 'KYC Under Review' : 'Authorize Live Mode'}
                                            </h2>
                                            <p className="text-lg text-gray-500 font-medium leading-relaxed">
                                                {isPending
                                                    ? "Our compliance team is currently reviewing your documents. This usually takes 24-48 hours. We'll notify you as soon as your account is approved."
                                                    : "To start accepting real payments and settling funds to your wallets, you need to complete our Zambian business verification process (KYC)."}
                                            </p>
                                        </div>

                                        {!isPending && (
                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                                <Button
                                                    onClick={() => navigate('/merchant/onboarding')}
                                                    className="w-full sm:w-auto bg-black hover:bg-gray-900 text-white text-base font-black px-10 py-4 rounded-[20px] shadow-2xl transition-all hover:scale-105"
                                                >
                                                    ✨ Start Verification
                                                </Button>
                                                <Button
                                                    onClick={() => setDashboardMode('TEST')}
                                                    className="w-full sm:w-auto bg-white border border-gray-200 text-gray-600 text-base font-black px-10 py-4 rounded-[20px] hover:bg-gray-50 transition-all"
                                                >
                                                    Stay in Test Mode
                                                </Button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 max-w-3xl mx-auto">
                                            {[
                                                { emoji: '📋', text: 'PACRA Details' },
                                                { emoji: '🏦', text: 'Settlement Account' },
                                                { emoji: '👤', text: 'Identity (NRC)' }
                                            ].map((benefit, i) => (
                                                <div key={i} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                    <span className="text-xl mb-1 block">{benefit.emoji}</span>
                                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{benefit.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Abstract background for gate */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-emerald-50/20 opacity-50"></div>
                                </div>
                            )}

                            {/* Dashboard Stats & Actions (Visible in Test mode or Approved Live mode) */}
                            {(dashboardMode === 'TEST' || isApproved) && (
                                <>
                                    {/* Main Hero Card: Balance & Actions */}
                                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                                        <div className="lg:col-span-2 bg-gradient-to-br from-[#1A1A1A] to-[#333333] rounded-[40px] p-10 text-white relative shadow-2xl shadow-gray-200 overflow-hidden group">
                                            {/* Design elements */}
                                            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500 rounded-full -mr-32 -mt-32 blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full -ml-32 -mb-32 blur-[80px] opacity-10"></div>

                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                            {dashboardMode === 'TEST' ? 'Test Available Balance' : 'Available Balance'}
                                                        </span>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${dashboardMode === 'TEST' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                            {dashboardMode === 'TEST' ? 'TEST BALANCE' : 'LIVE BALANCE'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-baseline gap-3">
                                                        <span className="text-3xl font-black text-gray-400">{balance?.currency}</span>
                                                        <h2 className="text-6xl font-black tracking-tighter tabular-nums">
                                                            {Number(balance?.available || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </h2>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 mt-12">
                                                    {dashboardMode === 'LIVE' ? (
                                                        <Button
                                                            onClick={() => setShowSettleModal(true)}
                                                            className="bg-white text-black hover:bg-gray-100 font-black px-10 py-4 rounded-2xl text-sm flex items-center gap-2 transform hover:translate-y-[-2px] transition-all"
                                                        >
                                                            <span>💰</span> Settle to Wallet
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => setShowSettleModal(true)}
                                                            className="bg-white text-black hover:bg-gray-100 font-black px-10 py-4 rounded-2xl text-sm flex items-center gap-2 transform hover:translate-y-[-2px] transition-all"
                                                        >
                                                            <span>🧪</span> Settle to Test Wallet
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Account branding - Corner */}
                                            <div className="absolute top-10 right-10">
                                                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center font-black text-white/50">
                                                    FP
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions / KYC Status Card */}
                                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/50 p-8 flex flex-col justify-between overflow-hidden relative">
                                            <div className="space-y-6 relative z-10">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Business Trust</h3>
                                                <div className="space-y-4">
                                                    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                    {isApproved ? '✓' : '⚠️'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-gray-900 uppercase">Compliance Status</p>
                                                                    <p className="text-[10px] text-gray-500 font-bold">{isApproved ? 'Approved by Admin' : 'Action Required'}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {merchant?.compliance_status}
                                                            </span>
                                                        </div>
                                                        {merchant?.admin_kyc_notes && (
                                                            <div className="mt-2 text-[10px] bg-white p-3 rounded-xl border border-gray-100 text-gray-600 italic">
                                                                <span className="font-black text-gray-400 block mb-1 uppercase tracking-tighter">Admin Feedback:</span>
                                                                "{merchant.admin_kyc_notes}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-6 relative z-10">
                                                <button
                                                    onClick={() => isApproved ? navigate('/merchant/compliance-requirements') : navigate('/merchant/compliance-requirements')}
                                                    className="w-full py-4 text-xs font-black text-orange-600 uppercase tracking-widest bg-orange-50 rounded-2xl hover:bg-orange-100 transition-colors"
                                                >
                                                    {isApproved ? 'View Requirements' : 'Review Requirements'}
                                                </button>
                                            </div>
                                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-orange-100/30 rounded-full -mr-16 -mb-16 blur-2xl"></div>
                                        </div>
                                    </section>

                                    {/* Stats Grid */}
                                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {stats.map((stat: any, idx: number) => (
                                            <div key={idx} className="bg-white p-8 rounded-[32px] border border-gray-100/50 shadow-lg shadow-gray-50/20 hover:shadow-xl transition-all duration-300 group hover:translate-y-[-4px]">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                                                        <span className="text-lg">
                                                            {stat.label.includes('Volume') ? '📊' : stat.label.includes('Balance') ? '💰' : stat.label.includes('Transactions') ? '⚡' : '✨'}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {stat.change}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                                <h3 className="text-3xl font-black text-gray-900 group-hover:text-orange-600 transition-colors tabular-nums">
                                                    {stat.value}
                                                </h3>
                                            </div>
                                        ))}
                                    </section>

                                    {/* Main Content Sections: API Keys & Activity */}
                                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                        <div className="lg:col-span-2 space-y-10">
                                            {/* Wallets Card */}
                                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-10 space-y-8 relative overflow-hidden">
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="space-y-1">
                                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Personal Wallets</h3>
                                                        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Secured personal balances</p>
                                                    </div>
                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">PLATFORM CONNECTED</span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                                    {wallets.length > 0 ? wallets.map(w => (
                                                        <div key={w.id} className="p-6 bg-gray-50 hover:bg-white rounded-3xl border border-transparent hover:border-gray-100 transition-all group cursor-pointer hover:shadow-lg hover:shadow-gray-200/50">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                                    {w.currency === 'ZMW' ? '🇿🇲' : w.currency === 'USD' ? '🇺🇸' : '🌍'}
                                                                </div>
                                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"></div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-2xl font-black text-gray-900">{w.currency} {Number(w.balance).toLocaleString()}</p>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Platform Settlement Wallet</p>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="col-span-2 border-2 border-dashed border-gray-100 rounded-[32px] py-12 text-center space-y-3">
                                                            <div className="text-3xl">🏜️</div>
                                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">No currency wallets found</p>
                                                            <button className="text-[10px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-widest">Initialize Global Account</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                            </div>

                                            {/* API Keys Configuration */}
                                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden group">
                                                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white font-black text-xs">API</div>
                                                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Authentication Keys</h2>
                                                    </div>
                                                    <button
                                                        onClick={rollKey}
                                                        className="text-[10px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-[0.2em] px-4 py-2 bg-orange-50 rounded-xl transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        Rotate Credentials ↻
                                                    </button>
                                                </div>
                                                <div className="p-10 space-y-10">
                                                    {[
                                                        { label: 'Public Key', value: currentKeys?.public, id: 'pk' },
                                                        { label: 'Secret Key', value: currentKeys?.secret, id: 'sk', secret: true }
                                                    ].map((keyItem) => (
                                                        <div key={keyItem.id} className="space-y-3">
                                                            <div className="flex items-center justify-between px-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{keyItem.label}</label>
                                                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Verified</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 bg-gray-50 p-5 rounded-2xl font-mono text-sm border border-gray-100 truncate text-gray-600 relative overflow-hidden group/key scrollbar-hide">
                                                                    {keyItem.secret && !showSecret ? '••••••••••••••••••••••••••••••••••••••••••••••••' : keyItem.value || 'Key not provisioned'}
                                                                    {keyItem.secret && !showSecret && <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[1px] flex items-center justify-center"></div>}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {keyItem.secret && (
                                                                        <button
                                                                            onClick={() => setShowSecret(!showSecret)}
                                                                            className="w-12 h-12 bg-white border border-gray-100 shadow-sm hover:shadow-md rounded-2xl flex items-center justify-center transition-all hover:scale-105"
                                                                        >
                                                                            {showSecret ? '👁️' : '🔒'}
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => {
                                                                            if (keyItem.value) {
                                                                                navigator.clipboard.writeText(keyItem.value);
                                                                                alert(`${keyItem.label} copied to clipboard!`);
                                                                            }
                                                                        }}
                                                                        className="w-12 h-12 bg-white border border-gray-100 shadow-sm hover:shadow-md rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                                                    >
                                                                        📋
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activity Log - Right Sidebar */}
                                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden flex flex-col h-fit sticky top-8">
                                            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Insights</h3>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            </div>

                                            <div className="p-6 space-y-8">
                                                {/* Micro Chart / Summary */}
                                                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity Trend</span>
                                                        <span className="text-[10px] font-black text-emerald-600">+12.5%</span>
                                                    </div>
                                                    <div className="flex items-end gap-1.5 h-12">
                                                        {[30, 45, 25, 60, 40, 75, 50, 65, 45, 80].map((h, i) => (
                                                            <div key={i} className="flex-1 bg-orange-500/20 rounded-t-sm group relative" style={{ height: `${h}%` }}>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[8px] px-1 rounded">
                                                                    {h}
                                                                </div>
                                                                <div className="absolute inset-0 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-sm"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Live Transactions</h4>
                                                    <div className="space-y-4">
                                                        {recentActivity.length === 0 ? (
                                                            <div className="text-center py-10 space-y-3 opacity-40">
                                                                <span className="text-3xl grayscale">📂</span>
                                                                <p className="text-[10px] font-black uppercase tracking-widest">No Recent Logs</p>
                                                            </div>
                                                        ) : (
                                                            recentActivity.map((activity: any, idx: number) => {
                                                                // If method is wallet_transfer or type is deduction, treat as negative
                                                                const isDeduction = activity.type === 'deduction' || activity.method === 'wallet_transfer';
                                                                const isSuccess = activity.status === 'succeeded';

                                                                return (
                                                                    <div key={idx} className="flex items-center justify-between group cursor-pointer">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 ${isSuccess ? (isDeduction ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100') : 'bg-orange-50 text-orange-400'}`}>
                                                                                {isDeduction ? '💸' : (activity.method === 'card' ? '💳' : '📱')}
                                                                            </div>
                                                                            <div>
                                                                                <p className={`text-sm font-black group-hover:underline ${isDeduction ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                                    {isDeduction ? '-' : '+'}{activity.currency} {activity.amount}
                                                                                </p>
                                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                                    {new Date(activity.created_at || activity.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activity.method.replace('_', ' ')}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className={`w-2 h-2 rounded-full ${isSuccess ? (isDeduction ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]') : 'bg-gray-300'}`}></div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 border-t border-gray-50 flex items-center justify-center">
                                                <button
                                                    onClick={() => navigate('/merchant/analytics')}
                                                    className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-[0.3em] transition-all"
                                                >
                                                    Advanced Analytics →
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* KYC Submission Modal - Redesigned */}
            {showKYCModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in slide-in-from-bottom-4 duration-500">
                        <div className="p-10 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-br from-orange-50/50 to-transparent">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center sm:text-left">Business Verification</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Complete KYC to unlock Live Mode</p>
                            </div>
                            <button onClick={() => setShowKYCModal(false)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-black transition-all hover:rotate-90">✕</button>
                        </div>

                        <form onSubmit={handleKYCSubmit} className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Legal Business Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-gray-300"
                                        placeholder="e.g. FlapaPay Zambia Ltd"
                                        value={kycForm.legalName}
                                        onChange={e => setKycForm({ ...kycForm, legalName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">PACRA Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                        placeholder="100..."
                                        value={kycForm.pacraNumber}
                                        onChange={e => setKycForm({ ...kycForm, pacraNumber: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">TPIN</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                        placeholder="1234567890"
                                        value={kycForm.tpin}
                                        onChange={e => setKycForm({ ...kycForm, tpin: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Managing Director</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none"
                                        placeholder="Full Legal Name"
                                        value={kycForm.directorName}
                                        onChange={e => setKycForm({ ...kycForm, directorName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Director NRC</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none"
                                        placeholder="123456/78/1"
                                        value={kycForm.directorNRC}
                                        onChange={e => setKycForm({ ...kycForm, directorNRC: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Business Address</label>
                                    <textarea
                                        required
                                        rows={3}
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none min-h-[100px]"
                                        placeholder="Registered Street Address, City, Zambia"
                                        value={kycForm.registeredAddress}
                                        onChange={e => setKycForm({ ...kycForm, registeredAddress: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-black rounded-3xl text-white relative overflow-hidden group">
                                <div className="relative z-10 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-orange-500">🛡️</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Compliance Notice</p>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        By submitting these details, you agree to our <span className="text-white hover:underline cursor-pointer">Merchant Services Agreement</span> and confirm the accuracy of all information.
                                    </p>
                                </div>
                                <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => setShowKYCModal(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black rounded-2xl py-5 transition-all"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl py-5 shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02]"
                                >
                                    Submit for Review ✨
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Withdrawal Modal - Redesigned */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in slide-in-from-bottom-4 duration-500">
                        <div className="p-10 border-b border-gray-100/50 flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Withdraw Funds</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Transfer from wallet to bank/mobile</p>
                            </div>
                            <button onClick={() => setShowWithdrawModal(false)} className="w-10 h-10 rounded-full bg-gray-50 shadow-sm flex items-center justify-center text-gray-400 hover:text-black transition-all">✕</button>
                        </div>

                        <form onSubmit={handleWithdraw} className="p-10 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Funding Wallet</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {wallets.map(w => (
                                            <button
                                                key={w.id}
                                                type="button"
                                                onClick={() => setWithdrawForm({ ...withdrawForm, walletId: w.id })}
                                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${withdrawForm.walletId === w.id ? 'border-orange-500 bg-orange-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl">{w.currency === 'ZMW' ? '🇿🇲' : '🇺🇸'}</span>
                                                    <div className="text-left leading-tight">
                                                        <p className="text-sm font-black text-gray-900">{w.currency} Wallet</p>
                                                        <p className="text-[10px] font-bold text-gray-400">Bal: {w.currency} {Number(w.balance).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                {withdrawForm.walletId === w.id && <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-black">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Transfer Amount</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-5 text-2xl font-black text-gray-900 outline-none tabular-nums"
                                            placeholder="0.00"
                                            value={withdrawForm.amount}
                                            onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-gray-300 group-focus-within:text-orange-500 transition-colors uppercase tracking-widest">
                                            {wallets.find(w => w.id === withdrawForm.walletId)?.currency || 'ZMW'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Destination Channel</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'MOBILE_MONEY', emoji: '📱', label: 'Mobile' },
                                            { id: 'BANK', emoji: '🏛️', label: 'Bank' }
                                        ].map(channel => (
                                            <button
                                                key={channel.id}
                                                type="button"
                                                onClick={() => setWithdrawForm({ ...withdrawForm, destinationType: channel.id })}
                                                className={`p-6 rounded-[28px] border-2 transition-all duration-300 text-center ${withdrawForm.destinationType === channel.id ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 text-gray-400'}`}
                                            >
                                                <span className="block text-3xl mb-2">{channel.emoji}</span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{channel.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                                        {withdrawForm.destinationType === 'MOBILE_MONEY' ? 'Recipient Mobile' : 'Bank Account (Zambia)'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-900"
                                        placeholder={withdrawForm.destinationType === 'MOBILE_MONEY' ? 'e.g. 097...' : '1234567890'}
                                        value={withdrawForm.accountNumber}
                                        onChange={e => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-black hover:bg-gray-900 text-white font-black py-5 rounded-2xl text-lg shadow-2xl transition-all hover:scale-[1.02] active:scale-100"
                            >
                                Send Funds Now 🚀
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Settle to Wallet Modal - Redesigned */}
            {showSettleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in duration-500">
                        <div className="p-10 border-b border-gray-100/50 flex items-center justify-between bg-emerald-50/30">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Settle Funds</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Platform → Wallet</p>
                            </div>
                            <button onClick={() => setShowSettleModal(false)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-black transition-all">✕</button>
                        </div>

                        <form onSubmit={handleSettleToWallet} className="p-10 space-y-10">
                            <div className="relative">
                                <div className="p-8 bg-black rounded-[32px] text-white space-y-2 relative z-10 overflow-hidden group">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest relative z-20">Current Balance</p>
                                    <h3 className="text-4xl font-black tabular-nums transition-transform group-hover:scale-105 relative z-20">
                                        {balance?.currency} {Number(balance?.available || 0).toLocaleString()}
                                    </h3>
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3 relative">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Destination Wallet</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                                        className="w-full flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-2xl transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:bg-white/80 active:scale-[0.99] group shadow-sm shadow-gray-100/30"
                                    >
                                        {settleForm.targetWalletId ? (
                                            (() => {
                                                const selected = wallets.find(w => w.id === settleForm.targetWalletId);
                                                return (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                                                            {selected?.currency === 'ZMW' ? '🇿🇲' : selected?.currency === 'USD' ? '🇺🇸' : '🌍'}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-black text-gray-900 leading-tight">{selected?.currency} Wallet</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Bal: {Number(selected?.balance).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <span className="text-gray-400 font-bold ml-1">Select a destination wallet...</span>
                                        )}
                                        <div className={`w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center transition-transform duration-300 ${showWalletDropdown ? 'rotate-180 bg-emerald-50 border-emerald-100 text-emerald-600' : 'text-gray-300'}`}>
                                            <span className="text-[10px]">▼</span>
                                        </div>
                                    </button>

                                    {showWalletDropdown && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 shadow-2xl shadow-gray-200/50 rounded-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                                            {wallets.map(w => (
                                                <button
                                                    key={w.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSettleForm({ ...settleForm, targetWalletId: w.id });
                                                        setShowWalletDropdown(false);
                                                    }}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-emerald-50/50 border-b border-gray-50/80 last:border-0 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:scale-110 group-hover:shadow-sm transition-all border border-gray-100/50 group-hover:border-emerald-100">
                                                            <span className="text-lg">{w.currency === 'ZMW' ? '🇿🇲' : w.currency === 'USD' ? '🇺🇸' : '🌍'}</span>
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-black text-gray-900 group-hover:text-emerald-700 transition-colors">{w.currency} Wallet</p>
                                                        </div>
                                                    </div>
                                                    {settleForm.targetWalletId === w.id ? (
                                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 w-6 h-6 rounded-full flex items-center justify-center shadow-sm shadow-emerald-200/50">✓</span>
                                                    ) : (
                                                        <span className="w-6 h-6 rounded-full border border-gray-200 group-hover:border-emerald-200 transition-colors"></span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Amount to Move</h4>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 text-3xl font-black text-gray-900 outline-none tabular-nums focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm shadow-gray-100/30"
                                            placeholder="0.00"
                                            value={settleForm.amount}
                                            onChange={e => setSettleForm({ ...settleForm, amount: e.target.value })}
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-gray-300 group-focus-within:text-emerald-500 transition-colors tracking-widest uppercase">
                                            {balance?.currency || 'ZMW'}
                                        </div>
                                    </div>
                                    {settleForm.amount && !isNaN(Number(settleForm.amount)) && (
                                        <div className="bg-orange-50/80 border border-orange-100 text-orange-700 px-4 py-3 rounded-2xl flex items-start gap-2.5 animate-in slide-in-from-top-1 duration-300">
                                            <span className="text-sm mt-0.5">⚠️</span>
                                            <p className="text-[10px] font-black uppercase tracking-tight leading-relaxed">
                                                A 1% platform fee ({(parseFloat(settleForm.amount) * 0.01).toFixed(2)} {balance?.currency}) will be added to the deduction for this wallet settlement.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {settleForm.targetWalletId && wallets.find(w => w.id === settleForm.targetWalletId)?.currency !== balance?.currency && (
                                    <div className="p-6 bg-gradient-to-br from-orange-50/80 to-amber-50/30 border border-orange-100/50 rounded-2xl space-y-4 shadow-inner shadow-white">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-orange-600 tracking-widest">
                                            <span className="flex items-center gap-1.5"><span className="text-sm">🔄</span> FX Swap Quote</span>
                                            <span className="bg-orange-100/50 px-2 py-0.5 rounded flex items-center gap-1">⏱ Locked 5m</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1.5">
                                                <p className="text-2xl font-black text-orange-900 tabular-nums">{(parseFloat(settleForm.amount || '0') / settleForm.fxRate).toFixed(2)} USD</p>
                                                <p className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">Rate: 1 USD = {settleForm.fxRate} ZMW</p>
                                            </div>
                                            <span className="text-[9px] font-black bg-white px-2.5 py-1 rounded-full border border-orange-100 text-orange-600 shadow-sm">PLATFORM RATE</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={!settleForm.targetWalletId || !settleForm.amount || parseFloat(settleForm.amount) <= 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-3xl text-lg shadow-2xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-30 disabled:grayscale"
                            >
                                Finalize Settlement ⚡
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
