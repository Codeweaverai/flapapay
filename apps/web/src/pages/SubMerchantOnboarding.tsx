import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import ReactCountryFlag from 'react-country-flag';
import {
    ArrowLeft, ArrowRight, Building2, User, CreditCard,
    CheckCircle, Loader2, AlertCircle, Smartphone, Landmark,
    Briefcase, UserCheck, MapPin, Phone, Search
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type AccountType = 'individual' | 'business' | null;

interface IndividualForm {
    full_name: string; nrc: string; dob: string; nationality: string;
    email: string; phone: string; address: string; city: string;
    trade_name: string; category: string; monthly_volume: string;
    payout_type: 'mobile_money' | 'bank_account';
    mobile_network: string; mobile_number: string;
    bank_id: string; bank_name: string; bank_account_number: string;
    bank_resolved_name: string; bank_verified: boolean;
}

interface BusinessForm {
    business_name: string; business_type: string; tpin: string;
    pacra_number: string; registration_date: string;
    director_name: string; director_nrc: string; director_role: string;
    email: string; phone: string; address: string; city: string;
    category: string; website: string;
    payout_type: 'mobile_money' | 'bank_account';
    mobile_network: string; mobile_number: string;
    bank_id: string; bank_name: string; bank_account_number: string;
    bank_resolved_name: string; bank_verified: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MOBILE_NETWORKS = [
    { id: 'mtn', name: 'MTN', gradient: 'from-yellow-400 to-yellow-500', text: 'text-yellow-700' },
    { id: 'airtel', name: 'Airtel', gradient: 'from-red-500 to-red-600', text: 'text-red-700' },
    { id: 'zamtel', name: 'Zamtel', gradient: 'from-green-500 to-green-600', text: 'text-green-700' },
];

const BUSINESS_TYPES = ['Limited Company', 'Sole Trader', 'Partnership', 'NGO / Non-profit', 'Cooperative', 'Trust'];
const CATEGORIES = ['Retail & Commerce', 'Food & Beverages', 'Professional Services', 'Technology', 'Agriculture', 'Transport & Logistics', 'Education', 'Healthcare', 'Entertainment', 'Other'];
const VOLUME_RANGES = ['Under ZMW 5,000/mo', 'ZMW 5k–20k/mo', 'ZMW 20k–100k/mo', 'ZMW 100k–500k/mo', 'Over ZMW 500k/mo'];

const IND_STEPS = [
    { label: 'Personal', icon: User, desc: 'Your legal identity' },
    { label: 'Contact', icon: MapPin, desc: 'Address & contact details' },
    { label: 'Business Activity', icon: Briefcase, desc: 'What you sell & volumes' },
    { label: 'Payout', icon: CreditCard, desc: 'Where to receive earnings' },
];

const BIZ_STEPS = [
    { label: 'Company', icon: Building2, desc: 'Registration & compliance' },
    { label: 'Director', icon: UserCheck, desc: 'Authorised representative' },
    { label: 'Contact', icon: Phone, desc: 'Business contact & address' },
    { label: 'Payout', icon: CreditCard, desc: 'Settlement account' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const INPUT = 'w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all';
const SELECT = `${INPUT} cursor-pointer`;
const LABEL = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Grid2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>;
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
    return <div className={full ? 'md:col-span-2' : ''}><label className={LABEL}>{label}</label>{children}</div>;
}

// ─── Bank logo helper (mirrors Settings.tsx) ──────────────────────────────────
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

// ─── Payout Step (shared) ─────────────────────────────────────────────────────
function PayoutStep({ payout_type, mobile_network, mobile_number, bank_id, bank_name, bank_account_number, bank_resolved_name, bank_verified, set }: any) {
    const [banks, setBanks] = useState<any[]>([]);
    const [bankSearch, setBankSearch] = useState('');
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState('');

    useEffect(() => {
        if (payout_type === 'bank_account' && banks.length === 0) {
            api.get('/merchants/lenco/banks?country=zm')
                .then(res => { if (res.data.status) setBanks(res.data.data); })
                .catch(() => {});
        }
    }, [payout_type]);

    const filteredBanks = useMemo(() =>
        banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase())),
        [banks, bankSearch]
    );

    const handleVerify = async () => {
        if (!bank_id || !bank_account_number.trim()) return;
        setResolving(true);
        setResolveError('');
        try {
            const res = await api.post('/merchants/lenco/resolve', {
                bankId: bank_id,
                accountNumber: bank_account_number.trim(),
                country: 'zm',
            });
            if (res.data.status && res.data.data?.accountName) {
                set('bank_resolved_name', res.data.data.accountName);
                set('bank_verified', true);
            } else {
                setResolveError(res.data.message || 'Account not found. Check the number and try again.');
            }
        } catch {
            setResolveError('Verification failed. Please check the account number and try again.');
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

    return (
        <div className="space-y-6">
            {/* Type toggle */}
            <div className="flex gap-3">
                {[
                    { id: 'mobile_money', label: 'Mobile Money', Icon: Smartphone },
                    { id: 'bank_account', label: 'Bank Account', Icon: Landmark },
                ].map(({ id, label, Icon }) => (
                    <button key={id} type="button" onClick={() => set('payout_type', id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 text-sm font-bold transition-all ${payout_type === id
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {payout_type === 'mobile_money' ? (
                <>
                    {/* Network picker */}
                    <div>
                        <label className={LABEL}>Network *</label>
                        <div className="grid grid-cols-3 gap-3">
                            {MOBILE_NETWORKS.map(net => (
                                <button key={net.id} type="button" onClick={() => set('mobile_network', net.id)}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${mobile_network === net.id ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${net.gradient} shadow-sm`} />
                                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-600">{net.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile number with ZM flag + +260 */}
                    <div>
                        <label className={LABEL}>Mobile Number *</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 select-none pointer-events-none">
                                <ReactCountryFlag
                                    countryCode="ZM"
                                    svg
                                    style={{ width: '1.25em', height: '1.25em', borderRadius: '3px' }}
                                />
                                <span className="text-sm font-bold text-gray-500">+260</span>
                            </div>
                            <input
                                className={`${INPUT} pl-24 font-mono tracking-wider`}
                                placeholder="97 0000 000"
                                value={mobile_number}
                                onChange={e => set('mobile_number', e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Zambia (+260) only — enter digits after country code</p>
                    </div>
                </>
            ) : (
                <>
                    {/* Bank search grid */}
                    <div>
                        <label className={LABEL}>Select Bank *</label>
                        <div className="relative mb-3">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search banks…"
                                value={bankSearch}
                                onChange={e => setBankSearch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                            />
                        </div>

                        {banks.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                                <Loader2 size={14} className="animate-spin" /> Loading banks…
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                                {filteredBanks.map(b => {
                                    const logo = getBankLogo(b.name);
                                    const isSelected = bank_id === b.id;
                                    return (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => handleBankSelect(b)}
                                            className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all ${isSelected
                                                ? 'border-orange-500 bg-orange-50 shadow-sm'
                                                : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
                                                {logo
                                                    ? <img src={logo} alt={b.name} className="w-full h-full object-contain p-1" />
                                                    : <span className="text-base font-black text-gray-300">{b.name.charAt(0)}</span>
                                                }
                                            </div>
                                            <span className={`text-[9px] font-black uppercase leading-tight tracking-tight ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                                                {b.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Account number + verify — only shown once a bank is selected */}
                    {bank_id && (
                        <div className="pt-2 border-t border-gray-100 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                            <label className={LABEL}>Account Number *</label>

                            {bank_verified ? (
                                /* ── Verified state ── */
                                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                                            <CheckCircle size={16} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified Account</p>
                                            <p className="text-sm font-extrabold text-gray-900 truncate">{bank_resolved_name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{bank_account_number} · {bank_name}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { set('bank_verified', false); set('bank_resolved_name', ''); }}
                                            className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ── Input + verify button ── */
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            className={`${INPUT} font-mono tracking-widest flex-1`}
                                            placeholder="Enter account number"
                                            value={bank_account_number}
                                            onChange={e => { set('bank_account_number', e.target.value); setResolveError(''); }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerify}
                                            disabled={resolving || !bank_account_number.trim()}
                                            className="px-5 py-3 bg-gray-900 text-white font-black text-sm rounded-2xl hover:bg-gray-800 disabled:opacity-30 transition-all flex items-center gap-2 shrink-0"
                                        >
                                            {resolving
                                                ? <><Loader2 size={13} className="animate-spin" /> Checking…</>
                                                : 'Verify'}
                                        </button>
                                    </div>
                                    {resolveError && (
                                        <p className="text-xs text-red-500 font-medium flex items-center gap-1.5 ml-1">
                                            <AlertCircle size={11} /> {resolveError}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-gray-400 ml-1">We'll confirm the account name with {bank_name} in real time.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepBar({ steps, current }: { steps: typeof IND_STEPS; current: number }) {
    return (
        <div className="flex items-center mb-8">
            {steps.map((s, i) => {
                const Icon = s.icon;
                const done = current > i + 1;
                const active = current === i + 1;
                return (
                    <React.Fragment key={s.label}>
                        <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${done ? 'bg-emerald-500' : active ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-300' : 'bg-white border border-gray-200'}`}>
                                {done ? <CheckCircle size={16} className="text-white" /> : <Icon size={15} className={active ? 'text-white' : 'text-gray-400'} />}
                            </div>
                            <span className={`text-[9px] font-black mt-1 tracking-wide ${active ? 'text-orange-600' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1.5 mb-4 rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const SubMerchantOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const [accountType, setAccountType] = useState<AccountType>(null);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [createdAccount, setCreatedAccount] = useState<any>(null);
    const [initializing, setInitializing] = useState(true);
    const [initError, setInitError] = useState('');

    const [ind, setInd] = useState<IndividualForm>({
        full_name: '', nrc: '', dob: '', nationality: 'Zambian',
        email: '', phone: '', address: '', city: 'Lusaka',
        trade_name: '', category: '', monthly_volume: '',
        payout_type: 'mobile_money', mobile_network: 'mtn', mobile_number: '',
        bank_id: '', bank_name: '', bank_account_number: '',
        bank_resolved_name: '', bank_verified: false,
    });

    const [biz, setBiz] = useState<BusinessForm>({
        business_name: '', business_type: 'Limited Company', tpin: '', pacra_number: '', registration_date: '',
        director_name: '', director_nrc: '', director_role: 'Managing Director',
        email: '', phone: '', address: '', city: 'Lusaka', category: '', website: '',
        payout_type: 'mobile_money', mobile_network: 'mtn', mobile_number: '',
        bank_id: '', bank_name: '', bank_account_number: '',
        bank_resolved_name: '', bank_verified: false,
    });

    const setI = (k: keyof IndividualForm, v: string | boolean) => setInd(p => ({ ...p, [k]: v }));
    const setB = (k: keyof BusinessForm, v: string | boolean) => setBiz(p => ({ ...p, [k]: v }));

    // ── Ensure merchant record + keys exist before any Connect call ──────────
    useEffect(() => {
        (async () => {
            try {
                // Ensure merchant record exists
                await api.post('/merchants/onboarding/draft', { payload: {} });
                // Load & cache merchant API keys
                const keysRes = await api.get('/merchants/keys');
                if (keysRes.data?.test?.secret) {
                    localStorage.setItem('merchant_sk_test', keysRes.data.test.secret);
                }
                if (keysRes.data?.live?.secret) {
                    localStorage.setItem('merchant_sk_live', keysRes.data.live.secret);
                }
                // If no keys exist yet, roll them to provision a fresh set
                if (!keysRes.data?.test?.secret) {
                    await api.post('/merchants/keys/roll', { type: 'test' });
                    const fresh = await api.get('/merchants/keys');
                    if (fresh.data?.test?.secret) localStorage.setItem('merchant_sk_test', fresh.data.test.secret);
                    if (fresh.data?.live?.secret) localStorage.setItem('merchant_sk_live', fresh.data.live.secret);
                }
            } catch (e: any) {
                setInitError('Could not initialize. Please visit the Merchant Dashboard first.');
            } finally {
                setInitializing(false);
            }
        })();
    }, []);

    const totalSteps = accountType === 'individual' ? IND_STEPS.length : BIZ_STEPS.length;
    const steps = accountType === 'individual' ? IND_STEPS : BIZ_STEPS;

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = (): string => {
        if (accountType === 'individual') {
            if (step === 1 && !ind.full_name.trim()) return 'Full legal name is required';
            if (step === 1 && !ind.nrc.trim()) return 'NRC / Passport number is required';
            if (step === 2 && !ind.email.trim()) return 'Email address is required';
            if (step === 3 && !ind.category) return 'Please select a business category';
            if (step === 4 && ind.payout_type === 'mobile_money' && !ind.mobile_number.trim()) return 'Mobile number is required';
            if (step === 4 && ind.payout_type === 'bank_account' && !ind.bank_verified) return 'Please verify your bank account before continuing';
        } else {
            if (step === 1 && !biz.business_name.trim()) return 'Business name is required';
            if (step === 1 && !biz.tpin.trim()) return 'TPIN is required';
            if (step === 2 && !biz.director_name.trim()) return 'Director name is required';
            if (step === 3 && !biz.email.trim()) return 'Contact email is required';
            if (step === 4 && biz.payout_type === 'mobile_money' && !biz.mobile_number.trim()) return 'Mobile number is required';
            if (step === 4 && biz.payout_type === 'bank_account' && !biz.bank_verified) return 'Please verify your bank account before continuing';
        }
        return '';
    };

    const handleNext = () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError('');
        if (step < totalSteps) { setStep(s => s + 1); }
        else { handleSubmit(); }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const isInd = accountType === 'individual';
            const payload = isInd ? {
                type: 'individual',
                country: 'ZM',
                email: ind.email,
                business_profile: {
                    name: ind.trade_name || ind.full_name,
                    type: 'individual',
                    category: ind.category,
                    monthly_volume: ind.monthly_volume,
                },
                individual: {
                    full_name: ind.full_name,
                    id_number: ind.nrc,
                    dob: ind.dob,
                    nationality: ind.nationality,
                    phone: `+260${ind.phone}`,
                    address: { line1: ind.address, city: ind.city, country: 'ZM' },
                },
                capabilities: { transfers: { requested: true } }
            } : {
                type: 'custom',
                country: 'ZM',
                email: biz.email,
                business_profile: {
                    name: biz.business_name,
                    type: biz.business_type,
                    tpin: biz.tpin,
                    pacra_number: biz.pacra_number,
                    registration_date: biz.registration_date,
                    category: biz.category,
                    website: biz.website,
                },
                individual: {
                    full_name: biz.director_name,
                    id_number: biz.director_nrc,
                    role: biz.director_role,
                    phone: `+260${biz.phone}`,
                    address: { line1: biz.address, city: biz.city, country: 'ZM' },
                },
                capabilities: { transfers: { requested: true } }
            };

            const res = await api.post('/v1/connect/accounts', payload);
            const accountId = res.data.id;

            // Add payout method
            const f = isInd ? ind : biz;
            await api.post(`/v1/connect/accounts/${accountId}/payout_methods`, {
                type: f.payout_type,
                is_default: true,
                details: f.payout_type === 'mobile_money'
                    ? { provider: f.mobile_network, number: `+260${f.mobile_number}`, country: 'ZM' }
                    : {
                        bank_name: f.bank_name,
                        bank_id: f.bank_id,
                        account_number: f.bank_account_number,
                        account_holder_name: f.bank_resolved_name,
                        country: 'ZM',
                    },
            });

            setCreatedAccount(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create account. Please try again.');
            setSubmitting(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (initializing) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] flex font-sans">
                <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen"><Sidebar /></div>
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-14 h-14 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">Initializing secure session…</p>
                    </div>
                </main>
            </div>
        );
    }

    if (initError) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] flex font-sans">
                <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen"><Sidebar /></div>
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="max-w-md text-center bg-white rounded-3xl border border-red-100 p-10 shadow-sm">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-7 h-7 text-red-500" />
                        </div>
                        <h2 className="text-lg font-extrabold text-gray-900 mb-2">Setup Required</h2>
                        <p className="text-sm text-gray-500 mb-6">{initError}</p>
                        <button onClick={() => navigate('/merchant/dashboard')}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 transition-all">
                            Go to Merchant Dashboard →
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // ── Success ───────────────────────────────────────────────────────────────
    if (createdAccount) {
        const name = accountType === 'individual' ? ind.full_name : biz.business_name;
        const payoutInfo = accountType === 'individual'
            ? (ind.payout_type === 'mobile_money'
                ? `${ind.mobile_network.toUpperCase()} · +260${ind.mobile_number}`
                : `${ind.bank_name} · ${ind.bank_resolved_name}`)
            : (biz.payout_type === 'mobile_money'
                ? `${biz.mobile_network.toUpperCase()} · +260${biz.mobile_number}`
                : `${biz.bank_name} · ${biz.bank_resolved_name}`);

        return (
            <div className="min-h-screen bg-[#F9FAFB] flex font-sans">
                <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen"><Sidebar /></div>
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="max-w-lg w-full">
                        {/* Success card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center mb-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500 rounded-t-3xl" />
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Account Created!</h1>
                            <p className="text-gray-500 text-sm mb-1"><span className="font-bold text-gray-800">{name}</span> has been connected to your platform.</p>
                            <p className="text-xs text-gray-400 font-mono bg-gray-50 inline-block px-3 py-1 rounded-lg mt-1">{createdAccount.id}</p>
                        </div>

                        {/* Summary */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Account Summary</p>
                            {[
                                { label: 'Type', value: accountType === 'individual' ? 'Individual Vendor' : biz.business_type },
                                { label: accountType === 'individual' ? 'Full Name' : 'Business', value: name },
                                { label: 'Contact', value: accountType === 'individual' ? ind.email : biz.email },
                                { label: 'Category', value: accountType === 'individual' ? ind.category : biz.category },
                                { label: 'Payout', value: `${(accountType === 'individual' ? ind : biz).payout_type === 'mobile_money' ? '📱' : '🏦'} ${payoutInfo}` },
                                { label: 'Status', value: 'Pending KYC Review' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                                    <span className="text-xs text-gray-400 font-medium">{label}</span>
                                    <span className="text-xs font-bold text-gray-800 max-w-[200px] text-right">{value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setCreatedAccount(null); setAccountType(null); setStep(1); setError(''); }}
                                className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm">
                                Add Another
                            </button>
                            <button onClick={() => navigate('/merchant/connect')}
                                className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 transition-all text-sm">
                                Connect Dashboard →
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen"><Sidebar /></div>

            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/25 via-amber-100/10 to-transparent rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />

                <div className="max-w-2xl mx-auto px-6 py-10 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => {
                                if (accountType && step > 1) { setStep(s => s - 1); setError(''); }
                                else if (accountType) { setAccountType(null); setStep(1); setError(''); }
                                else navigate('/merchant/connect');
                            }}
                            className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all active:scale-95">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
                                    <Shield className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase">FlapaPay Connect</span>
                                <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">KYC Verified</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                                {accountType ? 'Sub-merchant Onboarding' : 'Add Sub-merchant'}
                            </h1>
                        </div>
                    </div>

                    {/* ── Account type selection ── */}
                    {!accountType && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Select account type</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        {
                                            id: 'individual' as AccountType,
                                            icon: User,
                                            title: 'Individual',
                                            subtitle: 'Personal vendor or sole trader',
                                            tags: ['Street vendors', 'Freelancers', 'Home businesses'],
                                            gradient: 'from-blue-500 to-indigo-600',
                                            glow: 'hover:shadow-blue-500/10',
                                        },
                                        {
                                            id: 'business' as AccountType,
                                            icon: Building2,
                                            title: 'Business',
                                            subtitle: 'Registered company or organisation',
                                            tags: ['Ltd Companies', 'NGOs', 'Cooperatives'],
                                            gradient: 'from-orange-500 to-amber-500',
                                            glow: 'hover:shadow-orange-500/10',
                                        },
                                    ].map(({ id, icon: Icon, title, subtitle, tags, gradient, glow }) => (
                                        <button key={id as string} onClick={() => setAccountType(id)}
                                            className={`group text-left p-6 rounded-3xl border-2 border-gray-100 bg-white hover:border-gray-200 hover:shadow-xl ${glow} transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]`}>
                                            <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-lg font-extrabold text-gray-900 mb-1">{title}</h3>
                                            <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {tags.map(t => (
                                                    <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-bold uppercase tracking-wide">{t}</span>
                                                ))}
                                            </div>
                                            <div className="mt-5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-orange-500 transition-colors">
                                                Select <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trust badges */}
                            <div className="flex items-center justify-center gap-6 py-2">
                                {['PCI-DSS Compliant', 'Bank-grade Encryption', 'BOZ Regulated'].map(b => (
                                    <div key={b} className="flex items-center gap-1.5 text-gray-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{b}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Multi-step form ── */}
                    {accountType && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                            <StepBar steps={steps} current={step} />

                            <div className="mb-6 pb-5 border-b border-gray-50">
                                <h2 className="text-lg font-extrabold text-gray-900">{steps[step - 1].label}</h2>
                                <p className="text-sm text-gray-400">{steps[step - 1].desc}</p>
                            </div>

                            {/* ── Individual Steps ── */}
                            {accountType === 'individual' && (
                                <>
                                    {step === 1 && (
                                        <Grid2>
                                            <Field label="Full Legal Name *" full><input className={INPUT} placeholder="e.g. Mary Mwanza" value={ind.full_name} onChange={e => setI('full_name', e.target.value)} /></Field>
                                            <Field label="NRC / Passport *">
                                                <input className={INPUT} placeholder="123456/78/1" value={ind.nrc} onChange={e => setI('nrc', e.target.value)} />
                                            </Field>
                                            <Field label="Date of Birth">
                                                <input className={INPUT} type="date" value={ind.dob} onChange={e => setI('dob', e.target.value)} />
                                            </Field>
                                            <Field label="Nationality">
                                                <input className={INPUT} placeholder="Zambian" value={ind.nationality} onChange={e => setI('nationality', e.target.value)} />
                                            </Field>
                                        </Grid2>
                                    )}
                                    {step === 2 && (
                                        <Grid2>
                                            <Field label="Email Address *">
                                                <input className={INPUT} type="email" placeholder="you@example.com" value={ind.email} onChange={e => setI('email', e.target.value)} />
                                            </Field>
                                            <Field label="Phone Number">
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+260</span>
                                                    <input className={`${INPUT} pl-16`} placeholder="970 000 000" value={ind.phone} onChange={e => setI('phone', e.target.value)} />
                                                </div>
                                            </Field>
                                            <Field label="Physical Address" full>
                                                <input className={INPUT} placeholder="Street / Plot number" value={ind.address} onChange={e => setI('address', e.target.value)} />
                                            </Field>
                                            <Field label="City / Town">
                                                <input className={INPUT} placeholder="Lusaka" value={ind.city} onChange={e => setI('city', e.target.value)} />
                                            </Field>
                                        </Grid2>
                                    )}
                                    {step === 3 && (
                                        <Grid2>
                                            <Field label="Trading Name (optional)">
                                                <input className={INPUT} placeholder="Your shop or business name" value={ind.trade_name} onChange={e => setI('trade_name', e.target.value)} />
                                            </Field>
                                            <Field label="Business Category *">
                                                <select className={SELECT} value={ind.category} onChange={e => setI('category', e.target.value)}>
                                                    <option value="">Select category…</option>
                                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                                </select>
                                            </Field>
                                            <Field label="Estimated Monthly Volume" full>
                                                <select className={SELECT} value={ind.monthly_volume} onChange={e => setI('monthly_volume', e.target.value)}>
                                                    <option value="">Select range…</option>
                                                    {VOLUME_RANGES.map(r => <option key={r}>{r}</option>)}
                                                </select>
                                            </Field>
                                        </Grid2>
                                    )}
                                    {step === 4 && (
                                        <PayoutStep
                                            payout_type={ind.payout_type}
                                            mobile_network={ind.mobile_network}
                                            mobile_number={ind.mobile_number}
                                            bank_id={ind.bank_id}
                                            bank_name={ind.bank_name}
                                            bank_account_number={ind.bank_account_number}
                                            bank_resolved_name={ind.bank_resolved_name}
                                            bank_verified={ind.bank_verified}
                                            set={setI}
                                        />
                                    )}
                                </>
                            )}

                            {/* ── Business Steps ── */}
                            {accountType === 'business' && (
                                <>
                                    {step === 1 && (
                                        <Grid2>
                                            <Field label="Registered Business Name *" full>
                                                <input className={INPUT} placeholder="e.g. Lusaka Fresh Market Ltd" value={biz.business_name} onChange={e => setB('business_name', e.target.value)} />
                                            </Field>
                                            <Field label="Entity Type">
                                                <select className={SELECT} value={biz.business_type} onChange={e => setB('business_type', e.target.value)}>
                                                    {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                                                </select>
                                            </Field>
                                            <Field label="TPIN *">
                                                <input className={`${INPUT} font-mono`} placeholder="10-digit TPIN" maxLength={10} value={biz.tpin} onChange={e => setB('tpin', e.target.value)} />
                                            </Field>
                                            <Field label="PACRA Number">
                                                <input className={INPUT} placeholder="Registration No." value={biz.pacra_number} onChange={e => setB('pacra_number', e.target.value)} />
                                            </Field>
                                            <Field label="Registration Date">
                                                <input className={INPUT} type="date" value={biz.registration_date} onChange={e => setB('registration_date', e.target.value)} />
                                            </Field>
                                        </Grid2>
                                    )}
                                    {step === 2 && (
                                        <Grid2>
                                            <Field label="Director Full Name *" full>
                                                <input className={INPUT} placeholder="e.g. John Banda" value={biz.director_name} onChange={e => setB('director_name', e.target.value)} />
                                            </Field>
                                            <Field label="Director NRC / Passport">
                                                <input className={INPUT} placeholder="123456/78/1" value={biz.director_nrc} onChange={e => setB('director_nrc', e.target.value)} />
                                            </Field>
                                            <Field label="Role / Title">
                                                <select className={SELECT} value={biz.director_role} onChange={e => setB('director_role', e.target.value)}>
                                                    {['Managing Director', 'CEO', 'Director', 'Chairperson', 'Company Secretary', 'Authorised Signatory'].map(r => <option key={r}>{r}</option>)}
                                                </select>
                                            </Field>
                                        </Grid2>
                                    )}
                                    {step === 3 && (
                                        <Grid2>
                                            <Field label="Business Email *">
                                                <input className={INPUT} type="email" placeholder="info@business.zm" value={biz.email} onChange={e => setB('email', e.target.value)} />
                                            </Field>
                                            <Field label="Business Phone">
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+260</span>
                                                    <input className={`${INPUT} pl-16`} placeholder="970 000 000" value={biz.phone} onChange={e => setB('phone', e.target.value)} />
                                                </div>
                                            </Field>
                                            <Field label="Physical Address" full>
                                                <input className={INPUT} placeholder="Plot / Street, Area" value={biz.address} onChange={e => setB('address', e.target.value)} />
                                            </Field>
                                            <Field label="City">
                                                <input className={INPUT} placeholder="Lusaka" value={biz.city} onChange={e => setB('city', e.target.value)} />
                                            </Field>
                                            <Field label="Business Category">
                                                <select className={SELECT} value={biz.category} onChange={e => setB('category', e.target.value)}>
                                                    <option value="">Select…</option>
                                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                                </select>
                                            </Field>
                                            <Field label="Website (optional)">
                                                <input className={INPUT} placeholder="https://" value={biz.website} onChange={e => setB('website', e.target.value)} />
                                            </Field>
                                        </Grid2>
                                    )}
                                    {step === 4 && (
                                        <PayoutStep
                                            payout_type={biz.payout_type}
                                            mobile_network={biz.mobile_network}
                                            mobile_number={biz.mobile_number}
                                            bank_id={biz.bank_id}
                                            bank_name={biz.bank_name}
                                            bank_account_number={biz.bank_account_number}
                                            bank_resolved_name={biz.bank_resolved_name}
                                            bank_verified={biz.bank_verified}
                                            set={setB}
                                        />
                                    )}
                                </>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-5 flex items-start gap-2.5 p-4 bg-red-50 border border-red-100 rounded-2xl">
                                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-red-600">{error}</p>
                                </div>
                            )}

                            {/* Nav buttons */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-50">
                                <span className="text-xs text-gray-400 font-medium">Step {step} of {totalSteps}</span>
                                <button onClick={handleNext} disabled={submitting}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:scale-[0.98] text-sm">
                                    {submitting
                                        ? <><Loader2 size={15} className="animate-spin" /> Creating account…</>
                                        : step < totalSteps
                                            ? <>Continue <ArrowRight size={15} /></>
                                            : <><CheckCircle size={15} /> Complete Setup</>}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-5 mt-6">
                        {['PCI-DSS Compliant', 'Bank-level Encryption', 'BOZ Licensed'].map(b => (
                            <div key={b} className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">{b}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};
