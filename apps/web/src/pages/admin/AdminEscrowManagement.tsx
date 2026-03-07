import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Search,
    Filter,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    RefreshCw,
    Gavel
} from 'lucide-react';
import { api } from '../../lib/axios';

interface EscrowRecord {
    id: string;
    buyer_id: string;
    seller_id: string;
    buyer_name: string;
    buyer_email: string;
    seller_name: string;
    seller_email_actual: string;
    seller_email: string;
    amount: string;
    currency: string;
    status: string;
    created_at: string;
    updated_at: string;
    description: string;
    inspection_period: number;
    delivery_timeframe: number;
}

export const AdminEscrowManagement: React.FC = () => {
    const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedEscrow, setSelectedEscrow] = useState<EscrowRecord | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const navigate = useNavigate();

    const fetchEscrows = async () => {
        try {
            // Reusing the /escrows endpoint but since this is Admin, 
            // the server should ideally have a dedicated /admin/escrows endpoint.
            // I will implement GET /admin/escrows in the backend next if it doesn't exist.
            const res = await api.get('/admin/escrows');
            setEscrows(res.data);
        } catch (err) {
            console.error('Failed to fetch escrows', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEscrows();
    }, []);

    const handleForceRelease = async (id: string) => {
        if (!confirm('CRITICAL: Are you sure you want to FORCE RELEASE funds to the seller? This bypasses buyer approval.')) return;
        setIsActionLoading(true);
        try {
            await api.post(`/admin/escrows/${id}/force-release`);
            alert('Funds successfully released to seller via Admin override.');
            fetchEscrows();
            setSelectedEscrow(null);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to release funds');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleForceRefund = async (id: string) => {
        if (!confirm('CRITICAL: Are you sure you want to FORCE REFUND funds to the buyer? This bypasses seller delivery.')) return;
        setIsActionLoading(true);
        try {
            await api.post(`/admin/escrows/${id}/force-refund`);
            alert('Funds successfully refunded to buyer via Admin override.');
            fetchEscrows();
            setSelectedEscrow(null);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to refund funds');
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'RELEASED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'REFUNDED': return <RefreshCw className="w-4 h-4 text-orange-500" />;
            case 'DISPUTED': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'CANCELLED': return <XCircle className="w-4 h-4 text-slate-400" />;
            default: return <Clock className="w-4 h-4 text-blue-500" />;
        }
    };

    const filteredEscrows = escrows.filter(e => {
        const matchesSearch =
            e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
                        <Shield className="w-10 h-10 text-emerald-500" />
                        Escrow Governance
                    </h1>
                    <p className="text-slate-500 font-bold">Admin intervention panel for P2P transaction lifecycles and AI-detected risks.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500" />
                        <input
                            type="text"
                            placeholder="Search Escrow ID, User..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl pl-12 pr-6 py-2.5 font-bold focus:ring-2 focus:ring-emerald-500 min-w-[300px]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="FUNDED">Funded</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="RELEASE_REQUESTED">Pending Payout</option>
                        <option value="DISPUTED">Disputed</option>
                        <option value="RELEASED">Released</option>
                        <option value="REFUNDED">Refunded</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <th className="px-6 py-4">Escrow Hash</th>
                            <th className="px-6 py-4">Participants</th>
                            <th className="px-6 py-4">Value</th>
                            <th className="px-6 py-4">Current Stage</th>
                            <th className="px-6 py-4">Last Activity</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredEscrows.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-5 font-mono text-[11px] text-slate-400">
                                    {e.id.slice(0, 18)}...
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase">Buyer</span>
                                            <p className="text-xs font-black text-slate-900">{e.buyer_name || 'Anonymous'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">Seller</span>
                                            <p className="text-xs font-black text-slate-700">{e.seller_name || e.seller_email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 uppercase font-black text-slate-900">
                                    {parseFloat(e.amount).toLocaleString()} {e.currency}
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 animate-in fade-in duration-500">
                                        {getStatusIcon(e.status)}
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${e.status === 'DISPUTED' ? 'text-red-500' :
                                            e.status === 'RELEASED' ? 'text-green-600' :
                                                e.status === 'RELEASE_REQUESTED' ? 'text-blue-600' : 'text-slate-600'
                                            }`}>
                                            {e.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-xs font-bold text-slate-400">
                                    {new Date(e.updated_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button
                                        onClick={() => navigate(`/admin/escrows/${e.id}`)}
                                        className="p-2 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 rounded-xl transition-all"
                                    >
                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filteredEscrows.length === 0 && (
                    <div className="py-20 text-center">
                        <Gavel className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold italic">No escrow agreements found matching your filters.</p>
                    </div>
                )}
            </div>

            {/* Slide-over Detail / Intervene Panel */}
            {selectedEscrow && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl p-10 overflow-y-auto animate-in slide-in-from-right duration-500">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Escrow Resolution</h2>
                                <p className="text-xs font-mono text-slate-400">{selectedEscrow.id}</p>
                            </div>
                            <button onClick={() => setSelectedEscrow(null)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                <XCircle className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Summary Card */}
                            <div className="bg-emerald-500 rounded-[32px] p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Shield className="w-32 h-32" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Secured Funds</p>
                                <h3 className="text-5xl font-black mb-6">
                                    {parseFloat(selectedEscrow.amount).toLocaleString()} <span className="text-2xl opacity-60 font-medium">{selectedEscrow.currency}</span>
                                </h3>
                                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    Current State: {selectedEscrow.status}
                                </div>
                            </div>

                            {/* Info Groups */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Buyer</p>
                                    <p className="font-black text-slate-900">{selectedEscrow.buyer_name || 'Not Found'}</p>
                                    <p className="text-xs text-slate-500 truncate">{selectedEscrow.buyer_email}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Seller</p>
                                    <p className="font-black text-slate-900">{selectedEscrow.seller_name || 'Invited User'}</p>
                                    <p className="text-xs text-slate-500 truncate">{selectedEscrow.seller_email}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2 uppercase text-xs">
                                    <Filter className="w-4 h-4 text-emerald-500" />
                                    Transaction Context
                                </h4>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between p-3 bg-white rounded-xl border border-slate-100">
                                        <span className="font-bold text-slate-500">Inspection Period</span>
                                        <span className="font-black text-slate-900">{selectedEscrow.inspection_period} Days</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-white rounded-xl border border-slate-100">
                                        <span className="font-bold text-slate-500">Delivery Deadline</span>
                                        <span className="font-black text-slate-900">{selectedEscrow.delivery_timeframe} Days</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-xl border border-slate-100">
                                        <p className="font-bold text-slate-500 mb-2 uppercase text-[10px]">Description</p>
                                        <p className="font-black text-slate-800 leading-relaxed italic">"{selectedEscrow.description || 'No description provided'}"</p>
                                    </div>
                                </div>
                            </div>

                            {/* INTERVENTION ACTIONS */}
                            <div className="pt-6 space-y-4">
                                <h4 className="font-black text-red-500 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                                    <AlertTriangle className="w-4 h-4" />
                                    Admin Intervention Zone
                                </h4>
                                {selectedEscrow.status !== 'RELEASED' && selectedEscrow.status !== 'REFUNDED' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            disabled={isActionLoading}
                                            onClick={() => handleForceRelease(selectedEscrow.id)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-5 rounded-[24px] font-black text-sm flex flex-col items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                        >
                                            <CheckCircle2 className="w-6 h-6" />
                                            FORCE RELEASE
                                        </button>
                                        <button
                                            disabled={isActionLoading}
                                            onClick={() => handleForceRefund(selectedEscrow.id)}
                                            className="bg-orange-500 hover:bg-orange-600 text-white p-5 rounded-[24px] font-black text-sm flex flex-col items-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                                        >
                                            <RefreshCw className="w-6 h-6" />
                                            FORCE REFUND
                                        </button>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-center px-6 italic">
                                    Intervention will automatically update the ledger, resolve any open disputes, and notify all parties of the Admin's final decision.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
