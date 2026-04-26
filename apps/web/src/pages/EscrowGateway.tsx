import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ReactCountryFlag from 'react-country-flag';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder').catch(e => { console.warn('Stripe disabled:', e.message); return null; });

const OPERATORS = {
    MTN: {
        name: 'MTN',
        providerName: 'MTN_MOMO_ZMB',
        prefixes: ['096', '076', '96', '76'],
        logo: '/assets/images/MTN_Logo.svg',
    },
    AIRTEL: {
        name: 'Airtel',
        providerName: 'AIRTEL_OAPI_ZMB',
        prefixes: ['097', '077', '97', '77'],
        logo: '/assets/images/Airtel_Africa_logo.svg',
    },
    ZAMTEL: {
        name: 'Zamtel',
        providerName: 'ZAMTEL_ZMB',
        prefixes: ['095', '075', '95', '75'],
        logo: '/assets/images/zamtel.png',
    },
};

const ZMW_NETWORKS = [
    { id: 'MTN_MOMO_ZMB', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
    { id: 'AIRTEL_OAPI_ZMB', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
    { id: 'ZAMTEL_ZMB', name: 'Zamtel', logo: '/assets/images/zamtel.png' },
];
const NGN_NETWORKS = [
    { id: 'MTN_MOMO_NGA', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
    { id: 'AIRTEL_NGA', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
];

// ── Stripe card form ─────────────────────────────────────────────────────────
const CardLayer: React.FC<{ escrow: any; onSuccess: () => void }> = ({ escrow, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (!stripe || !elements) return;
        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: { return_url: window.location.href },
                redirect: 'if_required',
            });
            if (stripeError) {
                setError(stripeError.message || 'Payment failed');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                await api.post(`/escrows/${escrow.id}/fund`, {
                    source: 'card',
                    paymentMethodId: paymentIntent.payment_method,
                });
                onSuccess();
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && (
                <p className="text-red-500 text-sm font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>
            )}
            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Securing Payment...
                    </>
                ) : `Fund Escrow — ${escrow.currency} ${parseFloat(escrow.amount).toLocaleString()}`}
            </button>
        </form>
    );
};

// ── Main Gateway ─────────────────────────────────────────────────────────────
export const EscrowGateway: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [escrow, setEscrow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clientSecret, setClientSecret] = useState('');

    const [method, setMethod] = useState<'CARD' | 'MOBILE_MONEY' | 'WALLET' | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');

    const [phoneNumber, setPhoneNumber] = useState('');
    const [operator, setOperator] = useState<any>(null);
    const [selectedNetwork, setSelectedNetwork] = useState('');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [mobileError, setMobileError] = useState('');

    useEffect(() => {
        const fetchEscrow = async () => {
            try {
                const res = await api.get(`/escrow-public/${id}`);
                setEscrow(res.data);

                if (res.data.status !== 'CREATED') {
                    setStatus('SUCCESS');
                    return;
                }

                // Prefetch Stripe intent
                try {
                    const intentRes = await api.post(`/escrows/${id}/intent`, {});
                    setClientSecret(intentRes.data.clientSecret);
                } catch {
                    // Card may not be available — no-op
                }
            } catch {
                setError('Invalid or expired escrow link.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchEscrow();
    }, [id]);

    const detectOperator = (val: string) => {
        setPhoneNumber(val);
        const clean = val.replace(/\s/g, '');
        const found = Object.values(OPERATORS).find(o => o.prefixes.some(p => clean.startsWith(p)));
        setOperator(found || null);
        if (found) setSelectedNetwork(found.providerName);
    };

    const handleMobilePayment = async () => {
        if (!phoneNumber || !selectedNetwork) return;
        setStatus('PROCESSING');
        setMobileError('');
        try {
            const countryCode = escrow.currency === 'NGN' ? '234' : '260';
            const cleanPhone = phoneNumber.replace(/^\+/, '').replace(/^0/, '').replace(/\s+/g, '');
            const fullPhone = `${countryCode}${cleanPhone}`;

            let providerName = selectedNetwork;
            if (escrow.currency === 'NGN') {
                if (selectedNetwork === 'MTN_MOMO_ZMB') providerName = 'MTN_MOMO_NGA';
                if (selectedNetwork === 'AIRTEL_OAPI_ZMB') providerName = 'AIRTEL_NGA';
            }

            await api.post(`/escrows/${id}/fund`, {
                source: 'mobile_money',
                phoneNumber: fullPhone,
                provider: providerName,
            });
            setShowApprovalModal(true);
            setTimeout(() => {
                setShowApprovalModal(false);
                setStatus('SUCCESS');
            }, 5000);
        } catch (err: any) {
            setMobileError(err.response?.data?.error || 'Mobile payment failed. Please try again.');
            setStatus('IDLE');
        }
    };

    const handleWalletPayment = async () => {
        setStatus('PROCESSING');
        try {
            await api.post(`/escrows/${id}/fund`, { source: 'wallet' });
            setStatus('SUCCESS');
        } catch (err: any) {
            setMobileError(err.response?.data?.error || 'Wallet payment failed.');
            setStatus('IDLE');
        }
    };

    const networks = escrow?.currency === 'NGN' ? NGN_NETWORKS : ZMW_NETWORKS;

    // ── Loading ──────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center">
                    <img src="/assets/images/flapapaylogoicon.png" alt="FlapaPay" className="w-8 h-8 object-contain" />
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>
        </div>
    );

    // ── Error ────────────────────────────────────────────────────
    if (error || !escrow) return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <div className="bg-white p-10 rounded-[40px] shadow-xl text-center max-w-sm w-full border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-500 to-orange-600" />
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 mt-2">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Escrow Link</h2>
                <p className="text-gray-500 font-medium text-sm mb-8">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95">
                    Go to Dashboard
                </button>
            </div>
        </div>
    );

    // ── Success ──────────────────────────────────────────────────
    if (status === 'SUCCESS') return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center max-w-sm w-full border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-500 to-orange-600" />
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 mt-2 relative">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
                    <svg className="w-10 h-10 text-green-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Funds Secured!</h2>
                <p className="text-gray-500 mb-4 leading-relaxed">
                    <span className="font-black text-gray-900">{escrow.currency} {parseFloat(escrow.amount).toLocaleString()}</span> is now held in escrow. The seller has been notified to proceed.
                </p>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-8 space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Escrow ID</span>
                        <span className="font-mono font-bold text-gray-900 text-xs">{escrow.id?.slice(0, 16)}...</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Amount</span>
                        <span className="font-bold text-gray-900">{escrow.currency} {parseFloat(escrow.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Status</span>
                        <span className="font-bold text-green-600">Funded</span>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    // ── Main Checkout ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-white py-12 px-4 flex flex-col items-center font-sans" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>

            <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">

                {/* Brand Header — black with yellow stripe */}
                <div className="bg-black px-8 pt-8 pb-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-40 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 to-orange-600 z-10" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
                            <img src="/assets/images/flapapaylogoicon.png" alt="FlapaPay" className="w-10 h-10 object-contain" />
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Escrow Checkout</p>
                        <h1 className="text-xl font-black text-white">Secure Purchase via FlapaPay</h1>
                        {escrow.description && (
                            <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-xs">{escrow.description}</p>
                        )}
                        <div className="flex items-start justify-center gap-1.5 mt-5">
                            <span className="text-lg font-bold text-gray-400 mt-2">{escrow.currency}</span>
                            <span className="text-5xl font-extrabold text-white tracking-tight">{parseFloat(escrow.amount).toLocaleString()}</span>
                        </div>

                        {/* Escrow trust badge */}
                        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2 border border-white/10">
                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.15em]">Funds held in escrow until delivery</span>
                        </div>
                    </div>
                </div>

                {/* Payment Body */}
                <div className="p-8 space-y-8">

                    {/* Method Selection */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Method</p>

                        {/* Card */}
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
                                    </div>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${method === 'CARD' ? 'border-black bg-black' : 'border-gray-300'}`}>
                                {method === 'CARD' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        </div>

                        {/* Mobile Money */}
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

                        {/* Wallet */}
                        <div
                            onClick={() => setMethod('WALLET')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${method === 'WALLET' ? 'border-black bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center">
                                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 10V7a4 4 0 00-8 0v3" /></svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">FlapaPay Wallet</p>
                                    <p className="text-xs text-gray-400 font-medium">Instant — deducted from your balance</p>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${method === 'WALLET' ? 'border-black bg-black' : 'border-gray-300'}`}>
                                {method === 'WALLET' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        </div>
                    </div>

                    {/* ── Card Form ── */}
                    {method === 'CARD' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Accepted Cards</span>
                                <div className="flex gap-3 items-center">
                                    <img src="https://cdn.brandfetch.io/idhem73aId/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1679062241241" className="h-10 object-contain" alt="Visa" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8 object-contain" alt="Mastercard" />
                                </div>
                            </div>
                            {clientSecret ? (
                                <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                                    <CardLayer escrow={escrow} onSuccess={() => setStatus('SUCCESS')} />
                                </Elements>
                            ) : (
                                <div className="h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3">
                                    <div className="w-6 h-6 border-4 border-yellow-400/30 border-t-yellow-500 rounded-full animate-spin" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading Secure Checkout...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Mobile Money Form ── */}
                    {method === 'MOBILE_MONEY' && (
                        <div className="space-y-5">
                            {/* MNO Network Grid */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Network</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {networks.map(net => (
                                        <button
                                            key={net.id}
                                            type="button"
                                            onClick={() => setSelectedNetwork(net.id)}
                                            className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedNetwork === net.id ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
                                        >
                                            <img src={net.logo} alt={net.name} className="h-8 w-8 object-contain" />
                                            <span className="text-[10px] font-bold text-gray-600">{net.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Phone Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                                <div className="flex items-center bg-gray-50 border-2 border-gray-100 focus-within:border-black focus-within:bg-white rounded-2xl px-4 transition-all">
                                    <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-3 py-4">
                                        {escrow.currency === 'NGN' ? (
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
                                disabled={!selectedNetwork || !phoneNumber || status === 'PROCESSING'}
                                onClick={handleMobilePayment}
                                className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {status === 'PROCESSING' ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Requesting PIN...
                                    </>
                                ) : `Fund Escrow — ${escrow.currency} ${parseFloat(escrow.amount).toLocaleString()}`}
                            </button>

                            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                You will receive a mobile money prompt to authorize this transaction.
                            </p>
                        </div>
                    )}

                    {/* ── Wallet Form ── */}
                    {method === 'WALLET' && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">Amount to hold</span>
                                    <span className="font-black text-gray-900">{escrow.currency} {parseFloat(escrow.amount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">Source</span>
                                    <span className="font-bold text-gray-900">FlapaPay Wallet</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 text-xs text-gray-400 font-medium">
                                    Funds are locked until you confirm delivery or raise a dispute.
                                </div>
                            </div>

                            {mobileError && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {mobileError}
                                </div>
                            )}

                            <button
                                disabled={status === 'PROCESSING'}
                                onClick={handleWalletPayment}
                                className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {status === 'PROCESSING' ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Processing...
                                    </>
                                ) : `Confirm Wallet Funding`}
                            </button>
                        </div>
                    )}

                    {/* Security footer */}
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Secured by FlapaPay Escrow</p>
                    </div>
                </div>
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
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 mt-2 border-8 border-white shadow-xl shadow-orange-500/10 relative z-10">
                            <svg className="w-10 h-10 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3 relative z-10">Approve on Phone</h3>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed relative z-10 text-sm">
                            A prompt was sent to <strong className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{phoneNumber}</strong>. Enter your PIN to authorize the escrow funding.
                        </p>
                        <div className="flex justify-center gap-2 relative z-10">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
