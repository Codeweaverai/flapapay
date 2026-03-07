import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ReactCountryFlag from 'react-country-flag';
import { Button } from '../components/ui/Button';

const stripeTestPromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder').catch(e => { console.warn('Stripe disabled:', e.message); return null; });

const OPERATORS = {
    AIRTEL: {
        name: 'Airtel',
        prefixes: ['097', '077', '97', '77'],
        logo: '/assets/images/Airtel_Africa_logo.svg',
        color: 'bg-red-600'
    },
    MTN: {
        name: 'MTN',
        prefixes: ['096', '076', '96', '76'],
        logo: '/assets/images/MTN_Logo.svg',
        color: 'bg-yellow-400'
    },
    ZAMTEL: {
        name: 'Zamtel',
        prefixes: ['095', '075', '95', '75'],
        logo: '/assets/images/zamtel.png',
        color: 'bg-emerald-600'
    }
};

const CardLayer: React.FC<{ escrow: any, onSuccess: () => void }> = ({ escrow, onSuccess }) => {
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
                await api.post(`/escrows/${escrow.id}/fund`, {
                    source: 'card',
                    paymentMethodId: paymentIntent.payment_method
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <Button
                type="submit"
                disabled={!stripe || loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
                {loading ? 'Securing Payment...' : `Fund ${escrow.currency} ${parseFloat(escrow.amount).toLocaleString()}`}
            </Button>
        </form>
    );
};

export const EscrowGateway: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [escrow, setEscrow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [method, setMethod] = useState<'CARD' | 'MOBILE_MONEY' | 'WALLET' | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [operator, setOperator] = useState<any>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    useEffect(() => {
        const fetchEscrow = async () => {
            try {
                const res = await api.get(`/escrow-public/${id}`);
                setEscrow(res.data);
                if (res.data.status !== 'CREATED') {
                    setStatus('SUCCESS'); // Already funded or terminal
                }
            } catch (err) {
                setError('Invalid Escrow Transaction');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchEscrow();
    }, [id]);

    const handleMobilePayment = async () => {
        if (!phoneNumber || !operator) return;
        setStatus('PROCESSING');
        try {
            await api.post(`/escrows/${id}/fund`, {
                source: 'mobile_money',
                phoneNumber,
                provider: operator.name
            });
            setShowApprovalModal(true);
            setTimeout(() => {
                setShowApprovalModal(false);
                setStatus('SUCCESS');
            }, 5000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Mobile payment failed');
            setStatus('IDLE');
        }
    };

    const handleWalletPayment = async () => {
        setStatus('PROCESSING');
        try {
            await api.post(`/escrows/${id}/fund`, { source: 'wallet' });
            setStatus('SUCCESS');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Wallet payment failed');
            setStatus('IDLE');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 underline animate-pulse">Loading Gateway...</div>;

    if (status === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-md w-full text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Funds Secured</h1>
                    <p className="text-slate-500 mb-8 font-medium">Your payment has been successfully placed in escrow. The seller has been notified to proceed.</p>
                    <Button onClick={() => navigate('/dashboard')} className="w-full bg-slate-900 text-white rounded-2xl py-4">Return to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-emerald-100/40 to-transparent pointer-events-none"></div>

            <div className="max-w-[480px] w-full relative z-10">
                <div className="text-center mb-10">
                    <div className="bg-white p-4 rounded-3xl shadow-sm inline-block mb-6 border border-slate-100">
                        <img src="/assets/images/flapapaylogoicon.png" alt="FlapaPay" className="h-10 w-auto" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-1">Escrow Checkout</p>
                    <h2 className="text-xl font-black text-slate-900">Secure Purchase via FlapaPay</h2>

                    <div className="mt-8">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                            <span className="text-2xl text-slate-400 font-bold">{escrow.currency}</span>
                            {parseFloat(escrow.amount).toLocaleString()}
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">{escrow.description}</p>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100/60 p-8">
                    <div className="flex flex-col items-center justify-center mb-8 pb-6 border-b border-slate-100/50">
                        <div className="flex items-center gap-2 text-slate-400">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Encrypted Escrow Hold</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button onClick={() => setMethod('CARD')} className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${method === 'CARD' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-50 hover:border-indigo-100'}`}>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">💳</span>
                                <div className="text-left font-black tracking-tight text-slate-800">Card Payment</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${method === 'CARD' ? 'border-indigo-500 bg-indigo-500' : 'border-slate-200'}`}></div>
                        </button>

                        <button onClick={() => setMethod('MOBILE_MONEY')} className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${method === 'MOBILE_MONEY' ? 'border-orange-500 bg-orange-50/30' : 'border-slate-50 hover:border-orange-100'}`}>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">📱</span>
                                <div className="text-left font-black tracking-tight text-slate-800">Mobile Money</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${method === 'MOBILE_MONEY' ? 'border-orange-500 bg-orange-500' : 'border-slate-200'}`}></div>
                        </button>

                        <button onClick={() => setMethod('WALLET')} className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${method === 'WALLET' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-50 hover:border-emerald-100'}`}>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">💰</span>
                                <div className="text-left font-black tracking-tight text-slate-800">Pay from Wallet</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${method === 'WALLET' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200'}`}></div>
                        </button>
                    </div>

                    <div className="mt-8 animate-in slide-in-from-top-4 duration-500">
                        {method === 'CARD' && (
                            <div className="pt-2">
                                {stripeTestPromise ? (
                                    <Elements stripe={stripeTestPromise}>
                                        <CardLayer escrow={escrow} onSuccess={() => setStatus('SUCCESS')} />
                                    </Elements>
                                ) : (
                                    <div className="p-10 bg-slate-50 rounded-2xl text-center text-xs font-bold text-slate-400 capitalize">Stripe unavailable</div>
                                )}
                            </div>
                        )}

                        {method === 'MOBILE_MONEY' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-slate-100 pr-3">
                                        <ReactCountryFlag countryCode="ZM" svg style={{ width: '1.2em', height: '1.2em', borderRadius: '2px' }} />
                                        <span className="text-sm font-black text-slate-900">+260</span>
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="9XXXXXXXX"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPhoneNumber(val);
                                            const op = Object.values(OPERATORS).find(o => o.prefixes.some(pre => val.startsWith(pre)));
                                            setOperator(op);
                                        }}
                                        className="w-full pl-[5.5rem] p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-orange-500 outline-none font-black text-lg"
                                    />
                                </div>
                                {operator && (
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                                        <img src={operator.logo} className="h-6" alt={operator.name} />
                                        <span className="text-xs font-bold text-slate-600">Detected: {operator.name}</span>
                                    </div>
                                )}
                                <Button onClick={handleMobilePayment} disabled={!operator || status === 'PROCESSING'} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-500/10">
                                    {status === 'PROCESSING' ? 'Processing...' : `Pay ${escrow.currency} ${parseFloat(escrow.amount).toLocaleString()}`}
                                </Button>
                            </div>
                        )}

                        {method === 'WALLET' && (
                            <div className="text-center space-y-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">One-click wallet funding</p>
                                <Button onClick={handleWalletPayment} disabled={status === 'PROCESSING'} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/10">
                                    {status === 'PROCESSING' ? 'Processing...' : 'Confirm Wallet Funding'}
                                </Button>
                                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4 opacity-60">
                    <div className="flex gap-6 grayscale">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8" alt="Mastercard" />
                        <img src="/assets/images/MTN_Logo.svg" className="h-8" alt="MTN" />
                        <img src="/assets/images/Airtel_Africa_logo.svg" className="h-8" alt="Airtel" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Secured by FlapaPay Governance</p>
                </div>
            </div>

            {showApprovalModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
                    <div className="bg-white p-10 rounded-[3rem] max-w-sm w-full text-center shadow-2xl">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M12 12h.01M12 6h.01M12 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Check Your Phone</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">We've sent a payment prompt to your device. Enter your PIN to complete the escrow funding.</p>
                        <div className="flex justify-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
