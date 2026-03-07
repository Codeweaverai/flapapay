import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface KycPayload {
    industry?: string;
    subIndustry?: string;
    tradingName?: string;
    businessPhone?: string;
    businessEmail?: string;
    businessWebsite?: string;
    yearEstablished?: string;
    expectedMonthlyVolume?: string;
    businessDescription?: string;
    directors?: Array<{ fullName: string; nationality: string; idType: string; nrcOrPassport: string; sharePercentage: string; id?: string }>;
    corpShareholders?: Array<{ companyName: string; countryOfIncorporation: string; regNumber: string; sharePercentage: string; id?: string }>;
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

export const AdminMerchantReview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [loading, setLoading] = useState(true);
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        const fetchMerchant = async () => {
            try {
                setLoading(true);
                // We use the same endpoint but might need to filter if there isn't a single fetch endpoint
                // Actually unified-server.js has /admin/merchants (list)
                // Let's check if it has a detail endpoint
                const res = await fetch(`http://localhost:3005/admin/merchants`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const all = await res.json();
                const found = all.find((m: Merchant) => m.id === id);
                if (found) {
                    setMerchant(found);
                    setAdminNotes(found.admin_kyc_notes || '');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMerchant();
    }, [id, token]);

    const submitReview = async (decision: 'ACTIVE' | 'REJECTED' | 'PENDING') => {
        if (!merchant) return;
        try {
            const res = await fetch(`http://localhost:3005/admin/merchants/kyc/${merchant.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ decision, adminNotes })
            });
            if (!res.ok) throw new Error('Failed');
            navigate('/admin/merchants');
        } catch {
            alert('Failed to submit review');
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400">Loading Merchant Details...</div>;
    if (!merchant) return <div className="p-12 text-center text-gray-400">Merchant not found</div>;

    const kyc = merchant.kyc_payload || {};
    const files = kyc.files || {};

    const docLabels: Record<string, string> = {
        certificateOfIncorporation: 'Certificate of Incorporation',
        articlesOfAssociation: 'Articles of Association',
        pacraForm3: 'PACRA Form 3',
        tpinCertificate: 'TPIN Certificate',
        taxClearance: 'Tax Clearance',
        bankStatement: 'Bank Statement',
        proofOfAddress: 'Proof of Address',
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <button onClick={() => navigate('/admin/merchants')} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all font-blacks text-lg">←</button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{merchant.business_name}</h1>
                        <p className="text-gray-500 font-bold mt-1">KYC Review for Live Activation</p>
                    </div>
                </div>
                <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] shadow-sm border ${merchant.compliance_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    merchant.compliance_status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {merchant.compliance_status.replace('_', ' ')}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Business Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Core Business Details */}
                    <div className="bg-white border border-gray-100 shadow-sm rounded-[32px] p-8 space-y-8">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-[14px] bg-orange-50 border border-orange-100 flex items-center justify-center text-lg">🏢</span>
                            Business Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { label: 'Registered Name', value: merchant.business_name },
                                { label: 'Trading Name', value: kyc.tradingName || merchant.business_name },
                                { label: 'PACRA Number', value: merchant.pacra_number },
                                { label: 'TPIN', value: merchant.tpin },
                                { label: 'Industry', value: `${kyc.industry} (${kyc.subIndustry})` },
                                { label: 'Year Established', value: kyc.yearEstablished },
                                { label: 'Monthly Volume', value: kyc.expectedMonthlyVolume ? `ZMW ${kyc.expectedMonthlyVolume}` : null },
                                { label: 'Contact', value: `${kyc.businessPhone} / ${kyc.businessEmail}` },
                                { label: 'Website', value: kyc.businessWebsite },
                                { label: 'Address', value: merchant.registered_address, full: true },
                            ].filter(f => f.value).map(field => (
                                <div key={field.label} className={field.full ? 'md:col-span-2' : ''}>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{field.label}</p>
                                    <p className="text-base font-bold text-gray-900">{field.value}</p>
                                </div>
                            ))}
                        </div>
                        {kyc.businessDescription && (
                            <div className="pt-6 border-t border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</p>
                                <p className="text-sm text-gray-700 leading-relaxed font-bold">{kyc.businessDescription}</p>
                            </div>
                        )}
                    </div>

                    {/* Directors Section */}
                    {kyc.directors && kyc.directors.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 px-2">
                                <span className="w-10 h-10 rounded-[14px] bg-blue-50 border border-blue-100 flex items-center justify-center text-lg">👥</span>
                                Directors & Key Personnel
                            </h3>
                            {kyc.directors.map((d, i) => (
                                <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-[32px] p-8 space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl border border-gray-200">👤</div>
                                            <div>
                                                <p className="text-xl font-black text-gray-900 tracking-tight">{d.fullName}</p>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{d.nationality} • {d.idType}</p>
                                            </div>
                                        </div>
                                        {d.sharePercentage && <span className="bg-orange-50 text-orange-600 border border-orange-100 px-4 py-2 rounded-xl text-xs font-black shadow-inner">{d.sharePercentage}% Equity</span>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5">ID Number</p>
                                            <p className="text-sm font-black text-gray-900">{d.nrcOrPassport}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {files[`directorPassportPhoto_${i}`] && (
                                                <a href={files[`directorPassportPhoto_${i}`]} target="_blank" rel="noopener noreferrer" className="flex-1 bg-white border border-gray-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:shadow-md transition-all">
                                                    <span className="text-2xl">🖼️</span>
                                                    <span className="text-[9px] font-black tracking-widest uppercase text-gray-500 text-center">Passport Photo</span>
                                                </a>
                                            )}
                                            {files[`directorIdCopy_${i}`] && (
                                                <a href={files[`directorIdCopy_${i}`]} target="_blank" rel="noopener noreferrer" className="flex-1 bg-white border border-gray-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:shadow-md transition-all">
                                                    <span className="text-2xl">🆔</span>
                                                    <span className="text-[9px] font-black tracking-widest uppercase text-gray-500 text-center">ID / NRC Copy</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Corp Shareholders Section */}
                    {kyc.corpShareholders && kyc.corpShareholders.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 px-2">
                                <span className="w-10 h-10 rounded-[14px] bg-purple-50 border border-purple-100 flex items-center justify-center text-lg">🏢</span>
                                Corporate Shareholders
                            </h3>
                            {kyc.corpShareholders.map((c, i) => (
                                <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-[32px] p-8 space-y-6">
                                    <div>
                                        <p className="text-xl font-black text-gray-900 tracking-tight">{c.companyName}</p>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{c.countryOfIncorporation} • Reg: {c.regNumber}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        {files[`corpIncorpCert_${i}`] && (
                                            <a href={files[`corpIncorpCert_${i}`]} target="_blank" rel="noopener noreferrer" className="flex-1 bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex items-center gap-4 hover:border-purple-400 hover:shadow-md transition-all">
                                                <span className="text-2xl">📄</span>
                                                <span className="text-[10px] font-black tracking-widest uppercase text-gray-700">Incorp Cert</span>
                                            </a>
                                        )}
                                        {files[`corpArticles_${i}`] && (
                                            <a href={files[`corpArticles_${i}`]} target="_blank" rel="noopener noreferrer" className="flex-1 bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex items-center gap-4 hover:border-purple-400 hover:shadow-md transition-all">
                                                <span className="text-2xl">📄</span>
                                                <span className="text-[10px] font-black tracking-widest uppercase text-gray-700">Articles</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Files & Action */}
                <div className="space-y-8">
                    {/* Face Verification */}
                    {kyc.faceCapture && (
                        <div className="bg-white border border-gray-100 shadow-sm rounded-[32px] p-8 space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Biometric Check</h3>
                            <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 p-1">
                                <img src={kyc.faceCapture} alt="Capture" className="w-full h-full object-cover rounded-[20px]" />
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
                                <span className="text-lg">✓</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Liveness Verified by Merchant</span>
                            </div>
                        </div>
                    )}

                    {/* Business Documents */}
                    <div className="bg-white border border-gray-100 shadow-sm rounded-[32px] p-8 space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Business Documents</h3>
                        <div className="space-y-3">
                            {Object.entries(docLabels).map(([key, label]) => {
                                const url = files[key];
                                return (
                                    <div key={key} className={`group flex items-center justify-between p-5 rounded-2xl border transition-all ${url ? 'bg-white border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md' : 'bg-gray-50 border-dashed border-gray-200 opacity-60'}`}>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl">{url ? '📄' : '⭕'}</span>
                                            <span className={`text-[11px] font-black tracking-widest uppercase ${url ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                                        </div>
                                        {url && (
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-orange-400 uppercase opacity-0 group-hover:opacity-100 transition-all">View</a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Review Decision Card */}
                    <div className="bg-white border-2 border-orange-200 rounded-[32px] p-8 space-y-6 sticky top-8 shadow-xl shadow-orange-500/10">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Review Decision</h3>
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Internal / Feedback Notes</p>
                            <textarea
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                placeholder="Write feedback for merchant..."
                                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 text-gray-900 font-bold text-sm outline-none focus:border-orange-400 focus:bg-white transition-all resize-none h-32"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => submitReview('ACTIVE')}
                                className="w-full bg-emerald-50 text-emerald-600 font-black py-4 rounded-xl hover:bg-emerald-100 transition-all text-sm uppercase tracking-widest border border-emerald-200 shadow-sm"
                            >
                                ✅ Approve & Go Live
                            </button>
                            <button
                                onClick={() => submitReview('PENDING')}
                                className="w-full bg-amber-50 text-amber-700 font-black py-3 rounded-xl hover:bg-amber-100 transition-all text-sm border border-amber-200 shadow-sm"
                            >
                                Request Clarification (Pending)
                            </button>
                            <button
                                onClick={() => submitReview('REJECTED')}
                                className="w-full bg-red-50 text-red-600 font-black py-3 rounded-xl hover:bg-red-100 transition-all text-sm border border-red-200 shadow-sm"
                            >
                                ❌ Reject Application
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
