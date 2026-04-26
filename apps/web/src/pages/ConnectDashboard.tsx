import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { api } from '../lib/axios';
import { Search, Plus, TrendingUp, Users, DollarSign, ExternalLink, Settings, BarChart2, ShieldCheck, AlertTriangle, Download, Zap, Link2, BookOpen, Send, Activity, Bell, PieChart, CreditCard, Code, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useConnectSocket } from '../hooks/useConnectSocket';
import type { ConnectEvent } from '../hooks/useConnectSocket';

// Amounts are stored in smallest currency unit (ngwe). Divide by 100 for display.
const fmtAmt = (n: number | string) =>
    (parseFloat(String(n)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ConnectDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [subMerchants, setSubMerchants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTestMode, setIsTestMode] = useState(() => localStorage.getItem('connect_test_mode') === 'true');
    const [bulkPayoutLoading, setBulkPayoutLoading] = useState(false);
    const [bulkPayoutResult, setBulkPayoutResult] = useState<string | null>(null);
    const [liveToasts, setLiveToasts] = useState<(ConnectEvent & { toastId: number })[]>([]);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkAccountId, setLinkAccountId] = useState('');
    const [linkReturnUrl, setLinkReturnUrl] = useState('');
    const [linkCreating, setLinkCreating] = useState(false);
    const [linkResult, setLinkResult] = useState<{ url: string; expires_at: string } | null>(null);
    const [linkError, setLinkError] = useState('');

    const dismissToast = (toastId: number) => setLiveToasts(prev => prev.filter(t => t.toastId !== toastId));

    const handleConnectEvent = useCallback((event: ConnectEvent) => {
        const toastId = Date.now();
        setLiveToasts(prev => [{ ...event, toastId }, ...prev].slice(0, 5));
        setTimeout(() => dismissToast(toastId), 8000);
        // Refresh stats on key events
        if (['kyc.approved', 'kyc.rejected', 'account.activated', 'account.suspended', 'payout.completed'].includes(event.type)) {
            api.get('/v1/connect/stats').then(r => setStats(r.data)).catch(() => {});
        }
    }, []);

    useConnectSocket(handleConnectEvent);

    const handleBulkPayout = async () => {
        if (!confirm('Trigger payouts for all eligible sub-merchants with available balance?')) return;
        setBulkPayoutLoading(true);
        setBulkPayoutResult(null);
        try {
            const res = await import('../lib/axios').then(m => m.api.post('/v1/connect/bulk/payout', { currency: 'ZMW' }));
            setBulkPayoutResult(`✓ ${res.data.triggered} payout(s) triggered`);
        } catch {
            setBulkPayoutResult('Failed to trigger bulk payout.');
        } finally { setBulkPayoutLoading(false); }
    };

    const handleCreateHostedLink = async () => {
        if (!linkAccountId.trim()) { setLinkError('Please select or enter a sub-merchant account ID'); return; }
        setLinkCreating(true);
        setLinkError('');
        setLinkResult(null);
        try {
            const res = await api.post('/v1/connect/onboarding_links', {
                account_id: linkAccountId,
                return_url: linkReturnUrl || window.location.origin + '/merchant/connect',
                refresh_url: window.location.origin + '/merchant/connect',
            });
            setLinkResult({ url: res.data.url, expires_at: res.data.expires_at });
        } catch (err: any) {
            setLinkError(err.response?.data?.error || 'Failed to create link');
        } finally {
            setLinkCreating(false);
        }
    };

    const handleExport = async (type: string) => {
        try {
            const { api } = await import('../lib/axios');
            const res = await api.get(`/v1/connect/export/${type}`, {
                headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `flapapay_connect_${type}_${Date.now()}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch { alert('Export failed.'); }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const config = {
                    headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' }
                };
                const [statsRes, accountsRes] = await Promise.all([
                    api.get('/v1/connect/stats', config),
                    api.get('/v1/connect/accounts', config)
                ]);
                setStats(statsRes.data);
                setSubMerchants(accountsRes.data);
            } catch (err) {
                console.error('Failed to fetch connect data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        localStorage.setItem('connect_test_mode', isTestMode.toString());
    }, [isTestMode]);

    return (
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-100" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            {/* ── Live Event Toasts ──────────────────────────────────── */}
            {liveToasts.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                    {liveToasts.map(toast => {
                        const isGood = ['kyc.approved', 'account.activated', 'payout.completed', 'transfer.completed'].includes(toast.type);
                        const isWarn = ['kyc.rejected', 'account.suspended', 'payout.failed', 'charge.failed', 'dispute.opened'].includes(toast.type);
                        return (
                            <div
                                key={toast.toastId}
                                className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold backdrop-blur-xl animate-in slide-in-from-right-8 duration-300 ${
                                    isGood ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                    isWarn ? 'bg-red-50 border-red-200 text-red-800' :
                                    'bg-white border-gray-200 text-gray-800'
                                }`}
                            >
                                {isGood ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> :
                                 isWarn ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0" /> :
                                 <RefreshCw className="w-4 h-4 text-orange-400 shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <code className={`text-[10px] font-black tracking-widest uppercase ${isGood ? 'text-emerald-500' : isWarn ? 'text-red-500' : 'text-orange-500'}`}>{toast.type}</code>
                                    {toast.account_id && <p className="text-xs font-medium opacity-70 truncate">Account: {toast.account_id}</p>}
                                </div>
                                <button onClick={() => dismissToast(toast.toastId)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto relative">
                {/* Ambient Glows */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/30 via-amber-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-100/20 to-transparent rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header */}
                    <header className="flex justify-between items-start mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                                    <ExternalLink className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-orange-500 uppercase">Marketplace Engine</span>
                            </div>
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Connect</h1>
                            <p className="text-gray-500 mt-1 font-medium">Manage your ecosystem of sellers and automated splits.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm h-12">
                                <button
                                    onClick={() => setIsTestMode(false)}
                                    className={`px-5 h-full rounded-xl text-xs font-bold tracking-widest uppercase transition-all ${!isTestMode ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >Live</button>
                                <button
                                    onClick={() => setIsTestMode(true)}
                                    className={`px-5 h-full rounded-xl text-xs font-bold tracking-widest uppercase transition-all ${isTestMode ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25' : 'text-gray-400 hover:text-gray-600'}`}
                                >Test</button>
                            </div>
                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-2xl h-12 px-5 border-orange-200 text-orange-600 hover:bg-orange-50 transition-all"
                                onClick={() => { setShowLinkModal(true); setLinkResult(null); setLinkError(''); setLinkAccountId(''); }}
                            >
                                <Link2 className="w-4 h-4 mr-2" />
                                Send Hosted Link
                            </Button>
                            <Button
                                size="lg"
                                className="rounded-2xl h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 active:scale-95 transition-all"
                                onClick={() => navigate('/merchant/connect/onboard')}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Sub-merchant
                            </Button>
                        </div>
                    </header>

                    {/* Navigation strip */}
                    <div className="flex flex-wrap gap-2 mb-10">
                        {[
                            { label: 'Charges', path: '/merchant/connect/charges', icon: CreditCard, color: 'text-orange-600 bg-orange-50' },
                        { label: 'Analytics', path: '/merchant/connect/analytics', icon: BarChart2, color: 'text-indigo-600 bg-indigo-50' },
                            { label: 'Disputes', path: '/merchant/connect/disputes', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
                            { label: 'Risk', path: '/merchant/connect/risk', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' },
                            { label: 'Webhooks', path: '/merchant/connect/webhook-deliveries', icon: Activity, color: 'text-purple-600 bg-purple-50' },
                            { label: 'Requests', path: '/merchant/connect/payout-requests', icon: Send, color: 'text-blue-600 bg-blue-50' },
                            { label: 'Invites', path: '/merchant/connect/invites', icon: Link2, color: 'text-orange-600 bg-orange-50' },
                            { label: 'Ledger', path: '/merchant/connect/ledger', icon: BookOpen, color: 'text-teal-600 bg-teal-50' },
                            { label: 'Earnings', path: '/merchant/connect/earnings', icon: PieChart, color: 'text-violet-600 bg-violet-50' },
                            { label: 'Notifications', path: '/merchant/connect/notifications', icon: Bell, color: 'text-pink-600 bg-pink-50' },
                            { label: 'Settings', path: '/merchant/connect/settings', icon: Settings, color: 'text-gray-600 bg-gray-100' },
                            { label: 'API Reference', path: '/merchant/connect/api-reference', icon: Code, color: 'text-slate-600 bg-slate-100' },
                            { label: 'Components', path: '/merchant/connect/components', icon: Zap, color: 'text-orange-600 bg-orange-50' },
                        ].map(({ label, path, icon: Icon, color }) => (
                            <button key={path} onClick={() => navigate(path)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Connect Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-orange-500/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <Users className="w-16 h-16" />
                            </div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Sellers</p>
                            <h3 className="text-4xl font-black text-gray-900">{loading ? '...' : stats?.totalSubMerchants}</h3>
                            <div className="mt-4 flex items-center text-emerald-600 text-xs font-bold">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                <span>Organic Growth</span>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-orange-500/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <DollarSign className="w-16 h-16" />
                            </div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Marketplace GMV</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-gray-400 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-gray-900">{loading ? '...' : fmtAmt(stats?.marketplaceGMV || 0)}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-orange-500/50 text-xs font-bold">
                                <span>Aggregate Seller Volume</span>
                            </div>
                        </div>
                        <div className="bg-orange-600 p-8 rounded-[2.5rem] border border-orange-500 shadow-xl shadow-orange-600/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-white/10 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-16 h-16" />
                            </div>
                            <p className="text-orange-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Platform Revenue</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-orange-100 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-white">{loading ? '...' : fmtAmt(stats?.platformRevenue || 0)}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-orange-100/80 text-xs font-bold">
                                <span>Platform Fees Collected</span>
                            </div>
                        </div>
                    </div>

                    {/* Sub-merchants Table */}
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-sm overflow-hidden mb-12">
                        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h2 className="font-black text-2xl text-gray-900 tracking-tight">Connected Accounts</h2>
                                <p className="text-gray-500 text-sm mt-1">Sellers using your platform infrastructure.</p>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search ecosystem..."
                                    className="pl-11 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all w-64 text-gray-900"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Business Profile</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Verification</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Volume (ZK)</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Platform Fee</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {subMerchants.map((sub) => {
                                        const displayName = sub.businessName || sub.email;
                                        const initial = displayName?.[0]?.toUpperCase() || '?';
                                        const kycBadge = sub.kyc_status === 'verified'
                                            ? { label: 'Verified', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
                                            : sub.kyc_status === 'pending_review'
                                            ? { label: 'KYC Review', cls: 'bg-amber-50 text-amber-600 border-amber-100' }
                                            : sub.kyc_status === 'rejected'
                                            ? { label: 'Rejected', cls: 'bg-red-50 text-red-500 border-red-100' }
                                            : { label: 'Unverified', cls: 'bg-gray-50 text-gray-400 border-gray-200' };
                                        return (
                                        <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/merchant/connect/vendor/${sub.id}`)}>
                                            <td className="px-10 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-600 font-black text-sm">
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900">{displayName}</p>
                                                        {sub.businessName && <p className="text-[11px] text-gray-400 font-mono tracking-tight">{sub.email}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`inline-flex w-fit px-3 py-1 rounded-lg text-[10px] font-black tracking-[0.15em] uppercase border ${sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                        {sub.status}
                                                    </span>
                                                    <span className={`inline-flex w-fit px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase border ${kycBadge.cls}`}>
                                                        {kycBadge.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-5 text-right font-mono text-gray-900 font-bold">{fmtAmt(sub.volume)}</td>
                                            <td className="px-10 py-5 text-right font-mono text-orange-600 font-bold">{fmtAmt(sub.fees)}</td>
                                            <td className="px-10 py-5 text-right">
                                                <button
                                                    onClick={e => { e.stopPropagation(); navigate(`/merchant/connect/vendor/${sub.id}`); }}
                                                    className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all hover:scale-110 active:scale-95"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                    {subMerchants.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-20 text-center text-gray-400 font-medium italic">
                                                No sub-merchants found in your ecosystem.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bulk Operations + CSV Export (Phase 3.4) */}
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-sm p-8 mb-8">
                        <h3 className="font-black text-xl text-gray-900 mb-6">Bulk Operations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Bulk Payout */}
                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl"><Zap className="w-5 h-5 text-emerald-600" /></div>
                                    <div>
                                        <h4 className="font-black text-gray-900 text-sm">Bulk Payout</h4>
                                        <p className="text-xs text-gray-400">Pay all eligible sub-merchants at once</p>
                                    </div>
                                </div>
                                <button onClick={handleBulkPayout} disabled={bulkPayoutLoading}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {bulkPayoutLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</> : <><Zap className="w-4 h-4" /> Trigger All Payouts</>}
                                </button>
                                {bulkPayoutResult && (
                                    <p className={`mt-3 text-xs font-bold text-center ${bulkPayoutResult.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{bulkPayoutResult}</p>
                                )}
                            </div>
                            {/* CSV Exports */}
                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl"><Download className="w-5 h-5 text-indigo-600" /></div>
                                    <div>
                                        <h4 className="font-black text-gray-900 text-sm">CSV Export</h4>
                                        <p className="text-xs text-gray-400">Download data for accounting & reporting</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {['accounts', 'charges', 'payouts'].map(type => (
                                        <button key={type} onClick={() => handleExport(type)}
                                            className="flex-1 py-2.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* How It Works (Educational Section) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Programmatic Onboarding</h3>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    Use our Connect API to create sub-merchants automatically when sellers join your platform. No manual verification needed if they stay within sandbox limits.
                                </p>
                                <code className="block bg-white/10 p-4 rounded-xl text-orange-400 text-xs font-mono border border-white/10">
                                    POST /v1/connect/accounts
                                </code>
                            </div>
                            <div className="absolute -right-10 -bottom-10 opacity-10 text-[10rem] rotate-12">📦</div>
                        </div>
                        <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-emerald-600/20">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Custom Split Fees</h3>
                                <p className="text-emerald-50 mb-6 leading-relaxed">
                                    Determine your own platform fee for every transaction. Collect it automatically in your primary marketplace wallet on every charge.
                                </p>
                                <div className="flex gap-2">
                                    <div className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold border border-white/20 tracking-widest">5% FIXED</div>
                                    <div className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold border border-white/20 tracking-widest">TIERED PRICING</div>
                                </div>
                            </div>
                            <div className="absolute -right-10 -bottom-10 opacity-10 text-[10rem] -rotate-12">💸</div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Hosted Onboarding Link Modal ───────────────────────── */}
            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowLinkModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-black text-gray-900">Send Hosted Onboarding Link</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Sub-merchant fills their own KYC — no platform access needed.</p>
                            </div>
                            <button onClick={() => setShowLinkModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {!linkResult ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sub-merchant Account</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        value={linkAccountId}
                                        onChange={e => setLinkAccountId(e.target.value)}
                                    >
                                        <option value="">Select a sub-merchant…</option>
                                        {subMerchants.map((sm: any) => (
                                            <option key={sm.id} value={sm.id}>{sm.business_name || sm.email} — {sm.kyc_status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Return URL (optional)</label>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        value={linkReturnUrl}
                                        onChange={e => setLinkReturnUrl(e.target.value)}
                                        placeholder="https://your-platform.com/sellers"
                                    />
                                </div>
                                {linkError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {linkError}
                                    </div>
                                )}
                                <button
                                    onClick={handleCreateHostedLink}
                                    disabled={linkCreating || !linkAccountId}
                                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {linkCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                                    {linkCreating ? 'Generating…' : 'Generate Onboarding Link'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <div>
                                        <div className="text-sm font-bold text-green-800">Link Created!</div>
                                        <div className="text-xs text-green-600">Expires {new Date(linkResult.expires_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Onboarding URL</div>
                                    <p className="text-xs text-gray-700 break-all font-mono mb-3">{linkResult.url}</p>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(linkResult.url); }}
                                        className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs transition-all"
                                    >
                                        Copy Link
                                    </button>
                                </div>
                                <button
                                    onClick={() => { setLinkResult(null); setLinkAccountId(''); setLinkReturnUrl(''); }}
                                    className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl font-bold text-xs transition-all"
                                >
                                    Generate Another Link
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
