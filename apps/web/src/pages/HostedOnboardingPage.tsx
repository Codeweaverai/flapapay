import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactCountryFlag from 'react-country-flag';
import {
    ArrowLeft, ArrowRight, Building2, User, CreditCard,
    CheckCircle, CheckCircle2, Loader2, AlertCircle, Smartphone, Landmark,
    Briefcase, MapPin, Phone, Search, Mail, Lock, Shield, ShieldCheck,
    RefreshCw, ExternalLink
} from 'lucide-react';

// ─── Public API (no auth headers needed) ──────────────────────────────────────
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
const pub = axios.create({ baseURL: BASE });

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
    status: string;
    platform_name: string;
    platform_color: string;
    platform_logo_url: string | null;
    account_id: string;
    account: { business_name: string; email: string; country: string; kyc_status: string; };
    requirements: { currently_due: string[]; pending_verification?: string[] };
    partial_data: Record<string, any>;
    expires_at: string;
    return_url?: string;
    refresh_url?: string;
}

interface Form {
    // Business info
    account_type: 'individual' | 'business' | '';
    business_name: string;
    business_type: string;
    tpin: string;
    pacra_number: string;
    // Individual
    full_name: string;
    nrc: string;
    dob: string;
    nationality: string;
    // Contact
    email: string;
    phone: string;
    address: string;
    city: string;
    category: string;
    website: string;
    // Payout
    payout_type: 'mobile_money' | 'bank_account';
    mobile_network: string;
    mobile_number: string;
    mobile_verified: boolean;
    bank_id: string;
    bank_name: string;
    bank_account_number: string;
    bank_resolved_name: string;
    bank_verified: boolean;
    // OTP
    otp_email: string;
    otp_code: string;
    otp_sent: boolean;
    otp_verified: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MOBILE_NETWORKS = [
    { id: 'mtn', name: 'MTN', gradient: 'from-yellow-400 to-yellow-500', text: 'text-yellow-700' },
    { id: 'airtel', name: 'Airtel', gradient: 'from-red-500 to-red-600', text: 'text-red-700' },
    { id: 'zamtel', name: 'Zamtel', gradient: 'from-green-500 to-green-600', text: 'text-green-700' },
];
const BUSINESS_TYPES = ['Limited Company', 'Sole Trader', 'Partnership', 'NGO / Non-profit', 'Cooperative', 'Trust'];
const CATEGORIES = ['Retail & Commerce', 'Food & Beverages', 'Professional Services', 'Technology', 'Agriculture', 'Transport & Logistics', 'Education', 'Healthcare', 'Entertainment', 'Other'];

const BANK_LOGOS: Record<string, string> = {
    zanaco: 'https://cdn.brandfetch.io/id8rWWhZ0S/w/768/h/226/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1765290669363',
    stanbic: 'https://cdn.brandfetch.io/idtBHsdHkP/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764691523293',
    absa: 'https://cdn.brandfetch.io/idIIZJY7QN/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667792595017',
    access: 'https://cdn.brandfetch.io/idPXJmyni4/w/400/h/400/theme/light/icon.png?c=1bxid64Mup7aczewSAYMX&t=1667560957752',
    ecobank: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ecobank_Logo_EN.png',
    fnb: 'https://cdn.brandfetch.io/idMm5AKGl0/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668184013589',
    stanchart: 'https://cdn.brandfetch.io/idasTAHEfB/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1766383628158',
    uba: 'https://cdn.brandfetch.io/idbEJ2XWew/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1718352485394',
    natsave: 'https://cdn.brandfetch.io/id2RUtvBPh/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1763982236282',
    firstcapital: 'https://cdn.brandfetch.io/idaj4d7B1e/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1771529890408',
    zicb: 'https://cdn.brandfetch.io/idUnVed1lu/w/447/h/159/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1767416627446',
};

const getBankLogo = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('zanaco')) return BANK_LOGOS.zanaco;
    if (n.includes('stanbic')) return BANK_LOGOS.stanbic;
    if (n.includes('absa')) return BANK_LOGOS.absa;
    if (n.includes('access')) return BANK_LOGOS.access;
    if (n.includes('eco')) return BANK_LOGOS.ecobank;
    if (n.includes('fnb') || n.includes('first national')) return BANK_LOGOS.fnb;
    if (n.includes('chartered') || n.includes('scb')) return BANK_LOGOS.stanchart;
    if (n.includes('uba') || n.includes('united bank')) return BANK_LOGOS.uba;
    if (n.includes('natsave') || n.includes('national savings')) return BANK_LOGOS.natsave;
    if (n.includes('first capital')) return BANK_LOGOS.firstcapital;
    if (n.includes('zicb')) return BANK_LOGOS.zicb;
    return null;
};

// ─── UI Helpers ───────────────────────────────────────────────────────────────
const INPUT = 'w-full bg-gray-50 border border-amber-200 rounded-2xl px-4 py-4 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all';
const SELECT = `${INPUT} cursor-pointer`;
const LABEL = 'block text-xs font-black text-gray-600 uppercase tracking-widest mb-2';

function Grid2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>;
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
    return <div className={full ? 'md:col-span-2' : ''}><label className={LABEL}>{label}</label>{children}</div>;
}

// ─── Step: Account Type ───────────────────────────────────────────────────────
function AccountTypeStep({ form, set }: { form: Form; set: (k: keyof Form, v: any) => void }) {
    return (
        <div className="space-y-4">
            <p className="text-base text-gray-600 mb-6">
                Choose the type of account that best describes your business.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { type: 'individual', icon: User, title: 'Individual / Sole Trader', desc: 'Personal NRC-based verification. For freelancers and sole traders.' },
                    { type: 'business', icon: Building2, title: 'Registered Business', desc: 'PACRA registration required. For limited companies and NGOs.' },
                ].map(({ type, icon: Icon, title, desc }) => (
                    <button
                        key={type}
                        onClick={() => set('account_type', type as any)}
                        className={`p-6 rounded-3xl border-2 text-left transition-all ${
                            form.account_type === type
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-gray-200 hover:border-amber-300 bg-white'
                        }`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                            form.account_type === type ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gray-100'
                        }`}>
                            <Icon className={`w-7 h-7 ${form.account_type === type ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="font-bold text-gray-900 text-base mb-2">{title}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">{desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Step: Identity ───────────────────────────────────────────────────────────
function IdentityStep({ form, set }: { form: Form; set: (k: keyof Form, v: any) => void }) {
    if (form.account_type === 'individual') {
        return (
            <Grid2>
                <Field label="Full Legal Name" full><input className={INPUT} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="As on your NRC" /></Field>
                <Field label="NRC Number"><input className={INPUT} value={form.nrc} onChange={e => set('nrc', e.target.value)} placeholder="e.g. 123456/78/9" /></Field>
                <Field label="Date of Birth"><input type="date" className={INPUT} value={form.dob} onChange={e => set('dob', e.target.value)} /></Field>
                <Field label="Nationality"><input className={INPUT} value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. Zambian" /></Field>
                <Field label="Trade / Business Name" full><input className={INPUT} value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Name your customers know you by" /></Field>
                <Field label="Business Category" full>
                    <select className={SELECT} value={form.category} onChange={e => set('category', e.target.value)}>
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </Field>
            </Grid2>
        );
    }
    return (
        <Grid2>
            <Field label="Registered Business Name" full><input className={INPUT} value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="As on PACRA certificate" /></Field>
            <Field label="Business Type">
                <select className={SELECT} value={form.business_type} onChange={e => set('business_type', e.target.value)}>
                    <option value="">Select type</option>
                    {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
            </Field>
            <Field label="PACRA Number"><input className={INPUT} value={form.pacra_number} onChange={e => set('pacra_number', e.target.value)} placeholder="e.g. 120011234567" /></Field>
            <Field label="TPIN"><input className={INPUT} value={form.tpin} onChange={e => set('tpin', e.target.value)} placeholder="ZRA Tax Payer ID" /></Field>
            <Field label="Director / Authorised Rep Name" full><input className={INPUT} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Full legal name" /></Field>
            <Field label="Director NRC"><input className={INPUT} value={form.nrc} onChange={e => set('nrc', e.target.value)} placeholder="Director's NRC number" /></Field>
            <Field label="Business Category" full>
                <select className={SELECT} value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
            </Field>
        </Grid2>
    );
}

// ─── Step: Contact ────────────────────────────────────────────────────────────
function ContactStep({ form, set }: { form: Form; set: (k: keyof Form, v: any) => void }) {
    return (
        <Grid2>
            <Field label="Email Address" full><input type="email" className={INPUT} value={form.email} onChange={e => set('email', e.target.value)} placeholder="business@example.com" /></Field>
            <Field label="Phone Number" full>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3.5 min-w-[90px]">
                        <ReactCountryFlag countryCode="ZM" svg style={{ width: '1.25em', height: '1.25em', borderRadius: '2px' }} />
                        <span className="text-sm font-bold text-gray-700">+260</span>
                    </div>
                    <input className={INPUT} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="97 000 0000" />
                </div>
            </Field>
            <Field label="Street Address" full><input className={INPUT} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Plot number / street name" /></Field>
            <Field label="City / Town"><input className={INPUT} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Lusaka" /></Field>
            <Field label="Website (optional)"><input className={INPUT} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yoursite.com" /></Field>
        </Grid2>
    );
}

// ─── Step: Payout ─────────────────────────────────────────────────────────────
function PayoutStep({ token, form, set }: { token: string; form: Form; set: (k: keyof Form, v: any) => void }) {
    const [banks, setBanks] = useState<any[]>([]);
    const [bankSearch, setBankSearch] = useState('');
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [confirmingOtp, setConfirmingOtp] = useState(false);
    const [otpError, setOtpError] = useState('');

    useEffect(() => {
        if (form.payout_type === 'bank_account' && banks.length === 0) {
            pub.get('/v1/connect/banks?country=zm')
                .then(res => { if (res.data?.data) setBanks(res.data.data); })
                .catch(() => {});
        }
    }, [form.payout_type]);

    const filteredBanks = useMemo(() =>
        banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase())),
        [banks, bankSearch]
    );

    const handleVerifyBank = async () => {
        if (!form.bank_id || !form.bank_account_number.trim()) return;
        setResolving(true);
        setResolveError('');
        try {
            const res = await pub.post(`/v1/connect/onboarding/${token}/verify-bank`, {
                bank_id: form.bank_id,
                account_number: form.bank_account_number.trim(),
                country: 'zm'
            });
            set('bank_resolved_name', res.data.account_name);
            set('bank_verified', true);
        } catch (err: any) {
            setResolveError(err.response?.data?.error || 'Verification failed. Check the account number.');
            set('bank_verified', false);
        } finally {
            setResolving(false);
        }
    };

    const handleBankSelect = (b: any) => {
        set('bank_id', b.id);
        set('bank_name', b.name);
        set('bank_verified', false);
        set('bank_resolved_name', '');
        setBankSearch('');
    };

    const handleSendOtp = async () => {
        if (!form.otp_email) return;
        setSendingOtp(true);
        setOtpError('');
        try {
            await pub.post(`/v1/connect/onboarding/${token}/verify-otp`, {
                action: 'send',
                email: form.otp_email,
                purpose: 'mobile_money_verification'
            });
            set('otp_sent', true);
        } catch (err: any) {
            setOtpError(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleConfirmOtp = async () => {
        if (!form.otp_code) return;
        setConfirmingOtp(true);
        setOtpError('');
        try {
            await pub.post(`/v1/connect/onboarding/${token}/verify-otp`, {
                action: 'confirm',
                code: form.otp_code,
                purpose: 'mobile_money_verification'
            });
            set('otp_verified', true);
            set('mobile_verified', true);
        } catch (err: any) {
            setOtpError(err.response?.data?.error || 'Invalid code');
        } finally {
            setConfirmingOtp(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Type Toggle */}
            <div className="flex gap-3">
                {[
                    { type: 'mobile_money', icon: Smartphone, label: 'Mobile Money' },
                    { type: 'bank_account', icon: Landmark, label: 'Bank Account' },
                ].map(({ type, icon: Icon, label }) => (
                    <button
                        key={type}
                        onClick={() => set('payout_type', type as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all border-2 ${
                            form.payout_type === type
                                ? 'border-amber-500 bg-amber-50 text-amber-700'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-amber-300'
                        }`}
                    >
                        <Icon className="w-5 h-5" />
                        {label}
                    </button>
                ))}
            </div>

            {form.payout_type === 'mobile_money' ? (
                <div className="space-y-5">
                    <div>
                        <label className={LABEL}>Mobile Network</label>
                        <div className="flex gap-3">
                            {MOBILE_NETWORKS.map(n => (
                                <button
                                    key={n.id}
                                    onClick={() => set('mobile_network', n.id)}
                                    className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                                        form.mobile_network === n.id
                                            ? `bg-gradient-to-r ${n.gradient} border-transparent text-white`
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    {n.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={LABEL}>Mobile Money Number</label>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3.5 min-w-[90px]">
                                <ReactCountryFlag countryCode="ZM" svg style={{ width: '1.25em', height: '1.25em', borderRadius: '2px' }} />
                                <span className="text-sm font-bold text-gray-700">+260</span>
                            </div>
                            <input
                                className={INPUT}
                                value={form.mobile_number}
                                onChange={e => { set('mobile_number', e.target.value); set('mobile_verified', false); set('otp_sent', false); set('otp_verified', false); }}
                                placeholder="97 000 0000"
                            />
                        </div>
                    </div>

                    {/* OTP Verification */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-amber-600" />
                            <span className="text-sm font-bold text-amber-800">Verify via Email OTP</span>
                        </div>
                        <p className="text-sm text-amber-700">We'll send a 6-digit code to your email to confirm the mobile number.</p>

                        {!form.otp_sent ? (
                            <div className="flex gap-3">
                                <input
                                    className={INPUT}
                                    type="email"
                                    value={form.otp_email}
                                    onChange={e => set('otp_email', e.target.value)}
                                    placeholder="Enter your email"
                                />
                                <button
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp || !form.otp_email}
                                    className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl text-sm font-bold disabled:opacity-50 hover:from-amber-600 hover:to-orange-700 transition-all whitespace-nowrap flex items-center gap-2 shadow-sm"
                                >
                                    {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    Send Code
                                </button>
                            </div>
                        ) : form.otp_verified ? (
                            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                                <CheckCircle className="w-5 h-5" />
                                Mobile number verified
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-amber-700">Code sent to <strong>{form.otp_email}</strong></p>
                                <div className="flex gap-3">
                                    <input
                                        className={INPUT}
                                        value={form.otp_code}
                                        onChange={e => set('otp_code', e.target.value)}
                                        placeholder="6-digit code"
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={handleConfirmOtp}
                                        disabled={confirmingOtp || form.otp_code.length < 6}
                                        className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl text-sm font-bold disabled:opacity-50 hover:from-amber-600 hover:to-orange-700 transition-all whitespace-nowrap flex items-center gap-2 shadow-sm"
                                    >
                                        {confirmingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                        Verify
                                    </button>
                                </div>
                                <button onClick={() => set('otp_sent', false)} className="text-sm text-amber-600 hover:text-amber-700 underline">
                                    Use a different email
                                </button>
                            </div>
                        )}
                        {otpError && <p className="text-sm text-orange-600 font-medium">{otpError}</p>}
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Bank Search Grid */}
                    <div>
                        <label className={LABEL}>Select Bank</label>
                        {form.bank_name ? (
                            <div className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl">
                                {getBankLogo(form.bank_name) ? (
                                    <img src={getBankLogo(form.bank_name)!} alt={form.bank_name} className="h-9 w-9 object-contain rounded-xl" />
                                ) : (
                                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <Landmark className="w-5 h-5 text-amber-600" />
                                    </div>
                                )}
                                <span className="text-base font-bold text-gray-900 flex-1">{form.bank_name}</span>
                                <button onClick={() => { set('bank_name', ''); set('bank_id', ''); set('bank_verified', false); set('bank_resolved_name', ''); }} className="text-sm text-amber-600 font-bold">Change</button>
                            </div>
                        ) : (
                            <>
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input className={`${INPUT} pl-11`} value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="Search banks..." />
                                </div>
                                {banks.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-sm">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                        Loading banks...
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                                        {filteredBanks.map(b => {
                                            const logo = getBankLogo(b.name);
                                            return (
                                                <button
                                                    key={b.id}
                                                    onClick={() => handleBankSelect(b)}
                                                    className="flex items-center gap-2 p-3 rounded-2xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
                                                >
                                                    {logo ? (
                                                        <img src={logo} alt={b.name} className="h-7 w-7 object-contain rounded-lg flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Landmark className="w-3 h-3 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-semibold text-gray-700 truncate">{b.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {form.bank_name && (
                        <div>
                            <label className={LABEL}>Account Number</label>
                            <div className="flex gap-3">
                                <input
                                    className={INPUT}
                                    value={form.bank_account_number}
                                    onChange={e => { set('bank_account_number', e.target.value); set('bank_verified', false); set('bank_resolved_name', ''); }}
                                    placeholder="Enter account number"
                                />
                                <button
                                    onClick={handleVerifyBank}
                                    disabled={resolving || !form.bank_account_number.trim() || form.bank_verified}
                                    className="px-5 py-3 bg-orange-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 hover:bg-orange-600 transition-colors whitespace-nowrap flex items-center gap-2"
                                >
                                    {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                    {form.bank_verified ? 'Verified' : 'Verify'}
                                </button>
                            </div>
                            {resolveError && <p className="text-xs text-red-500 font-medium mt-2">{resolveError}</p>}
                            {form.bank_verified && form.bank_resolved_name && (
                                <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <div>
                                        <div className="text-xs font-bold text-green-800">Account Verified</div>
                                        <div className="text-xs text-green-700">{form.bank_resolved_name}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Step: Review ─────────────────────────────────────────────────────────────
function ReviewStep({ form }: { form: Form }) {
    const sections = [
        {
            title: 'Account Type',
            items: [{ label: 'Type', value: form.account_type === 'individual' ? 'Individual / Sole Trader' : 'Registered Business' }]
        },
        {
            title: 'Identity',
            items: [
                { label: form.account_type === 'individual' ? 'Full Name' : 'Business Name', value: form.account_type === 'individual' ? form.full_name : form.business_name },
                { label: form.account_type === 'individual' ? 'NRC' : 'PACRA', value: form.account_type === 'individual' ? form.nrc : form.pacra_number },
                ...(form.account_type === 'business' ? [{ label: 'TPIN', value: form.tpin }] : []),
                { label: 'Category', value: form.category },
            ].filter(i => i.value)
        },
        {
            title: 'Contact',
            items: [
                { label: 'Email', value: form.email },
                { label: 'Phone', value: form.phone ? `+260 ${form.phone}` : '' },
                { label: 'Address', value: `${form.address}, ${form.city}`.trim().replace(/^,\s*/, '') },
            ].filter(i => i.value)
        },
        {
            title: 'Payout Method',
            items: form.payout_type === 'mobile_money'
                ? [
                    { label: 'Method', value: 'Mobile Money' },
                    { label: 'Network', value: (form.mobile_network || '').toUpperCase() },
                    { label: 'Number', value: form.mobile_number ? `+260 ${form.mobile_number}` : '' },
                    { label: 'Verified', value: form.mobile_verified ? '✓ Yes' : '✗ Not verified' },
                ].filter(i => i.value)
                : [
                    { label: 'Method', value: 'Bank Account' },
                    { label: 'Bank', value: form.bank_name },
                    { label: 'Account', value: form.bank_account_number },
                    { label: 'Account Name', value: form.bank_resolved_name },
                    { label: 'Verified', value: form.bank_verified ? '✓ Yes' : '✗ Not verified' },
                ].filter(i => i.value)
        },
    ];

    return (
        <div className="space-y-5">
            <p className="text-base text-gray-600">Please review your information before submitting.</p>
            {sections.map(s => (
                <div key={s.title} className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
                    <div className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3">{s.title}</div>
                    <div className="space-y-2">
                        {s.items.map(i => (
                            <div key={i.label} className="flex justify-between text-sm">
                                <span className="text-gray-600">{i.label}</span>
                                <span className="font-semibold text-gray-900 text-right max-w-[60%]">{i.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                By submitting, you confirm all information is accurate and you agree to FlapaPay's Terms of Service.
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HostedOnboardingPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [completed, setCompleted] = useState(false);

    const [form, setFormState] = useState<Form>({
        account_type: '',
        business_name: '', business_type: '', tpin: '', pacra_number: '',
        full_name: '', nrc: '', dob: '', nationality: '',
        email: '', phone: '', address: '', city: '', category: '', website: '',
        payout_type: 'mobile_money',
        mobile_network: 'mtn', mobile_number: '', mobile_verified: false,
        bank_id: '', bank_name: '', bank_account_number: '',
        bank_resolved_name: '', bank_verified: false,
        otp_email: '', otp_code: '', otp_sent: false, otp_verified: false,
    });

    const set = (k: keyof Form, v: any) => setFormState(prev => ({ ...prev, [k]: v }));

    const STEPS = [
        { label: 'Account Type', icon: User, desc: 'Individual or business' },
        { label: 'Identity', icon: form.account_type === 'business' ? Building2 : User, desc: form.account_type === 'business' ? 'Company details' : 'Personal details' },
        { label: 'Contact', icon: Phone, desc: 'Address & contact' },
        { label: 'Payout', icon: CreditCard, desc: 'Settlement method' },
        { label: 'Review', icon: CheckCircle, desc: 'Confirm & submit' },
    ];

    // Load session
    useEffect(() => {
        if (!token) return;
        pub.get(`/v1/connect/onboarding/${token}`)
            .then(res => {
                setSession(res.data);
                // Pre-fill from partial_data
                const pd = res.data.partial_data || {};
                if (pd.account_type) set('account_type', pd.account_type.type || '');
                if (pd.identity) setFormState(prev => ({ ...prev, ...pd.identity }));
                if (pd.contact) setFormState(prev => ({ ...prev, ...pd.contact }));
                if (pd.payout) setFormState(prev => ({ ...prev, ...pd.payout }));
                // Pre-fill email from account
                if (res.data.account?.email) set('otp_email', res.data.account.email);
                if (res.data.status === 'completed') setCompleted(true);
            })
            .catch(err => setError(err.response?.data?.error || 'Failed to load onboarding session'))
            .finally(() => setLoading(false));
    }, [token]);

    const brandColor = session?.platform_color || '#f97316';

    // Save step progress to backend
    const saveStep = async (stepKey: string, data: any) => {
        try {
            await pub.post(`/v1/connect/onboarding/${token}/save`, { step: stepKey, data });
        } catch {}
    };

    // Validate current step
    const validateStep = (): string => {
        if (currentStep === 0 && !form.account_type) return 'Please select your account type';
        if (currentStep === 1) {
            if (!form.full_name.trim()) return 'Full name is required';
            if (!form.nrc.trim()) return form.account_type === 'business' ? 'Director NRC is required' : 'NRC number is required';
            if (form.account_type === 'business' && !form.business_name.trim()) return 'Business name is required';
            if (!form.category) return 'Please select a business category';
        }
        if (currentStep === 2) {
            if (!form.email.trim()) return 'Email address is required';
            if (!form.phone.trim()) return 'Phone number is required';
            if (!form.address.trim()) return 'Address is required';
            if (!form.city.trim()) return 'City is required';
        }
        if (currentStep === 3) {
            if (form.payout_type === 'mobile_money') {
                if (!form.mobile_network) return 'Select a mobile network';
                if (!form.mobile_number.trim()) return 'Mobile number is required';
                if (!form.mobile_verified) return 'Please verify your mobile number via OTP';
            } else {
                if (!form.bank_id) return 'Please select a bank';
                if (!form.bank_account_number.trim()) return 'Account number is required';
                if (!form.bank_verified) return 'Please verify your bank account';
            }
        }
        return '';
    };

    const handleNext = async () => {
        const err = validateStep();
        if (err) { setSubmitError(err); return; }
        setSubmitError('');

        // Save progress per step
        const stepKeys = ['account_type', 'identity', 'contact', 'payout'];
        const stepData = [
            { type: form.account_type },
            { full_name: form.full_name, nrc: form.nrc, dob: form.dob, nationality: form.nationality, business_name: form.business_name, business_type: form.business_type, pacra_number: form.pacra_number, tpin: form.tpin, category: form.category },
            { email: form.email, phone: form.phone, address: form.address, city: form.city, website: form.website },
            { type: form.payout_type, mobile_network: form.mobile_network, mobile_number: form.mobile_number, mobile_verified: form.mobile_verified, bank_id: form.bank_id, bank_name: form.bank_name, bank_account_number: form.bank_account_number, bank_resolved_name: form.bank_resolved_name, bank_verified: form.bank_verified },
        ];
        if (currentStep < stepKeys.length) {
            await saveStep(stepKeys[currentStep], stepData[currentStep]);
        }

        setCurrentStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await pub.post(`/v1/connect/onboarding/${token}/submit`, {});
            setCompleted(true);
            if (res.data.return_url) {
                setTimeout(() => { window.location.href = res.data.return_url; }, 3000);
            }
        } catch (err: any) {
            setSubmitError(err.response?.data?.error || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-white" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
                            <div className="w-20 h-20 border-4 border-black border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                        <p className="mt-8 text-black font-black uppercase tracking-[0.2em] text-xs">Loading Session</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error ──────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-white" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
                <div className="flex items-center justify-center min-h-screen p-6">
                    <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-sm">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Access Denied</h2>
                        <p className="text-gray-500 font-medium leading-relaxed mb-10">
                            {error || 'This onboarding link is invalid, expired, or has been revoked.'}
                        </p>
                        {session?.refresh_url && (
                            <a href={session.refresh_url} className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-gray-900 transition-all shadow-xl shadow-black/10">
                                <RefreshCw className="w-4 h-4" /> Request New Link
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Completed ──────────────────────────────────────────────────────────────
    if (completed || session?.status === 'completed') {
        return (
            <div className="min-h-screen bg-white" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
                <div className="flex items-center justify-center min-h-screen p-6">
                    <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">Onboarding Submitted!</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-12">Application Under Review</p>
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Submitted To</p>
                            <p className="text-3xl font-black text-gray-900 tracking-tight">{session?.platform_name}</p>
                            <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                                You'll receive an email once approved (1-2 business days)
                            </p>
                        </div>
                        {session?.return_url && (
                            <a href={session.return_url} className="w-full inline-flex items-center justify-center gap-2 px-8 py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
                                <ExternalLink className="w-4 h-4" />
                                Return to Merchant
                            </a>
                        )}
                        <div className="pt-6">
                            <p className="text-sm text-gray-400 font-bold">Secured By FlapaPay</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main Form ──────────────────────────────────────────────────────────────
    const StepContent = [
        <AccountTypeStep key="type" form={form} set={set} />,
        <IdentityStep key="identity" form={form} set={set} />,
        <ContactStep key="contact" form={form} set={set} />,
        <PayoutStep key="payout" token={token!} form={form} set={set} />,
        <ReviewStep key="review" form={form} />,
    ][currentStep];

    return (
        <div className="min-h-screen bg-white" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            {/* Top Bar */}
            <div className="relative z-10 bg-white/90 border-b border-gray-100 sticky top-0 z-50 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {session?.platform_logo_url ? (
                            <img src={session.platform_logo_url} alt={session.platform_name} className="h-10 object-contain" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-lg">
                                {(session?.platform_name || 'P')[0]}
                            </div>
                        )}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Onboarding for</p>
                            <p className="text-sm font-black text-gray-900">{session?.platform_name}</p>
                        </div>
                    </div>
                    
                    {/* Center - Powered By FlapaPay */}
                    <div className="hidden md:flex items-center gap-3">
                        <img src="/assets/images/flapapaylogoicon.png" alt="FlapaPay" className="h-14 w-14 object-contain" />
                        <span className="text-xl font-bold text-gray-500">Powered By <span className="text-gray-900 font-black text-2xl">FlapaPay</span></span>
                    </div>
                    
                    <div className="text-sm font-black text-gray-400 uppercase tracking-widest hidden sm:block">
                        Step {currentStep + 1} of {STEPS.length}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Progress */}
                <div className="flex items-center gap-3 mb-12 overflow-x-auto pb-2">
                    {STEPS.map((step, i) => {
                        const Icon = step.icon;
                        const done = i < currentStep;
                        const active = i === currentStep;
                        return (
                            <React.Fragment key={i}>
                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                                        done ? 'bg-black border-black text-white' : active ? 'border-black text-black bg-white' : 'border-gray-200 text-gray-300 bg-white'
                                    }`}>
                                        {done
                                            ? <CheckCircle className="w-5 h-5" />
                                            : <Icon className="w-5 h-5" />
                                        }
                                    </div>
                                    <span className={`text-xs font-bold hidden sm:block ${active ? 'text-black' : 'text-gray-400'}`}>{step.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 rounded-full min-w-[30px] ${i < currentStep ? 'bg-black' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-white rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                    {/* Card Header */}
                    <div className="p-10 border-b border-gray-100">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{STEPS[currentStep].label}</h1>
                        <p className="text-base text-gray-500 mt-2">{STEPS[currentStep].desc}</p>
                    </div>

                    {/* Card Body */}
                    <div className="p-10">
                        {StepContent}

                        {submitError && (
                            <div className="mt-5 flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {submitError}
                            </div>
                        )}
                    </div>

                    {/* Card Footer */}
                    <div className="p-6 border-t border-amber-100 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-600">
                        <button
                            onClick={() => { setSubmitError(''); setCurrentStep(prev => prev - 1); }}
                            disabled={currentStep === 0}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-white/20 border border-white/30 hover:bg-white/30 disabled:opacity-0 transition-all backdrop-blur-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {currentStep < STEPS.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-4 rounded-[2rem] text-sm font-black text-amber-700 bg-white hover:bg-gray-50 transition-all shadow-2xl shadow-black/20 active:scale-[0.98]"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center gap-2 px-8 py-4 rounded-[2rem] text-sm font-black text-amber-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all shadow-2xl shadow-black/20 active:scale-[0.98]"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                {submitting ? 'Submitting…' : 'Submit Application'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-12 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm font-black uppercase tracking-widest">Piped by 256-bit encryption</span>
                    </div>
                    <p className="text-sm text-gray-400 font-bold">
                        Secured By FlapaPay
                    </p>
                </div>
            </div>
        </div>
    );
}
