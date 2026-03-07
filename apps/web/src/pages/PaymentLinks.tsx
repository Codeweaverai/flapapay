import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/axios';

interface Wallet {
    id: string;
    currency: string;
    balance: string;
}

interface PaymentLink {
    id: string;
    title: string;
    amount: string;
    currency: string;
    url: string;
    active: boolean;
    views: number;
    payments: number;
}

export const PaymentLinks: React.FC = () => {
    const { user } = useAuth();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

    // Form State
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [targetWalletId, setTargetWalletId] = useState('');
    const [acceptCard, setAcceptCard] = useState(true);
    const [acceptMobileMoney, setAcceptMobileMoney] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Real Data State
    const [links, setLinks] = useState<PaymentLink[]>([]);

    const fetchLinks = async () => {
        try {
            const res = await api.get('/payment-links');
            // Backend returns full objects, map to UI interface if needed
            // Assuming DB structure matches for now, except adding `url` client-side
            const mappedLinks = res.data.map((l: any) => ({
                ...l,
                url: `${window.location.origin}/pay/${l.id}`,
                payments: l.payments_count || 0
            }));
            setLinks(mappedLinks);
        } catch (error) {
            console.error('Failed to fetch links', error);
        }
    };

    useEffect(() => {
        const fetchWallets = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.wallets) {
                    setWallets(res.data.wallets);
                    if (res.data.wallets.length > 0) {
                        setTargetWalletId(res.data.wallets[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to load wallets');
            }
        };
        fetchWallets();
        fetchLinks();
    }, []);

    const handleCreateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const payload = {
                title,
                amount,
                currency,
                wallet_id: targetWalletId,
                allows_mobile_money: acceptMobileMoney,
                allows_card: acceptCard
            };

            await api.post('/payment-links', payload);

            // Refresh list and reset
            await fetchLinks();
            setActiveTab('manage');
            setTitle('');
            setAmount('');
            alert('Payment Link Created Successfully!');
        } catch (error) {
            console.error('Failed to create link', error);
            alert('Failed to create payment link. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <div className="hidden md:block w-72 shrink-0">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Payment Links</h1>
                        <p className="text-gray-500 mt-1">Create and manage shareable payment pages.</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Create New
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manage' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Manage Links
                        </button>
                    </div>
                </header>

                <div className="max-w-5xl mx-auto">
                    {activeTab === 'create' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Configuration Form */}
                            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-slide-up">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Link Configuration</h2>
                                <form onSubmit={handleCreateLink} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Product or Service Name</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Web Design Service"
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Amount</label>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                                            <select
                                                value={currency}
                                                onChange={(e) => {
                                                    setCurrency(e.target.value);
                                                    // Auto-select corresponding wallet
                                                    const matchingWallet = wallets.find(w => w.currency === e.target.value);
                                                    if (matchingWallet) setTargetWalletId(matchingWallet.id);
                                                }}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium appearance-none"
                                            >
                                                <option value="USD">USD</option>
                                                <option value="ZMW">ZMW</option>
                                                <option value="NGN">NGN</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Receive Funds Into</label>
                                        <select
                                            value={targetWalletId}
                                            onChange={(e) => setTargetWalletId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                        >
                                            {wallets.map(w => (
                                                <option key={w.id} value={w.id}>{w.currency} Wallet - Balance: {parseFloat(w.balance).toLocaleString()} {w.currency}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-50">
                                        <label className="block text-sm font-bold text-gray-700">Accepted Payment Methods</label>

                                        <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${acceptCard ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`} onClick={() => setAcceptCard(!acceptCard)}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center p-2">
                                                    <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.894-1.352 2.054-1.352 2.022 0 3.264.717 3.394.81l.732-4.22c-.524-.266-1.58-.69-3.05-.69-2.924 0-4.99 1.558-4.999 3.793-.01 1.646 1.47 2.569 2.59 3.116 1.152.566 1.54 .932 1.54 1.439 0 .776-1.026 1.135-1.97 1.135-1.66 0-3.76-.73-3.86-.76l-.76 4.3c.69.317 1.956.593 3.256.593 3.273 0 5.4-1.613 5.385-4.102.003-1.368-.82-2.42-2.58-3.09z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Credit/Debit Card</p>
                                                    <p className="text-xs text-gray-500">Processed securely via Stripe</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${acceptCard ? 'border-black bg-black' : 'border-gray-300'}`}>
                                                {acceptCard && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${acceptMobileMoney ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`} onClick={() => setAcceptMobileMoney(!acceptMobileMoney)}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center p-2">
                                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Mobile Money</p>
                                                    <p className="text-xs text-gray-500">Processed via PawaPay</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${acceptMobileMoney ? 'border-black bg-black' : 'border-gray-300'}`}>
                                                {acceptMobileMoney && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isCreating ? (
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : 'Generate Payment Link'}
                                    </button>
                                </form>
                            </div>

                            {/* Preview Card */}
                            <div className="flex flex-col items-center justify-center">
                                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-6">Preview Checkout Experience</h3>
                                <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 transform transition-all hover:scale-[1.02]">
                                    <div className="bg-black/5 p-8 text-center relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-pink-500"></div>
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-md mx-auto flex items-center justify-center mb-4">
                                            <img src="/assets/images/flapapaylogoicon.png" alt="Logo" className="w-10 h-10 object-contain" />
                                        </div>
                                        <p className="text-gray-500 text-sm font-medium mb-1">Pay to {user?.fullName || 'Business Name'}</p>
                                        <h3 className="text-gray-900 font-bold text-xl">{title || 'Product Name'}</h3>
                                    </div>
                                    <div className="p-8">
                                        <div className="text-center mb-8">
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Total Amount</p>
                                            <div className="text-4xl font-extrabold text-gray-900 flex items-start justify-center gap-1">
                                                <span className="text-lg mt-1 text-gray-400">{currency}</span>
                                                {amount || '0.00'}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-90">
                                                <span>Pay with</span>
                                                {acceptCard && !acceptMobileMoney && 'Card'}
                                                {acceptMobileMoney && !acceptCard && 'Mobile Money'}
                                                {acceptCard && acceptMobileMoney && 'Card or Mobile Money'}
                                                {!acceptCard && !acceptMobileMoney && '...'}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                    Secured by FlapaPay
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Manage Links Tab
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {links.map(link => (
                                    <div key={link.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{link.title}</h3>
                                                <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1 mt-1">
                                                    {link.url}
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                            </div>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${link.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                                                <p className="text-xs text-gray-500 font-bold uppercase">Price</p>
                                                <p className="text-gray-900 font-bold">{link.currency} {link.amount}</p>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                                                <p className="text-xs text-gray-500 font-bold uppercase">Views</p>
                                                <p className="text-gray-900 font-bold">{link.views}</p>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                                                <p className="text-xs text-gray-500 font-bold uppercase">Paid</p>
                                                <p className="text-gray-900 font-bold">{link.payments}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(link.url);
                                                    alert('Link copied!');
                                                }}
                                                className="flex-1 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-sm hover:shadow active:scale-95 transition-all"
                                            >
                                                Copy Link
                                            </button>
                                            <button className="px-4 py-2 bg-gray-100 text-red-500 rounded-xl text-sm font-bold hover:bg-gray-200 active:scale-95 transition-all">
                                                Deactivate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
