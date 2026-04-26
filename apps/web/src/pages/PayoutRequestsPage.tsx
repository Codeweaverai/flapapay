import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock,
    DollarSign, AlertTriangle, Filter, Send
} from 'lucide-react';

type RequestStatus = 'pending' | 'approved' | 'denied' | 'processing' | 'completed' | 'failed';

interface PayoutRequest {
    id: string;
    account_id: string;
    business_name: string;
    account_email: string;
    amount: number;
    currency: string;
    status: RequestStatus;
    note: string | null;
    platform_note: string | null;
    reviewed_at: string | null;
    created_at: string;
}

const STATUS_CFG: Record<RequestStatus, { label: string; color: string; Icon: React.FC<any> }> = {
    pending:    { label: 'Pending',    color: 'bg-yellow-50 text-yellow-700 border-yellow-200', Icon: Clock },
    approved:   { label: 'Approved',   color: 'bg-blue-50 text-blue-700 border-blue-200', Icon: CheckCircle },
    denied:     { label: 'Denied',     color: 'bg-red-50 text-red-600 border-red-200', Icon: XCircle },
    processing: { label: 'Processing', color: 'bg-purple-50 text-purple-700 border-purple-200', Icon: RefreshCw },
    completed:  { label: 'Completed',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle },
    failed:     { label: 'Failed',     color: 'bg-gray-100 text-gray-500 border-gray-200', Icon: AlertTriangle },
};

function fmt(n: number, currency = 'ZMW') {
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default function PayoutRequestsPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('pending');

    const [actionTarget, setActionTarget] = useState<PayoutRequest | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'deny' | null>(null);
    const [platformNote, setPlatformNote] = useState('');
    const [actioning, setActioning] = useState(false);
    const [actionError, setActionError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/connect/payout-requests', { params: { status: statusFilter } });
            setRequests(res.data.requests ?? []);
            setTotal(res.data.total ?? 0);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { load(); }, [load]);

    async function handleAction() {
        if (!actionTarget || !actionType) return;
        setActioning(true);
        setActionError('');
        try {
            await api.patch(`/v1/connect/payout-requests/${actionTarget.id}`, {
                action: actionType,
                platform_note: platformNote || undefined,
            });
            setActionTarget(null);
            setActionType(null);
            setPlatformNote('');
            await load();
        } catch (err: any) {
            setActionError(err.response?.data?.error || 'Action failed');
        } finally {
            setActioning(false);
        }
    }

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/30 via-rose-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>
                <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all active:scale-95">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-0.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <Send className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">Disbursement Requests</span>
                                {pendingCount > 0 && (
                                    <span className="px-3 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                                        {pendingCount} pending
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Payout Requests</h1>
                            <p className="text-sm text-gray-500">Review and approve sub-merchant on-demand payout requests</p>
                        </div>
                        <button onClick={load} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 shadow-sm transition-all active:scale-95">
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* Status filter */}
                    <div className="flex gap-2 mb-6">
                        {(['pending', 'approved', 'denied', 'completed', 'all'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-2xl text-xs font-bold capitalize transition-all hover:-translate-y-0.5 ${
                                    statusFilter === s
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Action modal */}
                    {actionTarget && actionType && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">
                                    {actionType === 'approve' ? 'Approve Payout Request' : 'Deny Payout Request'}
                                </h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    {actionType === 'approve'
                                        ? `This will immediately disburse ${fmt(actionTarget.amount, actionTarget.currency)} to ${actionTarget.business_name}.`
                                        : `Deny the ${fmt(actionTarget.amount, actionTarget.currency)} request from ${actionTarget.business_name}.`
                                    }
                                </p>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Note to sub-merchant (optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={platformNote}
                                        onChange={e => setPlatformNote(e.target.value)}
                                        placeholder={actionType === 'deny' ? 'Reason for denial…' : 'Any notes for the sub-merchant…'}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                    />
                                </div>
                                {actionError && <p className="text-sm text-red-500 mb-3">{actionError}</p>}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setActionTarget(null); setActionType(null); setActionError(''); setPlatformNote(''); }}
                                        className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAction}
                                        disabled={actioning}
                                        className={`flex-1 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors ${
                                            actionType === 'approve'
                                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                                : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    >
                                        {actioning ? 'Processing…' : actionType === 'approve' ? 'Approve & Pay' : 'Deny Request'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Requests list */}
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-400">
                            <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <DollarSign size={36} className="mb-3 opacity-30" />
                            <p className="text-sm">No {statusFilter !== 'all' ? statusFilter : ''} payout requests</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map(req => {
                                const cfg = STATUS_CFG[req.status] ?? STATUS_CFG.pending;
                                const { Icon } = cfg;
                                return (
                                    <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-800">{req.business_name}</span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                                                        <Icon size={10} />
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400 mb-1">{req.account_email}</div>
                                                {req.note && (
                                                    <div className="text-xs text-gray-500 italic">"{req.note}"</div>
                                                )}
                                                {req.platform_note && (
                                                    <div className="text-xs text-gray-400 mt-1">Platform note: {req.platform_note}</div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-lg font-black text-gray-900">{fmt(req.amount, req.currency)}</div>
                                                <div className="text-xs text-gray-400">{new Date(req.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        {req.status === 'pending' && (
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                                                <button
                                                    onClick={() => { setActionTarget(req); setActionType('deny'); }}
                                                    className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                                                >
                                                    Deny
                                                </button>
                                                <button
                                                    onClick={() => { setActionTarget(req); setActionType('approve'); }}
                                                    className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                                                >
                                                    Approve &amp; Pay
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <p className="text-center text-xs text-gray-400 pt-2">{total} total request{total !== 1 ? 's' : ''}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
