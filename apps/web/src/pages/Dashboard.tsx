import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { useNotifications } from '../contexts/NotificationContext';
import ReactCountryFlag from 'react-country-flag';

interface Wallet {
    id: string;
    currency: string;
    balance: string;
}

interface Transaction {
    id: string;
    amount: string;
    currency: string;
    description: string;
    transaction_type: 'DEPOSIT' | 'TRANSFER' | 'WITHDRAWAL';
    created_at: string;
    transaction_reference: string;
    credit_wallet_id?: string;
    debit_wallet_id?: string;
    fee_amount?: string;
    funding_source_type?: string;
    funding_source_brand?: string;
    funding_source_last4?: string;
    deposit_operator?: string;
    deposit_provider?: string;
    withdrawal_provider?: string;
    withdrawal_destination_type?: string;
    withdrawal_destination_details?: string | {
        provider?: string;
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        phoneNumber?: string;
        country?: string;
    };
};

type TransactionBrandMeta = {
    label: string;
    src?: string;
    initials?: string;
    bgClass: string;
};

const BRAND_ASSET_MAP: Record<string, TransactionBrandMeta> = {
    mtn: { label: 'MTN MoMo', src: '/assets/images/MTN_Logo.svg', bgClass: 'bg-yellow-50' },
    airtel: { label: 'Airtel Money', src: '/assets/images/Airtel_Africa_logo.svg', bgClass: 'bg-red-50' },
    zamtel: { label: 'Zamtel Kwacha', src: '/assets/images/zamtel.png', bgClass: 'bg-green-50' },
    visa: { label: 'Visa', src: '/assets/images/visa02.svg', bgClass: 'bg-blue-50' },
    mastercard: { label: 'Mastercard', src: '/assets/images/mastercard.svg', bgClass: 'bg-orange-50' },
    'standard chartered': { label: 'Standard Chartered', src: '/assets/images/STANCHART.svg', bgClass: 'bg-blue-50' },
    stanchart: { label: 'Standard Chartered', src: '/assets/images/STANCHART.svg', bgClass: 'bg-blue-50' },
    'first alliance': { label: 'First Alliance', src: '/assets/images/firstalliance.svg', bgClass: 'bg-sky-50' },
    firstalliance: { label: 'First Alliance', src: '/assets/images/firstalliance.svg', bgClass: 'bg-sky-50' },
    'indo zambia': { label: 'Indo Zambia', src: '/assets/images/indozambiabank.png', bgClass: 'bg-cyan-50' },
    indozambia: { label: 'Indo Zambia', src: '/assets/images/indozambiabank.png', bgClass: 'bg-cyan-50' },
    'ab bank': { label: 'AB Bank', src: '/assets/images/AB_Bank_Logo-300x58.png', bgClass: 'bg-red-50' },
    abbank: { label: 'AB Bank', src: '/assets/images/AB_Bank_Logo-300x58.png', bgClass: 'bg-red-50' },
};

const toBrandKey = (value?: string) => String(value || '').trim().toLowerCase();

const parseWithdrawalDestinationDetails = (value: Transaction['withdrawal_destination_details']) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
};

const getTransactionBrandMeta = (tx: Transaction): TransactionBrandMeta | null => {
    const destinationDetails = parseWithdrawalDestinationDetails(tx.withdrawal_destination_details);
    const withdrawalProvider = toBrandKey(destinationDetails.provider);
    const withdrawalBankName = String(destinationDetails.bankName || '').trim();

    if (tx.transaction_type === 'WITHDRAWAL' && tx.withdrawal_destination_type === 'mobile_money') {
        const mobileMoneyCandidate = [withdrawalProvider, toBrandKey(tx.description)].find(Boolean);
        if (mobileMoneyCandidate) {
            const direct = BRAND_ASSET_MAP[mobileMoneyCandidate];
            if (direct) return direct;

            const partial = Object.entries(BRAND_ASSET_MAP).find(([key]) => mobileMoneyCandidate.includes(key));
            if (partial) return partial[1];
        }

        return { label: 'Mobile Money', initials: 'MM', bgClass: 'bg-emerald-100' };
    }

    if (tx.transaction_type === 'WITHDRAWAL' && tx.withdrawal_destination_type === 'bank_account') {
        const bankCandidate = toBrandKey(withdrawalBankName);
        if (bankCandidate) {
            const direct = BRAND_ASSET_MAP[bankCandidate];
            if (direct) return direct;

            const partial = Object.entries(BRAND_ASSET_MAP).find(([key]) => bankCandidate.includes(key));
            if (partial) return partial[1];

            return { label: withdrawalBankName, initials: 'BK', bgClass: 'bg-slate-100' };
        }

        return { label: 'Bank', initials: 'BK', bgClass: 'bg-slate-100' };
    }

    const candidates = [
        tx.deposit_operator,
        tx.funding_source_brand,
        tx.deposit_provider,
        tx.description
    ].map(toBrandKey).filter(Boolean);

    for (const candidate of candidates) {
        const direct = BRAND_ASSET_MAP[candidate];
        if (direct) return direct;

        const partial = Object.entries(BRAND_ASSET_MAP).find(([key]) => candidate.includes(key));
        if (partial) return partial[1];
    }

    const fundingType = toBrandKey(tx.funding_source_type);
    if (fundingType === 'bank' || tx.withdrawal_destination_type === 'bank_account') {
        return { label: 'Bank', initials: 'BK', bgClass: 'bg-slate-100' };
    }
    if (fundingType === 'mobile_money') {
        return { label: 'Mobile Money', initials: 'MM', bgClass: 'bg-emerald-100' };
    }
    if (fundingType === 'card') {
        return { label: 'Card', initials: 'CD', bgClass: 'bg-blue-100' };
    }

    return null;
};

const normalizeWallets = (payload: any): Wallet[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.wallets)) return payload.wallets;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const normalizeTransactions = (payload: any): Transaction[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.transactions)) return payload.transactions;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const formatTransactionDescription = (tx: Transaction) => {
    const raw = String(tx.description || '').trim();
    if (!raw) return 'Transaction processed successfully';

    const cleaned = raw.replace(/via PawaPay/gi, '').replace(/via Lenco/gi, '').trim();
    const mobileMoneyMatch = cleaned.match(/^Withdrawal to mobile_money \((.+)\)$/i);
    const bankMatch = cleaned.match(/^Withdrawal to bank_account \((.+)\)$/i);

    const toFriendlyWithdrawal = (jsonPayload: string, destinationLabel: string) => {
        try {
            const parsed = JSON.parse(jsonPayload);
            if (destinationLabel === 'mobile money') {
                const provider = String(parsed.provider || '').trim();
                const phoneNumber = String(parsed.phoneNumber || '').trim();
                const accountName = String(parsed.accountName || '').trim();
                return [
                    'Withdrawal to mobile money',
                    [provider ? provider.toUpperCase() : '', phoneNumber, accountName].filter(Boolean).join(' • ')
                ].filter(Boolean).join(' • ');
            }

            const bankName = String(parsed.bankName || '').trim();
            const accountName = String(parsed.accountName || '').trim();
            const accountNumber = String(parsed.accountNumber || '').trim();
            const maskedAccount = accountNumber ? `****${accountNumber.slice(-4)}` : '';
            return [
                'Withdrawal to bank account',
                [bankName, accountName, maskedAccount].filter(Boolean).join(' • ')
            ].filter(Boolean).join(' • ');
        } catch {
            return cleaned;
        }
    };

    if (mobileMoneyMatch) return toFriendlyWithdrawal(mobileMoneyMatch[1], 'mobile money');
    if (bankMatch) return toFriendlyWithdrawal(bankMatch[1], 'bank account');

    return cleaned;
};

export const Dashboard: React.FC = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingWallet, setIsAddingWallet] = useState(false);
    const [newCurrency, setNewCurrency] = useState('USD');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const fetchData = async () => {
        if (!token) return;

        try {
            const res = await api.get('/auth/me', {
                params: { _t: Date.now() },
                headers: {
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache',
                },
            });
            setWallets(normalizeWallets(res.data?.wallets ?? res.data));

            const txRes = await api.get('/transactions', {
                params: { _t: Date.now() },
                headers: {
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache',
                },
            });
            setTransactions(normalizeTransactions(txRes.data));
        } catch (error) {
            console.error('Failed to load dashboard data', error);
            if (axios.isAxiosError(error) && error.response?.status === 403) logout();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token, logout]); // Added logout to dependency array


    if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-gray-50">Loading...</div>;

    return (
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-100" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            {/* Mobile Header (TODO: Add toggle) */}

            <main className="flex-1 min-h-screen p-6 md:p-8 relative overflow-x-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/20 via-emerald-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <header className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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
                                onClick={() => navigate('/withdraw')}
                                className="flex flex-col items-center justify-center w-32 h-16 bg-emerald-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
                            >
                                <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-[10px] font-bold">Withdraw</span>
                            </button>
                            <button
                                onClick={() => navigate('/virtual-cards')}
                                className="flex flex-col items-center justify-center w-32 h-16 bg-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
                            >
                                <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <span className="text-[10px] font-bold">Virtual Card</span>
                            </button>

                            {/* Profile Square & Logout Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all duration-300 shadow-lg ${showUserMenu ? 'border-orange-500 scale-105 shadow-orange-500/20' : 'border-white/50 bg-white/10 hover:border-white shadow-sm hover:scale-105'}`}
                                >
                                    {user?.avatarUrl ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:3005'}${user.avatarUrl}`}
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

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
                        <button onClick={() => navigate('/send')} className="group p-6 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-2 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </div>
                            <span className="font-bold text-sm block">Send Money</span>
                        </button>
                        <button onClick={() => navigate('/add-money')} className="group p-6 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-2 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </div>
                            <span className="font-bold text-sm block">Add Money</span>
                        </button>
                        <button onClick={() => navigate('/request-funds')} className="group p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-2 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="font-bold text-sm block">Request Funds</span>
                        </button>
                        <button onClick={() => navigate('/link-card')} className="group p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-2 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            </div>
                            <span className="font-bold text-sm block">Link Cards</span>
                        </button>
                        <button onClick={() => navigate('/invoices')} className="group p-6 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-rose-500/30 transition-all duration-300 transform hover:-translate-y-2 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <span className="font-bold text-sm block">Invoices</span>
                        </button>
                    </div>

                    {/* FX Liquidity Pool Card */}
                    <div className="mb-12">
                        <div
                            onClick={() => navigate('/fx-pool')}
                            className="bg-emerald-50 border border-emerald-100 rounded-[40px] p-8 md:p-12 relative overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500"
                        >
                            {/* Ambient Glows */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 blur-[100px] -mr-48 -mt-48 group-hover:bg-emerald-400/20 transition-all duration-700"></div>

                            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white border border-emerald-100 mb-8 shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">New Feature</span>
                                    </div>
                                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
                                        FX Liquidity Pool
                                    </h2>
                                    <p className="text-lg font-medium text-gray-500 leading-relaxed mb-8 max-w-md">
                                        Swap between USD and ZMW instantly with real-time market rates and low spreads.
                                    </p>
                                    <button className="flex items-center gap-4 px-10 py-5 bg-emerald-600 text-white rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-600/20 group-hover:-translate-y-1 transition-all active:scale-95">
                                        Swap Funds Now
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="hidden md:flex items-center justify-center relative">
                                    <div className="relative w-full aspect-square max-w-[300px]">
                                        {/* Animated Currency Circles */}
                                        <div className="absolute top-0 left-1/2 -ml-10 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce duration-[3s]">
                                            <ReactCountryFlag countryCode="US" svg className="w-10 h-10 rounded-lg shadow-sm" />
                                        </div>
                                        <div className="absolute bottom-10 left-0 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce duration-[4s] delay-300">
                                            <ReactCountryFlag countryCode="ZM" svg className="w-10 h-10 rounded-lg shadow-sm" />
                                        </div>
                                        <div className="absolute bottom-10 right-0 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce duration-[3.5s] delay-700">
                                            <ReactCountryFlag countryCode="NG" svg className="w-10 h-10 rounded-lg shadow-sm" />
                                        </div>
                                        {/* Center Icon */}
                                        <div className="absolute inset-0 m-auto w-24 h-24 bg-emerald-500 rounded-3xl shadow-2xl flex items-center justify-center text-white transform rotate-12 transition-transform group-hover:rotate-0 duration-500">
                                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallets */}
                    <section className="mb-12">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Wallets</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {(() => {
                                const supportedCurrencies = ['USD', 'ZMW'];
                                const existingWallets = normalizeWallets(wallets).filter(wallet => supportedCurrencies.includes(wallet.currency));
                                const hasAllWallets = supportedCurrencies.every(currency => 
                                    existingWallets.some(wallet => wallet.currency === currency)
                                );

                                return (
                                    <>
                                        {existingWallets.map((wallet) => {
                                            // Determine background class based on currency
                                            let bgClass = "bg-white border-gray-100";
                                            let textClass = "text-gray-900";
                                            let labelClass = "text-gray-500";
                                            let iconBg = "bg-gray-50 text-gray-700";
                                            let subText = "text-gray-900";
                                            let countryCode = 'US';

                                            if (wallet.currency === 'USD') {
                                                bgClass = "bg-gradient-to-br from-yellow-400 to-orange-500 border-none text-white shadow-lg shadow-orange-500/20";
                                                textClass = "text-white";
                                                labelClass = "text-yellow-100";
                                                iconBg = "bg-white/20 text-white";
                                                subText = "text-white";
                                                countryCode = 'US';
                                            } else if (wallet.currency === 'ZMW') {
                                                bgClass = "bg-gradient-to-br from-emerald-400 to-green-600 border-none text-white shadow-lg shadow-emerald-500/20";
                                                textClass = "text-white";
                                                labelClass = "text-emerald-100";
                                                iconBg = "bg-white/20 text-white";
                                                subText = "text-white";
                                                countryCode = 'ZM';
                                            }

                                            return (
                                                <div key={wallet.id} className={`${bgClass} rounded-2xl p-4 shadow-md relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <span className={`text-4xl font-bold ${textClass}`}>{wallet.currency}</span>
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center font-bold overflow-hidden shadow-sm`}>
                                                                <ReactCountryFlag countryCode={countryCode} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                            <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold">Active</div>
                                                        </div>
                                                        <div className="mb-4">
                                                            <p className={`text-xs ${labelClass} font-medium`}>Available Balance</p>
                                                            <p className={`text-2xl font-extrabold ${subText} mt-1`}>{parseFloat(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-normal opacity-80">{wallet.currency}</span></p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            <button onClick={() => navigate('/add-money')} className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                                                                Add Funds
                                                            </button>
                                                            <button onClick={() => navigate('/send')} className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                                                                Transfer
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Add Wallet Card - Only show if not all wallets exist */}
                                        {!hasAllWallets && (
                                            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center min-h-[200px] hover:border-gray-300 hover:bg-gray-100 transition-all shadow-sm">
                                                {isAddingWallet ? (
                                                    <div className="w-full max-w-[180px] animate-fade-in">
                                                        <label className="text-xs font-bold text-gray-700 mb-2 block">Select Currency</label>
                                                        <select
                                                            className="block w-full rounded-lg border-gray-200 py-2 px-3 mb-3 text-xs bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none shadow-sm"
                                                            value={newCurrency}
                                                            onChange={(e) => setNewCurrency(e.target.value)}
                                                        >
                                                            {supportedCurrencies
                                                                .filter(currency => !existingWallets.some(wallet => wallet.currency === currency))
                                                                .map(currency => (
                                                                    <option key={currency} value={currency}>
                                                                        {currency === 'USD' && 'USD (US Dollar)'}
                                                                        {currency === 'ZMW' && 'ZMW (Zambian Kwacha)'}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                        <div className="flex gap-2">
                                                            <Button className="flex-1 bg-black text-white" size="sm" onClick={async () => {
                                                                try {
                                                                    await axios.post('http://localhost:3005/wallets', { currency: newCurrency }, {
                                                                        headers: { Authorization: `Bearer ${token}` }
                                                                    });
                                                                    window.location.reload();
                                                                } catch (e) { alert('Failed/Exists'); }
                                                            }}>Add</Button>
                                                            <Button className="flex-1" size="sm" variant="ghost" onClick={() => setIsAddingWallet(false)}>Cancel</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setIsAddingWallet(true)} className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition-colors">
                                                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 text-xl">+</div>
                                                        <span className="text-sm font-bold">Add Wallet</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </section>

                    {/* Recent Transactions */}
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                            <button 
                                onClick={() => navigate('/transactions')}
                                className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors group"
                            >
                                View All
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                            {transactions.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                    <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    <p>No transactions yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {normalizeTransactions(transactions).map((tx) => {
                                        const isCredit = wallets.some(w => w.id === tx.credit_wallet_id);
                                        const isDebit = wallets.some(w => w.id === tx.debit_wallet_id);
                                        const isInflow = isCredit && !isDebit;
                                        const brandMeta = getTransactionBrandMeta(tx);

                                        // Default to DEPOSIT logic if unsure
                                        const finalIsInflow = tx.transaction_type === 'DEPOSIT' || isInflow;

                                        return (
                                            <div
                                                key={tx.id}
                                                onClick={() => setSelectedTx(tx)}
                                                className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center ${brandMeta?.bgClass || 'bg-gray-50'}`}>
                                                        {brandMeta?.src ? (
                                                            <img src={brandMeta.src} alt={brandMeta.label} className="w-full h-full object-contain p-1.5" />
                                                        ) : (
                                                            <span className={`text-xs font-black ${finalIsInflow ? 'text-green-600' : 'text-red-500'}`}>
                                                                {brandMeta?.initials || (finalIsInflow ? 'IN' : 'OUT')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-gray-900 text-base">
                                                                {tx.transaction_type === 'DEPOSIT' ? 'Money Added' :
                                                                    finalIsInflow ? 'Payment Received' : 'Payment Sent'}
                                                            </p>
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider">
                                                                {tx.transaction_type}
                                                            </span>
                                                            {brandMeta && (
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                                                    {brandMeta.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 font-medium mt-0.5 line-clamp-1">
                                                            {formatTransactionDescription(tx)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-[11px] text-gray-400 font-medium">
                                                                {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(tx.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                            <span className="text-[11px] text-gray-300">•</span>
                                                            <span className="text-[11px] font-mono text-gray-400 uppercase">Ref: {tx.transaction_reference?.slice(0, 8)}...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-bold text-lg ${finalIsInflow ? 'text-green-600' : 'text-red-500'}`}>
                                                        {finalIsInflow ? '+' : '-'}{parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="flex justify-end gap-1 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tx.currency}</span>
                                                        <span className={`text-[10px] font-bold ${finalIsInflow ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-2 py-0.5 rounded-full`}>
                                                            {finalIsInflow ? 'Received' : 'Sent'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden transform animate-slide-up">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
                                <button
                                    onClick={() => setSelectedTx(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center mb-10">
                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 ${wallets.some(w => w.id === selectedTx.credit_wallet_id) && !wallets.some(w => w.id === selectedTx.debit_wallet_id)
                                    ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {wallets.some(w => w.id === selectedTx.credit_wallet_id) && !wallets.some(w => w.id === selectedTx.debit_wallet_id) ? (
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                    ) : (
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    )}
                                </div>
                                <h4 className="text-3xl font-extrabold text-gray-900">
                                    {wallets.some(w => w.id === selectedTx.credit_wallet_id) && !wallets.some(w => w.id === selectedTx.debit_wallet_id) ? '+' : '-'}
                                    {parseFloat(selectedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedTx.currency}
                                </h4>
                                <p className="text-emerald-500 font-bold text-sm mt-2 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Completed Successfully
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-400 font-medium">Type</span>
                                    <span className="font-bold text-gray-900 capitalize">{selectedTx.transaction_type.toLowerCase()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-400 font-medium">Date</span>
                                    <span className="font-bold text-gray-900">{new Date(selectedTx.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-400 font-medium">Reference</span>
                                    <span className="font-mono font-bold text-gray-900 uppercase">{selectedTx.transaction_reference}</span>
                                </div>
                                {selectedTx.fee_amount && (
                                    <div className="flex justify-between items-center text-sm py-1 p-3 bg-red-50 rounded-xl border border-red-100/50 mt-2">
                                        <span className="text-red-500 font-bold">Platform Fee</span>
                                        <span className="font-bold text-red-600">{selectedTx.currency} {parseFloat(selectedTx.fee_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-50">
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Description</span>
                                    <p className="text-gray-900 font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        {formatTransactionDescription(selectedTx)}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedTx(null)}
                                className="w-full mt-10 py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
