import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/axios';
import ReactCountryFlag from 'react-country-flag';

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
    input: { 'font-size': '14px', 'font-family': 'inherit', color: '#111827', 'letter-spacing': '0.02em' },
    ':focus': { color: '#111827' },
    valid: { color: '#1d4ed8' },
    invalid: { color: '#dc2626' },
};

const OPERATORS = {
    AIRTEL: {
        name: 'Airtel',
        providerName: 'AIRTEL_OAPI_ZMB',
        prefixes: ['097', '077', '97', '77'],
        logo: '/assets/images/Airtel_Africa_logo.svg',
    },
    MTN: {
        name: 'MTN',
        providerName: 'MTN_MOMO_ZMB',
        prefixes: ['096', '076', '96', '76'],
        logo: '/assets/images/MTN_Logo.svg',
    },
    ZAMTEL: {
        name: 'Zamtel',
        providerName: 'ZAMTEL_ZMB',
        prefixes: ['095', '075', '95', '75'],
        logo: '/assets/images/zamtel.png',
    },
};

const CardPaymentForm: React.FC<{ session: any; captureContext: string; onSuccess: () => void }> = ({ session, captureContext, onSuccess }) => {
    const numberRef = useRef<HTMLDivElement>(null);
    const cvvRef = useRef<HTMLDivElement>(null);
    const microformRef = useRef<any>(null);
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [flexReady, setFlexReady] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                await loadFlexScript();
                if (!active) return;
                const flex = new (window as any).Flex(captureContext);
                const mf = flex.microform({ styles: FLEX_STYLES });
                microformRef.current = mf;
                mf.createField('number', { placeholder: '1234 5678 9012 3456' }).load(numberRef.current!);
                mf.createField('securityCode', { placeholder: '•••' }).load(cvvRef.current!);
                if (active) setFlexReady(true);
            } catch (e: any) {
                if (active) setError('Failed to initialize secure card input.');
            }
        })();
        return () => { active = false; };
    }, [captureContext]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!microformRef.current) return;
        if (!expMonth || !expYear) { setError('Please enter card expiry.'); return; }
        setLoading(true);
        setError('');

        let token: string | null = null;
        try {
            token = await new Promise<string>((res, rej) =>
                microformRef.current.createToken(
                    { expirationMonth: expMonth, expirationYear: expYear },
                    (err: any, t: string) => (err ? rej(err) : res(t))
                )
            );
        } catch (err: any) {
            setError(err.message || 'Card validation failed');
            setLoading(false);
            return;
        }

        try {
            await api.post(`/v1/checkout/sessions/${session.id}/confirm`, {
                payment_method: 'card',
                payment_details: { transientToken: token },
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Payment failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Card Number</label>
                <div
                    ref={numberRef}
                    className="px-4 bg-gray-50 border-2 border-gray-100 focus-within:border-black focus-within:bg-white rounded-2xl transition-all"
                    style={{ minHeight: '48px', display: 'flex', alignItems: 'center' }}
                />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Month</label>
                    <select
                        value={expMonth}
                        onChange={e => setExpMonth(e.target.value)}
                        className="w-full h-12 px-3 bg-gray-50 border-2 border-gray-100 focus:border-black rounded-2xl text-sm font-bold text-gray-900 outline-none transition-all"
                    >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Year</label>
                    <select
                        value={expYear}
                        onChange={e => setExpYear(e.target.value)}
                        className="w-full h-12 px-3 bg-gray-50 border-2 border-gray-100 focus:border-black rounded-2xl text-sm font-bold text-gray-900 outline-none transition-all"
                    >
                        <option value="">YYYY</option>
                        {Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i)).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">CVV</label>
                    <div
                        ref={cvvRef}
                        className="px-4 bg-gray-50 border-2 border-gray-100 focus-within:border-black focus-within:bg-white rounded-2xl transition-all"
                        style={{ minHeight: '48px', display: 'flex', alignItems: 'center' }}
                    />
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-sm font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>
            )}

            <button
                type="submit"
                disabled={!flexReady || loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                    </>
                ) : `Pay ${session.currency} ${session.amount_total}`}
            </button>

            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                Secured by CyberSource · Visa-grade encryption
            </p>
        </form>
    );
};

export const UnifiedGateway: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mobileError, setMobileError] = useState('');
    const [captureContext, setCaptureContext] = useState('');

    const [method, setMethod] = useState<'CARD' | 'MOBILE_MONEY' | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');

    const [phoneNumber, setPhoneNumber] = useState('');
    const [operator, setOperator] = useState<any>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [isAmountSet, setIsAmountSet] = useState(false);

    useEffect(() => {
        const fetchSessionAndIntent = async () => {
            try {
                const res = await api.get(`/v1/checkout/sessions/${id}`);
                setSession(res.data);
                if (res.data.payment_method_types.includes('card') && res.data.amount_total) {
                    const intentRes = await api.post(`/v1/checkout/sessions/${id}/intent`);
                    setCaptureContext(intentRes.data.captureContext);
                }
                if (res.data.amount_total) setIsAmountSet(true);
            } catch {
                setError('Invalid or expired checkout session.');
            } finally {
                setLoading(false);
            }
        };
        fetchSessionAndIntent();
    }, [id]);

    const detectOperator = (value: string) => {
        setPhoneNumber(value);
        const prefix3 = value.substring(0, 3);
        const prefix2 = value.substring(0, 2);
        const match = Object.values(OPERATORS).find(op => op.prefixes.includes(prefix3) || op.prefixes.includes(prefix2));
        setOperator(match || null);
    };

    const handleMobilePayment = async () => {
        if (!operator || !phoneNumber) return;
        setStatus('PROCESSING');
        setMobileError('');
        try {
            const initRes = await api.post(`/v1/checkout/sessions/${id}/initiate-mobile`, {
                phone: phoneNumber,
                operator: operator.providerName,
            });
            if (initRes.data.depositId) {
                setShowApprovalModal(true);
                const pollInterval = setInterval(async () => {
                    try {
                        const confirmRes = await api.post(`/v1/checkout/sessions/${id}/confirm`, {
                            payment_method: 'mobile_money',
                            payment_details: { depositId: initRes.data.depositId, operator: operator.providerName },
                        });
                        if (confirmRes.data.status === 'COMPLETED' || confirmRes.data.success) {
                            clearInterval(pollInterval);
                            setShowApprovalModal(false);
                            setStatus('SUCCESS');
                        }
                    } catch {
                        clearInterval(pollInterval);
                        setShowApprovalModal(false);
                        setStatus('ERROR');
                        setMobileError('Payment confirmation failed. Please try again.');
                    }
                }, 3000);
                setTimeout(() => {
                    clearInterval(pollInterval);
                    if (status !== 'SUCCESS') {
                        setShowApprovalModal(false);
                        setStatus('ERROR');
                        setMobileError('Payment timed out. Please try again.');
                    }
                }, 120000);
            }
        } catch (err: any) {
            setStatus('ERROR');
            setMobileError(err.response?.data?.error || 'Failed to initiate mobile payment.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Checkout...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-10 shadow-xl max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Session Error</h2>
                    <p className="text-gray-500 text-sm font-medium">{error}</p>
                </div>
            </div>
        );
    }

    if (status === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-10 shadow-xl max-w-sm w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-500 to-orange-600" />
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-white shadow-xl shadow-green-500/10">
                        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-3">Payment Successful</h2>
                    <p className="text-gray-500 font-medium text-sm mb-6">
                        Your payment of <strong className="text-gray-900">{session.currency} {session.amount_total || customAmount}</strong> was received.
                    </p>
                    {session.success_url && (
                        <a
                            href={session.success_url}
                            className="inline-block px-8 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-colors"
                        >
                            Continue
                        </a>
                    )}
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative p-8 pb-6 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)' }}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10">
                        {session.merchant_logo && (
                            <img src={session.merchant_logo} alt="Merchant" className="h-10 w-auto mb-5 rounded-xl object-contain" />
                        )}
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">
                            {session.merchant_name || 'FlapaPay Checkout'}
                        </p>
                        <h1 className="text-4xl font-black tracking-tight">
                            {session.currency} {session.amount_total || '—'}
                        </h1>
                        {session.description && (
                            <p className="text-white/70 text-sm mt-2 font-medium">{session.description}</p>
                        )}
                    </div>
                </div>

                {/* Custom amount input */}
                {!session.amount_total && !isAmountSet && (
                    <div className="p-8 pb-0">
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Enter Amount ({session.currency})</label>
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={customAmount}
                                onChange={e => setCustomAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full text-3xl font-black text-gray-900 bg-gray-50 border-2 border-gray-100 focus:border-black focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all text-center"
                            />
                            <button
                                disabled={!customAmount || parseFloat(customAmount) <= 0}
                                onClick={async () => {
                                    setIsAmountSet(true);
                                    if (session.payment_method_types.includes('card')) {
                                        const intentRes = await api.post(`/v1/checkout/sessions/${id}/intent`, { amount: parseFloat(customAmount) });
                                        setCaptureContext(intentRes.data.captureContext);
                                    }
                                }}
                                className="w-full py-3 bg-white text-black rounded-2xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                            >
                                Continue to Payment
                            </button>
                        </div>
                    </div>
                )}

                {/* Payment Body */}
                {isAmountSet && (
                    <div className="p-8 space-y-8">

                        {/* Method Selection */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Method</p>

                            {session.payment_method_types?.includes('card') && (
                                <div
                                    onClick={() => setMethod('CARD')}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${method === 'CARD' ? 'border-black bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Credit / Debit Card</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <img src="https://cdn.brandfetch.io/idhem73aId/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1679062241241" className="h-5 object-contain" alt="Visa" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4 object-contain" alt="Mastercard" />
                                                <img src="https://cdn.brandfetch.io/idyXDiKxGF/w/319/h/319/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1685079041017" className="h-4 object-contain rounded-sm" alt="Discover" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${method === 'CARD' ? 'border-black bg-black' : 'border-gray-300'}`}>
                                        {method === 'CARD' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </div>
                            )}

                            {session.payment_method_types?.includes('mobile_money') && (
                                <div
                                    onClick={() => setMethod('MOBILE_MONEY')}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${method === 'MOBILE_MONEY' ? 'border-black bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Mobile Money</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <img src="/assets/images/MTN_Logo.svg" className="h-5 object-contain" alt="MTN" />
                                                <img src="/assets/images/Airtel_Africa_logo.svg" className="h-5 object-contain" alt="Airtel" />
                                                <img src="/assets/images/zamtel.png" className="h-4 object-contain" alt="Zamtel" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${method === 'MOBILE_MONEY' ? 'border-black bg-black' : 'border-gray-300'}`}>
                                        {method === 'MOBILE_MONEY' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Card Form */}
                        {method === 'CARD' && (
                            <div className="space-y-5">
                                {captureContext ? (
                                    <CardPaymentForm session={session} captureContext={captureContext} onSuccess={() => setStatus('SUCCESS')} />
                                ) : (
                                    <div className="h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3">
                                        <div className="w-6 h-6 border-4 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading Secure Checkout...</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Money Form */}
                        {method === 'MOBILE_MONEY' && (
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Network</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(session.currency === 'ZMW' ? [
                                            { id: 'MTN_MOMO_ZMB', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                            { id: 'AIRTEL_OAPI_ZMB', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
                                            { id: 'ZAMTEL_ZMB', name: 'Zamtel', logo: '/assets/images/zamtel.png' },
                                        ] : session.currency === 'NGN' ? [
                                            { id: 'MTN_MOMO_NGA', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                            { id: 'AIRTEL_NGA', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
                                        ] : []).map(net => (
                                            <button
                                                key={net.id}
                                                type="button"
                                                onClick={() => setOperator(Object.values(OPERATORS).find(o => o.providerName === net.id) || { name: net.name, providerName: net.id, logo: net.logo, prefixes: [] })}
                                                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${operator?.providerName === net.id ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
                                            >
                                                <img src={net.logo} alt={net.name} className="h-8 w-8 object-contain" />
                                                <span className="text-[10px] font-bold text-gray-600">{net.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                                    <div className="flex items-center bg-gray-50 border-2 border-gray-100 focus-within:border-black focus-within:bg-white rounded-2xl px-4 transition-all relative">
                                        <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-3 py-4">
                                            {session.currency === 'NGN' ? (
                                                <>
                                                    <ReactCountryFlag countryCode="NG" svg />
                                                    <span className="font-bold text-gray-500 text-sm">+234</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ReactCountryFlag countryCode="ZM" svg />
                                                    <span className="font-bold text-gray-500 text-sm">+260</span>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={e => detectOperator(e.target.value)}
                                            placeholder="9XXXXXXXX"
                                            className="flex-1 py-4 bg-transparent outline-none font-bold text-lg text-gray-900"
                                        />
                                        {operator && (
                                            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                                                <img src={operator.logo} alt={operator.name} className="h-6 w-auto" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {mobileError && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {mobileError}
                                    </div>
                                )}

                                <button
                                    disabled={!operator || status === 'PROCESSING'}
                                    onClick={handleMobilePayment}
                                    className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {status === 'PROCESSING' ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Requesting PIN...
                                        </>
                                    ) : `Pay ${session.currency} ${session.amount_total || customAmount}`}
                                </button>

                                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    You will receive a mobile money prompt to authorize this transaction.
                                </p>
                            </div>
                        )}

                        {/* Security note */}
                        <div className="flex items-center justify-center gap-1.5 pt-2">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Secure Checkout by FlapaPay</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment logos strip */}
            <div className="mt-8 flex items-center justify-center gap-6 px-8 py-5 bg-white rounded-3xl shadow-sm border border-gray-100">
                <img src="https://cdn.brandfetch.io/idhem73aId/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1679062241241" className="h-9 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" alt="Visa" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" alt="Mastercard" />
                <img src="/assets/images/MTN_Logo.svg" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" alt="MTN" />
                <img src="/assets/images/Airtel_Africa_logo.svg" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" alt="Airtel" />
                <img src="/assets/images/zamtel.png" className="h-7 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" alt="Zamtel" />
            </div>

            {/* Approval Modal */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-500 to-orange-600" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-white shadow-xl shadow-orange-500/10 relative z-10">
                            <svg className="w-10 h-10 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3 relative z-10">Approve on Phone</h3>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed relative z-10 text-sm">
                            A prompt was sent to <strong className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{phoneNumber}</strong>. Enter your PIN to authorize <strong className="text-gray-900">{session.currency} {session.amount_total || customAmount}</strong>.
                        </p>
                        <div className="flex justify-center gap-2 relative z-10">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
