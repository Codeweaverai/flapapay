import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ReactCountryFlag from 'react-country-flag';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx').catch(e => { console.warn('Stripe disabled:', e.message); return null; });

interface LinkDetails {
    id: string;
    title: string;
    description: string;
    amount: string;
    currency: string;
    merchant_name: string;
    allows_mobile_money: boolean;
    allows_card: boolean;
}

const CheckoutForm: React.FC<{ link: LinkDetails, onSuccess: () => void }> = ({ link, onSuccess }) => {
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
                // Call backend to record and credit
                await api.post(`/public/payment-links/${link.id}/confirm`, {
                    paymentIntentId: paymentIntent.id,
                    amount: parseFloat(link.amount)
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
            <PaymentElement />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
                {loading ? 'Processing...' : `Pay ${link.currency} ${link.amount}`}
            </button>
        </form>
    );
};

export const PaymentLinkPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [link, setLink] = useState<LinkDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile'>('card');
    const [success, setSuccess] = useState(false);
    const [clientSecret, setClientSecret] = useState('');

    // Mobile Money State
    const [mobileNumber, setMobileNumber] = useState('');
    const [provider, setProvider] = useState('MTN_MOMO_ZMB');
    const [isMobileProcessing, setIsMobileProcessing] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    useEffect(() => {
        const fetchLinkAndIntent = async () => {
            try {
                const res = await api.get(`/public/payment-links/${id}`);
                setLink(res.data);

                // If card is allowed, get intent
                if (res.data.allows_card) {
                    const intentRes = await api.post(`/public/payment-links/${id}/intent`, {});
                    setClientSecret(intentRes.data.clientSecret);
                } else if (res.data.allows_mobile_money) {
                    setPaymentMethod('mobile');
                }
                // Set default provider/country based on currency
                if (res.data.currency === 'ZMW') {
                    setProvider('MTN_MOMO_ZMB');
                } else if (res.data.currency === 'NGN') {
                    setProvider('MTN_MOMO_NGA');
                }
            } catch (err) {
                setError('Link not found or inactive');
            } finally {
                setLoading(false);
            }
        };
        fetchLinkAndIntent();
    }, [id]);

    const handleMobilePayment = async () => {
        if (!link || !mobileNumber) return;
        setIsMobileProcessing(true);
        try {
            const res = await api.post(`/public/payment-links/${id}/initiate-mobile`, {
                amount: parseFloat(link.amount),
                phoneNumber: mobileNumber,
                provider: provider
            });

            if (res.data.status === 'ACCEPTED') {
                setShowApprovalModal(true);
                // Poll/Simulate success like AddMoney.tsx
                setTimeout(async () => {
                    // Call confirm endpoint to credit wallet
                    await api.post(`/public/payment-links/${id}/confirm`, {
                        amount: parseFloat(link.amount)
                    });
                    setShowApprovalModal(false);
                    setSuccess(true);
                }, 5000);
            } else {
                alert('Mobile Money initiation failed. Please check your number.');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to initiate payment.');
        } finally {
            setIsMobileProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
    );

    if (error || !link) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-gray-100">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Payment Link</h2>
                <p className="text-gray-500 font-medium">{error}</p>
            </div>
        </div>
    );

    if (success) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-fade-in font-sans">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center max-w-md w-full border border-gray-100">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Payment Complete!</h2>
                <p className="text-gray-500 text-lg mb-8">Successfully paid <span className="text-black font-bold">{link.currency} {link.amount}</span> to {link.merchant_name}.</p>
                <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-100">
                    <div className="flex justify-between mb-3">
                        <span className="text-gray-500 font-medium">Reference</span>
                        <span className="font-mono font-bold text-gray-900">REF-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Date</span>
                        <span className="font-bold text-gray-900">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                    Return to Shop
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center font-sans">
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 animate-slide-up">
                {/* Header */}
                <div className="bg-black p-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-800 to-black opacity-30"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto flex items-center justify-center mb-6">
                            <img src="/assets/images/flapapaylogoicon.png" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Merchant Checkout</p>
                        <h1 className="text-2xl font-extrabold">{link.merchant_name}</h1>
                    </div>
                </div>

                <div className="p-10">
                    <div className="text-center mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{link.title}</h2>
                        {link.description && <p className="text-gray-500 text-sm mb-6 leading-relaxed">{link.description}</p>}

                        {/* Transaction Summary */}
                        <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 mb-6 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Payment Amount</span>
                                <span className="font-black text-gray-900">{link.currency} {parseFloat(link.amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Processing Fee (1.8%)</span>
                                <span className="font-black text-orange-500">
                                    {link.currency} {(parseFloat(link.amount) * 0.018).toFixed(2)}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-gray-900 font-black uppercase tracking-widest text-xs">Total to Pay</span>
                                <span className="text-2xl font-black text-gray-900">
                                    {link.currency} {link.amount}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Method Toggle */}
                    {(link.allows_card && link.allows_mobile_money) && (
                        <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-10">
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-black'}`}
                            >
                                Secure Card
                            </button>
                            <button
                                onClick={() => setPaymentMethod('mobile')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'mobile' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-black'}`}
                            >
                                Mobile Money
                            </button>
                        </div>
                    )}

                    {paymentMethod === 'card' ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accepted Cards</span>
                                <div className="flex gap-4 items-center">
                                    <img src="https://cdn.brandfetch.io/idhem73aId/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1679062241241" className="h-12 object-contain" alt="Visa" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-10 object-contain" alt="Mastercard" />
                                </div>
                            </div>
                            {clientSecret ? (
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    <CheckoutForm link={link} onSuccess={() => setSuccess(true)} />
                                </Elements>
                            ) : (
                                <div className="h-40 bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center text-gray-400">Loading Secure Checkout...</div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Network</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {link.currency === 'ZMW' ? [
                                    { id: 'MTN_MOMO_ZMB', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                    { id: 'AIRTEL_OAPI_ZMB', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
                                    { id: 'ZAMTEL_ZMB', name: 'Zamtel', logo: '/assets/images/zamtel.png' }
                                ].map((net) => (
                                    <button
                                        key={net.id}
                                        onClick={() => setProvider(net.id)}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${provider === net.id
                                            ? 'border-green-500 bg-green-50 shadow-sm'
                                            : 'border-gray-100 hover:border-gray-200 bg-white'
                                            }`}
                                    >
                                        <img src={net.logo} alt={net.name} className="h-8 w-8 object-contain" />
                                        <span className="text-[10px] font-bold text-gray-600">{net.name}</span>
                                    </button>
                                )) : link.currency === 'NGN' ? [
                                    { id: 'MTN_MOMO_NGA', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                    { id: 'AIRTEL_NGA', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' }
                                ].map((net) => (
                                    <button
                                        key={net.id}
                                        onClick={() => setProvider(net.id)}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${provider === net.id
                                            ? 'border-green-500 bg-green-50 shadow-sm'
                                            : 'border-gray-100 hover:border-gray-200 bg-white'
                                            }`}
                                    >
                                        <img src={net.logo} alt={net.name} className="h-8 w-8 object-contain" />
                                        <span className="text-[10px] font-bold text-gray-600">{net.name}</span>
                                    </button>
                                )) : (
                                    <div className="col-span-3 text-center text-sm text-gray-500">
                                        Mobile money not available for {link.currency}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <div className="flex items-center bg-gray-50 border border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-black rounded-2xl px-4 transition-all">
                                    <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-3 py-4">
                                        {link.currency === 'ZMW' ? (
                                            <>
                                                <ReactCountryFlag countryCode="ZM" svg />
                                                <span className="font-bold text-gray-500 text-sm">260</span>
                                            </>
                                        ) : link.currency === 'NGN' ? (
                                            <>
                                                <ReactCountryFlag countryCode="NG" svg />
                                                <span className="font-bold text-gray-500 text-sm">234</span>
                                            </>
                                        ) : (
                                            <span className="font-bold text-gray-500 text-sm">Code</span>
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        placeholder="96XXXXXXX"
                                        className="w-full py-4 bg-transparent outline-none font-bold text-lg text-gray-900"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleMobilePayment}
                                disabled={!mobileNumber || isMobileProcessing}
                                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
                            >
                                {isMobileProcessing ? 'Processing...' : `Pay ${link.currency} ${link.amount}`}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10 text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Secure Checkout by FlapaPay
                </p>
            </div>

            {/* Approval Modal */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in font-sans">
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center mx-4">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <svg className="w-10 h-10 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M12 12h.01M12 6h.01M12 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black mb-4">Complete Payment</h3>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                            A prompt has been sent to <strong>{mobileNumber}</strong>. Please enter your PIN to confirm.
                        </p>
                        <div className="flex justify-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
