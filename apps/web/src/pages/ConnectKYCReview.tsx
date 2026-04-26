import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { ShieldCheck, Clock, CheckCircle, XCircle, AlertCircle, Eye, ArrowLeft, RefreshCw, ChevronsUp } from 'lucide-react';

interface KYCAccount {
    id: string;
    business_name: string;
    email: string;
    kyc_status: string;
    kyc_submitted_at: string | null;
    kyc_reviewed_at: string | null;
    doc_count: number;
    pending_count: number;
}

interface KYCDocument {
    id: string;
    account_id: string;
    document_type: string;
    file_url: string;
    file_name: string;
    status: string;
    rejection_reason: string | null;
    uploaded_at: string;
}

const KYC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
    unverified:     { label: 'Unverified',     color: 'bg-gray-100 text-gray-500 border-gray-200',      icon: AlertCircle },
    pending_review: { label: 'Pending Review', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: Clock },
    verified:       { label: 'Verified',       color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle },
    rejected:       { label: 'Rejected',       color: 'bg-red-50 text-red-600 border-red-100',          icon: XCircle },
};

const DOC_TYPE_LABELS: Record<string, string> = {
    nrc: 'National ID (NRC)',
    passport: 'Passport',
    pacra_cert: 'PACRA Certificate',
    tpin_cert: 'TPIN Certificate',
    proof_of_address: 'Proof of Address',
};

export const ConnectKYCReview: React.FC = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<KYCAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState<KYCAccount | null>(null);
    const [kycData, setKycData] = useState<{ account: any; documents: KYCDocument[] } | null>(null);
    const [kycLoading, setKycLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('pending_review');
    const [reviewingDoc, setReviewingDoc] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
    const [approvingAll, setApprovingAll] = useState(false);
    const [approveAllResult, setApproveAllResult] = useState<{ approved: number; skipped: number } | null>(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/connect/accounts');
            // Enrich with kyc_status from stats
            const enriched = await Promise.all(res.data.map(async (a: any) => {
                try {
                    const kycRes = await api.get(`/v1/connect/accounts/${a.id}/kyc`);
                    return {
                        ...a,
                        kyc_status: kycRes.data.account?.kyc_status || 'unverified',
                        kyc_submitted_at: kycRes.data.account?.kyc_submitted_at,
                        doc_count: kycRes.data.documents?.length || 0,
                        pending_count: kycRes.data.documents?.filter((d: KYCDocument) => d.status === 'pending').length || 0,
                    };
                } catch {
                    return { ...a, kyc_status: 'unverified', doc_count: 0, pending_count: 0 };
                }
            }));
            setAccounts(enriched);
        } catch (err) {
            console.error('Failed to load accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    const openReview = async (account: KYCAccount) => {
        setSelectedAccount(account);
        setKycLoading(true);
        try {
            const res = await api.get(`/v1/connect/accounts/${account.id}/kyc`);
            setKycData(res.data);
        } catch (err) {
            console.error('Failed to load KYC data:', err);
        } finally {
            setKycLoading(false);
        }
    };

    const handleApproveAll = async () => {
        if (!selectedAccount) return;
        setApprovingAll(true);
        setApproveAllResult(null);
        try {
            const res = await api.post(`/v1/connect/accounts/${selectedAccount.id}/kyc/approve-all`);
            setApproveAllResult({ approved: res.data.approved ?? 0, skipped: res.data.skipped ?? 0 });
            // Refresh docs + account status
            const kycRes = await api.get(`/v1/connect/accounts/${selectedAccount.id}/kyc`);
            setKycData(kycRes.data);
            setAccounts(prev => prev.map(a =>
                a.id === selectedAccount.id
                    ? { ...a, kyc_status: kycRes.data.account?.kyc_status || a.kyc_status, pending_count: 0 }
                    : a
            ));
            setSelectedAccount(prev => prev ? { ...prev, kyc_status: kycRes.data.account?.kyc_status || prev.kyc_status } : null);
        } catch (err) {
            console.error('Approve all failed:', err);
        } finally {
            setApprovingAll(false);
        }
    };

    const handleReviewDoc = async (docId: string, status: 'approved' | 'rejected') => {
        if (!selectedAccount) return;
        setReviewingDoc(docId);
        try {
            const res = await api.patch(`/v1/connect/accounts/${selectedAccount.id}/kyc/${docId}`, {
                status,
                rejection_reason: status === 'rejected' ? rejectionReason : undefined
            });
            // Refresh KYC data and account list
            const kycRes = await api.get(`/v1/connect/accounts/${selectedAccount.id}/kyc`);
            setKycData(kycRes.data);
            setShowRejectInput(null);
            setRejectionReason('');
            // Update account kyc_status in list
            setAccounts(prev => prev.map(a =>
                a.id === selectedAccount.id
                    ? { ...a, kyc_status: res.data.account_kyc_status }
                    : a
            ));
            setSelectedAccount(prev => prev ? { ...prev, kyc_status: res.data.account_kyc_status } : null);
        } catch (err) {
            console.error('Review failed:', err);
        } finally {
            setReviewingDoc(null);
        }
    };

    const filtered = accounts.filter(a => filterStatus === 'all' || a.kyc_status === filterStatus);

    const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
        const cfg = KYC_STATUS_CONFIG[status] || KYC_STATUS_CONFIG.unverified;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${cfg.color}`}>
                <Icon className="w-3 h-3" /> {cfg.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 flex overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/30 to-transparent rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                {/* Left — Account List */}
                <div className="w-96 border-r border-gray-100 flex flex-col overflow-hidden bg-white">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <button onClick={() => navigate('/merchant/connect')} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-xs font-bold mb-4 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Connect
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-500/10 rounded-xl"><ShieldCheck className="w-5 h-5 text-orange-600" /></div>
                            <div>
                                <h2 className="font-black text-lg text-gray-900">KYC Review</h2>
                                <p className="text-xs text-gray-500">Sub-merchant verification</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {['all', 'pending_review', 'verified', 'rejected', 'unverified'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    {s === 'all' ? 'All' : s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-5 animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded-lg w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-100 rounded-lg w-1/2"></div>
                                </div>
                            ))
                        ) : filtered.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">No accounts match this filter.</div>
                        ) : (
                            filtered.map(account => (
                                <button key={account.id} onClick={() => openReview(account)}
                                    className={`w-full text-left p-5 hover:bg-gray-50 transition-colors ${selectedAccount?.id === account.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-600 font-black text-sm shrink-0">
                                                {account.business_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-gray-900">{account.business_name}</p>
                                                <p className="text-xs text-gray-400 font-mono">{account.email}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={account.kyc_status} />
                                    </div>
                                    {account.pending_count > 0 && (
                                        <div className="mt-2 flex items-center gap-1.5 text-orange-600 text-xs font-bold">
                                            <Clock className="w-3 h-3" />
                                            {account.pending_count} doc{account.pending_count > 1 ? 's' : ''} awaiting review
                                        </div>
                                    )}
                                    {account.kyc_submitted_at && (
                                        <p className="mt-1 text-[10px] text-gray-400">
                                            Submitted: {new Date(account.kyc_submitted_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right — Document Review Panel */}
                <div className="flex-1 overflow-y-auto p-8 relative z-10">
                    {!selectedAccount ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="font-bold text-sm">Select a sub-merchant to review their KYC documents</p>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">{selectedAccount.business_name}</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <StatusBadge status={selectedAccount.kyc_status} />
                                        <span className="text-xs text-gray-400">{kycData?.documents?.length || 0} documents uploaded</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(kycData?.documents?.some((d: KYCDocument) => d.status === 'pending') || selectedAccount.pending_count > 0) && (
                                        <button
                                            onClick={handleApproveAll}
                                            disabled={approvingAll}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all disabled:opacity-60 shadow-lg shadow-emerald-500/20"
                                        >
                                            {approvingAll
                                                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Approving...</>
                                                : <><ChevronsUp className="w-3.5 h-3.5" />Approve All Pending</>
                                            }
                                        </button>
                                    )}
                                    <button onClick={() => openReview(selectedAccount)} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-all">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Approve-all result */}
                            {approveAllResult && (
                                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-black text-emerald-800">
                                            {approveAllResult.approved} document{approveAllResult.approved !== 1 ? 's' : ''} approved
                                            {approveAllResult.skipped > 0 && `, ${approveAllResult.skipped} already reviewed`}
                                        </p>
                                    </div>
                                    <button onClick={() => setApproveAllResult(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {kycLoading ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-28 bg-gray-100 rounded-3xl animate-pulse"></div>
                                    ))}
                                </div>
                            ) : kycData?.documents?.length === 0 ? (
                                <div className="p-10 text-center bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-gray-400 font-medium">No documents uploaded by this sub-merchant yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {kycData?.documents?.map(doc => (
                                        <div key={doc.id} className={`bg-white rounded-3xl border p-6 shadow-sm transition-all ${doc.status === 'approved' ? 'border-emerald-100' : doc.status === 'rejected' ? 'border-red-100' : 'border-gray-100'}`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <p className="font-black text-gray-900">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{doc.file_name || 'Document'} · Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                    doc.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    doc.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-orange-50 text-orange-600 border-orange-100'
                                                }`}>{doc.status}</span>
                                            </div>

                                            {doc.rejection_reason && (
                                                <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-600 font-medium">
                                                    Rejection reason: {doc.rejection_reason}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3">
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-black text-gray-600 transition-all">
                                                    <Eye className="w-3.5 h-3.5" /> View Document
                                                </a>
                                                {doc.status !== 'approved' && (
                                                    <button onClick={() => handleReviewDoc(doc.id, 'approved')} disabled={reviewingDoc === doc.id}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all disabled:opacity-60">
                                                        {reviewingDoc === doc.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                                        Approve
                                                    </button>
                                                )}
                                                {doc.status !== 'rejected' && (
                                                    <>
                                                        {showRejectInput === doc.id ? (
                                                            <div className="flex-1 flex items-center gap-2">
                                                                <input type="text" placeholder="Reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400" />
                                                                <button onClick={() => handleReviewDoc(doc.id, 'rejected')} disabled={reviewingDoc === doc.id || !rejectionReason.trim()}
                                                                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black transition-all disabled:opacity-60">
                                                                    Confirm
                                                                </button>
                                                                <button onClick={() => setShowRejectInput(null)} className="px-3 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-black">Cancel</button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => setShowRejectInput(doc.id)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black transition-all border border-red-100">
                                                                <XCircle className="w-3.5 h-3.5" /> Reject
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
