import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertCircle, ShieldCheck, Wallet, CreditCard, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx').catch(e => { console.warn('Stripe disabled:', e.message); return null; });

const StripePaymentForm: React.FC<{ requestId: string; amount: number; currency: string; onSuccess: (ref: string) => void }> = ({ requestId, amount, currency, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage('');

        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.href,
                },
                redirect: 'if_required'
            });

            if (stripeError) {
                setErrorMessage(stripeError.message || 'Payment failed');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                const res = await api.post(`/v1/public/payment-requests/${requestId}/confirm`, {
                    paymentIntentId: paymentIntent.id
                });
                onSuccess(res.data.reference);
            }
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'Verification failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {errorMessage && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} /> {errorMessage}
                </div>
            )}
            <Button
                type="submit"
                disabled={!stripe || isProcessing}
                fullWidth
                className="h-16 rounded-2xl text-lg font-black bg-black text-white shadow-xl hover:bg-gray-800"
            >
                {isProcessing ? 'Processing Securely...' : `Pay ${currency} ${amount.toFixed(2)} Now`}
            </Button>
            <p className="text-[10px] text-gray-400 font-extrabold text-center uppercase tracking-widest flex items-center justify-center gap-2">
                <Lock size={10} /> PCI-DSS Compliant Execution
            </p>
        </form>
    );
};

export const PayRequest: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const [request, setRequest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [ref, setRef] = useState('');

    const [wallets, setWallets] = useState<any[]>([]);
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'card'>('wallet');
    const [savedCards, setSavedCards] = useState<any[]>([]);
    const [selectedCardId, setSelectedCardId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [showPublicCardForm, setShowPublicCardForm] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await api.get(`/v1/public/payment-requests/${id}`);
                setRequest(res.data);

                // Get intent for public card payment
                const intentRes = await api.post(`/v1/public/payment-requests/${id}/intent`, {});
                setClientSecret(intentRes.data.clientSecret);
            } catch (e) {
                setError('Payment request not found or expired.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequest();
    }, [id]);

    useEffect(() => {
        if (token && user) {
            api.get('/auth/me')
                .then(res => {
                    setWallets(res.data.wallets);
                    const matchingWallet = res.data.wallets.find((w: any) => w.currency === request?.currency);
                    if (matchingWallet) setSelectedWalletId(matchingWallet.id);
                    else if (res.data.wallets.length > 0) setSelectedWalletId(res.data.wallets[0].id);
                });

            api.get('/payments/methods')
                .then(res => {
                    setSavedCards(res.data.methods);
                    if (user?.defaultPaymentMethodId) {
                        setSelectedCardId(user.defaultPaymentMethodId);
                    } else if (res.data.methods.length > 0) {
                        setSelectedCardId(res.data.methods[0].id);
                    }
                })
                .catch(err => console.error('Failed to load cards', err));
        }
    }, [token, user, request]);

    const handlePayWithBalance = async () => {
        if (!selectedWalletId) {
            setError('Please select a wallet to pay with.');
            return;
        }

        setIsProcessing(true);
        setError('');
        try {
            const res = await api.post(`/v1/payment-requests/${id}/pay`, {
                walletId: selectedWalletId
            });
            setRef(res.data.reference);
            setSuccess(true);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Payment failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayWithCard = async () => {
        if (!selectedCardId) {
            setError('Please select a card to pay with.');
            return;
        }

        setIsProcessing(true);
        setError('');
        try {
            const res = await api.post(`/v1/payment-requests/${id}/pay`, {
                paymentMethodId: selectedCardId
            });
            setRef(res.data.reference);
            setSuccess(true);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Payment failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePublicSuccess = (reference: string) => {
        setRef(reference);
        setSuccess(true);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold">Loading request...</div>;

    if (success) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 space-y-8 animate-fade-in">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 size={48} strokeWidth={3} />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-black">Payment Successful!</h1>
                    <p className="text-gray-500 font-bold max-w-sm">You have paid {request.currency} {request.amount} to {request.requester_name}.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] w-full max-w-sm border border-gray-100 space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">Reference</span>
                        <span className="text-black font-black font-mono">{ref}</span>
                    </div>
                </div>
                <Button onClick={() => navigate('/dashboard')} className="h-16 px-12 rounded-2xl font-black bg-black">Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4">
            <div className="max-w-xl w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                        <ShieldCheck size={14} /> FlapaPay Secure Request
                    </div>
                    <h1 className="text-4xl font-black text-black tracking-tight leading-tight">
                        Pay {request.requester_name}
                    </h1>
                    <p className="text-black/50 font-bold mt-2">
                        {request.requester_email} is requesting a payment
                    </p>
                </div>

                {/* Amount Card */}
                <div className="bg-black text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/20 to-transparent pointer-events-none" />
                    <p className="text-orange-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4">Total Amount Requested</p>
                    <h2 className="text-6xl font-black tracking-tighter mb-4">
                        <span className="text-3xl font-medium opacity-50 mr-2">{request.currency}</span>
                        {parseFloat(request.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h2>
                    <p className="text-white/60 font-bold text-lg italic">{request.description || 'No note added'}</p>
                </div>

                {/* Payment Options */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 space-y-6">
                    {token ? (
                        <div className="space-y-6">
                            {/* Method Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setSelectedMethod('wallet'); setShowPublicCardForm(false); }}
                                    className={`group relative p-6 rounded-[28px] border-2 transition-all duration-300 overflow-hidden ${selectedMethod === 'wallet' && !showPublicCardForm ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md' : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-white'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Wallet size={24} />
                                        <span className="font-black text-xs uppercase tracking-widest">Balance</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setSelectedMethod('card')}
                                    className={`group relative p-6 rounded-[28px] border-2 transition-all duration-300 overflow-hidden ${selectedMethod === 'card' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md' : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-white'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <CreditCard size={24} />
                                        <span className="font-black text-xs uppercase tracking-widest">Card</span>
                                    </div>
                                </button>
                            </div>

                            {selectedMethod === 'wallet' ? (
                                <div className="space-y-4 animate-slide-up">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-1">Select Wallet</label>
                                        <select
                                            value={selectedWalletId}
                                            onChange={(e) => setSelectedWalletId(e.target.value)}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold text-lg focus:border-orange-500 outline-none transition-all"
                                        >
                                            {wallets.map(w => (
                                                <option key={w.id} value={w.id}>
                                                    {w.currency} Wallet (Balance: {parseFloat(w.balance).toFixed(2)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button
                                        onClick={handlePayWithBalance}
                                        isLoading={isProcessing}
                                        fullWidth
                                        className="h-16 rounded-2xl text-lg font-black bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                                    >
                                        Pay with Balance
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-slide-up">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-1">Select Card</label>
                                        <button
                                            onClick={() => setShowPublicCardForm(!showPublicCardForm)}
                                            className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                                        >
                                            {showPublicCardForm ? 'Show Saved Cards' : 'Use New Card'}
                                        </button>
                                    </div>

                                    {showPublicCardForm ? (
                                        clientSecret ? (
                                            <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                                    <StripePaymentForm
                                                        requestId={id!}
                                                        amount={parseFloat(request.amount)}
                                                        currency={request.currency}
                                                        onSuccess={handlePublicSuccess}
                                                    />
                                                </Elements>
                                            </div>
                                        ) : (
                                            <div className="h-40 flex items-center justify-center animate-pulse bg-gray-50 rounded-3xl">Loading Stripe...</div>
                                        )
                                    ) : (
                                        savedCards.length > 0 ? (
                                            <div className="space-y-3">
                                                {savedCards.map((card) => (
                                                    <button
                                                        key={card.id}
                                                        onClick={() => setSelectedCardId(card.id)}
                                                        className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${selectedCardId === card.id ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4 text-black">
                                                            <div className="w-12 h-8 bg-black rounded-lg flex items-center justify-center text-[10px] font-black text-white uppercase tracking-tighter shadow-sm">
                                                                {card.card.brand}
                                                            </div>
                                                            <span className="font-black text-gray-800 leading-none">•••• {card.card.last4}</span>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCardId === card.id ? 'border-orange-500 bg-orange-500' : 'border-gray-200'}`}>
                                                            {selectedCardId === card.id && <div className="w-1.5 h-1.5 rounded-full bg-white animate-scale-in" />}
                                                        </div>
                                                    </button>
                                                ))}
                                                <Button
                                                    onClick={handlePayWithCard}
                                                    isLoading={isProcessing}
                                                    fullWidth
                                                    className="h-16 rounded-2xl text-lg font-black bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                                                >
                                                    Pay with Saved Card
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="p-6 bg-orange-50 border border-orange-100 rounded-[24px] text-orange-700 text-sm font-bold flex items-center gap-3">
                                                    <AlertCircle size={20} />
                                                    <span>No saved cards found. You can pay with a new card below.</span>
                                                </div>
                                                <Button
                                                    onClick={() => setShowPublicCardForm(true)}
                                                    fullWidth
                                                    className="h-16 rounded-2xl text-lg font-black bg-black text-white"
                                                >
                                                    Pay with New Card
                                                </Button>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                            {error && <p className="text-red-500 text-sm font-bold ml-1 flex items-center gap-2 animate-shake"><AlertCircle size={16} />{error}</p>}
                        </div>
                    ) : (
                        <div className="text-center space-y-6 py-4">
                            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                                <p className="text-orange-800 font-bold mb-4">Sign in to pay with your balance and track this request.</p>
                                <div className="flex gap-4">
                                    <Button onClick={() => navigate('/login')} className="flex-1 rounded-xl font-black bg-black text-white">Login</Button>
                                    <Button variant="ghost" onClick={() => navigate('/signup')} className="flex-1 rounded-xl font-black border-black/10">Sign Up</Button>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-black">Or continue with Card</span></div>
                            </div>

                            {!showPublicCardForm ? (
                                <Button
                                    onClick={() => setShowPublicCardForm(true)}
                                    className="h-16 rounded-2xl text-lg font-black bg-gray-100 text-black hover:bg-gray-200 border-2 border-transparent w-full"
                                >
                                    <CreditCard className="mr-2" /> Pay with Debit/Credit Card
                                </Button>
                            ) : (
                                <div className="animate-fade-in text-left">
                                    {clientSecret ? (
                                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                                            <StripePaymentForm
                                                requestId={id!}
                                                amount={parseFloat(request.amount)}
                                                currency={request.currency}
                                                onSuccess={handlePublicSuccess}
                                            />
                                        </Elements>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center animate-pulse bg-gray-50 rounded-3xl">Loading Secure Checkout...</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Security */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-[10px] text-black/30 font-extrabold uppercase tracking-[0.2em]">
                        Secured by FlapaPay Encryption Protocol
                    </p>
                    <ShieldCheck className="text-green-500/40" size={32} />
                </div>
            </div>
        </div>
    );
};
