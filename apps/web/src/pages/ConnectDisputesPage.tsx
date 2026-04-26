import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { AlertTriangle, ArrowLeft, Plus, RefreshCw, CheckCircle, XCircle, Clock, MessageSquare, X, Upload, Eye, Paperclip, Loader2 } from 'lucide-react';

type DisputeStatus = 'open' | 'under_review' | 'won' | 'lost' | 'closed';

interface Dispute {
    id: string;
    charge_id: string;
    amount: number;
    currency: string;
    reason: string;
    status: DisputeStatus;
    customer_email: string | null;
    customer_statement: string | null;
    sub_merchant_name: string | null;
    evidence: any;
    resolution_notes: string | null;
    resolved_at: string | null;
    created_at: string;
}

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; icon: React.FC<any> }> = {
    open:         { label: 'Open',         color: 'bg-red-50 text-red-600 border-red-100',         icon: AlertTriangle },
    under_review: { label: 'Under Review', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: Clock },
    won:          { label: 'Won',          color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle },
    lost:         { label: 'Lost',         color: 'bg-gray-100 text-gray-500 border-gray-200',       icon: XCircle },
    closed:       { label: 'Closed',       color: 'bg-gray-100 text-gray-400 border-gray-200',       icon: XCircle },
};

const REASONS = ['duplicate', 'fraudulent', 'product_not_received', 'service_not_received', 'other'];

export const ConnectDisputesPage: React.FC = () => {
    const navigate = useNavigate();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('open');
    const [selected, setSelected] = useState<Dispute | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create dispute form
    const [createForm, setCreateForm] = useState({ charge_id: '', reason: 'fraudulent', customer_email: '', customer_statement: '', amount: '' });
    const [creating, setCreating] = useState(false);

    // Resolution form
    const [resolutionStatus, setResolutionStatus] = useState<DisputeStatus>('under_review');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [resolving, setResolving] = useState(false);
    const [resolveResult, setResolveResult] = useState<'idle' | 'success' | 'error'>('idle');

    // Evidence
    const [evidence, setEvidence] = useState<any[]>([]);
    const [evidenceLoading, setEvidenceLoading] = useState(false);
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [evidenceLabel, setEvidenceLabel] = useState('');
    const [uploadingEvidence, setUploadingEvidence] = useState(false);
    const [evidenceUploadResult, setEvidenceUploadResult] = useState<'idle' | 'success' | 'error'>('idle');

    const fetchEvidence = async (disputeId: string) => {
        setEvidenceLoading(true);
        try {
            const res = await api.get(`/v1/connect/disputes/${disputeId}/evidence`);
            setEvidence(res.data.evidence ?? []);
        } catch { setEvidence([]); } finally { setEvidenceLoading(false); }
    };

    const handleUploadEvidence = async () => {
        if (!selected || !evidenceFile) return;
        setUploadingEvidence(true);
        setEvidenceUploadResult('idle');
        try {
            const formData = new FormData();
            formData.append('file', evidenceFile);
            if (evidenceLabel) formData.append('label', evidenceLabel);
            await api.post(`/v1/connect/disputes/${selected.id}/evidence`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setEvidenceUploadResult('success');
            setEvidenceFile(null);
            setEvidenceLabel('');
            fetchEvidence(selected.id);
            setTimeout(() => setEvidenceUploadResult('idle'), 3000);
        } catch { setEvidenceUploadResult('error'); } finally { setUploadingEvidence(false); }
    };

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const params = filterStatus !== 'all' ? `?status=${filterStatus}&limit=100` : '?limit=100';
            const res = await api.get(`/v1/connect/disputes${params}`);
            setDisputes(res.data || []);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDisputes(); }, [filterStatus]);

    const handleCreate = async () => {
        if (!createForm.charge_id || !createForm.reason) return;
        setCreating(true);
        try {
            await api.post('/v1/connect/disputes', {
                charge_id: createForm.charge_id,
                reason: createForm.reason,
                customer_email: createForm.customer_email || undefined,
                customer_statement: createForm.customer_statement || undefined,
                amount: createForm.amount ? parseFloat(createForm.amount) : undefined
            });
            setShowCreateModal(false);
            setCreateForm({ charge_id: '', reason: 'fraudulent', customer_email: '', customer_statement: '', amount: '' });
            fetchDisputes();
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Failed to create dispute.');
        } finally { setCreating(false); }
    };

    const handleResolve = async () => {
        if (!selected) return;
        setResolving(true);
        setResolveResult('idle');
        try {
            const updated = await api.patch(`/v1/connect/disputes/${selected.id}`, {
                status: resolutionStatus,
                resolution_notes: resolutionNotes || undefined
            });
            setSelected(updated.data);
            setResolveResult('success');
            setDisputes(prev => prev.map(d => d.id === selected.id ? updated.data : d));
            setTimeout(() => setResolveResult('idle'), 3000);
        } catch { setResolveResult('error'); } finally { setResolving(false); }
    };

    const openCounts = disputes.filter(d => d.status === 'open').length;

    const StatusBadge: React.FC<{ status: DisputeStatus }> = ({ status }) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${cfg.color}`}>
                <Icon className="w-3 h-3" />{cfg.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 flex overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-rose-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                {/* Left — Dispute list */}
                <div className="w-[420px] border-r border-gray-100 flex flex-col overflow-hidden bg-white">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <button onClick={() => navigate('/merchant/connect')} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-xs font-bold mb-4 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Connect
                        </button>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                                <div>
                                    <h2 className="font-black text-lg text-gray-900">Disputes</h2>
                                    {openCounts > 0 && <p className="text-xs text-red-500 font-bold">{openCounts} open dispute{openCounts > 1 ? 's' : ''}</p>}
                                </div>
                            </div>
                            <button onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-red-500/20">
                                <Plus className="w-3.5 h-3.5" /> New
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {['all','open','under_review','won','lost','closed'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    {s === 'all' ? 'All' : s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-5 animate-pulse"><div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-100 rounded w-1/2"></div></div>
                            ))
                        ) : disputes.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">No disputes found.</div>
                        ) : (
                            disputes.map(dispute => (
                                <button key={dispute.id} onClick={() => { setSelected(dispute); setResolutionNotes(dispute.resolution_notes || ''); setResolutionStatus(dispute.status); setEvidence([]); fetchEvidence(dispute.id); }}
                                    className={`w-full text-left p-5 hover:bg-gray-50 transition-colors ${selected?.id === dispute.id ? 'bg-red-50 border-r-2 border-red-500' : ''}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-black text-sm text-gray-900 capitalize">{dispute.reason.replace(/_/g, ' ')}</p>
                                            <p className="text-xs font-mono text-gray-400 truncate max-w-[200px]">{dispute.charge_id}</p>
                                        </div>
                                        <StatusBadge status={dispute.status} />
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm font-black text-gray-900">{dispute.currency} {parseFloat(String(dispute.amount)).toFixed(2)}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(dispute.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {dispute.sub_merchant_name && (
                                        <p className="text-xs text-gray-400 mt-1">Sub-merchant: {dispute.sub_merchant_name}</p>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right — Detail + Resolution Panel */}
                <div className="flex-1 overflow-y-auto p-8 relative z-10">
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="font-bold text-sm">Select a dispute to review and resolve</p>
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 capitalize">{selected.reason.replace(/_/g, ' ')}</h2>
                                    <p className="text-xs font-mono text-gray-400 mt-1">{selected.id}</p>
                                </div>
                                <StatusBadge status={selected.status} />
                            </div>

                            {/* Details */}
                            <div className="bg-gray-50 rounded-3xl p-6 space-y-3 border border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Charge</span>
                                    <span className="font-mono font-bold text-gray-900">{selected.charge_id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Amount</span>
                                    <span className="font-black text-gray-900">{selected.currency} {parseFloat(String(selected.amount)).toFixed(2)}</span>
                                </div>
                                {selected.sub_merchant_name && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Sub-merchant</span>
                                        <span className="font-bold text-gray-900">{selected.sub_merchant_name}</span>
                                    </div>
                                )}
                                {selected.customer_email && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Customer</span>
                                        <span className="font-bold text-gray-900">{selected.customer_email}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Opened</span>
                                    <span className="text-gray-700">{new Date(selected.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            {selected.customer_statement && (
                                <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare className="w-4 h-4 text-orange-600" />
                                        <p className="font-black text-sm text-orange-700">Customer Statement</p>
                                    </div>
                                    <p className="text-sm text-orange-800 leading-relaxed">{selected.customer_statement}</p>
                                </div>
                            )}

                            {selected.resolution_notes && (
                                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                    <p className="font-black text-sm text-gray-700 mb-2">Resolution Notes</p>
                                    <p className="text-sm text-gray-600">{selected.resolution_notes}</p>
                                </div>
                            )}

                            {/* Resolution Controls */}
                            {!['won','lost','closed'].includes(selected.status) && (
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
                                    <h3 className="font-black text-gray-900">Resolve Dispute</h3>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Update Status</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(['open','under_review','won','lost'] as DisputeStatus[]).map(s => (
                                                <button key={s} onClick={() => setResolutionStatus(s)}
                                                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${resolutionStatus === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                    {s.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Resolution Notes</label>
                                        <textarea rows={3} placeholder="Document your decision..." value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all resize-none" />
                                    </div>
                                    <button onClick={handleResolve} disabled={resolving}
                                        className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                        {resolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        {resolving ? 'Saving...' : 'Update Dispute'}
                                    </button>
                                    {resolveResult === 'success' && <p className="text-center text-emerald-600 font-black text-sm">Updated successfully</p>}
                                    {resolveResult === 'error' && <p className="text-center text-red-500 font-black text-sm">Update failed</p>}
                                </div>
                            )}

                            {/* ── Evidence Files ─────────────────────────────── */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Paperclip className="w-4 h-4 text-gray-400" />
                                    <h3 className="font-black text-gray-900">Evidence Files</h3>
                                    <span className="ml-auto text-xs text-gray-400 font-medium">{evidence.length} file{evidence.length !== 1 ? 's' : ''}</span>
                                </div>

                                {/* Existing evidence */}
                                {evidenceLoading ? (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                                        <Loader2 size={14} className="animate-spin" /> Loading…
                                    </div>
                                ) : evidence.length > 0 ? (
                                    <div className="space-y-2">
                                        {evidence.map((ev: any) => (
                                            <div key={ev.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Paperclip size={12} className="text-gray-400 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{ev.file_name}</p>
                                                        {ev.label && <p className="text-xs text-gray-400">{ev.label}</p>}
                                                        <p className="text-[10px] text-gray-300">{new Date(ev.uploaded_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <a href={ev.file_url} target="_blank" rel="noreferrer"
                                                    className="p-2 text-gray-400 hover:text-orange-500 transition-colors shrink-0">
                                                    <Eye size={14} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No evidence files uploaded yet.</p>
                                )}

                                {/* Upload new evidence */}
                                <div className="pt-3 border-t border-gray-50 space-y-3">
                                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all">
                                        <Upload size={16} className="text-gray-300 mb-1" />
                                        <span className="text-xs text-gray-400 font-medium">
                                            {evidenceFile ? evidenceFile.name : 'Click to attach evidence (image, PDF)'}
                                        </span>
                                        <input type="file" accept="image/*,.pdf" className="hidden"
                                            onChange={e => setEvidenceFile(e.target.files?.[0] ?? null)} />
                                    </label>
                                    <input
                                        type="text"
                                        value={evidenceLabel}
                                        onChange={e => setEvidenceLabel(e.target.value)}
                                        placeholder="Label (e.g. Customer screenshot, Tracking info)"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                    <button
                                        onClick={handleUploadEvidence}
                                        disabled={!evidenceFile || uploadingEvidence}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 disabled:opacity-50 shadow-lg shadow-orange-500/20 transition-all"
                                    >
                                        {uploadingEvidence ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                        {uploadingEvidence ? 'Uploading…' : 'Upload Evidence'}
                                    </button>
                                    {evidenceUploadResult === 'success' && <p className="text-emerald-600 text-xs font-bold">Evidence uploaded successfully.</p>}
                                    {evidenceUploadResult === 'error' && <p className="text-red-500 text-xs font-bold">Upload failed. Try again.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Dispute Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Open Dispute</h2>
                                <p className="text-gray-500 text-xs">Log a customer dispute</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Charge ID</label>
                                <input type="text" placeholder="ch_xxxxxxxxxxxx" value={createForm.charge_id} onChange={e => setCreateForm(f => ({ ...f, charge_id: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Reason</label>
                                <select value={createForm.reason} onChange={e => setCreateForm(f => ({ ...f, reason: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all">
                                    {REASONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Customer Email (optional)</label>
                                <input type="email" placeholder="customer@example.com" value={createForm.customer_email} onChange={e => setCreateForm(f => ({ ...f, customer_email: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Customer Statement (optional)</label>
                                <textarea rows={3} placeholder="What the customer reported..." value={createForm.customer_statement} onChange={e => setCreateForm(f => ({ ...f, customer_statement: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all resize-none" />
                            </div>
                            <button onClick={handleCreate} disabled={creating || !createForm.charge_id}
                                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {creating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                                {creating ? 'Opening...' : 'Open Dispute'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
