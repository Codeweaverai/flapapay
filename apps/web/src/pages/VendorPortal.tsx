import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    TrendingUp, CreditCard, Clock, ExternalLink, ShieldCheck,
    X, Zap, RefreshCw, CheckCircle, AlertCircle, Calendar, Settings,
    Key, Copy, Trash2, Plus, Lock, Unlock, RotateCcw, Percent,
    FileText, Send, DollarSign
} from 'lucide-react';

interface PayoutMethod { id: string; type: string; details: any; is_default: boolean; }
interface Schedule { id?: string; schedule: 'daily' | 'weekly' | 'monthly'; min_threshold: number; currency: string; enabled: boolean; next_run_at?: string; }
interface ApiKey { id: string; public_key: string; secret_key_preview: string; label: string; key_type: string; created_at: string; secret_key?: string; }
interface Charge { id: string; amount: number; currency: string; status: string; payment_method: string; description: string; application_fee_amount: number | null; created_at: string; }

export const VendorPortal: React.FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Withdrawal modal
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawResult, setWithdrawResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

    // Schedule modal
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [schedule, setSchedule] = useState<Schedule>({ schedule: 'daily', min_threshold: 50, currency: 'ZMW', enabled: false });
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [scheduleStatus, setScheduleStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Account controls
    const [controlStatus, setControlStatus] = useState<string>('ACTIVE');
    const [maxPayout, setMaxPayout] = useState<string>('');
    const [platformNotes, setPlatformNotes] = useState<string>('');
    const [savingControls, setSavingControls] = useState(false);
    const [controlsResult, setControlsResult] = useState<'idle' | 'success' | 'error'>('idle');

    // API Keys
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [keysLoading, setKeysLoading] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [newKeyLabel, setNewKeyLabel] = useState('');
    const [newKeyType, setNewKeyType] = useState<'test' | 'live'>('test');
    const [creatingKey, setCreatingKey] = useState(false);
    const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);

    // Fee Override (Phase 3.2)
    const [feeOverride, setFeeOverride] = useState<{ fee_percent: number; reason: string } | null>(null);
    const [feeOverrideInput, setFeeOverrideInput] = useState<string>('');
    const [feeOverrideReason, setFeeOverrideReason] = useState<string>('');
    const [savingFeeOverride, setSavingFeeOverride] = useState(false);
    const [feeOverrideResult, setFeeOverrideResult] = useState<'idle' | 'success' | 'error'>('idle');

    // Statements
    const [statements, setStatements] = useState<any[]>([]);
    const [genYear, setGenYear] = useState(String(new Date().getFullYear()));
    const [genMonth, setGenMonth] = useState(String(new Date().getMonth() + 1));
    const [generatingStmt, setGeneratingStmt] = useState(false);
    const [stmtResult, setStmtResult] = useState<string | null>(null);
    const [emailingStmt, setEmailingStmt] = useState<string | null>(null);

    // Payout requests for this account
    const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
    const [prLoading, setPrLoading] = useState(false);

    // Charges + Refund
    const [charges, setCharges] = useState<Charge[]>([]);
    const [chargesLoading, setChargesLoading] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundCharge, setRefundCharge] = useState<Charge | null>(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refunding, setRefunding] = useState(false);
    const [refundResult, setRefundResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

    const fetchAll = async () => {
        if (!accountId) return;
        setLoading(true);
        try {
            const [statsRes, methodsRes, schedRes, feeRes] = await Promise.all([
                api.get(`/v1/connect/accounts/${accountId}/stats`),
                api.get(`/v1/connect/accounts/${accountId}/payout_methods`),
                api.get(`/v1/connect/accounts/${accountId}/schedule`).catch(() => ({ data: null })),
                api.get(`/v1/connect/accounts/${accountId}/fee-override`).catch(() => ({ data: null }))
            ]);
            if (feeRes.data) {
                setFeeOverride(feeRes.data);
                setFeeOverrideInput(String(feeRes.data.fee_percent));
                setFeeOverrideReason(feeRes.data.reason || '');
            }
            setStats(statsRes.data);
            setControlStatus(statsRes.data.status || 'ACTIVE');
            setMaxPayout(statsRes.data.max_payout_amount != null ? String(statsRes.data.max_payout_amount) : '');
            setPlatformNotes(statsRes.data.platform_notes || '');
            setPayoutMethods(methodsRes.data || []);
            if (methodsRes.data?.length > 0) {
                const def = methodsRes.data.find((m: PayoutMethod) => m.is_default) || methodsRes.data[0];
                setSelectedMethod(def.id);
            }
            if (schedRes.data) setSchedule(schedRes.data);
        } catch (err) {
            console.error('Failed to fetch vendor data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchKeys = async () => {
        if (!accountId) return;
        setKeysLoading(true);
        try {
            const res = await api.get(`/v1/connect/accounts/${accountId}/keys`);
            setApiKeys(res.data || []);
        } catch { /* silent */ } finally {
            setKeysLoading(false);
        }
    };

    const fetchCharges = async () => {
        if (!accountId) return;
        setChargesLoading(true);
        try {
            const res = await api.get(`/v1/connect/accounts/${accountId}/charges?limit=10`);
            setCharges(res.data || []);
        } catch { /* silent */ } finally {
            setChargesLoading(false);
        }
    };

    const fetchStatements = async () => {
        if (!accountId) return;
        try {
            const res = await api.get(`/v1/connect/accounts/${accountId}/statements`);
            setStatements(res.data.statements ?? []);
        } catch { /* silent */ }
    };

    const fetchPayoutRequests = async () => {
        if (!accountId) return;
        setPrLoading(true);
        try {
            const res = await api.get(`/v1/connect/accounts/${accountId}/payout-requests`);
            setPayoutRequests(res.data.requests ?? []);
        } catch { /* silent */ } finally { setPrLoading(false); }
    };

    const handleGenerateStatement = async () => {
        if (!accountId) return;
        setGeneratingStmt(true);
        setStmtResult(null);
        try {
            await api.post(`/v1/connect/accounts/${accountId}/statements/generate`, { year: parseInt(genYear), month: parseInt(genMonth) });
            setStmtResult('Statement generated successfully.');
            await fetchStatements();
        } catch (err: any) {
            setStmtResult(err.response?.data?.error || 'Failed to generate statement');
        } finally { setGeneratingStmt(false); }
    };

    const handleEmailStatement = async (stmtId: string) => {
        if (!accountId) return;
        setEmailingStmt(stmtId);
        try {
            await api.post(`/v1/connect/accounts/${accountId}/statements/${stmtId}/email`, {});
            await fetchStatements();
        } catch { /* silent */ } finally { setEmailingStmt(null); }
    };

    useEffect(() => {
        fetchAll();
        fetchKeys();
        fetchCharges();
        fetchStatements();
        fetchPayoutRequests();
    }, [accountId]);

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !selectedMethod) return;
        setWithdrawing(true);
        setWithdrawResult(null);
        try {
            const method = payoutMethods.find(m => m.id === selectedMethod);
            const details = typeof method?.details === 'string' ? JSON.parse(method?.details) : method?.details;
            // withdrawAmount is in ZMW — API expects ngwe (×100)
            await api.post('/v1/connect/payouts', {
                account: accountId,
                amount: Math.round(parseFloat(withdrawAmount) * 100),
                currency: stats?.currency || 'ZMW',
                destination: { type: method?.type, number: details?.number, network: details?.network, accountNumber: details?.accountNumber, bankCode: details?.bankCode }
            });
            setWithdrawResult({ status: 'success', message: `Payout of ZK ${parseFloat(withdrawAmount).toFixed(2)} initiated successfully.` });
            const updated = await api.get(`/v1/connect/accounts/${accountId}/stats`);
            setStats(updated.data);
        } catch (err: any) {
            setWithdrawResult({ status: 'error', message: err?.response?.data?.error || 'Payout failed. Please try again.' });
        } finally {
            setWithdrawing(false);
        }
    };

    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
        setScheduleStatus('idle');
        try {
            const res = await api.post(`/v1/connect/accounts/${accountId}/schedule`, schedule);
            setSchedule(res.data);
            setScheduleStatus('success');
            setTimeout(() => setScheduleStatus('idle'), 3000);
        } catch { setScheduleStatus('error'); } finally { setSavingSchedule(false); }
    };

    const handleSaveControls = async () => {
        setSavingControls(true);
        setControlsResult('idle');
        try {
            await api.patch(`/v1/connect/accounts/${accountId}`, {
                status: controlStatus,
                max_payout_amount: maxPayout !== '' ? parseFloat(maxPayout) : null,
                platform_notes: platformNotes
            });
            setControlsResult('success');
            setTimeout(() => setControlsResult('idle'), 3000);
            await fetchAll();
        } catch { setControlsResult('error'); } finally { setSavingControls(false); }
    };

    const handleSaveFeeOverride = async () => {
        if (!feeOverrideInput) return;
        setSavingFeeOverride(true);
        setFeeOverrideResult('idle');
        try {
            const res = await api.put(`/v1/connect/accounts/${accountId}/fee-override`, {
                fee_percent: parseFloat(feeOverrideInput),
                reason: feeOverrideReason || undefined
            });
            setFeeOverride(res.data);
            setFeeOverrideResult('success');
            setTimeout(() => setFeeOverrideResult('idle'), 3000);
        } catch { setFeeOverrideResult('error'); } finally { setSavingFeeOverride(false); }
    };

    const handleRemoveFeeOverride = async () => {
        if (!confirm('Remove the custom fee override? The platform default will apply.')) return;
        try {
            await api.delete(`/v1/connect/accounts/${accountId}/fee-override`);
            setFeeOverride(null);
            setFeeOverrideInput('');
            setFeeOverrideReason('');
        } catch { alert('Failed to remove override.'); }
    };

    const handleCreateKey = async () => {
        if (!newKeyLabel.trim()) return;
        setCreatingKey(true);
        try {
            const res = await api.post(`/v1/connect/accounts/${accountId}/keys`, { label: newKeyLabel, key_type: newKeyType });
            setNewKeySecret(res.data.secret_key);
            await fetchKeys();
        } catch { alert('Failed to create key.'); } finally { setCreatingKey(false); }
    };

    const handleRevokeKey = async (keyId: string) => {
        if (!confirm('Revoke this API key? This cannot be undone.')) return;
        try {
            await api.delete(`/v1/connect/accounts/${accountId}/keys/${keyId}`);
            setApiKeys(prev => prev.filter(k => k.id !== keyId));
        } catch { alert('Failed to revoke key.'); }
    };

    const handleRefund = async () => {
        if (!refundCharge || !refundAmount || parseFloat(refundAmount) <= 0) return;
        setRefunding(true);
        setRefundResult(null);
        try {
            // refundAmount is in ZMW — API expects ngwe (×100)
            await api.post(`/v1/charges/${refundCharge.id}/refund`, {
                amount: Math.round(parseFloat(refundAmount) * 100),
                reason: refundReason || undefined
            });
            setRefundResult({ status: 'success', message: `ZK ${parseFloat(refundAmount).toFixed(2)} refunded successfully.` });
            await fetchCharges();
            await fetchAll();
        } catch (err: any) {
            setRefundResult({ status: 'error', message: err?.response?.data?.error || 'Refund failed.' });
        } finally { setRefunding(false); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    // Amounts from API are in smallest currency unit (ngwe). Divide by 100 for display.
    const fmtAmt = (n: number | string) =>
        (parseFloat(String(n || 0)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const availableBalance = parseFloat(stats?.balance?.available || 0) / 100;
    const isSuspended = controlStatus === 'SUSPENDED';

    return (
        <div className="min-h-screen bg-white flex text-gray-900 font-['Inter']">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="mb-4 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-600/10 rounded-xl">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="text-xs font-black tracking-[0.3em] text-emerald-600 uppercase">Vendor Portal Secure</span>
                                {stats?.status === 'SUSPENDED' && (
                                    <span className="px-3 py-1 bg-red-100 text-red-600 border border-red-200 text-[10px] font-black uppercase tracking-widest rounded-lg">Suspended</span>
                                )}
                            </div>
                            <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
                                {loading ? '···' : (stats?.display_name || stats?.business_name || 'Sub-merchant')}
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">Real-time revenue sharing and account management.</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => setShowScheduleModal(true)} className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-gray-200">
                                <Calendar className="w-4 h-4" /> Auto Payout
                            </button>
                        </div>
                    </header>

                    {/* ── Account Profile Card ─────────────────────────── */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Account Profile</h3>
                            {stats?.kyc_status && (
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                    stats.kyc_status === 'verified'       ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    stats.kyc_status === 'pending_review' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    stats.kyc_status === 'rejected'       ? 'bg-red-50 text-red-500 border-red-100' :
                                                                            'bg-gray-50 text-gray-400 border-gray-200'
                                }`}>
                                    {stats.kyc_status === 'pending_review' ? 'KYC Under Review' :
                                     stats.kyc_status === 'verified'       ? 'KYC Verified' :
                                     stats.kyc_status === 'rejected'       ? 'KYC Rejected' : 'KYC Pending'}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-50">
                            {/* Identity */}
                            <div className="p-7 space-y-3">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">Identity</p>
                                {[
                                    { label: 'Name',        value: stats?.display_name || stats?.business_name || stats?.email },
                                    { label: 'Email',       value: stats?.email },
                                    { label: 'Country',     value: stats?.country || 'ZM' },
                                    { label: 'NRC / PACRA', value: stats?.identity?.nrc || stats?.identity?.pacra_number },
                                    { label: 'Category',    value: stats?.identity?.category },
                                ].filter(i => i.value).map(({ label, value }) => (
                                    <div key={label} className="flex justify-between text-sm gap-4">
                                        <span className="text-gray-400 font-medium shrink-0">{label}</span>
                                        <span className="font-semibold text-gray-900 text-right truncate">{value}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Contact */}
                            <div className="p-7 space-y-3">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">Contact</p>
                                {[
                                    { label: 'Phone',   value: stats?.contact?.phone ? `+260 ${stats.contact.phone}` : null },
                                    { label: 'Address', value: stats?.contact?.address },
                                    { label: 'City',    value: stats?.contact?.city },
                                    { label: 'Website', value: stats?.contact?.website },
                                ].filter(i => i.value).map(({ label, value }) => (
                                    <div key={label} className="flex justify-between text-sm gap-4">
                                        <span className="text-gray-400 font-medium shrink-0">{label}</span>
                                        <span className="font-semibold text-gray-900 text-right truncate">{value}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Payout method */}
                            <div className="p-7 space-y-3">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">Payout Method</p>
                                {stats?.payout_info?.type ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${stats.payout_info.type === 'mobile_money' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                {stats.payout_info.type === 'mobile_money' ? 'Mobile Money' : 'Bank Account'}
                                            </span>
                                        </div>
                                        {stats.payout_info.type === 'mobile_money' ? (
                                            <>
                                                <div className="flex justify-between text-sm"><span className="text-gray-400">Network</span><span className="font-semibold text-gray-900 uppercase">{stats.payout_info.mobile_network}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-gray-400">Number</span><span className="font-semibold text-gray-900">+260 {stats.payout_info.mobile_number}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-gray-400">Verified</span><span className={`font-bold text-xs ${stats.payout_info.mobile_verified ? 'text-emerald-600' : 'text-amber-500'}`}>{stats.payout_info.mobile_verified ? '✓ Yes' : '⚠ Pending'}</span></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between text-sm"><span className="text-gray-400">Bank</span><span className="font-semibold text-gray-900">{stats.payout_info.bank_name}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-gray-400">Account</span><span className="font-semibold text-gray-900">{stats.payout_info.bank_account_number}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-gray-400">Name</span><span className="font-semibold text-gray-900">{stats.payout_info.bank_resolved_name}</span></div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No payout method on file</p>
                                )}
                                {stats?.kyc_status === 'pending_review' && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-xs text-amber-700 font-medium">Payouts are held pending KYC approval by FlapaPay admin.</p>
                                    </div>
                                )}
                                {stats?.kyc_status === 'rejected' && stats?.kyc_rejection_reason && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                                        <p className="text-[10px] font-black text-red-700 uppercase tracking-wide mb-1">Rejection Reason</p>
                                        <p className="text-xs text-red-600">{stats.kyc_rejection_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Revenue</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-gray-400 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-gray-900">{loading ? '...' : fmtAmt(stats?.volume)}</h3>
                            </div>
                            <p className="mt-4 text-emerald-600 text-xs font-bold">Gross volume before fees</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Platform Fees</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-gray-400 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-orange-600">-{loading ? '...' : fmtAmt(stats?.fees)}</h3>
                            </div>
                            <p className="mt-4 text-gray-400 text-xs font-bold">Fees paid to marketplace</p>
                        </div>
                        <div className="bg-orange-600 p-8 rounded-[2.5rem] shadow-xl shadow-orange-600/20">
                            <p className="text-orange-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Net Earnings</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-orange-100 font-bold text-lg">ZK</span>
                                <h3 className="text-4xl font-black text-white">{loading ? '...' : fmtAmt(stats?.net)}</h3>
                            </div>
                            <p className="mt-4 text-orange-100 text-xs font-bold">After platform fees</p>
                        </div>
                    </div>

                    {/* Balance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl"><Clock className="w-6 h-6 text-emerald-600" /></div>
                                <h4 className="text-xl font-black text-gray-900">Pending Settlement</h4>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-gray-400 font-bold text-xl">ZK</span>
                                <span className="text-5xl font-black text-gray-900">{loading ? '...' : fmtAmt(stats?.balance?.pending)}</span>
                            </div>
                            <p className="text-gray-500 text-sm italic">Funds in the T+{stats?.settlementDays ?? 1} settlement window.</p>
                            {schedule.enabled && (
                                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-black uppercase tracking-widest mb-1">
                                        <Zap className="w-3 h-3" /> Auto Payout {schedule.schedule}
                                    </div>
                                    <p className="text-xs text-emerald-600">Next: {schedule.next_run_at ? new Date(schedule.next_run_at).toLocaleString() : 'Scheduled'}</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-orange-500/10 rounded-2xl"><CreditCard className="w-6 h-6 text-orange-600" /></div>
                                <h4 className="text-xl font-black text-gray-900">Available for Payout</h4>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-gray-400 font-bold text-xl">ZK</span>
                                <span className="text-5xl font-black text-gray-900">{loading ? '...' : fmtAmt(stats?.balance?.available)}</span>
                            </div>
                            <p className="text-gray-500 text-sm italic mb-6">Settled funds available to withdraw.</p>
                            {payoutMethods.length === 0 ? (
                                <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded-2xl">No payout method configured.</div>
                            ) : (
                                <button
                                    onClick={() => { setWithdrawAmount(availableBalance.toFixed(2)); setShowWithdrawModal(true); }}
                                    className="w-full h-16 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-xl"
                                >
                                    <TrendingUp className="w-5 h-5 text-orange-500" /> Request Withdrawal
                                    <ExternalLink className="w-4 h-4 ml-2 opacity-30 group-hover:opacity-100 transition-opacity" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Account Controls (Phase 2.4) ── */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
                            <div className="p-2 bg-gray-900/5 rounded-xl"><Settings className="w-5 h-5 text-gray-700" /></div>
                            <div>
                                <h3 className="font-black text-xl text-gray-900">Account Controls</h3>
                                <p className="text-gray-500 text-sm">Suspend, cap payouts, or add platform notes</p>
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Status Toggle */}
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Account Status</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setControlStatus('ACTIVE')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-black transition-all ${controlStatus === 'ACTIVE' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-300'}`}
                                    >
                                        <Unlock className="w-4 h-4" /> Active
                                    </button>
                                    <button
                                        onClick={() => setControlStatus('SUSPENDED')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-black transition-all ${controlStatus === 'SUSPENDED' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-red-300'}`}
                                    >
                                        <Lock className="w-4 h-4" /> Suspend
                                    </button>
                                </div>
                            </div>
                            {/* Max Payout Cap */}
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Max Payout Cap (ZK)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="No limit"
                                    value={maxPayout}
                                    onChange={e => setMaxPayout(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all"
                                />
                                <p className="text-xs text-gray-400 mt-1">Leave blank for no limit</p>
                            </div>
                            {/* Platform Notes */}
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Platform Notes</label>
                                <textarea
                                    rows={2}
                                    placeholder="Internal notes..."
                                    value={platformNotes}
                                    onChange={e => setPlatformNotes(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-8 pb-8 flex items-center gap-4">
                            <button
                                onClick={handleSaveControls}
                                disabled={savingControls}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white font-black text-sm rounded-2xl transition-all disabled:opacity-60"
                            >
                                {savingControls ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                                {savingControls ? 'Saving...' : 'Save Controls'}
                            </button>
                            {controlsResult === 'success' && <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-black"><CheckCircle className="w-4 h-4" /> Saved</span>}
                            {controlsResult === 'error' && <span className="flex items-center gap-1.5 text-red-500 text-sm font-black"><AlertCircle className="w-4 h-4" /> Failed</span>}
                        </div>
                    </div>

                    {/* ── Fee Override (Phase 3.2) ── */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-xl"><Percent className="w-5 h-5 text-purple-600" /></div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900">Custom Fee Rate</h3>
                                    <p className="text-gray-500 text-sm">Override the platform default fee for this account</p>
                                </div>
                            </div>
                            {feeOverride && (
                                <span className="px-4 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl text-xs font-black uppercase tracking-widest">
                                    {feeOverride.fee_percent}% active
                                </span>
                            )}
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Fee % Override</label>
                                <div className="relative">
                                    <input type="number" min="0" max="100" step="0.1" placeholder="e.g. 3.5"
                                        value={feeOverrideInput} onChange={e => setFeeOverrideInput(e.target.value)}
                                        className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 transition-all" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Leaves blank to use platform default</p>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Reason (optional)</label>
                                <input type="text" placeholder="e.g. VIP seller, negotiated rate..."
                                    value={feeOverrideReason} onChange={e => setFeeOverrideReason(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 transition-all" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSaveFeeOverride} disabled={savingFeeOverride || !feeOverrideInput}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-60 shadow-lg shadow-purple-600/20">
                                    {savingFeeOverride ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Percent className="w-4 h-4" />}
                                    {savingFeeOverride ? 'Saving...' : 'Set Override'}
                                </button>
                                {feeOverride && (
                                    <button onClick={handleRemoveFeeOverride}
                                        className="px-4 py-3 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-2xl transition-all border border-gray-200 hover:border-red-200">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        {feeOverrideResult === 'success' && <p className="px-8 pb-6 text-emerald-600 font-black text-sm flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Fee override saved</p>}
                        {feeOverrideResult === 'error' && <p className="px-8 pb-6 text-red-500 font-black text-sm">Failed to save override.</p>}
                    </div>

                    {/* ── API Keys (Phase 2.3) ── */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-xl"><Key className="w-5 h-5 text-indigo-600" /></div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900">API Keys</h3>
                                    <p className="text-gray-500 text-sm">Sub-merchant access credentials for FlapaPay APIs</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowKeyModal(true); setNewKeyLabel(''); setNewKeySecret(null); }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
                            >
                                <Plus className="w-4 h-4" /> Generate Key
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            {keysLoading ? (
                                <div className="p-10 text-center text-gray-400 text-sm">Loading keys...</div>
                            ) : apiKeys.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 text-sm italic">No API keys generated yet.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Label</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Public Key</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Secret Preview</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created</th>
                                            <th className="px-8 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {apiKeys.map(key => (
                                            <tr key={key.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-4 font-bold text-sm text-gray-900">{key.label}</td>
                                                <td className="px-8 py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${key.key_type === 'live' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                                        {key.key_type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 font-mono text-xs text-gray-600">{key.public_key}</td>
                                                <td className="px-8 py-4 font-mono text-xs text-gray-500">{key.secret_key_preview}</td>
                                                <td className="px-8 py-4 text-xs text-gray-400">{new Date(key.created_at).toLocaleDateString()}</td>
                                                <td className="px-8 py-4">
                                                    <button
                                                        onClick={() => handleRevokeKey(key.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Revoke key"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* ── Recent Charges + Refunds (Phase 2.1) ── */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-xl"><RotateCcw className="w-5 h-5 text-orange-600" /></div>
                            <div>
                                <h3 className="font-black text-xl text-gray-900">Recent Charges</h3>
                                <p className="text-gray-500 text-sm">Platform charges routed to this account</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            {chargesLoading ? (
                                <div className="p-10 text-center text-gray-400 text-sm">Loading charges...</div>
                            ) : charges.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 text-sm italic">No charges recorded yet.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Charge ID</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Platform Fee</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {charges.map(charge => (
                                            <tr key={charge.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-4 font-mono text-xs text-gray-500">{charge.id}</td>
                                                <td className="px-8 py-4 text-right font-mono font-bold text-gray-900 text-sm">ZK {fmtAmt(charge.amount)}</td>
                                                <td className="px-8 py-4 text-right font-mono text-orange-600 text-sm">
                                                    {charge.application_fee_amount != null ? `ZK ${fmtAmt(charge.application_fee_amount)}` : '—'}
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                        charge.status === 'succeeded' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        charge.status === 'refunded' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                                        charge.status === 'partially_refunded' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                        'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                        {charge.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-xs text-gray-400">{new Date(charge.created_at).toLocaleDateString()}</td>
                                                <td className="px-8 py-4">
                                                    {charge.status === 'succeeded' && (
                                                        <button
                                                            onClick={() => { setRefundCharge(charge); setRefundAmount((charge.amount / 100).toFixed(2)); setRefundReason(''); setRefundResult(null); setShowRefundModal(true); }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl text-xs font-black transition-all border border-gray-200 hover:border-red-200"
                                                        >
                                                            <RotateCcw className="w-3 h-3" /> Refund
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* ── Payout Requests (Phase 5) ── */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-xl"><DollarSign className="w-5 h-5 text-orange-600" /></div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900">Payout Requests</h3>
                                    <p className="text-gray-500 text-sm">On-demand payout requests submitted by this sub-merchant</p>
                                </div>
                            </div>
                            <button onClick={fetchPayoutRequests} className="p-2 text-gray-400 hover:text-orange-500 transition-colors">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-8">
                            {prLoading ? (
                                <div className="flex items-center justify-center h-20 text-gray-400">
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
                                </div>
                            ) : payoutRequests.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-6">No payout requests from this account</p>
                            ) : (
                                <div className="space-y-3">
                                    {payoutRequests.map((req: any) => (
                                        <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                            <div>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-2 ${
                                                    req.status === 'pending' ? 'bg-yellow-50 text-yellow-700'
                                                    : req.status === 'completed' ? 'bg-emerald-50 text-emerald-700'
                                                    : req.status === 'denied' ? 'bg-red-50 text-red-600'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>{req.status}</span>
                                                <span className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                                                {req.note && <p className="text-xs text-gray-400 mt-1 italic">"{req.note}"</p>}
                                                {req.platform_note && <p className="text-xs text-gray-400 mt-0.5">Note: {req.platform_note}</p>}
                                            </div>
                                            <span className="font-black text-gray-900">{req.currency} {fmtAmt(req.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Statements (Phase 5) ── */}
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl"><FileText className="w-5 h-5 text-blue-600" /></div>
                            <div>
                                <h3 className="font-black text-xl text-gray-900">Monthly Statements</h3>
                                <p className="text-gray-500 text-sm">Generate and email period statements for this sub-merchant</p>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            {/* Generate control */}
                            <div className="flex flex-wrap gap-3 items-end">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Year</label>
                                    <select value={genYear} onChange={e => setGenYear(e.target.value)}
                                        className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all">
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Month</label>
                                    <select value={genMonth} onChange={e => setGenMonth(e.target.value)}
                                        className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all">
                                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                                            <option key={i+1} value={i+1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <button onClick={handleGenerateStatement} disabled={generatingStmt}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/20 disabled:opacity-60 transition-all">
                                    {generatingStmt ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                    Generate
                                </button>
                            </div>
                            {stmtResult && <p className="text-sm text-emerald-600 font-semibold">{stmtResult}</p>}

                            {/* Statement list */}
                            {statements.length > 0 ? (
                                <div className="space-y-3">
                                    {statements.map((s: any) => {
                                        const period = new Date(s.period_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                        return (
                                            <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{period}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {s.total_charges_count} charges · Net: {s.currency} {parseFloat(s.net_earnings).toLocaleString()}
                                                    </p>
                                                    {s.emailed_at && <p className="text-xs text-emerald-600 mt-0.5">Emailed {new Date(s.emailed_at).toLocaleDateString()}</p>}
                                                </div>
                                                <button onClick={() => handleEmailStatement(s.id)} disabled={emailingStmt === s.id}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50">
                                                    {emailingStmt === s.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                    Email
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-4">No statements generated yet</p>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* ── Withdrawal Modal ── */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => { setShowWithdrawModal(false); setWithdrawResult(null); }} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Request Withdrawal</h2>
                        <p className="text-gray-500 text-sm mb-8">Funds will be sent to your registered payout method.</p>
                        {withdrawResult ? (
                            <div className={`p-6 rounded-2xl ${withdrawResult.status === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {withdrawResult.status === 'success' ? <CheckCircle className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
                                    <p className={`font-black text-sm ${withdrawResult.status === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                                        {withdrawResult.status === 'success' ? 'Payout Initiated' : 'Payout Failed'}
                                    </p>
                                </div>
                                <p className={`text-sm ${withdrawResult.status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>{withdrawResult.message}</p>
                                <button onClick={() => { setShowWithdrawModal(false); setWithdrawResult(null); }} className="mt-4 w-full py-3 bg-gray-900 text-white rounded-xl font-black text-sm">Close</button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Amount (ZK)</label>
                                    <input type="number" min="1" max={availableBalance} step="0.01" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all" />
                                    <p className="text-xs text-gray-400 mt-1">Available: ZK {availableBalance.toFixed(2)}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Payout Method</label>
                                    <div className="space-y-2">
                                        {payoutMethods.map(method => {
                                            const details = typeof method.details === 'string' ? JSON.parse(method.details) : method.details;
                                            return (
                                                <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                                                    className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedMethod === method.id ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 capitalize">{method.type?.replace('_', ' ')}</p>
                                                            <p className="text-xs text-gray-500 font-mono">{details?.network && `${details.network} · `}{details?.number || details?.accountNumber || '—'}</p>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded-full border-2 ${selectedMethod === method.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}></div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <button onClick={handleWithdraw} disabled={withdrawing || !selectedMethod || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                                    className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-xl shadow-orange-600/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {withdrawing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                                    {withdrawing ? 'Processing...' : `Withdraw ZK ${parseFloat(withdrawAmount || '0').toFixed(2)}`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Auto Payout Schedule Modal ── */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowScheduleModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center"><Calendar className="w-6 h-6 text-orange-600" /></div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Auto Payout Schedule</h2>
                                <p className="text-gray-500 text-xs">Set when funds are automatically disbursed</p>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div>
                                    <p className="font-black text-sm text-gray-900">Enable Auto Payout</p>
                                    <p className="text-xs text-gray-500">Automatically disburse on schedule</p>
                                </div>
                                <button onClick={() => setSchedule(s => ({ ...s, enabled: !s.enabled }))}
                                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${schedule.enabled ? 'bg-orange-500' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${schedule.enabled ? 'left-6.5 translate-x-1' : 'left-0.5'}`}></span>
                                </button>
                            </div>
                            {schedule.enabled && (
                                <>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Frequency</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['daily', 'weekly', 'monthly'] as const).map(s => (
                                                <button key={s} onClick={() => setSchedule(prev => ({ ...prev, schedule: s }))}
                                                    className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${schedule.schedule === s ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Minimum Threshold (ZK)</label>
                                        <input type="number" min="0" step="10" value={schedule.min_threshold} onChange={e => setSchedule(s => ({ ...s, min_threshold: parseFloat(e.target.value) || 0 }))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all" />
                                        <p className="text-xs text-gray-400 mt-1">Payout only triggers when balance ≥ this amount</p>
                                    </div>
                                </>
                            )}
                            <button onClick={handleSaveSchedule} disabled={savingSchedule}
                                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {savingSchedule ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5" />}
                                {savingSchedule ? 'Saving...' : 'Save Schedule'}
                            </button>
                            {scheduleStatus === 'success' && <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold justify-center"><CheckCircle className="w-4 h-4" /> Schedule saved</div>}
                            {scheduleStatus === 'error' && <p className="text-red-500 text-sm text-center font-bold">Failed to save. Try again.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Generate API Key Modal (Phase 2.3) ── */}
            {showKeyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => { setShowKeyModal(false); setNewKeySecret(null); }} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center"><Key className="w-6 h-6 text-indigo-600" /></div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Generate API Key</h2>
                                <p className="text-gray-500 text-xs">For sub-merchant platform access</p>
                            </div>
                        </div>

                        {newKeySecret ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                    <p className="text-amber-700 font-black text-sm mb-1">Save your secret key now</p>
                                    <p className="text-amber-600 text-xs">This key will never be shown again.</p>
                                </div>
                                <div className="bg-gray-900 rounded-2xl p-4 font-mono text-xs text-emerald-400 break-all relative">
                                    {newKeySecret}
                                    <button onClick={() => copyToClipboard(newKeySecret!)}
                                        className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                                        {copiedKey ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                                    </button>
                                </div>
                                <button onClick={() => { setShowKeyModal(false); setNewKeySecret(null); }}
                                    className="w-full py-3 bg-gray-900 text-white font-black rounded-2xl">I've saved the key — Close</button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Key Label</label>
                                    <input type="text" placeholder="e.g. Production App" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Key Type</label>
                                    <div className="flex gap-2">
                                        {(['test', 'live'] as const).map(t => (
                                            <button key={t} onClick={() => setNewKeyType(t)}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${newKeyType === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleCreateKey} disabled={creatingKey || !newKeyLabel.trim()}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {creatingKey ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                                    {creatingKey ? 'Generating...' : 'Generate Key Pair'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Refund Modal (Phase 2.1) ── */}
            {showRefundModal && refundCharge && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => { setShowRefundModal(false); setRefundResult(null); }} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center"><RotateCcw className="w-6 h-6 text-red-500" /></div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Issue Refund</h2>
                                <p className="text-gray-500 text-xs font-mono">{refundCharge.id}</p>
                            </div>
                        </div>

                        {refundResult ? (
                            <div className={`p-6 rounded-2xl ${refundResult.status === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {refundResult.status === 'success' ? <CheckCircle className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
                                    <p className={`font-black text-sm ${refundResult.status === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                                        {refundResult.status === 'success' ? 'Refund Issued' : 'Refund Failed'}
                                    </p>
                                </div>
                                <p className={`text-sm ${refundResult.status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>{refundResult.message}</p>
                                <button onClick={() => { setShowRefundModal(false); setRefundResult(null); }} className="mt-4 w-full py-3 bg-gray-900 text-white rounded-xl font-black text-sm">Close</button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500 font-medium">Original charge</span>
                                        <span className="font-black text-gray-900">ZK {fmtAmt(refundCharge.amount)}</span>
                                    </div>
                                    {refundCharge.application_fee_amount != null && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Platform fee (will be reversed proportionally)</span>
                                            <span className="font-bold text-orange-600">ZK {fmtAmt(refundCharge.application_fee_amount)}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Refund Amount (ZK)</label>
                                    <input type="number" min="0.01" step="0.01" max={(refundCharge.amount / 100).toFixed(2)} value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all" />
                                    <p className="text-xs text-gray-400 mt-1">Max: ZK {fmtAmt(refundCharge.amount)}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Reason (optional)</label>
                                    <input type="text" placeholder="e.g. duplicate charge, customer request..." value={refundReason} onChange={e => setRefundReason(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all" />
                                </div>
                                <button onClick={handleRefund} disabled={refunding || !refundAmount || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > refundCharge.amount / 100}
                                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {refunding ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                                    {refunding ? 'Processing...' : `Refund ZK ${parseFloat(refundAmount || '0').toFixed(2)}`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
