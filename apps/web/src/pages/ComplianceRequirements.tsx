import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import {
    ArrowRight, Building2, FileText, Users, Globe, Landmark,
    ScanFace, ChevronDown, CheckCircle2, Circle, Shield,
    AlertCircle, ArrowUpRight, Clock
} from 'lucide-react';

const requirements = [
    {
        id: 'business',
        Icon: Building2,
        title: 'Business Registration (PACRA)',
        accent: 'text-orange-600',
        iconBg: 'bg-orange-100',
        badge: 'bg-orange-50 text-orange-600 border-orange-100',
        bar: 'bg-orange-500',
        docs: [
            { name: 'Certificate of Incorporation', description: 'Original or certified copy from PACRA', required: true },
            { name: 'Articles of Association', description: 'Constitution documents of the company', required: true },
            { name: 'PACRA Form 3', description: 'Statement of Particulars of Directors/Shareholders', required: true },
            { name: 'Business Name Certificate', description: 'If trading under a name other than registered name', required: false },
        ],
    },
    {
        id: 'tax',
        Icon: FileText,
        title: 'Zambia Revenue Authority (ZRA)',
        accent: 'text-blue-600',
        iconBg: 'bg-blue-100',
        badge: 'bg-blue-50 text-blue-600 border-blue-100',
        bar: 'bg-blue-500',
        docs: [
            { name: 'TPIN Certificate', description: 'Taxpayer Identification Number from ZRA', required: true },
            { name: 'VAT Registration Certificate', description: 'Required if turnover exceeds ZK 800,000 annually', required: false },
            { name: 'Tax Clearance Certificate', description: 'Valid tax clearance from ZRA — not older than 3 months', required: true },
        ],
    },
    {
        id: 'directors',
        Icon: Users,
        title: 'Directors & Shareholders',
        accent: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
        badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        bar: 'bg-emerald-500',
        docs: [
            { name: 'National Registration Card (NRC)', description: 'For all Zambian directors and shareholders', required: true },
            { name: 'Passport', description: 'For foreign directors and shareholders', required: true },
            { name: "Driver's Licence", description: 'Acceptable alternative photo ID for directors', required: false },
            { name: 'Passport-size Photographs', description: 'For all directors — recent, white background', required: true },
            { name: 'Personal Bank Statement', description: 'Last 3 months for major shareholders (>25%)', required: true },
        ],
    },
    {
        id: 'corporate',
        Icon: Globe,
        title: 'Corporate Shareholders',
        accent: 'text-purple-600',
        iconBg: 'bg-purple-100',
        badge: 'bg-purple-50 text-purple-600 border-purple-100',
        bar: 'bg-purple-500',
        docs: [
            { name: 'Certificate of Incorporation', description: 'For each corporate shareholder owning >25%', required: true },
            { name: 'Articles of Association', description: 'Corporate shareholder constitutional documents', required: true },
            { name: 'Board Resolution', description: 'Authorising the investment in FlapaPay merchant account', required: true },
            { name: 'Register of Directors & Shareholders', description: 'Full list with nationalities and shareholding percentages', required: true },
        ],
    },
    {
        id: 'bank',
        Icon: Landmark,
        title: 'Banking & Financial History',
        accent: 'text-rose-600',
        iconBg: 'bg-rose-100',
        badge: 'bg-rose-50 text-rose-600 border-rose-100',
        bar: 'bg-rose-500',
        docs: [
            { name: 'Business Bank Statement', description: 'Last 6 months from primary business account', required: true },
            { name: 'Proof of Business Address', description: 'Utility bill or bank letter — not older than 3 months', required: true },
            { name: 'Annual Audited Financial Statements', description: 'For businesses older than 2 years', required: false },
        ],
    },
    {
        id: 'face',
        Icon: ScanFace,
        title: 'Identity Verification (Liveness)',
        accent: 'text-gray-700',
        iconBg: 'bg-gray-100',
        badge: 'bg-gray-50 text-gray-600 border-gray-200',
        bar: 'bg-gray-700',
        docs: [
            { name: 'Face Capture (Video Selfie)', description: 'Real-time liveness check against submitted ID photo', required: true },
            { name: 'Biometric Consent Form', description: 'Signed consent for biometric data processing', required: true },
        ],
    },
];

const totalRequired = requirements.reduce((a, r) => a + r.docs.filter(d => d.required).length, 0);
const totalOptional = requirements.reduce((a, r) => a + r.docs.filter(d => !d.required).length, 0);

export const ComplianceRequirements: React.FC = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState<string | null>('business');

    return (
        <div className="min-h-screen bg-[#F8F9FB] lg:pl-64 font-sans">
            <Sidebar isOpen={false} />

            <main className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/merchant/dashboard')}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors mb-2"
                        >
                            <ArrowRight className="w-3 h-3 rotate-180" /> Merchant Dashboard
                        </button>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <Shield className="w-7 h-7 text-orange-500" />
                            KYC Requirements
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Document checklist for Zambian business verification</p>
                    </div>
                    <button
                        onClick={() => navigate('/merchant/onboarding')}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-orange-200 shrink-0"
                    >
                        Start Verification <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Stats row ──────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Document Categories', value: requirements.length.toString(), icon: <FileText className="w-4 h-4 text-orange-500" />, bg: 'bg-orange-100' },
                        { label: 'Required Documents', value: totalRequired.toString(), icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-100' },
                        { label: 'Optional Documents', value: totalOptional.toString(), icon: <Circle className="w-4 h-4 text-gray-400" />, bg: 'bg-gray-100' },
                    ].map(s => (
                        <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>{s.icon}</div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── BoZ notice ─────────────────────────────────────── */}
                <div className="bg-gray-900 rounded-2xl p-6 flex items-start gap-5">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Regulated by Bank of Zambia (BoZ)</h2>
                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                            FlapaPay operates under BoZ payment guidelines. All merchant onboarding follows the KYC/AML
                            framework prescribed by the Financial Intelligence Centre Act (2010) of Zambia.
                        </p>
                    </div>
                    <div className="ml-auto shrink-0 hidden md:flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Compliant
                    </div>
                </div>

                {/* ── Estimated time ─────────────────────────────────── */}
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-700 font-medium">
                        <span className="font-bold">Most merchants complete verification in under 20 minutes.</span>
                        {' '}Prepare your documents before you start for the smoothest experience.
                    </p>
                </div>

                {/* ── Accordion sections ─────────────────────────────── */}
                <div className="space-y-3">
                    {requirements.map((req) => {
                        const isOpen = open === req.id;
                        const requiredCount = req.docs.filter(d => d.required).length;
                        const optionalCount = req.docs.filter(d => !d.required).length;
                        return (
                            <div key={req.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-visible">
                                {/* Section header */}
                                <button
                                    onClick={() => setOpen(isOpen ? null : req.id)}
                                    className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-gray-50/50 transition-colors rounded-2xl"
                                >
                                    <div className={`w-10 h-10 ${req.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                                        <req.Icon className={`w-5 h-5 ${req.accent}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-gray-900">{req.title}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-semibold text-gray-400">{requiredCount} required</span>
                                            {optionalCount > 0 && (
                                                <>
                                                    <span className="text-gray-200">·</span>
                                                    <span className="text-[10px] font-semibold text-gray-400">{optionalCount} optional</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* Mini progress bar */}
                                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${req.bar} rounded-full transition-all duration-500`}
                                                style={{ width: `${(requiredCount / req.docs.length) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 w-8 text-right">
                                            {Math.round((requiredCount / req.docs.length) * 100)}%
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Documents list */}
                                {isOpen && (
                                    <div className="px-6 pb-5 space-y-2">
                                        <div className="h-px bg-gray-50 mb-4" />
                                        {req.docs.map((doc, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition-colors"
                                            >
                                                {doc.required
                                                    ? <CheckCircle2 className={`w-4 h-4 ${req.accent} shrink-0 mt-0.5`} />
                                                    : <Circle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                                                }
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800">{doc.name}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{doc.description}</p>
                                                </div>
                                                <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                                    doc.required ? req.badge : 'bg-gray-50 text-gray-400 border-gray-100'
                                                }`}>
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

                {/* ── Important note ─────────────────────────────────── */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                        <span className="font-bold">All documents must be clear, legible scans or high-quality photos.</span>
                        {' '}Blurry, expired, or incomplete submissions will be rejected and require re-upload.
                    </p>
                </div>

                {/* ── CTA ────────────────────────────────────────────── */}
                <div className="bg-orange-500 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 shadow-lg shadow-orange-200">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-xl font-black text-white">Ready to get verified?</h2>
                        <p className="text-orange-100 text-sm mt-1">
                            Gather your documents and start the guided verification journey.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/merchant/onboarding')}
                        className="flex items-center gap-2 bg-white text-orange-600 font-bold text-sm px-7 py-3 rounded-xl hover:bg-orange-50 transition-all shadow-sm shrink-0"
                    >
                        Begin Onboarding <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>

            </main>
        </div>
    );
};
