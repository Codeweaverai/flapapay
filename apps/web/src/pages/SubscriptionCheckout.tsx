import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ReactCountryFlag from 'react-country-flag';
import { Button } from '../components/ui/Button';

const stripeTestPromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const OPERATORS = {
    AIRTEL: {
        name: 'Airtel',
        providerName: 'AIRTEL_OAPI_ZMB',
        prefixes: ['097', '077', '97', '77'],
        logo: '/assets/images/Airtel_Africa_logo.svg'
    },
    MTN: {
        name: 'MTN',
        providerName: 'MTN_MOMO_ZMB',
        prefixes: ['096', '076', '96', '76'],
        logo: '/assets/images/MTN_Logo.svg'
    },
    ZAMTEL: {
        name: 'Zamtel',
        providerName: 'ZAMTEL_ZMB',
        prefixes: ['095', '075', '95', '75'],
        logo: '/assets/images/zamtel.png'
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
                await api.post(`/v1/checkout/sessions/${session.id}/confirm`, {
                    payment_method: 'card',
                    payment_details: { paymentIntentId: paymentIntent.id }
                });
                onSuccess();
            }
        } catch (err: any) {
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
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
                {loading ? 'Processing...' : `Subscribe for ${session.currency} ${session.amount_total}`}
            </Button>
        </form>
    );
};

const SubscriptionCheckout: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [method, setMethod] = useState<'CARD' | 'MOBILE_MONEY' | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

    // Mobile Money State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [operator, setOperator] = useState<any>(null);
    const [mobileError, setMobileError] = useState('');

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await api.get(`/v1/checkout/sessions/${id}`);
                setSession(res.data);

                if (res.data.payment_method_types.includes('card')) {
                    const intentRes = await api.post(`/v1/checkout/sessions/${id}/intent`);
                    setClientSecret(intentRes.data.clientSecret);
                }
            } catch (err) {
                setError('Invalid or expired subscription session.');
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [id]);

    const handleMobilePayment = async () => {
        if (!phoneNumber || !operator) return;
        setStatus('PROCESSING');
        setMobileError('');
        try {
            const countryCode = session.currency === 'NGN' ? '234' : '260';
            const cleanPhone = phoneNumber.replace(/^\+/, '').replace(/^0/, '').replace(/\s+/g, '');
            const fullPhone = `${countryCode}${cleanPhone}`;

            const res = await api.post(`/v1/checkout/sessions/${id}/initiate-mobile`, {
                amount: session.amount_total,
                phoneNumber: fullPhone,
                provider: operator.providerName,
                currency: session.currency
            });

            if (res.data.status === 'ACCEPTED') {
                // Simplified polling for demo
                setTimeout(async () => {
                    await api.post(`/v1/checkout/sessions/${id}/confirm`, {
                        payment_method: 'mobile_money',
                        amount: session.amount_total,
                        payment_details: { phone: fullPhone, provider: operator.name, reference: res.data.depositId }
                    });
                    setStatus('SUCCESS');
                }, 5000);
            }
        } catch (err: any) {
            setMobileError('Payment initiation failed.');
            setStatus('IDLE');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error || !session) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    if (status === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-black mb-2">Subscription Active!</h2>
                    <p className="text-slate-500 mb-8">Your {session.subscription_details?.product_name} plan is now active.</p>
                    <Button onClick={() => window.location.href = session.success_url} className="w-full bg-black text-white">Go to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
            <div className="max-w-[1000px] w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                {/* Left Side: Plan Details */}
                <div className="space-y-8">
                    <div className="inline-block p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <img src="/assets/images/flapapaylogoicon.png" alt="FlapaPay" className="h-8 w-auto" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-900 leading-tight">
                            Subscribe to {session.subscription_details?.product_name || 'Premium Plan'}
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            {session.subscription_details?.product_description || 'Get full access to all professional features and priority support.'}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-950">{session.currency} {session.amount_total}</span>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                                / {session.subscription_details?.billing_interval || 'month'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-600 font-medium">
                                <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                                Secure recurring billing
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 font-medium">
                                <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                                Cancel anytime from your portal
                            </div>
                            {session.subscription_details?.trial_days > 0 && (
                                <div className="flex items-center gap-3 text-indigo-600 font-bold">
                                    <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">★</div>
                                    {session.subscription_details.trial_days} days free trial
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Payment Form */}
                <div className="bg-white p-10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.06)] border border-slate-100">
                    <div className="mb-10 text-center">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Secure Checkout</p>
                        <h2 className="text-xl font-bold text-slate-800">Select Payment Method</h2>
                    </div>

                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setMethod('CARD')}
                            className={`flex-1 p-4 rounded-2xl border-2 transition-all font-bold ${method === 'CARD' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                        >
                            Card
                        </button>
                        <button
                            onClick={() => setMethod('MOBILE_MONEY')}
                            className={`flex-1 p-4 rounded-2xl border-2 transition-all font-bold ${method === 'MOBILE_MONEY' ? 'border-orange-500 bg-orange-50 text-orange-500' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                        >
                            Mobile Money
                        </button>
                    </div>

                    {method === 'CARD' && (
                        clientSecret ? (
                            <Elements stripe={stripeTestPromise} options={{ clientSecret }}>
                                <CardPaymentForm session={session} onSuccess={() => setStatus('SUCCESS')} />
                            </Elements>
                        ) : <div>Loading...</div>
                    )}

                    {method === 'MOBILE_MONEY' && (
                        <div className="space-y-6">
                            <input
                                type="tel"
                                placeholder="Phone (e.g. 9XXXXXXXX)"
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                    const clean = e.target.value.replace(/\s/g, '');
                                    for (const op of Object.values(OPERATORS)) {
                                        if (op.prefixes.some(pre => clean.startsWith(pre))) {
                                            setOperator(op);
                                            break;
                                        }
                                    }
                                }}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold"
                            />
                            {operator && <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><img src={operator.logo} className="h-5" /> Pay with {operator.name}</div>}
                            <Button
                                onClick={handleMobilePayment}
                                disabled={!operator || status === 'PROCESSING'}
                                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg"
                            >
                                {status === 'PROCESSING' ? 'Requesting PIN...' : `Subscribe with Mobile Money`}
                            </Button>
                        </div>
                    )}

                    {!method && <div className="h-40 flex items-center justify-center text-slate-300 font-bold border-2 border-dashed border-slate-100 rounded-[2rem]">Please select a payment method</div>}

                    <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Powered by FlapaPay Billing
                    </p>
                </div>

            </div>
        </div>
    );
};

export default SubscriptionCheckout;
