import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { api } from '../lib/axios';

// ---- Types ----
type Step = 'welcome' | 'industry' | 'business' | 'directors' | 'shareholders' | 'documents' | 'face' | 'review' | 'submitted';

interface Director {
    id: string;
    fullName: string;
    nationality: string;
    nrcOrPassport: string;
    idType: 'NRC' | 'PASSPORT' | 'DRIVERS_LICENCE';
    sharePercentage: string;
    passportPhoto: File | null;
    idCopy: File | null;
}

interface CorporateShareholder {
    id: string;
    companyName: string;
    countryOfIncorporation: string;
    regNumber: string;
    sharePercentage: string;
    incorpCert: File | null;
    articlesOfAssoc: File | null;
}

interface FormState {
    // Industry
    industry: string;
    subIndustry: string;
    // Business Details
    legalName: string;
    tradingName: string;
    registeredAddress: string;
    businessPhone: string;
    businessEmail: string;
    businessWebsite: string;
    yearEstablished: string;
    expectedMonthlyVolume: string;
    businessDescription: string;
    // Company Reg
    pacraNumber: string;
    tpin: string;
    // Directors
    directors: Director[];
    // Corp Shareholders
    corpShareholders: CorporateShareholder[];
    // Documents
    certificateOfIncorporation: File | null;
    articlesOfAssociation: File | null;
    pacraForm3: File | null;
    tpinCertificate: File | null;
    taxClearance: File | null;
    bankStatement: File | null;
    proofOfAddress: File | null;
    // Face
    faceVerified: boolean;
}

const industries = [
    { id: 'retail', label: 'Retail & E-Commerce', icon: '🛒' },
    { id: 'hospitality', label: 'Hospitality & Tourism', icon: '🏨' },
    { id: 'education', label: 'Education & Training', icon: '🎓' },
    { id: 'healthcare', label: 'Healthcare & Pharma', icon: '🏥' },
    { id: 'fintech', label: 'Fintech & Financial Services', icon: '💳' },
    { id: 'agriculture', label: 'Agriculture & Agribusiness', icon: '🌾' },
    { id: 'real-estate', label: 'Real Estate & Construction', icon: '🏗️' },
    { id: 'logistics', label: 'Logistics & Transport', icon: '🚛' },
    { id: 'media', label: 'Media & Technology', icon: '📱' },
    { id: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
    { id: 'professional-services', label: 'Professional Services', icon: '👔' },
    { id: 'other', label: 'Other', icon: '📦' },
];

const STEPS: Step[] = ['welcome', 'industry', 'business', 'directors', 'shareholders', 'documents', 'face', 'review', 'submitted'];
const STEP_LABELS = ['Start', 'Industry', 'Business', 'Directors', 'Shareholders', 'Documents', 'Face ID', 'Review'];

const newDirector = (): Director => ({ id: Date.now().toString(), fullName: '', nationality: 'Zambian', nrcOrPassport: '', idType: 'NRC', sharePercentage: '', passportPhoto: null, idCopy: null });
const newCorpShareholder = (): CorporateShareholder => ({ id: Date.now().toString(), companyName: '', countryOfIncorporation: '', regNumber: '', sharePercentage: '', incorpCert: null, articlesOfAssoc: null });

const FileUpload: React.FC<{ label: string; required?: boolean; onChange: (f: File | null) => void; file: File | null; accent?: string }> = ({ label, required = false, onChange, file, accent = 'border-orange-200 hover:border-orange-400' }) => {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">
                {label} {required ? <span className="text-red-400">*</span> : <span className="text-gray-300">Optional</span>}
            </label>
            <div
                onClick={() => ref.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all ${file ? 'border-emerald-400 bg-emerald-50' : `${accent} bg-gray-50/50`}`}
            >
                <input ref={ref} type="file" className="hidden" onChange={e => onChange(e.target.files?.[0] ?? null)} />
                {file ? (
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-base">✓</span>
                        <div>
                            <p className="text-sm font-black text-gray-800">{file.name}</p>
                            <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB – Click to replace</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-2">
                        <p className="text-2xl mb-1">📎</p>
                        <p className="text-sm font-black text-gray-500">Click to upload</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">PDF, JPG, PNG up to 10MB</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const Input: React.FC<{ label: string; required?: boolean; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string }> = ({ label, required, value, onChange, type = 'text', placeholder, className = '' }) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block">{label} {required && <span className="text-red-400">*</span>}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 font-bold outline-none focus:border-orange-400 focus:bg-white transition-all text-gray-800" />
    </div>
);

export const MerchantOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('welcome');
    const [submitting, setSubmitting] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [faceCapture, setFaceCapture] = useState<string | null>(null);
    const webcamRef = useRef<Webcam>(null);

    const [form, setForm] = useState<FormState>({
        industry: '',
        subIndustry: '',
        legalName: '', tradingName: '', registeredAddress: '', businessPhone: '', businessEmail: '', businessWebsite: '', yearEstablished: '', expectedMonthlyVolume: '', businessDescription: '',
        pacraNumber: '', tpin: '',
        directors: [newDirector()],
        corpShareholders: [],
        certificateOfIncorporation: null,
        articlesOfAssociation: null,
        pacraForm3: null,
        tpinCertificate: null,
        taxClearance: null,
        bankStatement: null,
        proofOfAddress: null,
        faceVerified: false,
    });

    const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
    const [complianceStatus, setComplianceStatus] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState<string | null>(null);

    // Check Status & Load Draft Logic
    const checkStatusAndLoadDraft = async () => {
        try {
            // First check merchant status
            const statusRes = await api.get('/merchants/status');
            const m = statusRes.data;
            setComplianceStatus(m.complianceStatus);
            setAdminNotes(m.merchant?.admin_kyc_notes);

            // If already active or pending (and not previously rejected), we might want to skip onboarding
            // But we'll handle that in the render

            const { data } = await api.get('/merchants/onboarding/draft');
            if (data && Object.keys(data).length > 0) {
                setForm(prev => ({
                    ...prev,
                    ...data,
                }));
                if (data.step) setStep(data.step);
                if (data.faceCapture) {
                    setFaceCapture(data.faceCapture);
                    setForm(f => ({ ...f, faceVerified: true }));
                }
            }
        } catch (err) {
            console.error('Failed to load status/draft:', err);
        } finally {
            setHasLoadedDraft(true);
        }
    };

    const saveDraft = async (currentStep?: Step) => {
        try {
            // Strip files from state before saving as draft (cannot JSONify File objects)
            const draftPayload = { ...form, step: currentStep || step, faceCapture };
            delete (draftPayload as any).certificateOfIncorporation;
            delete (draftPayload as any).articlesOfAssociation;
            delete (draftPayload as any).pacraForm3;
            delete (draftPayload as any).tpinCertificate;
            delete (draftPayload as any).taxClearance;
            delete (draftPayload as any).bankStatement;
            delete (draftPayload as any).proofOfAddress;
            // Also strip files from directors and shareholders
            draftPayload.directors = draftPayload.directors.map(d => ({ ...d, passportPhoto: null, idCopy: null }));
            draftPayload.corpShareholders = draftPayload.corpShareholders.map(c => ({ ...c, incorpCert: null, articlesOfAssoc: null }));

            await api.post('/merchants/onboarding/draft', { payload: draftPayload });
        } catch (err) {
            console.error('Failed to save draft:', err);
        }
    };

    React.useEffect(() => {
        checkStatusAndLoadDraft();
    }, []);

    // Auto-save on step change
    React.useEffect(() => {
        if (hasLoadedDraft && step !== 'submitted' && step !== 'welcome') {
            saveDraft();
        }
    }, [step]);

    const setField = (key: keyof FormState, val: any) => setForm(prev => ({ ...prev, [key]: val }));

    const updateDirector = (id: string, key: keyof Director, val: any) => setForm(prev => ({ ...prev, directors: prev.directors.map(d => d.id === id ? { ...d, [key]: val } : d) }));
    const updateCorp = (id: string, key: keyof CorporateShareholder, val: any) => setForm(prev => ({ ...prev, corpShareholders: prev.corpShareholders.map(c => c.id === id ? { ...c, [key]: val } : c) }));

    const stepIndex = STEPS.indexOf(step);

    const startCamera = () => {
        setIsCameraActive(true);
    };

    const capturePhoto = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setFaceCapture(imageSrc);
            setField('faceVerified', true);
            setIsCameraActive(false);

            // Save to draft immediately after capture
            setTimeout(() => saveDraft(), 100);
        }
    }, [webcamRef]);

    const handleStepChange = (nextStep: Step) => {
        saveDraft(nextStep);
        setStep(nextStep);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('industry', form.industry);
            fd.append('subIndustry', form.subIndustry);
            fd.append('legalName', form.legalName);
            fd.append('tradingName', form.tradingName);
            fd.append('registeredAddress', form.registeredAddress);
            fd.append('businessPhone', form.businessPhone);
            fd.append('businessEmail', form.businessEmail);
            fd.append('businessWebsite', form.businessWebsite);
            fd.append('yearEstablished', form.yearEstablished);
            fd.append('expectedMonthlyVolume', form.expectedMonthlyVolume);
            fd.append('businessDescription', form.businessDescription);
            fd.append('pacraNumber', form.pacraNumber);
            fd.append('tpin', form.tpin);
            fd.append('directors', JSON.stringify(form.directors.map(d => ({
                fullName: d.fullName, nationality: d.nationality, nrcOrPassport: d.nrcOrPassport,
                idType: d.idType, sharePercentage: d.sharePercentage,
            }))));
            fd.append('corpShareholders', JSON.stringify(form.corpShareholders.map(c => ({
                companyName: c.companyName, countryOfIncorporation: c.countryOfIncorporation,
                regNumber: c.regNumber, sharePercentage: c.sharePercentage,
            }))));
            if (form.certificateOfIncorporation) fd.append('certificateOfIncorporation', form.certificateOfIncorporation);
            if (form.articlesOfAssociation) fd.append('articlesOfAssociation', form.articlesOfAssociation);
            if (form.pacraForm3) fd.append('pacraForm3', form.pacraForm3);
            if (form.tpinCertificate) fd.append('tpinCertificate', form.tpinCertificate);
            if (form.taxClearance) fd.append('taxClearance', form.taxClearance);
            if (form.bankStatement) fd.append('bankStatement', form.bankStatement);
            if (form.proofOfAddress) fd.append('proofOfAddress', form.proofOfAddress);
            if (faceCapture) fd.append('faceCapture', faceCapture);
            form.directors.forEach((d, i) => {
                if (d.passportPhoto) fd.append(`directorPassportPhoto_${i}`, d.passportPhoto);
                if (d.idCopy) fd.append(`directorIdCopy_${i}`, d.idCopy);
            });
            form.corpShareholders.forEach((c, i) => {
                if (c.incorpCert) fd.append(`corpIncorpCert_${i}`, c.incorpCert);
                if (c.articlesOfAssoc) fd.append(`corpArticles_${i}`, c.articlesOfAssoc);
            });

            await api.post('/merchants/onboarding', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            // Clear draft on success
            await api.post('/merchants/onboarding/draft', { payload: {} });
            setStep('submitted');
        } catch (err) {
            alert('Failed to submit onboarding. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (step === 'submitted' || (complianceStatus && complianceStatus !== 'SANDBOX_ONLY' && step !== 'review' && step !== 'face')) {
        const isApproved = complianceStatus === 'ACTIVE';
        const isRejected = complianceStatus === 'REJECTED';

        return (
            <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/20 via-transparent to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-xl w-full space-y-10 animate-in fade-in zoom-in duration-500 relative z-10">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto text-5xl shadow-2xl ring-8 transition-all duration-700 ${isApproved ? 'bg-emerald-500 text-white ring-emerald-50 shadow-emerald-500/30' :
                        isRejected ? 'bg-red-500 text-white ring-red-50 shadow-red-500/30' :
                            'bg-orange-500 text-white ring-orange-50 shadow-orange-500/30 animate-pulse'
                        }`}>
                        {isApproved ? '🚀' : isRejected ? '❌' : '⏳'}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            {isApproved ? 'You\'re Live!' : isRejected ? 'Clarification Required' : 'Application Pending'}
                        </h1>
                        <p className="text-gray-500 font-bold text-lg leading-relaxed">
                            {isApproved
                                ? 'Congratulations! Your account has been verified. You can now process live payments and settle funds to your Zambian wallets.'
                                : isRejected
                                    ? 'Our compliance team has reviewed your application and needs more information or corrections to proceed.'
                                    : 'We\'ve received your onboarding documents. Our team is currently reviewing your application (usually takes 24-48 hours).'}
                        </p>
                    </div>

                    {adminNotes && (
                        <div className={`rounded-[32px] p-8 text-left space-y-4 border shadow-sm ${isRejected ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{isRejected ? '🚩' : '📝'}</span>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isRejected ? 'text-red-700' : 'text-amber-700'}`}>Message from Compliance Team</p>
                            </div>
                            <p className={`text-base font-bold leading-relaxed italic ${isRejected ? 'text-red-900' : 'text-amber-900'}`}>"{adminNotes}"</p>
                        </div>
                    )}

                    <div className="bg-white rounded-[40px] border border-gray-100 p-8 text-left space-y-6 shadow-xl shadow-gray-100/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-4">Verification Roadmap</p>
                        <div className="space-y-5">
                            {[
                                { label: 'Documents Submitted', status: 'Done', icon: '📝', color: 'text-emerald-500' },
                                { label: 'KYC & Liveness Check', status: (isApproved || isRejected) ? 'Done' : 'In Review', icon: '🤳', color: (isApproved || isRejected) ? 'text-emerald-500' : 'text-orange-500' },
                                { label: 'Live Mode Activation', status: isApproved ? 'Enabled' : isRejected ? 'Paused' : 'Waiting', icon: '⚡', color: isApproved ? 'text-emerald-500' : isRejected ? 'text-red-500' : 'text-gray-300' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl">{item.icon}</div>
                                        <p className="text-sm font-black text-gray-700">{item.label}</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${item.status === 'Done' || item.status === 'Enabled' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        item.status === 'Paused' ? 'bg-red-50 text-red-600 border-red-100' :
                                            'bg-orange-50 text-orange-600 border-orange-100'
                                        }`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button
                            onClick={() => navigate('/merchant/dashboard')}
                            className="bg-black text-white font-black px-12 py-5 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-black/20"
                        >
                            Back to Dashboard
                        </button>
                        {(isRejected || !isApproved) && (
                            <button
                                onClick={() => { setComplianceStatus(null); setStep('welcome'); }}
                                className="bg-white border-2 border-gray-100 text-gray-600 font-black px-10 py-5 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all"
                            >
                                {isRejected ? 'Fix Application' : 'Edit Details'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                        <span className="text-white font-black text-xs">FP</span>
                    </div>
                    <span className="font-black text-gray-900">Live Mode Verification</span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    {STEP_LABELS.map((label, idx) => {
                        const isActive = idx === stepIndex - 1;
                        const isDone = idx < stepIndex - 1;
                        return (
                            <div key={label} className="flex items-center gap-1">
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-orange-500 text-white' : isDone ? 'bg-emerald-100 text-emerald-700' : 'text-gray-300'}`}>
                                    {isDone ? '✓ ' : ''}{label}
                                </div>
                                {idx < STEP_LABELS.length - 1 && <span className="text-gray-200 mx-1">›</span>}
                            </div>
                        );
                    })}
                </div>
                <button onClick={() => navigate('/merchant/dashboard')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">Save & Exit</button>
            </nav>

            <div className="max-w-3xl mx-auto p-8 md:p-12">

                {/* STEP: Welcome */}
                {step === 'welcome' && (
                    <div className="text-center space-y-10 py-12 animate-in fade-in duration-500">
                        <div className="space-y-4">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-amber-500 rounded-[32px] flex items-center justify-center text-5xl shadow-2xl shadow-orange-500/20">🚀</div>
                            <h1 className="text-5xl font-black text-gray-900 tracking-tight">Start Your<br />Live Verification</h1>
                            <p className="text-gray-500 font-medium text-lg max-w-md mx-auto">Complete this guided onboarding to unlock Live Mode, real transactions, and KES/ZMW settlements.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                            {[
                                { icon: '⏱️', title: '~20 minutes', desc: 'Average time to complete' },
                                { icon: '🔒', title: 'Bank-Grade Security', desc: 'All documents encrypted at rest' },
                                { icon: '📋', title: 'Zambia-Compliant', desc: 'Follows BoZ & FICS guidelines' },
                            ].map(item => (
                                <div key={item.title} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-2 shadow-sm">
                                    <div className="text-3xl">{item.icon}</div>
                                    <p className="font-black text-gray-900">{item.title}</p>
                                    <p className="text-sm text-gray-400 font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setStep('industry')} className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black px-16 py-5 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-orange-500/20 text-lg">
                            Get Started →
                        </button>
                    </div>
                )}

                {/* STEP: Industry */}
                {step === 'industry' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Step 1 of 7</p>
                            <h2 className="text-4xl font-black text-gray-900">Your Industry</h2>
                            <p className="text-gray-500 font-medium">This helps us tailor your merchant dashboard and determine applicable regulations.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {industries.map(ind => (
                                <button key={ind.id} onClick={() => setField('industry', ind.id)}
                                    className={`p-6 rounded-[28px] border-2 text-left transition-all hover:scale-[1.02] ${form.industry === ind.id ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/10' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                    <span className="text-3xl block mb-3">{ind.icon}</span>
                                    <span className="text-sm font-black text-gray-800 leading-tight block">{ind.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => handleStepChange('welcome')} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-all">← Back</button>
                            <button onClick={() => form.industry && handleStepChange('business')} className={`flex-1 py-4 rounded-2xl font-black text-white transition-all ${form.industry ? 'bg-gradient-to-br from-orange-500 to-amber-500 hover:scale-[1.02] shadow-lg shadow-orange-500/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Continue →</button>
                        </div>
                    </div>
                )}

                {/* STEP: Business Details */}
                {step === 'business' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Step 2 of 7</p>
                            <h2 className="text-4xl font-black text-gray-900">Business Details</h2>
                        </div>
                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 space-y-6 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Legal Business Name" required value={form.legalName} onChange={v => setField('legalName', v)} placeholder="FlapaPay Zambia Ltd" className="md:col-span-2" />
                                <Input label="Trading Name (if different)" value={form.tradingName} onChange={v => setField('tradingName', v)} placeholder="FlapaPay" />
                                <Input label="Year Established" required value={form.yearEstablished} onChange={v => setField('yearEstablished', v)} placeholder="2022" type="number" />
                                <Input label="Business Phone" required value={form.businessPhone} onChange={v => setField('businessPhone', v)} placeholder="+260 97 XXXXXXX" />
                                <Input label="Business Email" required value={form.businessEmail} onChange={v => setField('businessEmail', v)} placeholder="ops@yourbusiness.com" type="email" />
                                <Input label="Website (optional)" value={form.businessWebsite} onChange={v => setField('businessWebsite', v)} placeholder="https://yourbusiness.com" />
                                <Input label="PACRA Registration Number" required value={form.pacraNumber} onChange={v => setField('pacraNumber', v)} placeholder="120243561891" />
                                <Input label="ZRA TPIN" required value={form.tpin} onChange={v => setField('tpin', v)} placeholder="3000000000" />
                                <Input label="Registered Address" required value={form.registeredAddress} onChange={v => setField('registeredAddress', v)} placeholder="Plot 1, Cairo Road, Lusaka" className="md:col-span-2" />
                                <Input label="Expected Monthly Volume (ZMW)" required value={form.expectedMonthlyVolume} onChange={v => setField('expectedMonthlyVolume', v)} placeholder="250,000" className="md:col-span-2" />
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block">Business Description <span className="text-red-400">*</span></label>
                                    <textarea value={form.businessDescription} onChange={e => setField('businessDescription', e.target.value)} rows={4} placeholder="What does your business do, who are your customers, and what will you use FlapaPay for?" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold outline-none focus:border-orange-400 focus:bg-white transition-all resize-none text-gray-800" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => handleStepChange('industry')} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-all">← Back</button>
                            <button onClick={() => handleStepChange('directors')} className="flex-1 py-4 rounded-2xl font-black text-white bg-gradient-to-br from-orange-500 to-amber-500 hover:scale-[1.02] shadow-lg shadow-orange-500/20 transition-all">Continue →</button>
                        </div>
                    </div>
                )}

                {/* STEP: Directors */}
                {step === 'directors' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Step 3 of 7</p>
                            <h2 className="text-4xl font-black text-gray-900">Directors</h2>
                            <p className="text-gray-500 font-medium">Add all company directors as registered with PACRA.</p>
                        </div>
                        <div className="space-y-6">
                            {form.directors.map((dir, idx) => (
                                <div key={dir.id} className="bg-white rounded-[32px] border border-gray-100 p-8 space-y-6 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-gray-900 text-lg">Director {idx + 1}</h3>
                                        {form.directors.length > 1 && <button onClick={() => setField('directors', form.directors.filter(d => d.id !== dir.id))} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">Remove</button>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <Input label="Full Legal Name" required value={dir.fullName} onChange={v => updateDirector(dir.id, 'fullName', v)} placeholder="John Smith" className="md:col-span-2" />
                                        <Input label="Nationality" required value={dir.nationality} onChange={v => updateDirector(dir.id, 'nationality', v)} placeholder="Zambian" />
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block">ID Type <span className="text-red-400">*</span></label>
                                            <select value={dir.idType} onChange={e => updateDirector(dir.id, 'idType', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 font-bold outline-none focus:border-orange-400 focus:bg-white transition-all text-gray-800">
                                                <option value="NRC">NRC</option>
                                                <option value="PASSPORT">Passport</option>
                                                <option value="DRIVERS_LICENCE">Driver's Licence</option>
                                            </select>
                                        </div>
                                        <Input label={`${dir.idType} Number`} required value={dir.nrcOrPassport} onChange={v => updateDirector(dir.id, 'nrcOrPassport', v)} placeholder="123456/78/9" />
                                        <Input label="Shareholding %" value={dir.sharePercentage} onChange={v => updateDirector(dir.id, 'sharePercentage', v)} placeholder="25" type="number" />
                                        <FileUpload label="Passport-size Photo" required file={dir.passportPhoto} onChange={f => updateDirector(dir.id, 'passportPhoto', f)} />
                                        <FileUpload label={`${dir.idType} Copy`} required file={dir.idCopy} onChange={f => updateDirector(dir.id, 'idCopy', f)} />
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setField('directors', [...form.directors, newDirector()])} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-black text-sm hover:border-orange-400 hover:text-orange-500 transition-all">+ Add Another Director</button>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => handleStepChange('business')} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-all">← Back</button>
                            <button onClick={() => handleStepChange('shareholders')} className="flex-1 py-4 rounded-2xl font-black text-white bg-gradient-to-br from-orange-500 to-amber-500 hover:scale-[1.02] shadow-lg shadow-orange-500/20 transition-all">Continue →</button>
                        </div>
                    </div>
                )}

                {/* STEP: Corporate Shareholders */}
                {step === 'shareholders' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Step 4 of 7</p>
                            <h2 className="text-4xl font-black text-gray-900">Corporate Shareholders</h2>
                            <p className="text-gray-500 font-medium">Add any corporate entities that own ≥25% of the business. Skip if none.</p>
                        </div>
                        <div className="space-y-6">
                            {form.corpShareholders.length === 0 && (
                                <div className="bg-white rounded-[32px] border border-dashed border-gray-200 p-12 text-center text-gray-400">
                                    <p className="text-4xl mb-3">🏢</p>
                                    <p className="font-bold">No corporate shareholders added</p>
                                    <p className="text-sm mt-1">Click below to add one, or skip to continue</p>
                                </div>
                            )}
                            {form.corpShareholders.map((corp, idx) => (
                                <div key={corp.id} className="bg-white rounded-[32px] border border-gray-100 p-8 space-y-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-gray-900">Corporate Shareholder {idx + 1}</h3>
                                        <button onClick={() => setField('corpShareholders', form.corpShareholders.filter(c => c.id !== corp.id))} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">Remove</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <Input label="Company Name" required value={corp.companyName} onChange={v => updateCorp(corp.id, 'companyName', v)} placeholder="Acme Holdings Ltd" className="md:col-span-2" />
                                        <Input label="Country of Incorporation" required value={corp.countryOfIncorporation} onChange={v => updateCorp(corp.id, 'countryOfIncorporation', v)} placeholder="Zambia" />
                                        <Input label="Registration Number" required value={corp.regNumber} onChange={v => updateCorp(corp.id, 'regNumber', v)} placeholder="PACRA/120243..." />
                                        <Input label="Shareholding %" required value={corp.sharePercentage} onChange={v => updateCorp(corp.id, 'sharePercentage', v)} placeholder="51" type="number" />
                                        <div />
                                        <FileUpload label="Certificate of Incorporation" required file={corp.incorpCert} onChange={f => updateCorp(corp.id, 'incorpCert', f)} />
                                        <FileUpload label="Articles of Association" required file={corp.articlesOfAssoc} onChange={f => updateCorp(corp.id, 'articlesOfAssoc', f)} />
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setField('corpShareholders', [...form.corpShareholders, newCorpShareholder()])} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-black text-sm hover:border-purple-400 hover:text-purple-500 transition-all">+ Add Corporate Shareholder</button>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => handleStepChange('directors')} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-all">← Back</button>
                            <button onClick={() => handleStepChange('documents')} className="flex-1 py-4 rounded-2xl font-black text-white bg-gradient-to-br from-orange-500 to-amber-500 hover:scale-[1.02] shadow-lg shadow-orange-500/20 transition-all">Continue →</button>
                        </div>
                    </div>
                )}

                {/* STEP: Documents */}
                {step === 'documents' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Step 5 of 7</p>
                            <h2 className="text-4xl font-black text-gray-900">Company Documents</h2>
                            <p className="text-gray-500 font-medium">Upload official registration and compliance documents.</p>
                        </div>
                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 space-y-6 shadow-sm">
                            <div className="pb-4 border-b border-gray-50">
                                <p className="font-black text-gray-800 text-sm uppercase tracking-widest">PACRA Documents</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FileUpload label="Certificate of Incorporation" required file={form.certificateOfIncorporation} onChange={f => setField('certificateOfIncorporation', f)} accent="border-orange-200 hover:border-orange-400" />
                                <FileUpload label="Articles of Association" required file={form.articlesOfAssociation} onChange={f => setField('articlesOfAssociation', f)} accent="border-orange-200 hover:border-orange-400" />
                                <FileUpload label="PACRA Form 3" required file={form.pacraForm3} onChange={f => setField('pacraForm3', f)} accent="border-orange-200 hover:border-orange-400" />
                            </div>
                            <div className="pt-4 pb-4 border-b border-gray-50 border-t">
                                <p className="font-black text-gray-800 text-sm uppercase tracking-widest">ZRA / Tax Documents</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FileUpload label="TPIN Certificate" required file={form.tpinCertificate} onChange={f => setField('tpinCertificate', f)} accent="border-blue-200 hover:border-blue-400" />
                                <FileUpload label="Tax Clearance Certificate" required file={form.taxClearance} onChange={f => setField('taxClearance', f)} accent="border-blue-200 hover:border-blue-400" />
                            </div>
                            <div className="pt-4 pb-4 border-b border-gray-50 border-t">
                                <p className="font-black text-gray-800 text-sm uppercase tracking-widest">Banking & Address</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FileUpload label="Business Bank Statement (6 months)" required file={form.bankStatement} onChange={f => setField('bankStatement', f)} accent="border-emerald-200 hover:border-emerald-400" />
                                <FileUpload label="Proof of Business Address" required file={form.proofOfAddress} onChange={f => setField('proofOfAddress', f)} accent="border-emerald-200 hover:border-emerald-400" />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => handleStepChange('shareholders')} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-all">← Back</button>
                            <button onClick={() => handleStepChange('face')} className="flex-1 py-4 rounded-2xl font-black text-white bg-gradient-to-br from-orange-500 to-amber-500 hover:scale-[1.02] shadow-lg shadow-orange-500/20 transition-all">Continue →</button>
                        </div>
                    </div>
                )}

                {/* STEP: Face Verification */}
                {step === 'face' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Step 6 of 7</p>
                            <h2 className="text-4xl font-black text-gray-900">Face Verification</h2>
                            <p className="text-gray-500 font-medium">A quick liveness check to confirm the identity of the primary director.</p>
                        </div>
                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 space-y-6 shadow-sm text-center">
                            {!isCameraActive && !faceCapture && (
                                <div className="space-y-6 py-6">
                                    <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-5xl">🤳</div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-gray-900">Liveness Check</h3>
                                        <p className="text-sm text-gray-500 font-medium">Ensure you are in a well-lit area. Look directly at the camera when prompted.</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-3 text-sm text-gray-400 font-bold">
                                        <span>✅ Good lighting</span>
                                        <span>✅ Face clearly visible, no obstruction</span>
                                        <span>✅ Remove sunglasses or hats</span>
                                    </div>
                                    <button onClick={startCamera} className="bg-black text-white font-black px-10 py-4 rounded-2xl hover:scale-105 transition-all">Launch Camera</button>
                                </div>
                            )}
                            {isCameraActive && !faceCapture && (
                                <div className="space-y-4">
                                    <div className="relative rounded-3xl overflow-hidden max-w-md mx-auto border-4 border-orange-400 shadow-2xl">
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={{ facingMode: "user" }}
                                            className="w-full"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-orange-500/20 to-transparent pointer-events-none" />
                                        <div className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-lg">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                            Live Stream
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        <p className="text-xs font-bold text-gray-400">Position your face within the frame</p>
                                        <div className="flex gap-4">
                                            <button onClick={() => setIsCameraActive(false)} className="bg-gray-100 text-gray-500 font-black px-6 py-4 rounded-2xl hover:bg-gray-200 transition-all">Cancel</button>
                                            <button onClick={capturePhoto} className="bg-orange-500 text-white font-black px-8 py-4 rounded-2xl hover:scale-105 shadow-xl shadow-orange-500/30 transition-all">📸 Capture Photo</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {faceCapture && (
                                <div className="space-y-4 py-4">
                                    <div className="relative max-w-sm mx-auto rounded-3xl overflow-hidden border-4 border-emerald-400">
                                        <img src={faceCapture} alt="Face Capture" className="w-full" />
                                        <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">✓ Captured</div>
                                    </div>
                                    <p className="font-black text-emerald-600 text-sm">Face captured successfully!</p>
                                    <button onClick={() => { setFaceCapture(null); setField('faceVerified', false); }} className="text-sm text-gray-400 hover:text-orange-500 font-black transition-colors">Retake</button>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep('documents')} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-all">← Back</button>
                            <button
                                onClick={() => setStep('review')}
                                className={`flex-1 py-4 rounded-2xl font-black text-white transition-all ${form.faceVerified ? 'bg-gradient-to-br from-orange-500 to-amber-500 hover:scale-[1.02] shadow-lg shadow-orange-500/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP: Review & Submit */}
                {step === 'review' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Step 7 of 7</p>
                            <h2 className="text-4xl font-black text-gray-900">Review & Submit</h2>
                            <p className="text-gray-500 font-medium">Please review your details before submission. Once submitted, our compliance team will review within 2–5 business days.</p>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Industry', value: industries.find(i => i.id === form.industry)?.label || '-', icon: '🏭' },
                                { label: 'Legal Business Name', value: form.legalName, icon: '🏢' },
                                { label: 'PACRA Number', value: form.pacraNumber, icon: '📄' },
                                { label: 'TPIN', value: form.tpin, icon: '📋' },
                                { label: 'Registered Address', value: form.registeredAddress, icon: '📍' },
                                { label: 'Directors', value: `${form.directors.length} director(s) added`, icon: '👤' },
                                { label: 'Corporate Shareholders', value: form.corpShareholders.length === 0 ? 'None' : `${form.corpShareholders.length} entity/ies`, icon: '🌐' },
                                { label: 'Face Verification', value: form.faceVerified ? '✓ Captured' : '✗ Not done', icon: '🤳' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <span className="text-xl">{item.icon}</span>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                                        <p className="font-black text-gray-900 mt-0.5">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
                            <span className="text-amber-500 text-xl shrink-0">⚠️</span>
                            <p className="text-sm font-bold text-amber-700">By submitting, you confirm that all information provided is accurate and complete to the best of your knowledge. Providing false information is an offence under Zambian law.</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep('face')} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-all">← Back</button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 py-4 rounded-2xl font-black text-white bg-gradient-to-br from-emerald-500 to-teal-500 hover:scale-[1.02] shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Submitting...
                                    </span>
                                ) : '✓ Submit for Review'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
