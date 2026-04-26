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
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-100" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <Sidebar />
            <main className="flex-1 min-h-screen p-6 md:p-8 md:ml-72 relative overflow-x-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/20 via-blue-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <header className="flex justify-between items-start mb-10">
                        <div>
                            <button
                                onClick={() => navigate('/escrow')}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-semibold text-sm mb-4 transition-colors group"
                            >
                                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Back to Dashboard
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">{escrow.description || 'Transaction Detail'}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">{escrow.status}</span>
                                <span className="text-xs text-gray-400">ID: {escrow.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-gray-900">{escrow.amount} <span className="text-lg font-normal text-gray-400">{escrow.currency}</span></p>
                            {escrow.escrow_fee_amount > 0 && (
                                <p className="text-xs font-semibold text-emerald-600 mt-1">Fee: -{escrow.escrow_fee_amount} {escrow.currency}</p>
                            )}
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Progress Timeline */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-6">Transaction Timeline</h2>
                                <div className="space-y-6">
                                    {steps.map((step, idx) => {
                                        const isPast = steps.findIndex(s => s.key === escrow.status) >= idx;
                                        const isCurrent = escrow.status === step.key;
                                        return (
                                            <div key={step.key} className="flex gap-4 relative">
                                                {idx !== steps.length - 1 && (
                                                    <div className={`absolute left-6 top-12 w-0.5 h-8 ${isPast ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                                                )}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 ${
                                                    isCurrent ? 'bg-emerald-500 text-white border-emerald-200 shadow-lg' :
                                                    isPast ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                                                        'bg-gray-50 text-gray-300 border-gray-200'
                                                    }`}>
                                                    <span className="font-bold text-sm">{idx + 1}</span>
                                                </div>
                                                <div className="pt-2">
                                                    <h3 className={`font-bold ${isPast ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</h3>
                                                    <p className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-300'}`}>{step.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Actions & Info Card */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="text-sm font-bold text-gray-500 mb-4">Actions</h2>

                                {escrow.status === 'CREATED' && isBuyer && (
                                    <div className="space-y-4 text-center">
                                        <div className="p-4 bg-emerald-50 rounded-xl mb-4">
                                            <p className="text-sm font-medium text-emerald-800">
                                                Funds must be secured before the seller can proceed.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleFund}
                                            disabled={actionLoading}
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {actionLoading ? 'Securing...' : 'Secure & Fund Now'}
                                        </Button>
                                    </div>
                                )}

                                {escrow.status === 'CREATED' && isSeller && (
                                    <div className="p-4 bg-orange-50 rounded-xl text-center">
                                        <p className="text-sm font-medium text-orange-800">
                                            Awaiting buyer to secure the funds for this transaction.
                                        </p>
                                    </div>
                                )}

                                {escrow.status === 'FUNDED' && (
                                    <div className="space-y-4">
                                        {isSeller ? (
                                            <>
                                                <div className="p-4 bg-emerald-50 rounded-xl mb-4">
                                                    <p className="text-sm font-medium text-emerald-800 text-center">
                                                        Funds are secured! Please deliver the item/service then mark as done.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={handleDeliver}
                                                    disabled={actionLoading}
                                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading ? 'Updating...' : 'Mark as Delivered'}
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="p-4 bg-yellow-50 rounded-xl text-center">
                                                <p className="text-sm font-medium text-yellow-800">
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
                                                <div className="p-4 bg-orange-50 rounded-xl mb-4 text-center">
                                                    <p className="text-sm font-medium text-orange-800">
                                                        Seller has marked as delivered! Please confirm to release funds.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={handleRelease}
                                                    disabled={actionLoading}
                                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading ? 'Requesting...' : 'Approve & Request Payout'}
                                                </Button>
                                                <Button className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors">
                                                    Open Dispute
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="p-4 bg-emerald-50 rounded-xl text-center">
                                                <p className="text-sm font-medium text-emerald-800">
                                                    You've marked as delivered. Awaiting buyer confirmation.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {escrow.status === 'RELEASE_REQUESTED' && (
                                    <div className="p-4 bg-blue-50 rounded-xl text-center space-y-3">
                                        <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        <p className="text-xs font-bold text-blue-800">Payout Under Review</p>
                                        <p className="text-sm text-blue-600 leading-relaxed">
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
                                        <h3 className="text-sm font-bold text-gray-900">Transaction Closed</h3>
                                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">This transaction was completed successfully and funds released.</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-900 rounded-2xl p-6 text-white">
                                <h2 className="text-sm font-bold text-emerald-500 mb-4">Participants</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 border-2 border-emerald-500/30">
                                            {escrow.buyer_avatar ? (
                                                <img src={escrow.buyer_avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 text-sm font-bold">
                                                    {escrow.buyer_name ? escrow.buyer_name.charAt(0).toUpperCase() : (escrow.buyer_email ? escrow.buyer_email.charAt(0).toUpperCase() : 'B')}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Buyer</p>
                                            <p className="text-sm font-semibold">{escrow.buyer_name || escrow.buyer_email || 'Buyer'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 border-2 border-orange-500/30">
                                            {escrow.seller_avatar ? (
                                                <img src={escrow.seller_avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-orange-500/20 text-orange-400 text-sm font-bold">
                                                    {escrow.seller_name ? escrow.seller_name.charAt(0).toUpperCase() : (escrow.seller_email ? escrow.seller_email.charAt(0).toUpperCase() : 'S')}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Seller</p>
                                            <p className="text-sm font-semibold">{escrow.seller_name || escrow.seller_email}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-800 space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Delivery Time</span>
                                            <span className="font-semibold text-emerald-400">{escrow.delivery_timeframe} Days</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Inspection Period</span>
                                            <span className="font-semibold text-emerald-400">{escrow.inspection_period} Days</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-800">
                                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Transaction Details</h4>
                                        <p className="text-sm text-gray-400 leading-relaxed">
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
