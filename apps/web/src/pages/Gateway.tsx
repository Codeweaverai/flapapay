import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../lib/axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ReactCountryFlag from 'react-country-flag';
import { Button } from '../components/ui/Button';

const stripeTestPromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder').catch(e => { console.warn('Stripe disabled:', e.message); return null; });

const OPERATORS = {
    AIRTEL: {
        name: 'Airtel',
        providerName: 'AIRTEL_OAPI_ZMB',
        prefixes: ['097', '077', '97', '77'],
        logo: '/assets/images/Airtel_Africa_logo.svg',
        color: 'bg-red-600'
    },
    MTN: {
        name: 'MTN',
        providerName: 'MTN_MOMO_ZMB',
        prefixes: ['096', '076', '96', '76'],
        logo: '/assets/images/MTN_Logo.svg',
        color: 'bg-yellow-400'
    },
    ZAMTEL: {
        name: 'Zamtel',
        providerName: 'ZAMTEL_ZMB',
        prefixes: ['095', '075', '95', '75'],
        logo: '/assets/images/zamtel.png',
        color: 'bg-emerald-600'
    }
};

const CardPaymentForm: React.FC<{ session: any, onSuccess: () => void }> = ({ session, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        if (!stripe || !elements) return;

        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.href,
                },
                redirect: 'if_required'
            });

            if (stripeError) {
                setError(stripeError.message || 'Payment failed');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Confirm with backend to record the charge
                await api.post(`/v1/checkout/sessions/${session.id}/confirm`, {
                    payment_method: 'card',
                    payment_details: {
                        paymentIntentId: paymentIntent.id
                    }
                });
                onSuccess();
            }
        } catch (err: any) {
            console.error(err);
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <Button
                type="submit"
                disabled={!stripe || loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Securing Payment...
                    </span>
                ) : `Pay ${session.currency} ${session.amount_total}`}
            </Button>
        </form>
    );
};

export const UnifiedGateway: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mobileError, setMobileError] = useState('');
    const [clientSecret, setClientSecret] = useState('');

    const [method, setMethod] = useState<'CARD' | 'MOBILE_MONEY' | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');

    // Mobile Money State
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

                // Prefetch Stripe Intent if 'card' is allowed AND amount is fixed
                if (res.data.payment_method_types.includes('card') && res.data.amount_total) {
                    const intentRes = await api.post(`/v1/checkout/sessions/${id}/intent`);
                    setClientSecret(intentRes.data.clientSecret);
                }

                if (res.data.amount_total) {
                    setIsAmountSet(true);
                }
            } catch (err) {
                console.error(err);
                setError('Invalid or expired checkout session.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchSessionAndIntent();
    }, [id]);

    useEffect(() => {
        if (status === 'SUCCESS' && session?.success_url) {
            const timer = setTimeout(() => {
                window.location.href = session.success_url;
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status, session]);

    const detectOperator = (val: string) => {
        setPhoneNumber(val);
        const cleanVal = val.replace(/\s/g, '');
        for (const op of Object.values(OPERATORS)) {
            if (op.prefixes.some(pre => cleanVal.startsWith(pre))) {
                setOperator(op);
                return;
            }
        }
        setOperator(null);
    };

    const handleMobilePayment = async () => {
        if (!phoneNumber || !operator) return;
        setStatus('PROCESSING');
        setMobileError('');
        try {
            const finalAmount = session.amount_total || parseFloat(customAmount);

            // Robust phone formatting from AddMoney
            const countryCode = session.currency === 'NGN' ? '234' : '260';
            const cleanPhone = phoneNumber.replace(/^\+/, '').replace(/^0/, '').replace(/\s+/g, '');
            const fullPhone = `${countryCode}${cleanPhone}`;

            // Adjust provider name based on currency
            let providerName = operator.providerName;
            if (session.currency === 'NGN') {
                if (operator.name === 'MTN') providerName = 'MTN_MOMO_NGA';
                if (operator.name === 'Airtel') providerName = 'AIRTEL_NGA';
            }

            // Call backend checkout session implementation
            const res = await api.post(`/v1/checkout/sessions/${id}/initiate-mobile`, {
                amount: finalAmount,
                phoneNumber: fullPhone,
                provider: providerName,
                currency: session.currency
            });

            if (res.data.status === 'ACCEPTED') {
                setShowApprovalModal(true);
                // Poll for success
                setTimeout(async () => {
                    await api.post(`/v1/checkout/sessions/${id}/confirm`, {
                        payment_method: 'mobile_money',
                        amount: finalAmount,
                        payment_details: {
                            phone: fullPhone,
                            provider: operator.name,
                            reference: res.data.depositId
                        }
                    });
                    setShowApprovalModal(false);
                    setStatus('SUCCESS');
                }, 5000);
            } else {
                throw new Error("Payment rejected by provider");
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.failureReason) {
                setMobileError(err.response.data.failureReason.failureMessage || 'Payment failed. Please try again.');
            } else if (err.response && err.response.data && err.response.data.details && err.response.data.details.failureReason) {
                setMobileError(err.response.data.details.failureReason.failureMessage || 'Payment failed. Please try again.');
            } else if (err.response && err.response.status === 401) {
                setMobileError('Unauthorized: Please ensure VITE_PAWAPAY_TOKEN is set accurately.');
            } else {
                setMobileError('Payment failed. Please check details and try again.');
            }
            setStatus('IDLE');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
    );

    if (error || !session) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center max-w-md w-full border border-red-50">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout Error</h2>
                <p className="text-gray-500 font-medium">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-8 w-full bg-gray-900 text-white py-4 rounded-2xl">Retry</Button>
            </div>
        </div>
    );


    if (status === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-md w-full text-center border border-emerald-100/50 animate-in zoom-in duration-500 relative z-10 overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 mx-auto mb-10 relative">
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                        <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Payment Successful</h1>
                    <p className="text-slate-500 font-medium text-[15px] leading-relaxed mb-8">We've securely processed your payment of <br /><span className="text-slate-900 font-black text-2xl mt-2 block">{session.currency} {session.amount_total || customAmount}</span></p>
                    <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl">
                        <svg className="w-5 h-5 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-slate-500 text-sm font-bold tracking-wide">Redirecting back...</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Soft background aesthetic */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-100/40 to-transparent pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/[0.05] rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute top-40 -left-40 w-96 h-96 bg-orange-500/[0.05] rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-[480px] w-full relative z-10">
                {/* Header Section */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-white p-4 rounded-3xl shadow-sm inline-block mb-6 border border-slate-100">
                        <img src="/assets/images/flapapaylogoicon.png" alt="FlapaPay" className="h-10 w-auto" />
                    </div>
                    <div className="space-y-1 flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Merchant Checkout</p>
                            {session.livemode === false && (
                                <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest leading-none">TEST MODE</span>
                            )}
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">{session.merchant?.name || 'Authorized Merchant'}</h2>
                    </div>
                    <div className="mt-4">
                        {isAmountSet ? (
                            <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                                <span className="text-2xl text-slate-400 font-bold">{session.currency}</span>
                                {session.amount_total.toLocaleString()}
                            </h1>
                        ) : (
                            <div className="space-y-4 max-w-[300px] mx-auto">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enter Amount to Pay</p>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">
                                        {session.currency}
                                    </div>
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-20 pr-8 py-5 text-3xl font-black text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-center"
                                        placeholder="0.00"
                                    />
                                </div>
                                <Button
                                    onClick={async () => {
                                        if (!customAmount || parseFloat(customAmount) <= 0) return;
                                        setIsAmountSet(true);
                                        // Fetch intent now that we have amount
                                        if (session.payment_method_types.includes('card')) {
                                            const intentRes = await api.post(`/v1/checkout/sessions/${id}/intent`, {
                                                amount: parseFloat(customAmount)
                                            });
                                            setClientSecret(intentRes.data.clientSecret);
                                        }
                                    }}
                                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl py-4 shadow-lg shadow-indigo-500/20"
                                >
                                    Continue to Payment
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Payment Card */}
                {isAmountSet && (
                    <div className="bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100/60 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="p-8">
                            <div className="flex flex-col items-center justify-center mb-10 pb-8 border-b border-slate-100/50 space-y-5">
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                    <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                    <span className="text-[13px] font-black uppercase tracking-[0.2em] leading-none text-slate-500">Safe & Encrypted</span>
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="space-y-4 mb-10">
                                <button
                                    onClick={() => setMethod('CARD')}
                                    className={`w-full relative overflow-hidden flex items-center justify-between p-6 rounded-3xl border-2 transition-all duration-300 group ${method === 'CARD' ? 'border-indigo-500 bg-indigo-50/30 ring-4 ring-indigo-500/10' : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md'}`}
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-2xl shadow-sm transition-colors ${method === 'CARD' ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50'}`}>💳</div>
                                        <div className="text-left">
                                            <p className={`font-black text-lg tracking-tight transition-colors ${method === 'CARD' ? 'text-indigo-950' : 'text-slate-700'}`}>Pay with Card</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <img src="https://cdn.brandfetch.io/idhem73aId/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1679062241241" className="h-9 w-auto object-contain" alt="Visa" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8 w-auto object-contain" alt="Mastercard" />
                                                <img src="https://cdn.brandfetch.io/idyXDiKxGF/w/319/h/319/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1685079041017" className="h-8 w-auto object-contain rounded-sm" alt="Discover" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all relative z-10 ${method === 'CARD' ? 'border-indigo-500 bg-indigo-500 scale-110' : 'border-slate-200'}`}>
                                        {method === 'CARD' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                </button>

                                <button
                                    onClick={() => setMethod('MOBILE_MONEY')}
                                    className={`w-full relative overflow-hidden flex items-center justify-between p-6 rounded-3xl border-2 transition-all duration-300 group ${method === 'MOBILE_MONEY' ? 'border-orange-500 bg-orange-50/30 ring-4 ring-orange-500/10' : 'border-slate-100 bg-white hover:border-orange-200 hover:shadow-md'}`}
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-2xl shadow-sm transition-colors ${method === 'MOBILE_MONEY' ? 'bg-orange-500 text-white shadow-orange-500/30' : 'bg-slate-50 text-slate-400 group-hover:text-orange-500 group-hover:bg-orange-50'}`}>📱</div>
                                        <div className="text-left">
                                            <p className={`font-black text-lg tracking-tight transition-colors ${method === 'MOBILE_MONEY' ? 'text-orange-950' : 'text-slate-700'}`}>Mobile Money</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <img src="/assets/images/MTN_Logo.svg" className="h-7 w-auto object-contain" alt="MTN" />
                                                <img src="/assets/images/Airtel_Africa_logo.svg" className="h-7 w-auto object-contain" alt="Airtel" />
                                                <img src="/assets/images/zamtel.png" className="h-6 w-auto object-contain" alt="Zamtel" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all relative z-10 ${method === 'MOBILE_MONEY' ? 'border-orange-500 bg-orange-500 scale-110' : 'border-slate-200'}`}>
                                        {method === 'MOBILE_MONEY' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                </button>
                            </div>

                            {/* Integration Areas */}
                            <div className="animate-in fade-in duration-500">
                                {method === 'CARD' && (
                                    <div className="pt-2">
                                        {clientSecret ? (
                                            <Elements key={clientSecret} stripe={stripeTestPromise} options={{ clientSecret }}>
                                                <CardPaymentForm session={session} onSuccess={() => setStatus('SUCCESS')} />
                                            </Elements>
                                        ) : (
                                            <div className="h-48 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 gap-4">
                                                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Secure Stripe...</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {method === 'MOBILE_MONEY' && (
                                    <div className="space-y-6">
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 border-r border-slate-100 pr-4 z-10">
                                                {session.currency === 'NGN' ? (
                                                    <>
                                                        <ReactCountryFlag countryCode="NG" svg style={{ width: '1.2em', height: '1.2em', borderRadius: '3px' }} />
                                                        <span className="text-slate-950 font-black text-sm">+234</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ReactCountryFlag countryCode="ZM" svg style={{ width: '1.2em', height: '1.2em', borderRadius: '3px' }} />
                                                        <span className="text-slate-950 font-black text-sm">+260</span>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => detectOperator(e.target.value)}
                                                placeholder="9XXXXXXXX"
                                                className="w-full pl-[110px] pr-14 py-5 bg-slate-50/50 border-2 border-slate-50 rounded-3xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none font-black text-lg transition-all"
                                            />
                                            {operator && (
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 animate-in zoom-in duration-300">
                                                    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                                                        <img src={operator.logo} alt={operator.name} className="h-6 w-auto" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {mobileError && (
                                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-100 flex items-center gap-3">
                                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span>{mobileError}</span>
                                            </div>
                                        )}

                                        <Button
                                            disabled={!operator || status === 'PROCESSING'}
                                            onClick={handleMobilePayment}
                                            className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all"
                                        >
                                            {status === 'PROCESSING' ? (
                                                <span className="flex items-center gap-3 justify-center">
                                                    <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                    <span>Requesting PIN...</span>
                                                </span>
                                            ) : `Pay ${session.currency} ${session.amount_total || customAmount}`}
                                        </Button>

                                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4">
                                            You will receive a mobile money prompt to authorize this transaction.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Security */}
                <div className="mt-16 w-full flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-center justify-center gap-8 px-10 py-7 bg-white/50 backdrop-blur-xl rounded-[3rem] shadow-[0_15px_50px_rgba(0,0,0,0.04)] border border-white/60">
                        <img src="https://cdn.brandfetch.io/idhem73aId/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1679062241241" className="h-11 w-auto object-contain drop-shadow-md hover:scale-110 transition-transform cursor-pointer" alt="Visa" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-11 w-auto object-contain drop-shadow-md hover:scale-110 transition-transform cursor-pointer" alt="Mastercard" />
                        <img src="/assets/images/Airtel_Africa_logo.svg" className="h-12 w-auto object-contain drop-shadow-md hover:scale-110 transition-transform cursor-pointer" alt="Airtel" />
                        <img src="/assets/images/MTN_Logo.svg" className="h-12 w-auto object-contain drop-shadow-md hover:scale-110 transition-transform cursor-pointer" alt="MTN" />
                        <img src="/assets/images/zamtel.png" className="h-11 w-auto object-contain drop-shadow-md hover:scale-110 transition-transform cursor-pointer" alt="Zamtel" />
                    </div>
                    <p className="text-slate-400 font-bold text-[8px] uppercase tracking-[0.25em] flex items-center justify-center gap-1.5 pt-1">
                        <svg className="w-3.5 h-3.5 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Secure Merchant Processing by FlapaPay
                    </p>
                </div>
            </div>

            {/* Verification Modal */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] border-none pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-10 border-8 border-white shadow-xl shadow-orange-500/10 relative z-10">
                            <svg className="w-10 h-10 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M12 12h.01M12 6h.01M12 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight relative z-10">Approve Payment</h3>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed relative z-10 text-sm">
                            We've sent a prompt to <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">{phoneNumber}</strong>. Please enter your PIN to authorize <strong className="text-slate-900">{session.currency} {session.amount_total || customAmount}</strong>.
                        </p>
                        <div className="flex justify-center gap-3 relative z-10">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0s' }}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
