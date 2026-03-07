import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export const EscrowDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [escrow, setEscrow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchEscrow = async () => {
            try {
                const res = await api.get(`/escrows/${id}`);
                setEscrow(res.data);
            } catch (err) {
                console.error('Failed to fetch escrow details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEscrow();
    }, [id]);

    const handleFund = async () => {
        setActionLoading(true);
        try {
            await api.post(`/escrows/${id}/fund`);
            const res = await api.get(`/escrows/${id}`);
            setEscrow(res.data);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to fund escrow');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeliver = async () => {
        setActionLoading(true);
        try {
            await api.post(`/escrows/${id}/deliver`);
            const res = await api.get(`/escrows/${id}`);
            setEscrow(res.data);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to mark as delivered');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRelease = async () => {
        setActionLoading(true);
        try {
            await api.post(`/escrows/${id}/release`);
            const res = await api.get(`/escrows/${id}`);
            setEscrow(res.data);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to release funds');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !escrow) return null;

    const isBuyer = user?.id === escrow.buyer_id;
    const isSeller = user?.id === escrow.seller_id;

    const steps = [
        { key: 'CREATED', label: 'Proposed', desc: `Transaction for ${escrow.amount} ${escrow.currency} proposed` },
        { key: 'FUNDED', label: 'Secured', desc: `${escrow.amount} ${escrow.currency} held by FlapaPay` },
        { key: 'DELIVERED', label: 'Delivered', desc: 'Item marked as delivered by seller' },
        { key: 'RELEASE_REQUESTED', label: 'Reviewing', desc: 'FlapaPay Admin/AI verifying payout' },
        { key: 'RELEASED', label: 'Completed', desc: `${escrow.amount} ${escrow.currency} released to seller` }
    ];


    const isCompleted = escrow.status === 'RELEASED';

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <main className="flex-1 ml-80 p-8 lg:p-12">
                <div className="max-w-4xl mx-auto">
                    <header className="flex justify-between items-start mb-10">
                        <div>
                            <button
                                onClick={() => navigate('/escrow')}
                                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 font-bold text-xs mb-4 transition-colors group"
                            >
                                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Back to Dashboard
                            </button>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{escrow.description || 'Transaction Detail'}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="px-3 py-1 bg-white border border-emerald-500/20 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{escrow.status}</span>
                                <span className="text-xs text-gray-400 font-bold">ID: {escrow.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-gray-900">{escrow.amount} <span className="text-lg font-normal text-gray-400">{escrow.currency}</span></p>
                            {escrow.escrow_fee_amount > 0 && (
                                <p className="text-xs font-bold text-emerald-600 mt-1">Fee: -{escrow.escrow_fee_amount} {escrow.currency}</p>
                            )}
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Progress Timeline */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50">
                                <h2 className="text-lg font-black text-gray-900 mb-8 uppercase tracking-widest text-xs opacity-40">Transaction Timeline</h2>
                                <div className="space-y-10">
                                    {steps.map((step, idx) => {
                                        const isPast = steps.findIndex(s => s.key === escrow.status) >= idx;
                                        const isCurrent = escrow.status === step.key;
                                        return (
                                            <div key={step.key} className="flex gap-6 relative">
                                                {idx !== steps.length - 1 && (
                                                    <div className={`absolute left-7 top-14 w-0.5 h-12 ${isPast ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                                                )}
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-4 ${isCurrent ? 'bg-emerald-600 text-white border-emerald-100 shadow-xl shadow-emerald-500/20' :
                                                    isPast ? 'bg-emerald-100 text-emerald-600 border-emerald-50' :
                                                        'bg-gray-50 text-gray-300 border-transparent'
                                                    }`}>
                                                    <span className="font-black text-xs">{idx + 1}</span>
                                                </div>
                                                <div className="pt-2">
                                                    <h3 className={`font-black ${isPast ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</h3>
                                                    <p className={`text-sm font-bold ${isPast ? 'text-gray-500' : 'text-gray-200'}`}>{step.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Actions & Info Card */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Actions</h2>

                                {escrow.status === 'CREATED' && isBuyer && (
                                    <div className="space-y-4 text-center">
                                        <div className="p-6 bg-emerald-50 rounded-3xl mb-4">
                                            <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                                                Funds must be secured before the seller can proceed.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleFund}
                                            disabled={actionLoading}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {actionLoading ? 'Securing...' : 'Secure & Fund Now'}
                                        </Button>
                                    </div>
                                )}

                                {escrow.status === 'CREATED' && isSeller && (
                                    <div className="p-6 bg-orange-50 rounded-3xl text-center">
                                        <p className="text-xs font-bold text-orange-800 leading-relaxed">
                                            Awaiting buyer to secure the funds for this transaction.
                                        </p>
                                    </div>
                                )}

                                {escrow.status === 'FUNDED' && (
                                    <div className="space-y-4">
                                        {isSeller ? (
                                            <>
                                                <div className="p-6 bg-emerald-50 rounded-3xl mb-4">
                                                    <p className="text-xs font-bold text-emerald-800 leading-relaxed text-center">
                                                        Funds are secured! Please deliver the item/service then mark as done.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={handleDeliver}
                                                    disabled={actionLoading}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading ? 'Updating...' : 'Mark as Delivered'}
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="p-6 bg-yellow-50 rounded-3xl text-center">
                                                <p className="text-xs font-bold text-yellow-800 leading-relaxed">
                                                    Funds are secured. Awaiting seller to deliver the item.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {escrow.status === 'DELIVERED' && (
                                    <div className="space-y-4">
                                        {isBuyer ? (
                                            <>
                                                <div className="p-6 bg-orange-50 rounded-3xl mb-4 text-center">
                                                    <p className="text-xs font-bold text-orange-800 leading-relaxed">
                                                        Seller has marked as delivered! Please confirm to release funds.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={handleRelease}
                                                    disabled={actionLoading}
                                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading ? 'Requesting...' : 'Approve & Request Payout'}
                                                </Button>
                                                <Button className="w-full bg-red-100 text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-200 transition-colors">
                                                    Open Dispute
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="p-6 bg-emerald-50 rounded-3xl text-center">
                                                <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                                                    You've marked as delivered. Awaiting buyer confirmation.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {escrow.status === 'RELEASE_REQUESTED' && (
                                    <div className="p-6 bg-blue-50 rounded-3xl text-center space-y-3">
                                        <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Payout Under Review</p>
                                        <p className="text-xs font-bold text-blue-600 leading-relaxed">
                                            {isBuyer
                                                ? "You've approved delivery. Our AI Agent is performing a final security check before releasing funds."
                                                : "Buyer has approved delivery! FlapaPay is processing the payout."}
                                        </p>
                                    </div>
                                )}

                                {isCompleted && (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Transaction Closed</h3>
                                        <p className="text-xs font-bold text-gray-400 mt-2 leading-relaxed">This transaction was completed successfully and funds released.</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-900 rounded-[40px] p-8 text-white">
                                <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6">Participants</h2>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 border-2 border-emerald-500/20">
                                                {escrow.buyer_avatar ? (
                                                    <img src={escrow.buyer_avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 text-xs font-black">
                                                        {escrow.buyer_name ? escrow.buyer_name.charAt(0).toUpperCase() : (escrow.buyer_email ? escrow.buyer_email.charAt(0).toUpperCase() : 'B')}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Buyer</p>
                                                <p className="text-sm font-black">{escrow.buyer_name || escrow.buyer_email || 'Buyer'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 border-2 border-orange-500/20">
                                                {escrow.seller_avatar ? (
                                                    <img src={escrow.seller_avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-orange-500/10 text-orange-500 text-xs font-black">
                                                        {escrow.seller_name ? escrow.seller_name.charAt(0).toUpperCase() : (escrow.seller_email ? escrow.seller_email.charAt(0).toUpperCase() : 'S')}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Seller</p>
                                                <p className="text-sm font-black">{escrow.seller_name || escrow.seller_email}</p>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="pt-6 border-t border-gray-800 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-bold">Delivery Time</span>
                                            <span className="font-black text-emerald-400">{escrow.delivery_timeframe} Days</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-bold">Inspection Period</span>
                                            <span className="font-black text-emerald-400">{escrow.inspection_period} Days</span>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <h4 className="text-[10px] font-black uppercase text-gray-600 tracking-tighter mb-2">Transaction Details</h4>
                                        <p className="text-xs text-gray-400 italic leading-relaxed">
                                            Secure transaction for {escrow.amount} {escrow.currency}.
                                            {escrow.instructions ? ` Instructions: ${escrow.instructions}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
