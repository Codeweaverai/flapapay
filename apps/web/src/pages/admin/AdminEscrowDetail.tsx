import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { Button } from '../../components/ui/Button';
import {
    Shield,
    ArrowLeft,
    Clock,
    CheckCircle2,
    BrainCircuit,
    User,
    TrendingUp,
    FileText,
    Gavel,
    ArrowRightLeft,
    ShieldAlert
} from 'lucide-react';

export const AdminEscrowDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [escrow, setEscrow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchEscrow = async () => {
            try {
                const res = await api.get(`/admin/escrows/${id}`);
                setEscrow(res.data);
            } catch (err) {
                console.error('Failed to fetch admin escrow details:', err);
                alert('Failed to load escrow details.');
                navigate('/admin/escrows');
            } finally {
                setLoading(false);
            }
        };
        fetchEscrow();
    }, [id, navigate]);

    const handleAction = async (type: 'release' | 'refund') => {
        const confirmed = confirm(`Are you sure you want to FORCE ${type.toUpperCase()}? This is a final administrative override.`);
        if (!confirmed) return;

        setActionLoading(true);
        try {
            await api.post(`/admin/escrows/${id}/force-${type}`);
            const res = await api.get(`/admin/escrows/${id}`);
            setEscrow(res.data);
            alert(`Successfully ${type}ed funds.`);
        } catch (err: any) {
            alert(err.response?.data?.error || `Failed to ${type} funds.`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !escrow) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
    );

    const steps = [
        { key: 'CREATED', label: 'Proposed', icon: <FileText size={18} /> },
        { key: 'FUNDED', label: 'Secured', icon: <Shield size={18} /> },
        { key: 'DELIVERED', label: 'Delivered', icon: <TrendingUp size={18} /> },
        { key: 'RELEASE_REQUESTED', label: 'Reviewing', icon: <BrainCircuit size={18} /> },
        { key: 'RELEASED', label: 'Completed', icon: <CheckCircle2 size={18} /> }
    ];

    const currentStepIdx = steps.findIndex(s => s.key === escrow.status);

    return (
        <div className="space-y-8 pb-20">
            {/* Compact Navigation Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin/escrows')}
                    className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold text-xs transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Governance
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Transaction ID</span>
                    <code className="bg-white/50 px-3 py-1 rounded-lg text-xs font-mono text-slate-600 border border-slate-100">{escrow.id}</code>
                </div>
            </div>

            {/* Main Stats Card (Horizontal) */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${escrow.status === 'RELEASE_REQUESTED' ? 'bg-blue-500' :
                                    escrow.status === 'RELEASED' ? 'bg-emerald-500' :
                                        escrow.status === 'DISPUTED' ? 'bg-red-500' : 'bg-slate-400'
                                }`} />
                            <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                {escrow.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <div className="w-px h-12 bg-slate-100 hidden md:block" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Balance</p>
                        <p className="text-3xl font-black text-slate-900">
                            {parseFloat(escrow.amount).toLocaleString()} <span className="text-lg font-normal text-slate-400">{escrow.currency}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inspection Period</p>
                        <p className="text-lg font-bold text-slate-900">{escrow.inspection_period} Days Active</p>
                    </div>
                    <div className="bg-emerald-50 px-6 py-4 rounded-[24px] border border-emerald-500/10">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Escrow Security</p>
                        <p className="text-sm font-bold text-emerald-700">Funds Secured in Vault</p>
                    </div>
                </div>
            </div>

            {/* Parties Section (Wider Horizontal face-to-face) */}
            <div className="bg-white rounded-[40px] p-1 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-50">
                    {/* Buyer Column */}
                    <div className="p-10 flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden shadow-xl">
                                {escrow.buyer_avatar ? (
                                    <img src={escrow.buyer_avatar} className="w-full h-full object-cover" alt="Buyer" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-xl shadow-lg">
                                <User size={16} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900 leading-none">{escrow.buyer_name || 'Anonymous Buyer'}</h3>
                            <p className="text-xs font-bold text-slate-400">{escrow.buyer_email}</p>
                        </div>
                        <div className="px-6 py-2 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Transaction Source
                        </div>
                    </div>

                    {/* Center Flow Icon (Floating) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex w-16 h-16 bg-white border-8 border-slate-50 rounded-full items-center justify-center text-emerald-500 shadow-sm z-10">
                        <ArrowRightLeft size={24} />
                    </div>

                    {/* Seller Column */}
                    <div className="p-10 flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden shadow-xl">
                                {escrow.seller_avatar ? (
                                    <img src={escrow.seller_avatar} className="w-full h-full object-cover" alt="Seller" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                        <TrendingUp size={40} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-xl shadow-lg">
                                <TrendingUp size={16} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900 leading-none">{escrow.seller_name || 'Unregistered Seller'}</h3>
                            <p className="text-xs font-bold text-slate-400">{escrow.seller_email_actual || escrow.seller_email}</p>
                        </div>
                        <div className="px-6 py-2 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Payout Beneficiary
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal Timeline Bar */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 overflow-x-auto">
                <div className="min-w-[800px]">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-12 text-center">Platform Audit Timeline</h2>
                    <div className="flex items-center justify-between relative px-20">
                        {/* Connector Line */}
                        <div className="absolute left-32 right-32 top-8 h-1 bg-slate-100 -z-0" />
                        <div className="absolute left-32 top-8 h-1 bg-emerald-500 transition-all duration-1000 -z-0" style={{
                            width: `${Math.max(0, (currentStepIdx / (steps.length - 1)) * 100)}%`
                        }} />

                        {steps.map((step, idx) => {
                            const isPast = currentStepIdx >= idx || escrow.status === 'RELEASED';
                            const isCurrent = escrow.status === step.key;
                            return (
                                <div key={step.key} className="flex flex-col items-center gap-4 relative z-10 w-32">
                                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border-4 transition-all duration-700 ${isCurrent ? 'bg-slate-900 text-white border-emerald-500 shadow-xl shadow-emerald-500/20 scale-110' :
                                            isPast ? 'bg-emerald-100 text-emerald-600 border-emerald-50' :
                                                'bg-white text-slate-300 border-slate-50'
                                        }`}>
                                        {step.icon}
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isPast ? 'text-slate-900' : 'text-slate-300'}`}>
                                            {step.label}
                                        </p>
                                        {isCurrent && <p className="text-[9px] font-bold text-emerald-500 animate-bounce mt-1 italic">ACTIVE</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Area: AI Review & Admin Actions (Side by Side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Intelligence Card */}
                <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl min-h-[400px]">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <BrainCircuit size={160} />
                    </div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between border-b border-white/10 pb-6">
                            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <BrainCircuit size={20} />
                                AI Risk Assessment
                            </h3>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">System Engine v4.0</span>
                        </div>

                        {escrow.ai_alerts && escrow.ai_alerts.length > 0 ? (
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {escrow.ai_alerts.map((alert: any) => (
                                    <div key={alert.id} className="p-6 bg-white/5 border border-white/10 rounded-[32px] space-y-4 hover:bg-white/[0.08] transition-colors">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert size={16} className={alert.title.includes('HIGH') ? 'text-red-400' : 'text-emerald-400'} />
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${alert.title.includes('HIGH') || alert.title.includes('CRITICAL') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                    {alert.title}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-white/30 font-bold">{new Date(alert.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm font-bold leading-relaxed text-white/70 italic">
                                            "{alert.message}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <Clock size={48} className="mb-4" />
                                <p className="text-sm font-bold italic uppercase tracking-widest">No Alerts Flagged</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin Governance & Controls */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 space-y-8">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Gavel size={20} className="text-red-500" />
                            Administrative Override
                        </h3>

                        <div className="space-y-4 pt-4">
                            {escrow.status !== 'RELEASED' && escrow.status !== 'REFUNDED' ? (
                                <>
                                    <Button
                                        onClick={() => handleAction('release')}
                                        disabled={actionLoading}
                                        className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-[28px] font-black shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all disabled:opacity-50 text-base"
                                    >
                                        FORCE RELEASE TO SELLER
                                    </Button>
                                    <Button
                                        onClick={() => handleAction('refund')}
                                        disabled={actionLoading}
                                        className="w-full bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50 py-6 rounded-[28px] font-black shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 text-base uppercase"
                                    >
                                        Force Refund to Buyer
                                    </Button>
                                </>
                            ) : (
                                <div className="p-10 bg-slate-50 rounded-[32px] text-center space-y-2 border-2 border-dashed border-slate-100">
                                    <CheckCircle2 size={40} className="mx-auto text-emerald-500 mt-2" />
                                    <p className="font-black text-slate-900 text-xl tracking-tight uppercase">Audit Concluded</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">This transaction lifecycle has ended</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-red-50 rounded-[24px] border border-red-100 mt-4">
                            <div className="flex items-start gap-3">
                                <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-red-600 font-bold leading-relaxed italic uppercase tracking-wider">
                                    Critical Warning: Force actions bypass all smart contract safety gates. These actions are non-reversible and logged for compliance audit.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Terms Context (Integrated/Smaller) */}
                    <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Metadata</h3>
                            <FileText size={16} className="text-slate-300" />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Category</p>
                                <p className="text-sm font-black text-slate-900">Marketplace Goods</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Delivery</p>
                                <p className="text-sm font-black text-slate-900">{escrow.delivery_timeframe} Day Window</p>
                            </div>
                            <div className="col-span-2 space-y-2 pt-4 border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest uppercase">Agreement Instructions</p>
                                <p className="text-xs text-slate-600 font-bold leading-relaxed italic pr-4">
                                    "{escrow.instructions || 'Standard platform escrow protection terms. Buyer has verified delivery requirements before funding. Seller confirms shipment capability.'}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
