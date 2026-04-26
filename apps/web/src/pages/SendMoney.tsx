import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { PinApprovalModal } from '../components/ui/PinApprovalModal';

type Step = 'SEARCH' | 'AMOUNT' | 'CONFIRM' | 'SUCCESS';

export const SendMoney: React.FC = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('SEARCH');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const [wallets, setWallets] = useState<any[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'card'>('wallet');
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');

    const [savedCards, setSavedCards] = useState<any[]>([]);
    const [selectedCardId, setSelectedCardId] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState<any>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [recentRecipients, setRecentRecipients] = useState<any[]>([]);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005';

    useEffect(() => {
        if (token) {
            api.get('/auth/me')
                .then(res => {
                    setWallets(res.data.wallets);
                    if (res.data.wallets.length > 0) {
                        setSelectedWalletId(res.data.wallets[0].id);
                        setSelectedCurrency(res.data.wallets[0].currency);
                    }
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

            // Load recent recipients — non-blocking
            api.get('/users/recent-recipients')
                .then(res => setRecentRecipients(res.data || []))
                .catch(() => {});
        }
    }, [token, user?.defaultPaymentMethodId]);

    useEffect(() => {
        if (selectedMethod === 'wallet' && selectedWalletId) {
            const wallet = wallets.find(w => w.id === selectedWalletId);
            if (wallet) setSelectedCurrency(wallet.currency);
        } else if (selectedMethod === 'card') {
            setSelectedCurrency('USD');
        }
    }, [selectedWalletId, selectedMethod, wallets]);

    const handleSearch = async () => {
        if (!searchQuery.includes('@')) {
            setError('Please enter a valid email to search.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const res = await api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
            setSearchResults(res.data);
        } catch (e) { setError('Search failed'); }
        finally { setIsLoading(false); }
    };

    const handleSelectUser = (u: any) => {
        setSelectedUser(u);
        setStep('AMOUNT');
        setError('');
    };

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        setIsPinModalOpen(true);
    };

    const handlePinSuccess = async (pin: string) => {
        setIsLoading(true);
        setError('');
        try {
            const currency = selectedCurrency;

            // ── Unregistered recipient — escrow / Pay Anyone flow ──────────────
            if (selectedUser?.registered === false) {
                const res = await api.post('/payments/transfer-to-unregistered', {
                    debitWalletId: selectedWalletId,
                    recipientEmail: selectedUser.email,
                    amount: parseFloat(amount),
                    currency,
                    description: description || 'Payment',
                    pin,
                });
                setSuccessData({
                    ...res.data,
                    amount: `${currency} ${amount}`,
                    pending: true,
                    recipientEmail: selectedUser.email,
                    expiresAt: res.data.expiresAt,
                });
                setStep('SUCCESS');
                return;
            }

            // ── Registered recipient ────────────────────────────────────────────
            if (selectedMethod === 'wallet') {
                const res = await api.post('/payments/transfer', {
                    debitWalletId: selectedWalletId,
                    recipientEmail: selectedUser.email,
                    amount: parseFloat(amount),
                    currency,
                    description: description || 'Transfer',
                    pin,
                });
                setSuccessData({ ...res.data, amount: `${currency} ${amount}` });
                setStep('SUCCESS');
            } else {
                if (!selectedCardId) {
                    setError('Please select a card or add one in settings.');
                    setIsLoading(false);
                    return;
                }
                const res = await api.post('/payments/send-from-card', {
                    paymentMethodId: selectedCardId,
                    recipientEmail: selectedUser.email,
                    amount: parseFloat(amount),
                    currency,
                    description: description || 'Transfer from Card',
                    pin,
                });
                setSuccessData({ ...res.data, amount: `${currency} ${amount}` });
                setStep('SUCCESS');
            }
        } catch (err: any) {
            throw err; // Let PinApprovalModal handle the error display
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { key: 'SEARCH', label: 'Recipient' },
        { key: 'AMOUNT', label: 'Details' },
        { key: 'SUCCESS', label: 'Confirm' }
    ];

    return (
        <div className="min-h-screen bg-white flex" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <div className="hidden md:block w-72 shrink-0"><Sidebar /></div>

            <main className="flex-1 px-4 py-8 md:p-12 flex flex-col items-center">
                <div className="max-w-5xl mx-auto w-full">
                {/* Modern Stepper */}
                <div className="w-full max-w-2xl mb-12">
                    <div className="relative flex justify-between items-center px-2">
                        {steps.map((s, i) => (
                            <div key={s.key} className="flex flex-col items-center relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${step === s.key ? 'bg-black text-white scale-110 shadow-lg ring-4 ring-gray-100' :
                                    (steps.findIndex(x => x.key === step) > i || step === 'SUCCESS' ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-100 text-gray-300')
                                    }`}>
                                    {steps.findIndex(x => x.key === step) > i || step === 'SUCCESS' ? '✓' : i + 1}
                                </div>
                                <span className={`absolute -bottom-7 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-300 ${step === s.key ? 'text-black' : 'text-gray-400'
                                    }`}>{s.label}</span>
                            </div>
                        ))}
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-0 w-full h-[2px] bg-gray-100 -z-0">
                            <div className="h-full bg-black transition-all duration-700 ease-in-out" style={{
                                width: step === 'SEARCH' ? '0%' : step === 'AMOUNT' ? '50%' : '100%'
                            }} />
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-2xl mx-auto">
                    {/* Header Animation Area */}
                    <div className="text-center mb-8 animate-fade-in-up">
                        <h1 className="text-4xl font-black text-black tracking-tight">
                            {step === 'SUCCESS' ? 'Transfer Sent!' : 'Send Money'}
                        </h1>
                        <p className="text-black/50 font-bold mt-2">
                            {step === 'SEARCH' && 'Directly to any email destination'}
                            {step === 'AMOUNT' && 'Tailor your transaction details'}
                        </p>
                    </div>

                    {/* ── Main Card — light gray with shadow ── */}
                    <div className="bg-gray-50 rounded-[40px] shadow-[0_24px_64px_-8px_rgba(0,0,0,0.10),0_4px_16px_-4px_rgba(0,0,0,0.06)] border border-gray-100 p-10 relative overflow-hidden">
                        {/* Subtle decorative blobs */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-100/60 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>

                        {/* SEARCH STEP */}
                        {step === 'SEARCH' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Search input card */}
                                <div className="space-y-4 p-6 bg-white rounded-[28px] border border-gray-100 shadow-sm">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Recipient</label>
                                    <div className="relative flex gap-3">
                                        <input
                                            type="email"
                                            placeholder="Enter email address..."
                                            className="flex-1 p-5 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-orange-400 focus:bg-white transition-all outline-none font-bold text-lg placeholder-gray-300 text-gray-900"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="h-16 w-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:scale-105 active:scale-95 transition-all shadow-lg group/btn"
                                            disabled={isLoading}
                                        >
                                            {isLoading
                                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                : <span className="text-2xl group-hover/btn:translate-x-1 transition-transform">→</span>}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-black border border-red-100">{error}</div>
                                )}

                                {/* Unregistered — Pay Anyone card */}
                                {searchResults.length === 1 && searchResults[0].registered === false && (
                                    <div className="p-6 bg-orange-50 border-2 border-orange-100 rounded-[28px] space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0 text-xl">✉️</div>
                                            <div className="flex-1">
                                                <p className="font-black text-gray-900 text-base leading-tight">{searchResults[0].email}</p>
                                                <p className="text-orange-600 font-black text-[11px] uppercase tracking-widest mt-0.5">Not on FlapaPay yet</p>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-sm font-bold leading-relaxed">
                                            We'll hold the funds and send them an email to claim. If they don't register within 30 days, you'll be fully refunded.
                                        </p>
                                        <button
                                            onClick={() => handleSelectUser(searchResults[0])}
                                            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                                        >
                                            Send Anyway →
                                        </button>
                                    </div>
                                )}

                                {/* Recent Recipients */}
                                {recentRecipients.length > 0 && searchResults.length === 0 && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <span>⏱</span> Recent
                                        </p>
                                        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                                            {recentRecipients.map(u => {
                                                const initials = u.full_name
                                                    ? u.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                                                    : (u.email?.[0] ?? '?').toUpperCase();
                                                const firstName = (u.full_name ?? u.email ?? '').split(' ')[0];
                                                const avatarSrc = u.avatar_url
                                                    ? (u.avatar_url.startsWith('http') ? u.avatar_url : `${API_BASE}${u.avatar_url}`)
                                                    : null;
                                                return (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => handleSelectUser(u)}
                                                        className="flex flex-col items-center gap-2 group shrink-0 w-16"
                                                    >
                                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-md group-hover:border-orange-400 group-hover:scale-105 group-hover:shadow-lg transition-all duration-200">
                                                            {avatarSrc ? (
                                                                <img src={avatarSrc} alt={u.full_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-black text-white text-lg">
                                                                    {initials}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors truncate w-full text-center">
                                                            {firstName}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="h-px bg-gray-100" />
                                    </div>
                                )}

                                {/* Search results — registered users only */}
                                {searchResults.filter(u => u.registered !== false).length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Results Found</p>
                                        {searchResults.filter(u => u.registered !== false).map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => handleSelectUser(u)}
                                                className="group flex items-center gap-4 p-5 bg-white rounded-[24px] cursor-pointer border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 hover:-translate-y-0.5 transition-all"
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center font-black text-orange-500 text-2xl shadow-sm overflow-hidden border border-orange-100">
                                                    {u.avatar_url ? (
                                                        <img src={`${API_BASE}${u.avatar_url}`} alt={u.full_name} className="w-full h-full object-cover" />
                                                    ) : u.full_name[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-gray-900 text-lg leading-tight">{u.full_name}</p>
                                                    <p className="text-sm font-bold text-gray-400">{u.email}</p>
                                                </div>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity font-black text-xs bg-orange-50 text-orange-500 border border-orange-100 px-3 py-1 rounded-full">
                                                    SELECT →
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* AMOUNT STEP */}
                        {step === 'AMOUNT' && selectedUser && (
                            <div className="space-y-6 animate-fade-in">

                                {/* Recipient card */}
                                <div className={`flex items-center gap-4 p-5 bg-white rounded-[28px] border shadow-sm ${selectedUser.registered === false ? 'border-orange-200' : 'border-gray-100'}`}>
                                    <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center font-black text-2xl overflow-hidden border shadow-sm ${selectedUser.registered === false ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-orange-50 text-orange-500 border-orange-100'}`}>
                                        {selectedUser.avatar_url
                                            ? <img src={`${API_BASE}${selectedUser.avatar_url}`} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                                            : selectedUser.registered === false ? '✉️' : (selectedUser.full_name?.[0] ?? '?')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-gray-900 text-base leading-tight truncate">
                                            {selectedUser.registered === false ? selectedUser.email : selectedUser.full_name}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.registered === false ? 'bg-orange-400' : 'bg-green-500 animate-pulse'}`} />
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedUser.registered === false ? 'text-orange-500' : 'text-gray-400'}`}>
                                                {selectedUser.registered === false ? 'Will be notified by email' : 'FlapaPay User'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep('SEARCH')}
                                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-all text-sm font-black shrink-0"
                                        title="Change Recipient"
                                    >✕</button>
                                </div>

                                {/* Amount input */}
                                <div className="text-center space-y-3 py-4">
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-4xl font-black text-orange-500">
                                            {selectedCurrency === 'ZMW' ? 'K' : selectedCurrency === 'NGN' ? '₦' : '$'}
                                        </span>
                                        <input
                                            type="number"
                                            autoFocus
                                            className="text-center text-7xl font-black bg-transparent border-none focus:ring-0 outline-none p-0 placeholder-gray-200 min-w-[200px] text-gray-900"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="h-0.5 w-20 bg-gray-200 mx-auto rounded-full" />
                                    <input
                                        type="text"
                                        className="w-full p-4 text-center font-bold text-gray-500 bg-white rounded-2xl border border-gray-100 outline-none focus:border-gray-200 focus:shadow-sm transition-all"
                                        placeholder="Add a note (optional)"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* Payment method toggle — card disabled for unregistered recipients */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                                    {selectedUser?.registered === false && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-xl border border-orange-100">
                                            <span className="text-orange-400 text-xs">ℹ</span>
                                            <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest">Wallet payment only for unregistered recipients</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'wallet', emoji: '💰', label: 'My Wallets', sub: 'Instant Transfer' },
                                            { key: 'card',   emoji: '💳', label: 'Saved Card',  sub: 'Card Network' },
                                        ].map(m => (
                                            <button
                                                key={m.key}
                                                onClick={() => {
                                                    if (m.key === 'card' && selectedUser?.registered === false) return;
                                                    setSelectedMethod(m.key as 'wallet' | 'card');
                                                }}
                                                disabled={m.key === 'card' && selectedUser?.registered === false}
                                                className={`relative p-5 rounded-[24px] border-2 transition-all duration-200 overflow-hidden text-left ${
                                                    m.key === 'card' && selectedUser?.registered === false
                                                        ? 'border-gray-50 bg-gray-50 text-gray-200 cursor-not-allowed opacity-40'
                                                        : selectedMethod === m.key
                                                            ? 'border-gray-900 bg-gray-900 text-white shadow-xl -translate-y-0.5'
                                                            : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                                                }`}
                                            >
                                                <span className="absolute -right-2 -bottom-2 text-3xl opacity-10">{m.emoji}</span>
                                                <p className="font-black text-sm uppercase tracking-widest">{m.label}</p>
                                                <p className={`text-[10px] font-bold mt-1 ${selectedMethod === m.key ? 'text-orange-400' : 'text-gray-300'}`}>{m.sub}</p>
                                            </button>
                                        ))}
                                    </div>

                                    {selectedMethod === 'wallet' ? (
                                        <div className="relative">
                                            <select
                                                className="w-full p-5 bg-white rounded-2xl border border-gray-100 outline-none font-black text-gray-800 appearance-none shadow-sm cursor-pointer"
                                                value={selectedWalletId}
                                                onChange={(e) => setSelectedWalletId(e.target.value)}
                                            >
                                                {wallets.map(w => (
                                                    <option key={w.id} value={w.id}>{w.currency} Wallet — Balance: {parseFloat(w.balance).toLocaleString()}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 font-black text-sm">∨</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {savedCards.length > 0 ? savedCards.map(card => (
                                                <button
                                                    key={card.id}
                                                    onClick={() => setSelectedCardId(card.id)}
                                                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                                                        selectedCardId === card.id
                                                            ? 'border-gray-900 bg-white shadow-md'
                                                            : 'border-gray-100 bg-white hover:border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm">
                                                            {card.card.brand}
                                                        </div>
                                                        <span className="font-black text-gray-800">•••• {card.card.last4}</span>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCardId === card.id ? 'border-green-500 bg-green-500' : 'border-gray-200'}`}>
                                                        {selectedCardId === card.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="p-5 bg-orange-50 border border-orange-100 rounded-[20px] text-orange-600 text-[11px] font-black flex items-center gap-3 uppercase tracking-wider">
                                                    <span className="text-xl">!</span> No saved payment methods.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* ── Bottom transparent action area ── */}
                                <div className="relative -mx-10 -mb-10 mt-2 px-10 pb-10 pt-6 bg-gradient-to-b from-transparent to-white/70 backdrop-blur-sm border-t border-gray-100/80 rounded-b-[40px]">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total to Deduct</p>
                                            <p className="text-3xl font-black text-gray-900 leading-none">
                                                {selectedCurrency === 'ZMW' ? 'K' : selectedCurrency === 'NGN' ? '₦' : '$'}
                                                {amount ? (parseFloat(amount) * 1.01).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Fee (1%)</p>
                                            <p className="text-sm font-black text-gray-400">
                                                +{selectedCurrency === 'ZMW' ? 'K' : selectedCurrency === 'NGN' ? '₦' : '$'}{(parseFloat(amount || '0') * 0.01).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black border border-red-100 mb-5">{error}</div>}

                                    <Button
                                        className="w-full py-5 text-lg font-black bg-gray-900 text-white rounded-[28px] shadow-xl hover:bg-orange-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30"
                                        onClick={handlePay}
                                        isLoading={isLoading}
                                        disabled={!amount || parseFloat(amount) <= 0 || (selectedMethod === 'card' && savedCards.length === 0)}
                                    >
                                        Authorize Transfer
                                    </Button>
                                    <p className="text-[10px] text-gray-300 font-extrabold mt-5 text-center uppercase tracking-[0.2em]">
                                        Secured by FlapaPay Encryption Protocol
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SUCCESS STEP */}
                        {step === 'SUCCESS' && successData && (
                            <div className="text-center py-6 animate-scale-in">

                                {/* ── Pending / Unregistered ── */}
                                {successData.pending ? (
                                    <>
                                        <div className="relative inline-block mb-8">
                                            <div className="w-28 h-28 bg-orange-500 rounded-[40px] flex items-center justify-center mx-auto shadow-xl ring-4 ring-orange-50">
                                                <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-white shadow-lg rounded-2xl flex items-center justify-center">✉️</div>
                                        </div>

                                        <h2 className="text-3xl font-black mb-2 tracking-tight text-gray-900">Payment Pending</h2>
                                        <p className="text-gray-400 font-bold text-sm mb-6">Waiting to be claimed</p>

                                        <div className="space-y-1 mb-8">
                                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Amount Held</p>
                                            <p className="text-5xl font-black text-gray-900">{successData.amount}</p>
                                        </div>

                                        <div className="bg-orange-50 border border-orange-100 p-6 rounded-[28px] mb-6 text-left space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recipient</p>
                                                <p className="font-black text-gray-900">{successData.recipientEmail}</p>
                                            </div>
                                            <div className="h-px bg-orange-100" />
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                                                    <p className="font-black text-orange-600 text-sm uppercase tracking-wide">Awaiting Claim</p>
                                                </div>
                                            </div>
                                            {successData.expiresAt && (
                                                <>
                                                    <div className="h-px bg-orange-100" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expires</p>
                                                        <p className="font-bold text-gray-700 text-sm">
                                                            {new Date(successData.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <p className="text-gray-400 text-xs font-bold mb-6 leading-relaxed">
                                            We emailed <span className="font-black text-gray-600">{successData.recipientEmail}</span> with a link to claim their funds. If unclaimed, you'll be fully refunded.
                                        </p>
                                    </>
                                ) : (
                                    /* ── Standard completed transfer ── */
                                    <>
                                        <div className="relative inline-block mb-8">
                                            <div className="w-28 h-28 bg-green-500 rounded-[40px] flex items-center justify-center mx-auto shadow-xl ring-4 ring-green-50">
                                                <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-white shadow-lg rounded-2xl flex items-center justify-center animate-bounce">✨</div>
                                        </div>

                                        <h2 className="text-4xl font-black mb-3 tracking-tight text-gray-900">Transfer Sent!</h2>
                                        <div className="space-y-1 mb-8">
                                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Amount</p>
                                            <p className="text-5xl font-black text-gray-900">{successData.amount}</p>
                                        </div>

                                        <div className="bg-white/60 backdrop-blur-sm border border-gray-100 p-8 rounded-[32px] mb-8 text-left shadow-sm">
                                            <div className="space-y-5">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recipient</p>
                                                    <p className="font-black text-gray-900 text-lg">{selectedUser?.full_name}</p>
                                                </div>
                                                <div className="h-px bg-gray-100" />
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transaction Ref</p>
                                                    <p className="font-mono text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm">{successData.reference}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex flex-col gap-3">
                                    <Button
                                        className="w-full h-14 rounded-[24px] font-black text-base bg-gray-900 text-white shadow-lg hover:-translate-y-0.5 hover:bg-orange-500 transition-all"
                                        onClick={() => { setStep('SEARCH'); setAmount(''); setSearchQuery(''); setSearchResults([]); setSelectedUser(null); navigate('/dashboard'); }}
                                    >Done</Button>
                                    {!successData.pending && (
                                        <button
                                            onClick={() => successData?.reference && window.open(`${API_BASE}/v1/transfers/${successData.reference}/pdf`, '_blank')}
                                            className="text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-700 transition-colors py-2 flex items-center justify-center gap-2 group"
                                        >
                                            <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download Receipt PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Back Option for Steps */}
                    {step === 'AMOUNT' && (
                        <button
                            onClick={() => setStep('SEARCH')}
                            className="mt-8 flex items-center gap-2 mx-auto text-gray-400 hover:text-black transition-colors font-black text-xs uppercase tracking-widest group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to recipient selection
                        </button>
                    )}
                </div>
                </div>
            </main>

            <PinApprovalModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                description={`Approve ${selectedUser?.registered === false ? 'pending payment' : 'transfer'} of ${selectedCurrency} ${amount} to ${selectedUser?.registered === false ? selectedUser?.email : selectedUser?.full_name}`}
            />
        </div>
    );
};
