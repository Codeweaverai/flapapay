import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ReactCountryFlag from 'react-country-flag';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').catch(e => { console.warn('Stripe disabled:', e.message); return null; });

const PaymentForm = ({ amount, onSuccess }: { amount: string, onSuccess: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: 'http://localhost:5173/dashboard',
            },
            redirect: 'if_required'
        });

        if (error) {
            setMessage(error.message || 'Payment failed');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            setMessage('Payment succeeded!');
            onSuccess();
        } else {
            setMessage('Unexpected state');
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <PaymentElement />
            {message && <div className="text-sm text-red-500">{message}</div>}
            <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50"
            >
                {isProcessing ? 'Processing...' : `Pay ${amount}`}
            </Button>
        </form>
    );
};

export const AddMoney: React.FC = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [wallets, setWallets] = useState<any[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [clientSecret, setClientSecret] = useState('');

    // Saved Cards State
    const [savedCards, setSavedCards] = useState<any[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string>('new');
    const [isUsingNewCard, setIsUsingNewCard] = useState(true);

    // Mobile Money State
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
    const [mobileNumber, setMobileNumber] = useState('');
    const [provider, setProvider] = useState('MTN_MOMO_ZMB');
    const [countryCode, setCountryCode] = useState('260');
    const [depositStatus, setDepositStatus] = useState('');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (token) {
                try {
                    const userRes = await api.get('/auth/me');
                    setWallets(userRes.data.wallets);

                    const urlWalletId = searchParams.get('walletId');
                    if (urlWalletId) {
                        const found = userRes.data.wallets.find((w: any) => w.id === urlWalletId);
                        if (found) setSelectedWallet(found);
                    } else if (userRes.data.wallets.length > 0) {
                        setSelectedWallet(userRes.data.wallets[0]);
                    }

                    // Fetch saved cards
                    const res = await api.get('/payments/methods');
                    setSavedCards(res.data.methods);

                    if (user?.defaultPaymentMethodId) {
                        const defaultCard = res.data.methods.find((c: any) => c.id === user.defaultPaymentMethodId);
                        if (defaultCard) setSelectedCardId(defaultCard.id);
                    } else if (res.data.methods.length > 0) {
                        setSelectedCardId(res.data.methods[0].id);
                    }
                } catch (err) {
                    console.error('Failed to load user data', err);
                }
            }
        };
        fetchUserData();
    }, [token, user?.defaultPaymentMethodId]);

    useEffect(() => {
        setIsUsingNewCard(selectedCardId === 'new');
        setClientSecret('');
    }, [selectedCardId]);

    // Force payment method check when wallet changes
    useEffect(() => {
        if (selectedWallet?.currency === 'USD') {
            setPaymentMethod('card');
        } else if (selectedWallet?.currency === 'NGN') {
            setProvider('MTN_MOMO_NGA');
            setCountryCode('234');
        } else if (selectedWallet?.currency === 'ZMW') {
            setProvider('MTN_MOMO_ZMB');
            setCountryCode('260');
        }
    }, [selectedWallet]);

    const initiatePayment = async () => {
        setIsLoading(true);
        setError('');
        setDepositStatus('');

        if (parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            setIsLoading(false);
            return;
        }

        try {
            if (paymentMethod === 'mobile_money') {
                // Strip '+', leading '0', and spaces
                const cleanPhone = mobileNumber.replace(/^\+/, '').replace(/^0/, '').replace(/\s+/g, '');
                const fullPhone = `${countryCode}${cleanPhone}`;

                const res = await api.post('/pawapay/deposit', {
                    amount: parseFloat(amount),
                    phoneNumber: fullPhone,
                    provider: provider,
                    currency: selectedWallet?.currency || 'ZMW'
                });

                if (res.data.status === 'ACCEPTED') {
                    setDepositStatus(`Deposit Initiated! Check your phone (${mobileNumber}).`);
                    setShowApprovalModal(true);

                    // Simulate success
                    setTimeout(() => {
                        setShowApprovalModal(false);
                        setShowSuccessModal(true);
                        // Finalize after showing success
                        setTimeout(() => {
                            handleSuccess();
                        }, 2000);
                    }, 5000);

                } else {
                    setError(`Deposit Failed: ${res.data.failureReason?.failureMessage || 'Unknown error'}`);
                }

            } else {
                // Stripe
                const payload: any = {
                    amount: parseFloat(amount),
                    currency: selectedWallet?.currency || 'usd'
                };
                if (!isUsingNewCard) payload.paymentMethodId = selectedCardId;

                const res = await api.post('/payments/create-payment-intent', payload);
                setClientSecret(res.data.clientSecret);

                if (!isUsingNewCard) handleSuccess();
            }

        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to initiate payment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccess = async () => {
        try {
            await api.post('/wallets/deposit', {
                walletId: selectedWallet?.id,
                amount: parseFloat(amount),
                description: isUsingNewCard ? 'Card Deposit' : 'Linked Card Deposit'
            });
            setShowSuccessModal(true);
        } catch (e) {
            console.error('Failed to record deposit', e);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <div className="hidden md:block w-72 shrink-0 transition-all duration-300">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-black mb-4 flex items-center gap-2 font-medium transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Add Money</h1>
                        <p className="text-gray-500">Top up your wallet balance instantly.</p>
                    </div>

                    {/* Horizontal Wallet Cards */}
                    <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
                        <div className="flex gap-4">
                            {wallets.map((wallet) => (
                                <button
                                    key={wallet.id}
                                    onClick={() => setSelectedWallet(wallet)}
                                    className={`relative min-w-[200px] p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between h-32 shadow-sm
                                        ${selectedWallet?.id === wallet.id
                                            ? 'border-black bg-gray-900 text-white shadow-xl scale-105'
                                            : 'border-white bg-white hover:border-gray-200 text-gray-500'}`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className="font-bold text-lg tracking-wider">{wallet.currency}</span>
                                        {wallet.currency === 'ZMW' ? (
                                            <ReactCountryFlag countryCode="ZM" svg style={{ fontSize: '1.5em' }} />
                                        ) : wallet.currency === 'NGN' ? (
                                            <ReactCountryFlag countryCode="NG" svg style={{ fontSize: '1.5em' }} />
                                        ) : (
                                            <ReactCountryFlag countryCode="US" svg style={{ fontSize: '1.5em' }} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs opacity-70 uppercase font-bold tracking-widest mb-1">Balance</p>
                                        <p className="text-2xl font-bold truncate">
                                            {Number(wallet.balance).toLocaleString()}
                                        </p>
                                    </div>
                                    {selectedWallet?.id === wallet.id && (
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-black rotate-45"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        {/* Selected Wallet Indicator */}
                        <div className="mb-8 p-4 bg-green-50/50 rounded-xl flex items-center justify-between border border-green-100/50">
                            <span className="text-sm font-semibold text-green-600/70">Adding money to</span>
                            <div className="flex items-center gap-2 font-bold text-green-700">
                                {selectedWallet?.currency === 'ZMW' ? <ReactCountryFlag countryCode="ZM" svg /> :
                                    selectedWallet?.currency === 'NGN' ? <ReactCountryFlag countryCode="NG" svg /> :
                                        <ReactCountryFlag countryCode="US" svg />}
                                {selectedWallet?.currency} Wallet
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-10">
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Amount to Add</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 font-black text-2xl transition-colors group-focus-within:text-orange-600">
                                    {selectedWallet?.currency === 'ZMW' ? 'K' : selectedWallet?.currency === 'NGN' ? '₦' : '$'}
                                </span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 text-4xl font-black bg-gray-50 border-2 border-transparent rounded-2xl outline-none transition-all placeholder-gray-300
                                               focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_rgba(249,115,22,0.1)] text-gray-900"
                                    placeholder="0.00"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Transaction Summary */}
                        {amount && parseFloat(amount) > 0 && (
                            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 animate-fade-in">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Transaction Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Deposit Amount</span>
                                        <span className="font-bold text-gray-900">{selectedWallet?.currency === 'ZMW' ? 'K' : selectedWallet?.currency === 'NGN' ? '₦' : '$'}{parseFloat(amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Processing Fee (1.8%)</span>
                                        <span className="font-bold text-orange-600">+{selectedWallet?.currency === 'ZMW' ? 'K' : selectedWallet?.currency === 'NGN' ? '₦' : '$'}{(parseFloat(amount) * 0.018).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-900 font-black">Total to Charge</span>
                                        <span className="text-xl font-black text-gray-900">{selectedWallet?.currency === 'ZMW' ? 'K' : selectedWallet?.currency === 'NGN' ? '₦' : '$'}{(parseFloat(amount) * 1.018).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Method Tabs */}
                        <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-8">
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-200 ${paymentMethod === 'card'
                                    ? 'bg-white shadow-md text-black scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Card Payment
                            </button>
                            {(selectedWallet?.currency === 'ZMW' || selectedWallet?.currency === 'NGN') && (
                                <button
                                    onClick={() => setPaymentMethod('mobile_money')}
                                    className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-200 ${paymentMethod === 'mobile_money'
                                        ? 'bg-white shadow-md text-black scale-[1.02]'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Mobile Money
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100 animate-shake">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>
                        )}

                        {depositStatus && (
                            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium flex items-center gap-2 border border-green-100">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                {depositStatus}
                            </div>
                        )}

                        {paymentMethod === 'card' ? (
                            <div className="space-y-6 animate-fade-in-up">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-4">Select Payment Card</label>
                                    <div className="space-y-3">
                                        {savedCards.map((card) => (
                                            <div
                                                key={card.id}
                                                onClick={() => {
                                                    setSelectedCardId(card.id);
                                                    setIsUsingNewCard(false);
                                                }}
                                                className={`p-5 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all duration-200 group ${selectedCardId === card.id
                                                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-8 rounded flex items-center justify-center text-xs font-bold text-white shadow-sm ${selectedCardId === card.id ? 'bg-blue-600' : 'bg-gray-400'
                                                        }`}>
                                                        {card.card.brand.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold text-sm ${selectedCardId === card.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                                            •••• {card.card.last4}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-medium">Expires {card.card.exp_month}/{card.card.exp_year}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCardId === card.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                                    }`}>
                                                    {selectedCardId === card.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                </div>
                                            </div>
                                        ))}

                                        <div
                                            onClick={() => {
                                                setSelectedCardId('new');
                                                setIsUsingNewCard(true);
                                            }}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all duration-200 ${selectedCardId === 'new'
                                                ? 'border-black bg-gray-50 shadow-sm'
                                                : 'border-gray-100 bg-white hover:border-gray-200'
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <span className="font-bold text-sm">Use a new card</span>
                                        </div>
                                    </div>
                                </div>

                                {isUsingNewCard ? (
                                    clientSecret ? (
                                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                                            <PaymentForm
                                                amount={amount}
                                                onSuccess={() => {
                                                    navigate('/dashboard');
                                                    setShowSuccessModal(true);
                                                }}
                                            />
                                        </Elements>
                                    ) : (
                                        <Button
                                            onClick={initiatePayment}
                                            disabled={!amount || isLoading}
                                            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                        >
                                            {isLoading ? 'Preparing Secure Checkout...' : 'Continue to Payment'}
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        onClick={initiatePayment}
                                        disabled={!amount || isLoading}
                                        className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                    >
                                        {isLoading ? 'Processing Payment...' : `Pay ${selectedWallet?.currency === 'ZMW' ? 'K' : selectedWallet?.currency === 'NGN' ? '₦' : '$'}${amount} with Saved Card`}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in-up">
                                {/* Mobile Money Form */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Select Network Provider</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {selectedWallet?.currency === 'ZMW' ? [
                                            { id: 'MTN_MOMO_ZMB', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                            { id: 'AIRTEL_OAPI_ZMB', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
                                            { id: 'ZAMTEL_ZMB', name: 'Zamtel', logo: '/assets/images/zamtel.png' }
                                        ].map((net) => (
                                            <button
                                                key={net.id}
                                                onClick={() => setProvider(net.id)}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${provider === net.id
                                                    ? 'border-green-500 bg-green-50 shadow-sm'
                                                    : 'border-gray-100 hover:border-gray-200 bg-white'
                                                    }`}
                                            >
                                                <img src={net.logo} alt={net.name} className="h-10 w-10 object-contain" />
                                                <span className="text-xs font-bold text-gray-600">{net.name}</span>
                                            </button>
                                        )) : [
                                            { id: 'MTN_MOMO_NGA', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                            { id: 'AIRTEL_NGA', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' }
                                        ].map((net) => (
                                            <button
                                                key={net.id}
                                                onClick={() => setProvider(net.id)}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${provider === net.id
                                                    ? 'border-green-500 bg-green-50 shadow-sm'
                                                    : 'border-gray-100 hover:border-gray-200 bg-white'
                                                    }`}
                                            >
                                                <img src={net.logo} alt={net.name} className="h-10 w-10 object-contain" />
                                                <span className="text-xs font-bold text-gray-600">{net.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 focus-within:border-black focus-within:ring-1 focus-within:ring-black/5 transition-all">
                                        <div className="flex items-center gap-2 border-r border-gray-100 pr-4 mr-4 py-3">
                                            {selectedWallet?.currency === 'ZMW' ? (
                                                <>
                                                    <ReactCountryFlag countryCode="ZM" svg />
                                                    <span className="font-bold text-gray-500 text-sm">{countryCode}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ReactCountryFlag countryCode="NG" svg />
                                                    <span className="font-bold text-gray-500 text-sm">{countryCode}</span>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="tel"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            className="flex-1 py-3 font-bold text-gray-900 outline-none placeholder-gray-300 bg-transparent"
                                            placeholder="96XXXXXXX"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Use the number registered with your mobile money account.
                                    </p>
                                </div>

                                <Button
                                    onClick={initiatePayment}
                                    disabled={!amount || !mobileNumber || isLoading}
                                    className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all text-lg"
                                >
                                    {isLoading ? 'Sending Request...' : `Request Payment (${selectedWallet?.currency === 'ZMW' ? 'K' : selectedWallet?.currency === 'NGN' ? '₦' : '$'}${amount})`}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Approval Modal */}
                {showApprovalModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl scale-100 transform transition-all">
                            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-2xl font-black mb-3">Check Your Phone</h3>
                            <p className="text-gray-500 mb-8 font-medium leading-relaxed">
                                We've sent a payment request to <b className="text-black">{mobileNumber}</b>.<br />
                                Please approve the transaction on your device.
                            </p>
                            <div className="flex justify-center mb-6">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-black"></div>
                            </div>
                            <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">Waiting for approval...</p>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl scale-100 transform transition-all">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-2xl font-black mb-3">Deposit Successful!</h3>
                            <p className="text-gray-500 mb-8 font-medium leading-relaxed">
                                Your wallet has been topped up successfully.<br />
                                The funds are now available.
                            </p>
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
                            >
                                Return to Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
