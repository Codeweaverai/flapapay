import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import {
    ArrowLeft, CheckCircle, XCircle, User, Building2, Phone,
    CreditCard, Landmark, Smartphone, ShieldCheck, Clock, AlertCircle,
    RefreshCw, Mail, MapPin, Calendar
} from 'lucide-react';

const kycBadge = (status: string) => {
    switch (status) {
        case 'verified':       return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'pending_review': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'rejected':       return 'bg-red-50 text-red-600 border-red-200';
        default:               return 'bg-gray-50 text-gray-400 border-gray-200';
    }
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0 gap-4">
            <span className="text-sm text-gray-400 font-medium shrink-0">{label}</span>
            <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
        </div>
    );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-orange-500" />
                </div>
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">{title}</h3>
            </div>
            <div className="px-7 py-5">{children}</div>
        </div>
    );
}

export function AdminSubMerchantReview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchAccount = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/admin/sub-merchants/${id}`);
            setAccount(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load account');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAccount(); }, [id]);

    const handleApprove = async () => {
        if (!confirm(`Approve KYC for ${account?.display_name}? This will activate their account and notify them by email.`)) return;
        setApproving(true);
        setActionResult(null);
        try {
            await api.post(`/admin/sub-merchants/${id}/kyc/approve`);
            setActionResult({ type: 'success', message: `Account approved and activated. Email sent to ${account.email}.` });
            await fetchAccount();
        } catch (err: any) {
            setActionResult({ type: 'error', message: err.response?.data?.error || 'Approval failed' });
        } finally { setApproving(false); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setRejecting(true);
        setActionResult(null);
        try {
            await api.post(`/admin/sub-merchants/${id}/kyc/reject`, { reason: rejectReason });
            setActionResult({ type: 'success', message: `Account rejected. Sub-merchant has been notified by email.` });
            setShowRejectModal(false);
            setRejectReason('');
            await fetchAccount();
        } catch (err: any) {
            setActionResult({ type: 'error', message: err.response?.data?.error || 'Rejection failed' });
        } finally { setRejecting(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
        </div>
    );

    if (error || !account) return (
        <div className="p-8 text-center text-red-500">{error || 'Account not found'}</div>
    );

    const isActionable = account.kyc_status === 'pending_review';

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {/* Back + Header */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate('/admin/sub-merchants')} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors mt-1">
                    <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{account.display_name}</h1>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${kycBadge(account.kyc_status)}`}>
                            {account.kyc_status === 'pending_review' ? 'Pending Review' :
                             account.kyc_status === 'verified'       ? 'Verified' :
                             account.kyc_status === 'rejected'       ? 'Rejected' : 'Unverified'}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${account.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                            {account.status}
                        </span>
                    </div>
                    <p className="text-gray-400 mt-1 text-sm">{account.email} · Platform: <span className="font-semibold text-gray-600">{account.platform_name}</span></p>
                </div>
            </div>

            {/* Action Result */}
            {actionResult && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${actionResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {actionResult.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-sm font-semibold">{actionResult.message}</p>
                </div>
            )}

            {/* KYC Review Actions */}
            {isActionable && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <h3 className="font-black text-amber-800">KYC Awaiting Review</h3>
                    </div>
                    <p className="text-sm text-amber-700 mb-5">
                        Submitted {account.kyc_submitted_at ? new Date(account.kyc_submitted_at).toLocaleString() : ''}. Review the information below and approve or reject.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleApprove}
                            disabled={approving}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm disabled:opacity-50 transition-all"
                        >
                            {approving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Approve & Activate
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-2xl font-black text-sm transition-all"
                        >
                            <XCircle className="w-4 h-4" />
                            Reject
                        </button>
                    </div>
                </div>
            )}

            {/* Rejection reason if already rejected */}
            {account.kyc_status === 'rejected' && account.kyc_rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2">Rejection Reason on File</p>
                    <p className="text-sm text-red-700">{account.kyc_rejection_reason}</p>
                </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Identity */}
                <Section title="Identity" icon={User}>
                    <InfoRow label="Full Name" value={account.identity?.full_name} />
                    <InfoRow label="Business Name" value={account.identity?.business_name} />
                    <InfoRow label="NRC Number" value={account.identity?.nrc} />
                    <InfoRow label="Date of Birth" value={account.identity?.dob} />
                    <InfoRow label="Nationality" value={account.identity?.nationality} />
                    <InfoRow label="PACRA Number" value={account.identity?.pacra_number} />
                    <InfoRow label="TPIN" value={account.identity?.tpin} />
                    <InfoRow label="Business Category" value={account.identity?.category} />
                    <InfoRow label="Business Type" value={account.identity?.business_type} />
                </Section>

                {/* Contact */}
                <Section title="Contact Details" icon={Phone}>
                    <InfoRow label="Email" value={account.email} />
                    <InfoRow label="Phone" value={account.contact?.phone ? `+260 ${account.contact.phone}` : null} />
                    <InfoRow label="Address" value={account.contact?.address} />
                    <InfoRow label="City" value={account.contact?.city} />
                    <InfoRow label="Country" value={account.country} />
                    <InfoRow label="Website" value={account.contact?.website} />
                </Section>

                {/* Payout Method */}
                <Section title="Payout Method" icon={CreditCard}>
                    {account.payout_info?.type ? (
                        <>
                            <InfoRow label="Type" value={account.payout_info.type === 'mobile_money' ? 'Mobile Money' : 'Bank Account'} />
                            {account.payout_info.type === 'mobile_money' ? (
                                <>
                                    <InfoRow label="Network" value={(account.payout_info.mobile_network || '').toUpperCase()} />
                                    <InfoRow label="Number" value={`+260 ${account.payout_info.mobile_number}`} />
                                    <InfoRow label="OTP Verified" value={account.payout_info.mobile_verified ? '✓ Yes' : '✗ Not verified'} />
                                </>
                            ) : (
                                <>
                                    <InfoRow label="Bank" value={account.payout_info.bank_name} />
                                    <InfoRow label="Account Number" value={account.payout_info.bank_account_number} />
                                    <InfoRow label="Account Name" value={account.payout_info.bank_resolved_name} />
                                    <InfoRow label="Verified" value={account.payout_info.bank_verified ? '✓ Yes' : '✗ Pending'} />
                                </>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 italic">No payout method submitted</p>
                    )}
                </Section>

                {/* Account Meta */}
                <Section title="Account Info" icon={ShieldCheck}>
                    <InfoRow label="Account ID" value={account.id} />
                    <InfoRow label="Platform" value={account.platform_name} />
                    <InfoRow label="Created" value={new Date(account.created_at).toLocaleString()} />
                    <InfoRow label="KYC Submitted" value={account.kyc_submitted_at ? new Date(account.kyc_submitted_at).toLocaleString() : null} />
                    <InfoRow label="Account Status" value={account.status} />
                    <InfoRow label="KYC Status" value={account.kyc_status} />
                </Section>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowRejectModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-black text-gray-900 mb-1">Reject KYC Application</h2>
                        <p className="text-sm text-gray-500 mb-5">Provide a clear reason. This will be emailed to <strong>{account.email}</strong>.</p>
                        <textarea
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                            rows={4}
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. The NRC number provided does not match our records. Please resubmit with a clear copy of your NRC document."
                        />
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejecting || !rejectReason.trim()}
                                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {rejecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Reject & Notify
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
