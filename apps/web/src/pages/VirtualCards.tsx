import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import {
    Eye, EyeOff, Lock, Unlock, Plus, Minus,
    Layers, CreditCard, Coins
} from 'lucide-react';
import { PinApprovalModal } from '../components/ui/PinApprovalModal';

interface VirtualCard {
    id: string;
    last4: string;
    brand: string;
    status: string;
    amount: string;
    currency: string;
    expiry_month: string;
    expiry_year: string;
}

interface CardDetails {
    pan: string;
    cvv: string;
    expiry: string;
}

interface Wallet {
    id: string;
    currency: string;
    balance: string;
}

export const VirtualCards: React.FC = () => {
    const { token, user } = useAuth();
    const [cards, setCards] = useState<VirtualCard[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFundModal, setShowFundModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
    const [amount, setAmount] = useState('');
    const [cardCurrency, setCardCurrency] = useState('USD');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pendingRevealCardId, setPendingRevealCardId] = useState<string | null>(null);

    // Details state
    const [revealedDetails, setRevealedDetails] = useState<Record<string, CardDetails>>({});

    useEffect(() => {
        fetchCards();
        fetchWallets();
    }, [token]);

    const fetchCards = async () => {
        try {
            const res = await api.get('/v1/issuing/cards');
            setCards(res.data || []);
        } catch (error) {
            console.error('Failed to fetch cards', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWallets = async () => {
        try {
            const res = await api.get('/wallets');
            setWallets(res.data || []);
        } catch (error) {
            console.error('Failed to fetch wallets', error);
        }
    };

    const handleCreateCard = async () => {
        setIsCreating(true);
        try {
            await api.post('/v1/issuing/cards', {
                amount: Number(amount),
                currency: cardCurrency
            });
            setShowCreateModal(false);
            setAmount('');
            fetchCards();
            fetchWallets();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create card');
        } finally {
            setIsCreating(false);
        }
    };

    const handleFundCard = async () => {
        if (!selectedCard) return;
        setIsActionLoading(true);
        try {
            await api.post(`/v1/issuing/cards/${selectedCard.id}/fund`, {
                amount: Number(amount)
            });
            setShowFundModal(false);
            setAmount('');
            fetchCards();
            fetchWallets();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to fund card');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleWithdrawFunds = async () => {
        if (!selectedCard) return;
        setIsActionLoading(true);
        try {
            await api.post(`/v1/issuing/cards/${selectedCard.id}/refund`, {
                amount: Number(amount)
            });
            setShowWithdrawModal(false);
            setAmount('');
            fetchCards();
            fetchWallets();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to withdraw funds');
        } finally {
            setIsActionLoading(false);
        }
    };

    const toggleCardStatus = async (card: VirtualCard) => {
        const newStatus = card.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        try {
            await api.patch(`/v1/issuing/cards/${card.id}/status`, { status: newStatus });
            setCards(cards.map(c => c.id === card.id ? { ...c, status: newStatus } : c));
        } catch (error) {
            alert('Failed to update card status');
        }
    };

    const revealDetails = async (cardId: string) => {
        if (revealedDetails[cardId]) {
            const newRevealed = { ...revealedDetails };
            delete newRevealed[cardId];
            setRevealedDetails(newRevealed);
            return;
        }

        setPendingRevealCardId(cardId);
        setIsPinModalOpen(true);
    };

    const handlePinSuccess = async (pin: string) => {
        if (!pendingRevealCardId) return;

        try {
            const res = await api.post(`/v1/issuing/cards/${pendingRevealCardId}/details`, { pin });
            setRevealedDetails({ ...revealedDetails, [pendingRevealCardId]: res.data });
        } catch (error: any) {
            throw error; // Let PinApprovalModal handle error
        } finally {
            setPendingRevealCardId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <div className="hidden md:block w-72 shrink-0">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Virtual Cards</h1>
                        <p className="text-gray-500 mt-1 uppercase tracking-widest text-[10px] font-bold">Manage your digital payment methods</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex flex-col items-end leading-none">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issuance Fee</span>
                            <span className="text-orange-600 font-black mt-1">$0.50 USD</span>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="group px-6 py-4 bg-black text-white rounded-[20px] font-bold shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center gap-3 overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Plus className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Issue New Card</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-[300px] bg-white rounded-[40px] animate-pulse border border-gray-100 shadow-sm"></div>
                        ))
                    ) : cards.length === 0 ? (
                        <div className="col-span-full py-24 bg-white rounded-[48px] border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-6">
                                <CreditCard size={48} strokeWidth={1} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Cards Issued</h2>
                            <p className="text-gray-500 max-w-sm mb-10">Get a USD or ZMW virtual card instantly to pay on Amazon, Netflix, or any global merchant.</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg hover:bg-orange-700 transition-all active:scale-95"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        cards.map(card => {
                            const isRevealed = !!revealedDetails[card.id];
                            const details = revealedDetails[card.id];

                            return (
                                <div key={card.id} className="group flex flex-col gap-4">
                                    {/* Card Visual */}
                                    <div className={`relative h-[260px] w-full rounded-[32px] overflow-hidden p-8 flex flex-col justify-between shadow-2xl transition-all ${card.status === 'ACTIVE' ? 'bg-black' : 'bg-gray-900 opacity-80'}`}>

                                        {/* Top Row: Logos */}
                                        <div className="flex justify-between items-start z-10 relative">
                                            {/* FlapaPay Logo (Top Left) */}
                                            <img src="/assets/images/flapapaylogoicon.png" className="h-16 w-16 object-contain" alt="FlapaPay" />

                                            <div className="flex items-center gap-4">
                                                {/* Eye Toggle */}
                                                <button
                                                    onClick={() => revealDetails(card.id)}
                                                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md transition-colors text-white"
                                                >
                                                    {isRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>

                                                {/* Mastercard Logo (Top Right) */}
                                                <img src="/assets/images/mastercard.svg" className="h-14 w-14 object-contain" alt="Mastercard" />
                                            </div>
                                        </div>

                                        {/* Middle: Card Number */}
                                        <div className="mt-2 z-10 relative">
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3 leading-none">Card Number</p>
                                            <p className="text-2xl font-mono tracking-[0.15em] font-bold text-white drop-shadow-md">
                                                {isRevealed ? (
                                                    // Show full number with spacing
                                                    (details?.pan || '0000000000000000').replace(/(.{4})/g, '$1 ').trim()
                                                ) : (
                                                    // Masked version
                                                    `**** **** **** ${card.last4}`
                                                )}
                                            </p>
                                        </div>

                                        {/* Bottom Row: Expiry, CVV, Balance */}
                                        <div className="flex justify-between items-end z-10 relative">
                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1 leading-none">Card Holder</p>
                                                    <p className="text-white text-sm font-black uppercase tracking-widest">{user?.fullName || 'FlapaPay User'}</p>
                                                </div>
                                                <div className="flex gap-10">
                                                    <div>
                                                        <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Expiry</p>
                                                        <p className="text-white text-base font-bold tracking-widest font-mono">
                                                            {isRevealed ? details?.expiry : `${card.expiry_month}/${card.expiry_year}`}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">CVV</p>
                                                        <p className="text-white text-base font-bold tracking-[0.2em] font-mono">
                                                            {isRevealed ? details?.cvv : '***'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Balance</p>
                                                <p className="text-2xl font-black text-white">{card.currency} {Number(card.amount).toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {/* Glass Overlay for Status (if blocked) */}
                                        {card.status !== 'ACTIVE' && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                                                <div className="bg-red-500 h-10 px-6 rounded-full flex items-center gap-2 shadow-2xl border border-red-400">
                                                    <Lock size={16} className="text-white" />
                                                    <span className="text-white text-xs font-black uppercase tracking-widest">{card.status}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Tray */}
                                    <div className="grid grid-cols-3 gap-2 px-2">
                                        <button
                                            onClick={() => { setSelectedCard(card); setShowFundModal(true); }}
                                            disabled={card.status !== 'ACTIVE'}
                                            className="h-12 bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md hover:border-orange-200 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Plus className="text-orange-600" size={16} />
                                            <span className="text-[9px] font-bold uppercase text-gray-500">Fund</span>
                                        </button>
                                        <button
                                            onClick={() => { setSelectedCard(card); setShowWithdrawModal(true); }}
                                            disabled={card.status !== 'ACTIVE' || Number(card.amount) <= 0}
                                            className="h-12 bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md hover:border-blue-200 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Minus className="text-blue-600" size={16} />
                                            <span className="text-[9px] font-bold uppercase text-gray-500">Refund</span>
                                        </button>
                                        <button
                                            onClick={() => toggleCardStatus(card)}
                                            className={`h-12 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md transition-all active:scale-95 ${card.status === 'ACTIVE' ? 'bg-white border border-gray-100' : 'bg-green-500 text-white border-transparent'}`}
                                        >
                                            {card.status === 'ACTIVE' ? <Lock className="text-red-500" size={16} /> : <Unlock size={16} />}
                                            <span className={`text-[9px] font-bold uppercase ${card.status === 'ACTIVE' ? 'text-gray-500' : 'text-white'}`}>
                                                {card.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Create Card Modal - Redesigned */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-orange-950/90 backdrop-blur-md animate-in fade-in duration-500"></div>
                    
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    </div>

                    <div className="relative z-10 w-full max-w-lg animate-in zoom-in-95 duration-500">
                        <div className="bg-white/95 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-white/20">
                            {/* Header with gradient border top */}
                            <div className="relative">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500"></div>
                                
                                <div className="p-8 pb-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                                <Layers size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">New Virtual Card</h2>
                                                <p className="text-sm text-gray-500">Powered by Mastercard</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                        >
                                            <Minus size={20} className="text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Feature badges */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                            Zero Monthly Fees
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                            Instant Activation
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                            Global Acceptance
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-8 pb-8">
                                {/* Currency Selection */}
                                <div className="mb-6">
                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 block">
                                        Choose Currency
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['USD', 'ZMW'].map((curr, idx) => (
                                            <button
                                                key={curr}
                                                onClick={() => setCardCurrency(curr)}
                                                className={`group relative py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 border-2 ${
                                                    cardCurrency === curr
                                                        ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>{curr}</span>
                                                    {idx === 0 && (
                                                        <span className={`text-xs ${cardCurrency === curr ? 'text-orange-100' : 'text-gray-400'}`}>
                                                            🇺🇸
                                                        </span>
                                                    )}
                                                    {idx === 1 && (
                                                        <span className={`text-xs ${cardCurrency === curr ? 'text-orange-100' : 'text-gray-400'}`}>
                                                            🇿🇲
                                                        </span>
                                                    )}
                                                </div>
                                                {cardCurrency === curr && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="mb-4">
                                    <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">
                                        Initial Amount
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold transition-colors duration-300 ${
                                            amount ? 'text-gray-900' : 'text-gray-300'
                                        }`}>
                                            {cardCurrency === 'USD' ? '$' : 'K'}
                                        </div>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-16 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xl font-bold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none placeholder:text-gray-300"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                                {cardCurrency}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-1.5 text-[10px] text-gray-500 flex items-center gap-1">
                                        <div className="w-0.5 h-0.5 bg-orange-500 rounded-full"></div>
                                        Funds deducted from your {cardCurrency} wallet
                                    </p>
                                </div>

                                {/* Fee Summary Card */}
                                <div className="mb-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                <CreditCard size={14} className="text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-700">Issuance Fee</p>
                                                <p className="text-[10px] text-gray-500">One-time charge</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-orange-600">
                                                {cardCurrency === 'USD' ? '$0.50' : 'K12.50'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Cost Card - Premium Style */}
                                <div className="mb-5 p-4 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[10px] font-medium text-orange-100">Total Cost</p>
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 rounded-full">
                                                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                                                <span className="text-[10px] font-semibold">All-inclusive</span>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold">
                                                {cardCurrency === 'USD' ? '$' : 'K'}
                                            </span>
                                            <span className="text-2xl font-bold">
                                                {(Number(amount || 0) + (cardCurrency === 'USD' ? 0.5 : 12.5)).toLocaleString(undefined, { 
                                                    minimumFractionDigits: 2, 
                                                    maximumFractionDigits: 2 
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={isCreating}
                                        className="flex-1 py-4 px-6 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateCard}
                                        disabled={!amount || Number(amount) <= 0 || isCreating}
                                        className="flex-[2] py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                                    <Plus size={18} strokeWidth={3} />
                                                </div>
                                                <span>Issue Card</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fund Modal - Redesigned */}
            {showFundModal && selectedCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-orange-950/70 to-black/80 backdrop-blur-md animate-in fade-in duration-500"></div>
                    
                    <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-500">
                        <div className="bg-white/95 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-white/20">
                            {/* Header */}
                            <div className="relative p-8 pb-6 border-b border-gray-100">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                                            <Plus size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Add Funds</h2>
                                            <p className="text-sm text-gray-500">Card ending •••• {selectedCard.last4}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowFundModal(false)}
                                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                    >
                                        <Minus size={20} className="text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                {/* Wallet Balance Card */}
                                <div className="mb-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <Coins size={18} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Available Balance</p>
                                                <p className="text-xs text-gray-500">{selectedCard.currency} Wallet</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {wallets.filter(w => w.currency === selectedCard.currency).map(w => (
                                                <p key={w.id} className="text-xl font-bold text-green-700">
                                                    {selectedCard.currency} {Number(w.balance).toFixed(2)}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-1 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full overflow-hidden">
                                        <div className="h-full w-3/4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="mb-8">
                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 block">
                                        Enter Amount
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold transition-colors ${
                                            amount ? 'text-gray-900' : 'text-gray-300'
                                        }`}>
                                            {selectedCard.currency === 'USD' ? '$' : 'K'}
                                        </div>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-16 pr-20 py-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-3xl font-bold focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none placeholder:text-gray-300"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                                                {selectedCard.currency}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Amount Buttons */}
                                <div className="mb-6 grid grid-cols-4 gap-2">
                                    {[10, 50, 100, 200].map((quickAmount) => (
                                        <button
                                            key={quickAmount}
                                            onClick={() => setAmount(quickAmount.toString())}
                                            className="py-3 px-2 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl text-sm font-bold text-gray-600 hover:text-green-700 transition-all"
                                        >
                                            +{quickAmount}
                                        </button>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowFundModal(false)}
                                        className="flex-1 py-4 px-6 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleFundCard}
                                        disabled={!amount || isActionLoading}
                                        className="flex-[2] py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        {isActionLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                                    <Plus size={18} strokeWidth={3} />
                                                </div>
                                                <span>Add Funds</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal - Redesigned */}
            {showWithdrawModal && selectedCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-blue-950/70 to-black/80 backdrop-blur-md animate-in fade-in duration-500"></div>
                    
                    <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-500">
                        <div className="bg-white/95 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-white/20">
                            {/* Header */}
                            <div className="relative p-8 pb-6 border-b border-gray-100">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                            <Minus size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
                                            <p className="text-sm text-gray-500">Card ending •••• {selectedCard.last4}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowWithdrawModal(false)}
                                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                    >
                                        <Minus size={20} className="text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                {/* Card Balance Card */}
                                <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <CreditCard size={18} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Card Balance</p>
                                                <p className="text-xs text-gray-500">Available to withdraw</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-blue-700">
                                                {selectedCard.currency} {Number(selectedCard.amount).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="mb-6">
                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 block">
                                        Withdrawal Amount
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold transition-colors ${
                                            amount ? 'text-gray-900' : 'text-gray-300'
                                        }`}>
                                            {selectedCard.currency === 'USD' ? '$' : 'K'}
                                        </div>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-16 pr-20 py-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-3xl font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none placeholder:text-gray-300"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                                                {selectedCard.currency}
                                            </span>
                                        </div>
                                    </div>
                                    {amount && Number(amount) > Number(selectedCard.amount) && (
                                        <p className="mt-2 text-xs text-red-500 font-semibold flex items-center gap-1">
                                            <span>⚠️</span> Amount exceeds card balance
                                        </p>
                                    )}
                                </div>

                                {/* Quick Amount Buttons */}
                                <div className="mb-6 grid grid-cols-4 gap-2">
                                    {['25%', '50%', '75%', 'MAX'].map((percentage, idx) => {
                                        const calcAmount = percentage === 'MAX' 
                                            ? Number(selectedCard.amount)
                                            : Number(selectedCard.amount) * (idx + 1) * 0.25;
                                        return (
                                            <button
                                                key={percentage}
                                                onClick={() => setAmount(calcAmount.toFixed(2))}
                                                className="py-3 px-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl text-sm font-bold text-gray-600 hover:text-blue-700 transition-all"
                                            >
                                                {percentage}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Destination Info */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                            <Coins size={16} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-gray-600">Destination</p>
                                            <p className="text-sm font-bold text-gray-900">{selectedCard.currency} Wallet</p>
                                        </div>
                                        <div className="text-xs text-gray-500">Instant transfer</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowWithdrawModal(false)}
                                        className="flex-1 py-4 px-6 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleWithdrawFunds}
                                        disabled={!amount || Number(amount) > Number(selectedCard.amount) || isActionLoading}
                                        className="flex-[2] py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        {isActionLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                                    <Minus size={18} strokeWidth={3} />
                                                </div>
                                                <span>Withdraw</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PinApprovalModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                title="Security Verification"
                description="Enter your 4-digit security PIN to view sensitive card details."
            />
        </div>
    );
};
