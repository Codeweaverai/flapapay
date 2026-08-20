import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/axios';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '../components/ui/Button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ReactCountryFlag from 'react-country-flag';
import { APP_BASE } from '../lib/runtime';
import { startMobileMoneyStatusPolling } from '../lib/mobileMoneyPolling';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').catch(e => { console.warn('Stripe disabled:', e.message); return null; });

const getWalletTheme = (currency?: string) => {
    const normalizedCurrency = String(currency || '').toUpperCase();

    if (normalizedCurrency === 'USD') {
        return {
            card: 'bg-gradient-to-br from-yellow-400 to-orange-500 border-none text-white shadow-lg shadow-orange-500/20',
            label: 'text-yellow-100',
            text: 'text-white',
            icon: 'bg-white/20 text-white',
            badge: 'bg-white/20 text-white',
            countryCode: 'US',
        };
    }
    if (normalizedCurrency === 'ZMW') {
        return {
            card: 'bg-gradient-to-br from-emerald-400 to-green-600 border-none text-white shadow-lg shadow-emerald-500/20',
            label: 'text-emerald-100',
            text: 'text-white',
            icon: 'bg-white/20 text-white',
            badge: 'bg-white/20 text-white',
            countryCode: 'ZM',
        };
    }
    if (normalizedCurrency === 'NGN') {
        return {
            card: 'bg-gradient-to-br from-sky-500 to-blue-700 border-none text-white shadow-lg shadow-blue-500/20',
            label: 'text-sky-100',
            text: 'text-white',
            icon: 'bg-white/20 text-white',
            badge: 'bg-white/20 text-white',
            countryCode: 'NG',
        };
    }
    return {
        card: 'bg-gradient-to-br from-slate-700 to-slate-900 border-none text-white shadow-lg shadow-slate-900/20',
        label: 'text-slate-200',
        text: 'text-white',
        icon: 'bg-white/20 text-white',
        badge: 'bg-white/20 text-white',
        countryCode: 'US',
    };
};

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
                return_url: `${APP_BASE}/dashboard`,
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
    const { token, user, logout } = useAuth();
    const { unreadCount } = useNotifications();
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
    const [provider, setProvider] = useState('mtn');
    const [countryCode, setCountryCode] = useState('260');
    const [resolvedAccountName, setResolvedAccountName] = useState('');
    const [resolvedPhone, setResolvedPhone] = useState('');
    const [isResolvingMobileAccount, setIsResolvingMobileAccount] = useState(false);
    const [mobileResolveError, setMobileResolveError] = useState('');
    const [depositStatus, setDepositStatus] = useState('');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [collectionReference, setCollectionReference] = useState('');
    const pollStopRef = useRef<null | (() => void)>(null);
    const mobileResolveTimeoutRef = useRef<number | null>(null);
    const allowedWalletCurrencies = new Set(['USD', 'ZMW']);
    const eligibleWallets = wallets.filter((wallet) => allowedWalletCurrencies.has(String(wallet?.currency || '').toUpperCase()));
    const walletDisplayPriority: Record<string, number> = { ZMW: 0, USD: 1 };
    const orderedWallets = [...eligibleWallets].sort((a, b) => {
        const currencyA = String(a?.currency || '').toUpperCase();
        const currencyB = String(b?.currency || '').toUpperCase();
        const priorityA = walletDisplayPriority[currencyA] ?? 99;
        const priorityB = walletDisplayPriority[currencyB] ?? 99;

        if (priorityA !== priorityB) return priorityA - priorityB;
        return currencyA.localeCompare(currencyB);
    });
    const normalizedMobileDigits = mobileNumber.replace(/\D/g, '');
    const normalizedLocalMobileDigits = normalizedMobileDigits.startsWith(countryCode)
        ? normalizedMobileDigits.slice(countryCode.length)
        : normalizedMobileDigits.replace(/^0+/, '');
    const isReadyForMobileResolve = paymentMethod === 'mobile_money'
        && selectedWallet?.currency === 'ZMW'
        && Boolean(provider)
        && normalizedLocalMobileDigits.length === 9;

    const refreshWallets = async (preferredWalletId?: string | null) => {
        const userRes = await api.get('/auth/me');
        const nextWallets = Array.isArray(userRes.data.wallets) ? userRes.data.wallets : [];
        const nextEligibleWallets = nextWallets
            .filter((wallet: any) => allowedWalletCurrencies.has(String(wallet?.currency || '').toUpperCase()))
            .sort((a: any, b: any) => {
                const currencyA = String(a?.currency || '').toUpperCase();
                const currencyB = String(b?.currency || '').toUpperCase();
                const priorityA = walletDisplayPriority[currencyA] ?? 99;
                const priorityB = walletDisplayPriority[currencyB] ?? 99;

                if (priorityA !== priorityB) return priorityA - priorityB;
                return currencyA.localeCompare(currencyB);
            });
        setWallets(nextWallets);

        const targetWalletId = preferredWalletId || selectedWallet?.id || searchParams.get('walletId');
        if (targetWalletId) {
            const found = nextEligibleWallets.find((w: any) => w.id === targetWalletId);
            if (found) {
                setSelectedWallet(found);
                return;
            }
        }

        if (nextEligibleWallets.length > 0) {
            setSelectedWallet(nextEligibleWallets[0]);
            return;
        }

        setSelectedWallet(null);
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (token) {
                try {
                    await refreshWallets(searchParams.get('walletId'));

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
        } else if (selectedWallet?.currency === 'ZMW') {
            setProvider('mtn');
            setCountryCode('260');
        } else {
            setPaymentMethod('card');
        }
    }, [selectedWallet]);

    useEffect(() => {
        setResolvedAccountName('');
        setResolvedPhone('');
        setMobileResolveError('');

        if (paymentMethod !== 'mobile_money' || selectedWallet?.currency !== 'ZMW') {
            setIsResolvingMobileAccount(false);
            if (mobileResolveTimeoutRef.current) {
                window.clearTimeout(mobileResolveTimeoutRef.current);
                mobileResolveTimeoutRef.current = null;
            }
            return;
        }

        if (!isReadyForMobileResolve) {
            setIsResolvingMobileAccount(false);
            if (mobileResolveTimeoutRef.current) {
                window.clearTimeout(mobileResolveTimeoutRef.current);
                mobileResolveTimeoutRef.current = null;
            }
            return;
        }

        setIsResolvingMobileAccount(true);
        mobileResolveTimeoutRef.current = window.setTimeout(async () => {
            try {
                const res = await api.post('/resolve/mobile-money', {
                    phone: normalizedLocalMobileDigits,
                    operator: provider,
                    country: 'zm'
                });
                const payload = res.data?.data || {};
                setResolvedAccountName(String(payload.accountName || '').trim());
                setResolvedPhone(String(payload.phone || '').trim());
                setMobileResolveError('');
            } catch (err: any) {
                setResolvedAccountName('');
                setResolvedPhone('');
                setMobileResolveError(err.response?.data?.message || err.response?.data?.error || 'Account name could not be resolved');
            } finally {
                setIsResolvingMobileAccount(false);
                mobileResolveTimeoutRef.current = null;
            }
        }, 500);

        return () => {
            if (mobileResolveTimeoutRef.current) {
                window.clearTimeout(mobileResolveTimeoutRef.current);
                mobileResolveTimeoutRef.current = null;
            }
        };
    }, [countryCode, isReadyForMobileResolve, normalizedLocalMobileDigits, paymentMethod, provider, selectedWallet?.currency]);

    useEffect(() => {
        if (!collectionReference || !showApprovalModal) return;

        pollStopRef.current?.();
        pollStopRef.current = startMobileMoneyStatusPolling({
            fetchStatus: async () => {
                const res = await api.get(`/lenco/mobile-money/collections/${collectionReference}/status`);
                return res.data;
            },
            onPending: () => {
                setDepositStatus(`Payment request sent. Authorize the prompt on ${mobileNumber}.`);
            },
            onSuccess: async () => {
                setShowApprovalModal(false);
                setDepositStatus('Deposit completed successfully.');
                setShowSuccessModal(true);
                await refreshWallets(selectedWallet?.id);
                setCollectionReference('');
            },
            onFailure: (snapshot) => {
                setShowApprovalModal(false);
                setCollectionReference('');
                setError(snapshot?.failureReason || 'Mobile money deposit failed.');
            },
            onError: (err: any) => {
                setShowApprovalModal(false);
                setCollectionReference('');
                setError(err.response?.data?.error || 'Failed to check mobile money deposit status');
            },
            onTimeout: () => {
                setShowApprovalModal(false);
                setCollectionReference('');
                setError('Mobile money deposit confirmation timed out. Please try again.');
            }
        });

        return () => {
            pollStopRef.current?.();
            pollStopRef.current = null;
        };
    }, [collectionReference, mobileNumber, selectedWallet?.id, showApprovalModal]);

    useEffect(() => () => {
        pollStopRef.current?.();
        pollStopRef.current = null;
        if (mobileResolveTimeoutRef.current) {
            window.clearTimeout(mobileResolveTimeoutRef.current);
            mobileResolveTimeoutRef.current = null;
        }
    }, []);

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
                const cleanPhone = mobileNumber.replace(/\D/g, '');
                const fullPhone = cleanPhone.startsWith(countryCode) ? cleanPhone : `${countryCode}${cleanPhone.replace(/^0+/, '')}`;

                if (!resolvedAccountName) {
                    setError('Resolve the mobile money account name before sending the collection request');
                    setIsLoading(false);
                    return;
                }

                const res = await api.post('/lenco/mobile-money/collections', {
                    walletId: selectedWallet?.id,
                    amount: parseFloat(amount),
                    phoneNumber: fullPhone,
                    operator: provider,
                    country: 'zm',
                    accountName: resolvedAccountName
                });

                const providerStatus = String(res.data?.status || '').toLowerCase();
                const localStatus = String(res.data?.localStatus || '').toUpperCase();
                if (localStatus === 'COMPLETED' || providerStatus === 'successful') {
                    setDepositStatus('Deposit completed successfully.');
                    await refreshWallets(selectedWallet?.id);
                    setShowSuccessModal(true);
                } else if (providerStatus === 'pay-offline' || providerStatus === 'pending' || localStatus === 'PENDING') {
                    setCollectionReference(res.data.reference);
                    setDepositStatus(`Payment request sent. Authorize the prompt on ${mobileNumber}.`);
                    setShowApprovalModal(true);
                } else {
                    setError(res.data?.message || 'Mobile money deposit could not be initiated');
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
        <div className="min-h-screen bg-white flex font-sans text-gray-900" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 min-h-screen p-6 md:p-8 relative overflow-x-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/20 via-emerald-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Add Money</h1>
                            <p className="text-gray-500 mt-1">Welcome back, {user?.fullName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
                                title="Settings"
                            >
                                <svg className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => navigate('/notifications')}
                                className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
                            >
                                <div className="relative">
                                    <svg className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex flex-col items-center justify-center w-32 h-16 bg-black text-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
                            >
                                <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="text-[10px] font-bold">Dashboard</span>
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all duration-300 shadow-lg ${showUserMenu ? 'border-orange-500 scale-105 shadow-orange-500/20' : 'border-white/50 bg-white/10 hover:border-white shadow-sm hover:scale-105'}`}
                                >
                                    {user?.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:3005'}${user.avatarUrl}`}
                                            alt={user.fullName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-lg font-black text-white">
                                            {user?.fullName?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-3 w-64 p-2 bg-white rounded-[24px] shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200 z-[100]">
                                        <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-xs font-black text-white">
                                                {user?.fullName?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-900 truncate">{user?.fullName}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Verified Pro</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { logout(); navigate('/signup/individual'); }}
                                            className="w-full mt-2 py-3 px-4 text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout Session
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {orderedWallets.length === 0 ? (
                        <div className="rounded-[32px] border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 9V7a5 5 0 00-10 0v2M5 9h14l1 10a2 2 0 01-2 2H6a2 2 0 01-2-2L5 9z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">No supported wallets found</h2>
                            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-gray-500">
                                Add Money is currently available only for USD and ZMW wallets. Create one of those wallets first, then return here to fund it.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="mt-6 rounded-2xl bg-black px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-gray-800"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    ) : (
                    <>
                    {/* Wallet Cards */}
                    <div className="mb-8">
                        <div className="mb-4">
                            <h2 className="text-lg font-black text-gray-900">Choose Wallet</h2>
                            <p className="text-sm font-medium text-gray-500">Only active USD and ZMW wallets are shown here.</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {orderedWallets.map((wallet) => {
                                const theme = getWalletTheme(wallet.currency);
                                const isSelected = selectedWallet?.id === wallet.id;

                                return (
                                    <button
                                        key={wallet.id}
                                        onClick={() => setSelectedWallet(wallet)}
                                        className={`relative min-w-[196px] rounded-2xl p-4 text-left transition-all duration-300 hover:-translate-y-1 ${theme.card} ${isSelected ? 'scale-[1.03] ring-2 ring-offset-2 ring-offset-white ring-black/15' : ''}`}
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                            <span className={`text-4xl font-bold ${theme.text}`}>{wallet.currency}</span>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ${theme.icon} shadow-sm`}>
                                                    <ReactCountryFlag countryCode={theme.countryCode} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${theme.badge}`}>
                                                    {isSelected ? 'Selected' : 'Active'}
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <p className={`text-xs font-medium uppercase tracking-widest ${theme.label}`}>Available Balance</p>
                                                <p className={`mt-1 text-2xl font-extrabold ${theme.text}`}>
                                                    {Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    <span className="ml-1 text-sm font-normal opacity-80">{wallet.currency}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-black tracking-wider ${theme.text}`}>{wallet.currency} Wallet</span>
                                                {isSelected && (
                                                    <span className="rounded-full bg-white/25 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                                        In Use
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        {/* Selected Wallet Indicator */}
                        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Funding Destination</p>
                                <div className="mt-2 flex items-center gap-3 font-black text-gray-900">
                                    {selectedWallet?.currency === 'ZMW' ? <ReactCountryFlag countryCode="ZM" svg /> : <ReactCountryFlag countryCode="US" svg />}
                                    <span className="text-xl">{selectedWallet?.currency} Wallet</span>
                                </div>
                                <p className="mt-2 text-sm font-medium text-gray-500">
                                    {selectedWallet?.currency === 'USD'
                                        ? 'Use card checkout to credit your USD balance instantly.'
                                        : 'Use mobile money collections or card funding for your ZMW balance.'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-right shadow-sm">
                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Available Balance</p>
                                <p className="mt-2 text-2xl font-black text-gray-900">
                                    {selectedWallet?.currency === 'ZMW' ? 'K' : '$'}
                                    {Number(selectedWallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-10">
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Amount to Add</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 font-black text-2xl transition-colors group-focus-within:text-orange-600">
                                    {selectedWallet?.currency === 'ZMW' ? 'K' : '$'}
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
                                        <span className="font-bold text-gray-900">{selectedWallet?.currency === 'ZMW' ? 'K' : '$'}{parseFloat(amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Processing Fee (1.8%)</span>
                                        <span className="font-bold text-orange-600">+{selectedWallet?.currency === 'ZMW' ? 'K' : '$'}{(parseFloat(amount) * 0.018).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-900 font-black">Total to Charge</span>
                                        <span className="text-xl font-black text-gray-900">{selectedWallet?.currency === 'ZMW' ? 'K' : '$'}{(parseFloat(amount) * 1.018).toFixed(2)}</span>
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
                            {selectedWallet?.currency === 'ZMW' && (
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
                                                    ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 shadow-md shadow-indigo-100'
                                                    : 'border-gray-100 bg-white hover:border-sky-200 hover:bg-sky-50/40'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-12 w-16 items-center justify-center rounded-xl text-xs font-black uppercase text-white shadow-sm ${selectedCardId === card.id
                                                        ? 'bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-500'
                                                        : 'bg-gradient-to-r from-slate-500 to-slate-400'
                                                        }`}>
                                                        {card.card.brand.toUpperCase().slice(0, 6)}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold text-sm ${selectedCardId === card.id ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                            •••• {card.card.last4}
                                                        </p>
                                                        <p className="text-xs font-medium text-gray-500">Expires {card.card.exp_month}/{card.card.exp_year}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCardId === card.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
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
                                                ? 'border-violet-500 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50 shadow-md shadow-violet-100'
                                                : 'border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/40'
                                                }`}
                                        >
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selectedCardId === 'new' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'bg-gray-100 text-gray-600'} transition-colors`}>
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <div>
                                                <span className="block text-sm font-bold text-gray-900">Use a new card</span>
                                                <span className="text-xs font-medium text-gray-500">Pay with a different Visa or Mastercard</span>
                                            </div>
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
                                        {isLoading ? 'Processing Payment...' : `Pay ${selectedWallet?.currency === 'ZMW' ? 'K' : '$'}${amount} with Saved Card`}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in-up">
                                {/* Mobile Money Form */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Select Network Provider</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { id: 'mtn', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                            { id: 'airtel', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
                                            { id: 'zamtel', name: 'Zamtel', logo: '/assets/images/zamtel.png' }
                                        ].map((net) => (
                                            <button
                                                key={net.id}
                                                onClick={() => setProvider(net.id)}
                                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${provider === net.id
                                                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-lime-50 shadow-md shadow-emerald-100'
                                                    : 'border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 bg-white'
                                                    }`}
                                            >
                                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${provider === net.id ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                                                    <img src={net.logo} alt={net.name} className="h-10 w-10 object-contain" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">{net.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 focus-within:border-black focus-within:ring-1 focus-within:ring-black/5 transition-all">
                                        <div className="flex items-center gap-2 border-r border-gray-100 pr-4 mr-4 py-3">
                                            <ReactCountryFlag countryCode="ZM" svg />
                                            <span className="font-bold text-gray-500 text-sm">{countryCode}</span>
                                        </div>
                                        <input
                                            type="tel"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            className="flex-1 py-3 font-bold text-gray-900 outline-none placeholder-gray-300 bg-transparent"
                                            placeholder="96XXXXXXX"
                                        />
                                    </div>
                                    <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Resolved Account Name</p>
                                                <p className="mt-1 text-sm font-bold text-gray-900">
                                                    {resolvedAccountName || (isResolvingMobileAccount ? 'Resolving account name...' : 'Enter a valid Zambia mobile number')}
                                                </p>
                                            </div>
                                            {resolvedAccountName ? (
                                                <div className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
                                                    Verified
                                                </div>
                                            ) : null}
                                        </div>
                                        {resolvedPhone ? (
                                            <p className="mt-2 text-xs font-medium text-gray-500">Phone: {resolvedPhone}</p>
                                        ) : null}
                                        {mobileResolveError ? (
                                            <p className="mt-2 text-xs font-medium text-red-500">{mobileResolveError}</p>
                                        ) : !isReadyForMobileResolve && mobileNumber ? (
                                            <p className="mt-2 text-xs font-medium text-amber-600">Enter a full 9-digit Zambia mobile number to resolve the account name.</p>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        FlapaPay mobile money collections are currently enabled for Zambia wallets only.
                                    </p>
                                </div>

                                <Button
                                    onClick={initiatePayment}
                                    disabled={!amount || !mobileNumber || !resolvedAccountName || isResolvingMobileAccount || isLoading}
                                    className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all text-lg"
                                >
                                    {isLoading ? 'Sending Request...' : isResolvingMobileAccount ? 'Resolving Account Name...' : `Request Payment (${selectedWallet?.currency === 'ZMW' ? 'K' : '$'}${amount})`}
                                </Button>
                            </div>
                        )}
                    </div>
                    </>
                    )}
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
