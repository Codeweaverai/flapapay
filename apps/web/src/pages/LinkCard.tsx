import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

const CARD_LOGOS: Record<string, { src: string; label: string }> = {
    visa: {
        src: 'https://cdn.brandfetch.io/idhem73aId/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1679062242416r',
        label: 'Visa',
    },
    mastercard: {
        src: 'https://cdn.brandfetch.io/idFw8DodCr/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1721117489739',
        label: 'Mastercard',
    },
    amex: {
        src: 'https://cdn.brandfetch.io/id5WXF6Iyd/theme/dark/idAyOxP8-l.svg?c=1bxid64Mup7aczewSAYMX&t=1729487052788',
        label: 'Amex',
    },
    maestro: {
        src: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Maestro_2016.svg',
        label: 'Maestro',
    },
};

function detectCardBrand(cardType: string | null): string | null {
    if (!cardType) return null;
    const t = cardType.toLowerCase();
    if (t === '001' || t === 'visa') return 'visa';
    if (t === '002' || t === 'mastercard' || t === 'master card') return 'mastercard';
    if (t === '003' || t === 'amex' || t === 'american express') return 'amex';
    if (t === 'maestro') return 'maestro';
    return null;
}

const CardBrandLogos: React.FC<{ detectedBrand: string | null }> = ({ detectedBrand }) => (
    <div className="flex items-center gap-3">
        {Object.entries(CARD_LOGOS).map(([key, { src, label }]) => {
            const active = detectedBrand === key;
            return (
                <div
                    key={key}
                    title={label}
                    className={`transition-all duration-200 rounded-lg p-1.5 ${active ? 'ring-2 ring-orange-400 bg-white shadow-md scale-110' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <img
                        src={src}
                        alt={label}
                        style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            );
        })}
    </div>
);

const FLEX_SCRIPT_URL = import.meta.env.VITE_CYBERSOURCE_ENVIRONMENT === 'production'
    ? 'https://flex.cybersource.com/microform/bundle/v2/flex-microform.min.js'
    : 'https://testflex.cybersource.com/microform/bundle/v2/flex-microform.min.js';

const loadFlexScript = (): Promise<void> => new Promise((resolve, reject) => {
    if ((window as any).Flex) { resolve(); return; }
    const s = document.createElement('script');
    s.src = FLEX_SCRIPT_URL;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load secure card module'));
    document.head.appendChild(s);
});

const FLEX_STYLES = {
    input: { 'font-size': '15px', 'font-family': 'inherit', color: '#111827', 'letter-spacing': '0.02em' },
    ':focus': { color: '#111827' },
    valid: { color: '#1d4ed8' },
    invalid: { color: '#dc2626' },
};

interface CardInstrument {
    id: string;
    last4: string;
    brand: string;
    exp_month: string;
    exp_year: string;
    is_default: boolean;
}

const SavedCardsList = ({ refresh }: { refresh: number }) => {
    const [cards, setCards] = useState<CardInstrument[]>([]);

    useEffect(() => {
        api.get('/v1/payment-methods')
            .then(res => setCards(res.data.instruments || []))
            .catch(() => {});
    }, [refresh]);

    if (cards.length === 0) return <p className="text-gray-400 text-sm italic">No linked cards yet.</p>;

    return (
        <div className="grid gap-3">
            {cards.map(card => (
                <div
                    key={card.id}
                    className={`p-4 rounded-xl border flex items-center justify-between ${card.is_default ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-7 bg-gray-800 rounded text-white flex items-center justify-center text-[10px] font-bold uppercase">
                            {card.brand?.slice(0, 4)}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-900">•••• {card.last4}</div>
                            <div className="text-xs text-gray-400">{card.exp_month}/{card.exp_year}</div>
                        </div>
                    </div>
                    {card.is_default && (
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">DEFAULT</span>
                    )}
                </div>
            ))}
        </div>
    );
};

interface BillingForm {
    firstName: string;
    lastName: string;
    email: string;
    address1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
}

const FlexSetupForm: React.FC<{
    captureContext: string;
    customerId: string;
    onSuccess: () => void;
    onRefreshContext: () => void;
    defaultEmail?: string;
}> = ({ captureContext, customerId, onSuccess, onRefreshContext, defaultEmail = '' }) => {
    const numberRef = useRef<HTMLDivElement>(null);
    const cvvRef = useRef<HTMLDivElement>(null);
    const microformRef = useRef<any>(null);
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [flexReady, setFlexReady] = useState(false);
    const [detectedBrand, setDetectedBrand] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [billing, setBilling] = useState<BillingForm>({
        firstName: '',
        lastName: '',
        email: defaultEmail,
        address1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
        phone: '',
    });

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                await loadFlexScript();
                if (!active) return;
                const flex = new (window as any).Flex(captureContext);
                const mf = flex.microform({ styles: FLEX_STYLES });
                microformRef.current = mf;
                const numberField = mf.createField('number', { placeholder: '1234 5678 9012 3456' });
                numberField.on('change', (data: any) => {
                    const brand = detectCardBrand(data?.card?.[0]?.name ?? data?.cardType ?? null);
                    if (active) setDetectedBrand(brand);
                });
                numberField.load(numberRef.current!);
                mf.createField('securityCode', { placeholder: '•••' }).load(cvvRef.current!);
                if (active) setFlexReady(true);
            } catch (e: any) {
                if (active) setErrorMessage('Failed to initialize secure card input. Please refresh.');
            }
        })();
        return () => { active = false; };
    }, [captureContext]);

    const setField = (field: keyof BillingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setBilling(b => ({ ...b, [field]: e.target.value }));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!microformRef.current) return;
        if (!expMonth || !expYear) {
            setErrorMessage('Please select the card expiry date.');
            return;
        }
        if (!billing.firstName || !billing.lastName || !billing.address1 || !billing.city || !billing.postalCode) {
            setErrorMessage('Please fill in all billing address fields.');
            return;
        }
        if (!agreedToTerms) {
            setErrorMessage('Please accept the Terms & Conditions to continue.');
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');

        let transientToken: string | null = null;
        try {
            transientToken = await new Promise<string>((res, rej) =>
                microformRef.current.createToken(
                    { expirationMonth: expMonth, expirationYear: expYear },
                    (err: any, t: string) => (err ? rej(err) : res(t))
                )
            );
        } catch (err: any) {
            const reason = err?.details?.[0]?.message || err?.message || 'Card validation failed';
            setErrorMessage('Card could not be validated — please re-enter your card details. (' + reason + ')');
            setIsProcessing(false);
            // Flex token creation failed — capture context is spent; refresh before next attempt
            onRefreshContext();
            return;
        }

        try {
            await api.post('/v1/payment-methods', {
                transientToken,
                expirationMonth: expMonth,
                expirationYear: expYear,
                billing_address: {
                    firstName:  billing.firstName,
                    lastName:   billing.lastName,
                    email:      billing.email,
                    address1:   billing.address1,
                    city:       billing.city,
                    state:      billing.state,
                    postalCode: billing.postalCode,
                    country:    billing.country,
                    phone:      billing.phone,
                },
            });
            onSuccess();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.detail || err.response?.data?.error || 'Failed to link card. Please try again.');
            setIsProcessing(false);
            // Refresh capture context so next attempt gets a fresh Flex token
            onRefreshContext();
        }
    };

    const inputCls = 'w-full h-11 px-3 bg-gray-50 border-2 border-gray-200 focus:border-orange-400 focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all placeholder-gray-400';
    const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── PANEL 1 — Card Details ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Panel header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-900">Card Details</p>
                        <p className="text-xs text-gray-400 mt-0.5">Secured by CyberSource · PCI DSS Level 1</p>
                    </div>
                    <CardBrandLogos detectedBrand={detectedBrand} />
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Verification banner */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl">
                        <svg className="w-5 h-5 text-white shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-white leading-relaxed">
                            <span className="font-bold">Card verification:</span> A temporary <span className="font-bold">$0.00</span> hold confirms card ownership. No charge is made — it disappears within 1–3 business days.
                        </p>
                    </div>

                    {/* Card number */}
                    <div>
                        <label className={labelCls}>Card Number</label>
                        <div className="relative">
                            <div
                                ref={numberRef}
                                className="pl-4 pr-14 bg-gray-50 border-2 border-gray-200 focus-within:border-orange-400 focus-within:bg-white rounded-xl transition-all"
                                style={{ height: '44px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center" style={{ height: '28px' }}>
                                {detectedBrand && CARD_LOGOS[detectedBrand] ? (
                                    <img src={CARD_LOGOS[detectedBrand].src} alt={CARD_LOGOS[detectedBrand].label}
                                        style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
                                ) : (
                                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Expiry + CVV */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={labelCls}>Month</label>
                            <select value={expMonth} onChange={e => setExpMonth(e.target.value)} className={inputCls}>
                                <option value="">MM</option>
                                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Year</label>
                            <select value={expYear} onChange={e => setExpYear(e.target.value)} className={inputCls}>
                                <option value="">YYYY</option>
                                {Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i)).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>CVV</label>
                            <div
                                ref={cvvRef}
                                className="px-4 bg-gray-50 border-2 border-gray-200 focus-within:border-orange-400 focus-within:bg-white rounded-xl transition-all"
                                style={{ height: '44px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PANEL 2 — Billing Address ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-bold text-gray-900">Billing Address</p>
                </div>

                <div className="px-6 py-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>First Name</label>
                            <input value={billing.firstName} onChange={setField('firstName')}
                                placeholder="John" className={inputCls} required />
                        </div>
                        <div>
                            <label className={labelCls}>Last Name</label>
                            <input value={billing.lastName} onChange={setField('lastName')}
                                placeholder="Smith" className={inputCls} required />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Email</label>
                        <input type="email" value={billing.email} onChange={setField('email')}
                            placeholder="john@example.com" className={inputCls} required />
                    </div>

                    <div>
                        <label className={labelCls}>Street Address</label>
                        <input value={billing.address1} onChange={setField('address1')}
                            placeholder="123 Main Street" className={inputCls} required />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>City</label>
                            <input value={billing.city} onChange={setField('city')}
                                placeholder="Cape Town" className={inputCls} required />
                        </div>
                        <div>
                            <label className={labelCls}>State / Province</label>
                            <input value={billing.state} onChange={setField('state')}
                                placeholder="WC" className={inputCls} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Postal Code</label>
                            <input value={billing.postalCode} onChange={setField('postalCode')}
                                placeholder="8001" className={inputCls} required />
                        </div>
                        <div>
                            <label className={labelCls}>Country</label>
                            <select value={billing.country} onChange={setField('country')} className={inputCls}>
                                <option value="">Select country</option>
                                <optgroup label="Africa">
                                    <option value="ZA">South Africa</option>
                                    <option value="ZM">Zambia</option>
                                    <option value="NG">Nigeria</option>
                                    <option value="KE">Kenya</option>
                                    <option value="GH">Ghana</option>
                                    <option value="UG">Uganda</option>
                                    <option value="TZ">Tanzania</option>
                                    <option value="RW">Rwanda</option>
                                    <option value="ET">Ethiopia</option>
                                    <option value="EG">Egypt</option>
                                    <option value="MA">Morocco</option>
                                    <option value="TN">Tunisia</option>
                                    <option value="CI">Côte d'Ivoire</option>
                                    <option value="SN">Senegal</option>
                                    <option value="CM">Cameroon</option>
                                    <option value="ZW">Zimbabwe</option>
                                    <option value="MZ">Mozambique</option>
                                    <option value="BW">Botswana</option>
                                    <option value="NA">Namibia</option>
                                    <option value="AO">Angola</option>
                                    <option value="MW">Malawi</option>
                                    <option value="LS">Lesotho</option>
                                    <option value="SZ">Eswatini</option>
                                </optgroup>
                                <optgroup label="Americas">
                                    <option value="US">United States</option>
                                    <option value="CA">Canada</option>
                                    <option value="BR">Brazil</option>
                                    <option value="MX">Mexico</option>
                                    <option value="AR">Argentina</option>
                                    <option value="CO">Colombia</option>
                                    <option value="CL">Chile</option>
                                    <option value="PE">Peru</option>
                                </optgroup>
                                <optgroup label="Europe">
                                    <option value="GB">United Kingdom</option>
                                    <option value="DE">Germany</option>
                                    <option value="FR">France</option>
                                    <option value="NL">Netherlands</option>
                                    <option value="ES">Spain</option>
                                    <option value="IT">Italy</option>
                                    <option value="SE">Sweden</option>
                                    <option value="NO">Norway</option>
                                    <option value="CH">Switzerland</option>
                                    <option value="PL">Poland</option>
                                    <option value="PT">Portugal</option>
                                    <option value="BE">Belgium</option>
                                </optgroup>
                                <optgroup label="Asia &amp; Pacific">
                                    <option value="AU">Australia</option>
                                    <option value="NZ">New Zealand</option>
                                    <option value="IN">India</option>
                                    <option value="SG">Singapore</option>
                                    <option value="AE">UAE</option>
                                    <option value="SA">Saudi Arabia</option>
                                    <option value="JP">Japan</option>
                                    <option value="CN">China</option>
                                    <option value="HK">Hong Kong</option>
                                    <option value="PH">Philippines</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Phone <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                        <input type="tel" value={billing.phone} onChange={setField('phone')}
                            placeholder="+27 21 000 0000" className={inputCls} />
                    </div>
                </div>
            </div>

            {/* ── Error ─────────────────────────────────────────────────── */}
            {errorMessage && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorMessage}
                </div>
            )}

            {/* ── Terms & Conditions + Submit ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={e => setAgreedToTerms(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-gradient-to-br from-orange-500 to-yellow-500 border-orange-500' : 'border-gray-300 bg-white group-hover:border-orange-400'}`}>
                            {agreedToTerms && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 leading-relaxed">
                        I agree to the{' '}
                        <a href="/terms" target="_blank" className="text-orange-500 font-semibold hover:underline">Terms & Conditions</a>
                        {' '}and{' '}
                        <a href="/privacy" target="_blank" className="text-orange-500 font-semibold hover:underline">Privacy Policy</a>.
                        I authorise FlapaPay to place a temporary $0.00 hold on this card for verification purposes.
                    </span>
                </label>

                <button
                    type="submit"
                    disabled={!flexReady || isProcessing || !agreedToTerms}
                    className="w-full py-4 rounded-xl font-bold text-white text-sm tracking-wide transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        background: (!flexReady || isProcessing || !agreedToTerms)
                            ? undefined
                            : 'linear-gradient(to right, #f97316, #eab308)',
                        backgroundColor: (!flexReady || isProcessing || !agreedToTerms) ? '#d1d5db' : undefined,
                    }}
                >
                    {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Verifying &amp; Linking Card...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Verify &amp; Link Card Securely
                        </span>
                    )}
                </button>
            </div>
        </form>
    );
};

export const LinkCard: React.FC = () => {
    const { token, user } = useAuth() as any;
    const navigate = useNavigate();
    const [captureContext, setCaptureContext] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [refreshCards, setRefreshCards] = useState(0);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!token) return;
        api.post('/v1/card-setup/context', {})
            .then(res => {
                setCaptureContext(res.data.captureContext);
                setCustomerId(res.data.customerId);
            })
            .catch(err => console.error('Failed to init card setup context', err));
        // Flex capture context expires in 15 min — auto-refresh at 14 min so it never expires mid-form
        const timer = setInterval(() => {
            api.post('/v1/card-setup/context', {})
                .then(res => {
                    setCaptureContext(res.data.captureContext);
                    setCustomerId(res.data.customerId);
                })
                .catch(() => {});
        }, 14 * 60 * 1000);
        return () => clearInterval(timer);
    }, [token]);

    const refreshContext = useCallback(() => {
        setCaptureContext('');
        setCustomerId('');
        api.post('/v1/card-setup/context', {})
            .then(res => {
                setCaptureContext(res.data.captureContext);
                setCustomerId(res.data.customerId);
            })
            .catch(() => {});
    }, []);

    const handleCardLinked = useCallback(() => {
        setSuccessMessage('Card linked successfully!');
        setRefreshCards(n => n + 1);
        refreshContext();
        setTimeout(() => setSuccessMessage(''), 3000);
    }, [refreshContext]);

    return (
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-100"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 min-h-screen p-6 md:p-8 flex flex-col max-w-5xl mx-auto relative overflow-x-hidden">
                {/* Decorative glow — matches Dashboard */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/20 via-yellow-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none" />
                <div className="md:hidden mb-6">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-500 flex items-center gap-2 text-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Link a Card</h1>
                    <p className="text-gray-500 mt-1 text-sm">Add a payment method for faster transfers and deposits.</p>
                </div>

                <div className="grid md:grid-cols-5 gap-6 items-start">
                    {/* Left — form */}
                    <div className="md:col-span-3">
                        {successMessage && (
                            <div className="mb-5 p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {successMessage}
                            </div>
                        )}

                        {captureContext && customerId ? (
                            <FlexSetupForm
                                captureContext={captureContext}
                                customerId={customerId}
                                onSuccess={handleCardLinked}
                                onRefreshContext={refreshContext}
                                defaultEmail={user?.email || ''}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-400 rounded-full animate-spin" />
                                <p className="text-gray-500 mt-4 text-sm font-medium">Initializing secure connection...</p>
                            </div>
                        )}
                    </div>

                    {/* Right — cards + info */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Your Linked Cards</h3>
                            <SavedCardsList refresh={refreshCards} />
                        </div>

                        <div className="relative rounded-2xl overflow-hidden shadow-sm" style={{ background: '#0a0a0a' }}>
                            {/* Floating diagonal stripe overlay */}
                            <div className="absolute inset-0 pointer-events-none" style={{
                                backgroundImage: 'repeating-linear-gradient(135deg, transparent 0px, transparent 18px, rgba(249,115,22,0.07) 18px, rgba(234,179,8,0.07) 26px)',
                            }} />
                            {/* Glow blob top-right */}
                            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none" style={{
                                background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)',
                            }} />
                            {/* Glow blob bottom-left */}
                            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full pointer-events-none" style={{
                                background: 'radial-gradient(circle, rgba(234,179,8,0.18) 0%, transparent 70%)',
                            }} />

                            <div className="relative p-5 space-y-3.5">
                                <p className="text-xs font-bold uppercase tracking-widest" style={{
                                    background: 'linear-gradient(to right, #f97316, #eab308)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>Why we verify</p>
                                {[
                                    { icon: '🔒', text: 'Your card data never touches our servers' },
                                    { icon: '✅', text: 'Instant card ownership verification' },
                                    { icon: '↩️', text: '$0 hold — no charge, refunded instantly' },
                                    { icon: '🛡️', text: 'Secured by CyberSource & PCI DSS Level 1' },
                                ].map(({ icon, text }) => (
                                    <div key={text} className="flex items-start gap-2.5 text-xs text-gray-300">
                                        <span className="text-base leading-tight">{icon}</span>
                                        <span className="leading-relaxed">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            {Object.entries(CARD_LOGOS).map(([key, { src, label }]) => (
                                <img key={key} src={src} alt={label} title={label} style={{ height: 28, width: 'auto', objectFit: 'contain' }}
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
