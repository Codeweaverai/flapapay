import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface KycPayload {
    industry?: string;
    tradingName?: string;
    businessPhone?: string;
    businessEmail?: string;
    businessWebsite?: string;
    yearEstablished?: string;
    expectedMonthlyVolume?: string;
    businessDescription?: string;
    directors?: Array<{ fullName: string; nationality: string; idType: string; nrcOrPassport: string; sharePercentage: string }>;
    corpShareholders?: Array<{ companyName: string; countryOfIncorporation: string; regNumber: string; sharePercentage: string }>;
    files?: Record<string, string>;
    faceCapture?: string;
}

interface Merchant {
    id: string;
    business_name: string;
    business_type: string;
    country: string;
    compliance_status: 'SANDBOX_ONLY' | 'PENDING' | 'ACTIVE' | 'REJECTED';
    is_live_enabled: boolean;
    created_at: string;
    full_name?: string;
    email?: string;
    pacra_number?: string;
    tpin?: string;
    registered_address?: string;
    kyc_payload?: KycPayload;
    kyc_submitted_at?: string;
    admin_kyc_notes?: string;
}

const statusStyle = (s: string) => {
    switch (s) {
        case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
        case 'PENDING': return 'bg-amber-100 text-amber-700';
        case 'REJECTED': return 'bg-red-100 text-red-600';
        default: return 'bg-gray-100 text-gray-500';
    }
};

export const AdminMerchants = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => { fetchMerchants(); }, [filter]);

    const fetchMerchants = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:3005/admin/merchants?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed');
            setMerchants(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openReview = (m: Merchant) => {
        navigate(`/admin/merchants/${m.id}/kyc`);
    };

    // Fallback: also support old compliance endpoint
    const quickApprove = async (id: string, status: string, isLiveEnabled: boolean) => {
        if (!confirm(`Change status to ${status}?`)) return;
        try {
            await fetch(`http://localhost:3005/admin/merchants/${id}/compliance`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status, isLiveEnabled })
            });
            fetchMerchants();
        } catch { alert('Failed'); }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Merchant KYC</h1>
                    <p className="text-gray-500 font-medium mt-1">Review, approve, or reject merchant verification applications</p>
                </div>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-gray-900 font-bold text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 self-start shadow-sm hover:border-gray-200 transition-all cursor-pointer"
                >
                    <option value="ALL">All Merchants</option>
                    <option value="PENDING">⏳ Pending</option>
                    <option value="ACTIVE">✅ Active (Live)</option>
                    <option value="SANDBOX_ONLY">🔒 Sandbox Only</option>
                    <option value="REJECTED">❌ Rejected</option>
                </select>
            </div>

            {/* Merchant Cards */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center text-gray-500 font-bold shadow-sm">Loading...</div>
                ) : merchants.length === 0 ? (
                    <div className="bg-white rounded-[32px] border border-dashed border-gray-200 p-12 text-center text-gray-400">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="font-bold">No merchants found</p>
                    </div>
                ) : merchants.map(merchant => (
                    <div key={merchant.id} className="bg-white border border-gray-100 rounded-[28px] p-8 shadow-sm hover:shadow-md hover:border-orange-200 hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-orange-50 rounded-[20px] border border-orange-100 flex items-center justify-center text-3xl shrink-0 shadow-inner">🏢</div>
                                <div>
                                    <p className="font-black text-gray-900 text-xl tracking-tight leading-tight mb-1">{merchant.business_name || 'Unnamed Business'}</p>
                                    <p className="text-sm font-bold text-gray-500">{merchant.full_name} • {merchant.email}</p>
                                    {merchant.kyc_submitted_at && (
                                        <p className="text-xs text-gray-400 font-bold mt-1">Submitted: {new Date(merchant.kyc_submitted_at).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${statusStyle(merchant.compliance_status)}`}>
                                    {merchant.compliance_status.replace('_', ' ')}
                                </span>
                                {merchant.kyc_submitted_at && (
                                    <button
                                        onClick={() => openReview(merchant)}
                                        className="px-5 py-2.5 bg-orange-500 text-white font-black text-xs rounded-xl hover:bg-orange-600 transition-all uppercase tracking-widest"
                                    >
                                        Review Application →
                                    </button>
                                )}
                                {!merchant.kyc_submitted_at && (
                                    <button
                                        onClick={() => openReview(merchant)}
                                        className="px-6 py-3 bg-gray-100 text-gray-600 font-black text-xs rounded-[14px] hover:bg-gray-200 hover:text-gray-900 transition-all uppercase tracking-widest"
                                    >
                                        View Details
                                    </button>
                                )}
                                {merchant.compliance_status !== 'ACTIVE' && !merchant.kyc_submitted_at && (
                                    <button onClick={() => quickApprove(merchant.id, 'ACTIVE', true)} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 font-black text-xs rounded-xl hover:bg-emerald-500/30 transition-all">✓ Approve</button>
                                )}
                                {merchant.compliance_status !== 'REJECTED' && !merchant.kyc_submitted_at && (
                                    <button onClick={() => quickApprove(merchant.id, 'REJECTED', false)} className="px-4 py-2 bg-red-500/10 text-red-400 font-black text-xs rounded-xl hover:bg-red-500/20 transition-all">✗ Reject</button>
                                )}
                            </div>
                        </div>

                        {/* Quick Info Row */}
                        {(merchant.pacra_number || merchant.tpin || merchant.registered_address) && (
                            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap gap-8">
                                {merchant.pacra_number && <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">PACRA</p><p className="text-sm font-bold text-gray-800">{merchant.pacra_number}</p></div>}
                                {merchant.tpin && <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">TPIN</p><p className="text-sm font-bold text-gray-800">{merchant.tpin}</p></div>}
                                {merchant.registered_address && <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Address</p><p className="text-sm font-bold text-gray-800">{merchant.registered_address}</p></div>}
                            </div>
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
};
