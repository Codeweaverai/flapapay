import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

const requirements = [
    {
        id: 'business',
        emoji: '🏢',
        title: 'Business Registration (PACRA)',
        color: 'from-orange-500 to-amber-500',
        bg: 'bg-orange-50',
        border: 'border-orange-100',
        accent: 'text-orange-600',
        docs: [
            { name: 'Certificate of Incorporation', description: 'Original or certified copy from PACRA', required: true },
            { name: 'Articles of Association', description: 'Constitution documents of the company', required: true },
            { name: 'PACRA Form 3', description: 'Statement of Particulars of Directors/Shareholders', required: true },
            { name: 'Business Name Certificate', description: 'If trading under a name other than registered name', required: false },
        ]
    },
    {
        id: 'tax',
        emoji: '📋',
        title: 'Zambia Revenue Authority (ZRA)',
        color: 'from-blue-500 to-indigo-500',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        accent: 'text-blue-600',
        docs: [
            { name: 'TPIN Certificate', description: 'Taxpayer Identification Number from ZRA', required: true },
            { name: 'VAT Registration Certificate', description: 'Required if turnover exceeds ZK800,000 annually', required: false },
            { name: 'Tax Clearance Certificate', description: 'Valid tax clearance from ZRA (not older than 3 months)', required: true },
        ]
    },
    {
        id: 'directors',
        emoji: '👤',
        title: 'Directors & Shareholders',
        color: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        accent: 'text-emerald-600',
        docs: [
            { name: 'National Registration Card (NRC)', description: 'For all Zambian directors and shareholders', required: true },
            { name: 'Passport', description: 'For foreign directors and shareholders', required: true },
            { name: "Driver's Licence", description: 'Acceptable alternative photo ID for directors', required: false },
            { name: 'Passport-size photographs', description: 'For all directors — recent, white background', required: true },
            { name: 'Personal Bank Statement', description: 'Last 3 months for major shareholders (>25%)', required: true },
        ]
    },
    {
        id: 'corporate',
        emoji: '🌐',
        title: 'Corporate Shareholders',
        color: 'from-purple-500 to-violet-500',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
        accent: 'text-purple-600',
        docs: [
            { name: 'Certificate of Incorporation', description: 'For each corporate shareholder owning >25%', required: true },
            { name: 'Articles of Association', description: 'Corporate shareholder constitutional documents', required: true },
            { name: 'Board Resolution', description: 'Authorising the investment in FlapaPay merchant account', required: true },
            { name: 'Register of Directors & Shareholders', description: 'Full list with nationalities and shareholding percentages', required: true },
        ]
    },
    {
        id: 'bank',
        emoji: '🏦',
        title: 'Banking & Financial History',
        color: 'from-rose-500 to-pink-500',
        bg: 'bg-rose-50',
        border: 'border-rose-100',
        accent: 'text-rose-600',
        docs: [
            { name: 'Business Bank Statement', description: 'Last 6 months from primary business account', required: true },
            { name: 'Proof of Business Address', description: 'Utility bill or bank letter (not older than 3 months)', required: true },
            { name: 'Annual Audited Financial Statements', description: 'For businesses older than 2 years', required: false },
        ]
    },
    {
        id: 'face',
        emoji: '🤳',
        title: 'Identity Verification (Liveness)',
        color: 'from-slate-700 to-gray-900',
        bg: 'bg-gray-100',
        border: 'border-gray-200',
        accent: 'text-gray-600',
        docs: [
            { name: 'Face Capture (Video Selfie)', description: 'Real-time liveness check against submitted ID photo', required: true },
            { name: 'Biometric Consent Form', description: 'Signed consent for biometric data processing', required: true },
        ]
    },
];

export const ComplianceRequirements: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 md:p-12 overflow-x-hidden">
                <div className="max-w-4xl mx-auto space-y-10">
                    {/* Header */}
                    <div className="space-y-4">
                        <button onClick={() => navigate('/merchant/dashboard')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-500 font-black uppercase tracking-widest transition-colors">
                            <span>←</span> Merchant Hub
                        </button>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black tracking-tight text-gray-900">KYC Requirements</h1>
                                <p className="text-gray-500 font-medium text-lg">Document checklist for Zambian business verification.</p>
                            </div>
                            <button
                                onClick={() => navigate('/merchant/onboarding')}
                                className="bg-black text-white font-black px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all text-sm uppercase tracking-widest"
                            >
                                ✨ Start Verification →
                            </button>
                        </div>
                    </div>

                    {/* Status bar */}
                    <div className="bg-[#1A1A1A] text-white rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl shrink-0">⚖️</div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-white">Regulated by Bank of Zambia (BoZ)</h2>
                            <p className="text-gray-400 font-medium mt-1">FlapaPay operates under BoZ payment guidelines. All merchant onboarding follows the KYC/AML framework prescribed by the Financial Intelligence Centre Act (2010) of Zambia.</p>
                        </div>
                    </div>

                    {/* Requirements Grid */}
                    <div className="space-y-6">
                        {requirements.map((req) => {
                            const isOpen = activeSection === req.id;
                            return (
                                <div key={req.id} className={`rounded-[32px] border overflow-hidden transition-all duration-300 ${req.border} bg-white`}>
                                    <button
                                        onClick={() => setActiveSection(isOpen ? null : req.id)}
                                        className="w-full p-8 flex items-center gap-6 text-left hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className={`w-14 h-14 rounded-2xl ${req.bg} flex items-center justify-center text-2xl shrink-0`}>
                                            {req.emoji}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{req.docs.filter(d => d.required).length} required · {req.docs.filter(d => !d.required).length} optional</p>
                                            <h3 className="text-xl font-black text-gray-900">{req.title}</h3>
                                        </div>
                                        <div className={`w-8 h-8 flex items-center justify-center text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-8 pb-8 space-y-3">
                                            {req.docs.map((doc, i) => (
                                                <div key={i} className={`flex items-start gap-4 p-5 rounded-2xl border ${req.border} ${req.bg}/30`}>
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${doc.required ? `bg-gradient-to-br ${req.color} text-white` : 'bg-gray-100 text-gray-400'}`}>
                                                        {doc.required ? '✓' : '○'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900">{doc.name}</p>
                                                        <p className="text-sm text-gray-500 font-medium mt-0.5">{doc.description}</p>
                                                    </div>
                                                    <span className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ${doc.required ? `${req.bg} ${req.accent}` : 'bg-gray-50 text-gray-400'}`}>
                                                        {doc.required ? 'Required' : 'Optional'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* CTA */}
                    <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-[40px] p-10 text-white text-center space-y-6 shadow-2xl shadow-orange-500/20">
                        <h2 className="text-3xl font-black">Ready to get verified?</h2>
                        <p className="text-orange-100 font-medium">Gather your documents and start the guided verification journey. Most merchants complete it in under 20 minutes.</p>
                        <button
                            onClick={() => navigate('/merchant/onboarding')}
                            className="bg-white text-orange-600 font-black px-12 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl"
                        >
                            Begin Onboarding
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
