import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { Button } from '../components/ui/Button';

export const CreateEscrow: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [wallets, setWallets] = useState<any[]>([]);
    const [cards, setCards] = useState<any[]>([]);

    // UI State
    const [selectedFundingType, setSelectedFundingType] = useState<'wallet' | 'card'>('wallet');
    const [selectedCardId, setSelectedCardId] = useState<string>('');

    const [formData, setFormData] = useState({
        sellerEmail: '',
        amount: '',
        currency: 'ZMW',
        description: '',
        instructions: '',
        deliveryTimeframe: '7',
        inspectionPeriod: '3'
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch Wallets
                const walletRes = await api.get('/wallets');
                setWallets(walletRes.data);

                // Fetch Linked Cards
                try {
                    const cardRes = await api.get('/payments/methods');
                    const fetchedCards = cardRes.data.methods || [];
                    setCards(fetchedCards);
                    if (fetchedCards.length > 0) {
                        setSelectedCardId(fetchedCards[0].id);
                    }
                } catch (cardErr) {
                    console.log('No cards found or failed to fetch cards', cardErr);
                }

            } catch (err) {
                console.error('Failed to fetch initial data:', err);
            }
        };
        fetchInitialData();
    }, []);

    const selectedWallet = wallets.find(w => w.currency === formData.currency);
    const availableBalance = selectedWallet ? parseFloat(selectedWallet.balance) : 0;
    const isInsufficient = selectedFundingType === 'wallet' && parseFloat(formData.amount || '0') > availableBalance;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isInsufficient) {
            alert('Insufficient funds in your wallet. Please top up or select a linked card.');
            return;
        }
        if (selectedFundingType === 'card' && !selectedCardId) {
            alert('Please select a linked card or use your wallet.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create the Escrow
            const createRes = await api.post('/escrows/create', {
                ...formData,
                amount: parseFloat(formData.amount),
                deliveryTimeframe: parseInt(formData.deliveryTimeframe),
                inspectionPeriod: parseInt(formData.inspectionPeriod)
            });

            const escrowId = createRes.data.id;

            // 2. Fund the Escrow immediately based on selected source
            try {
                await api.post(`/escrows/${escrowId}/fund`, {
                    source: selectedFundingType,
                    paymentMethodId: selectedFundingType === 'card' ? selectedCardId : null
                });
            } catch (fundErr: any) {
                console.error('Funding failed:', fundErr);
                alert('Escrow created but funding failed: ' + (fundErr.response?.data?.error || fundErr.message));
                // We still navigate so they can retry funding from the detail page
            }

            navigate(`/escrow/${escrowId}`);
        } catch (err: any) {
            console.error('Failed to create escrow:', err);
            alert(err.response?.data?.error || 'Failed to create escrow transaction');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <main className="flex-1 ml-80 p-8 lg:p-12">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => navigate('/escrow')}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 font-bold text-sm mb-8 transition-colors group"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Dashboard
                    </button>

                    <div className="bg-white rounded-[40px] p-12 shadow-sm border border-gray-50">
                        <header className="mb-10 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create New Escrow</h1>
                            <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-widest">Define your transaction terms</p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Seller Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="seller@example.com"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:font-normal"
                                        value={formData.sellerEmail}
                                        onChange={(e) => setFormData({ ...formData, sellerEmail: e.target.value })}
                                    />
                                    <p className="text-[10px] text-gray-400 ml-1">If they don't have an account, we'll invite them.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Currency</label>
                                    <select
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        <option value="ZMW">ZMW - Zambian Kwacha</option>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="RWF">RWF - Rwanda Franc</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            placeholder="0.00"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:font-normal"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-black">{formData.currency}</span>
                                    </div>
                                </div>

                                {/* Funding Source Selector */}
                                <div className="space-y-4 pt-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Funding Source</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* Wallet Option */}
                                        <div
                                            onClick={() => setSelectedFundingType('wallet')}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedFundingType === 'wallet' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedFundingType === 'wallet' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                </div>
                                                <h3 className={`font-black text-sm ${selectedFundingType === 'wallet' ? 'text-emerald-900' : 'text-gray-900'}`}>FlapaPay Wallet</h3>
                                            </div>
                                            <div className="flex justify-between items-center pl-11">
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isInsufficient ? 'text-red-500' : 'text-gray-400'}`}>
                                                    Available: {availableBalance.toLocaleString()} {formData.currency}
                                                </p>
                                                {isInsufficient && (
                                                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-50 px-2 py-1 rounded-md">Insufficient</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Linked Card Option */}
                                        <div
                                            onClick={() => setSelectedFundingType('card')}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedFundingType === 'card' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedFundingType === 'card' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                </div>
                                                <h3 className={`font-black text-sm ${selectedFundingType === 'card' ? 'text-emerald-900' : 'text-gray-900'}`}>Linked Card</h3>
                                            </div>
                                            <div className="pl-11">
                                                {cards.length > 0 ? (
                                                    <select
                                                        className="w-full bg-transparent text-xs font-bold text-gray-500 focus:outline-none appearance-none cursor-pointer"
                                                        value={selectedCardId}
                                                        onChange={(e) => setSelectedCardId(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {cards.map((card: any) => (
                                                            <option key={card.id} value={card.id}>
                                                                {card.card.brand.toUpperCase()} **** {card.card.last4}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <p className="text-[10px] font-bold text-gray-400">
                                                        No cards linked. <span className="text-emerald-600 hover:underline cursor-pointer" onClick={() => navigate('/link-card')}>Link one now</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>


                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Transaction Description</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. iPhone 13 Pro Max - Blue"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:font-normal"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Delivery Time (Days)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                                        value={formData.deliveryTimeframe}
                                        onChange={(e) => setFormData({ ...formData, deliveryTimeframe: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Inspection Period (Days)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                                        value={formData.inspectionPeriod}
                                        onChange={(e) => setFormData({ ...formData, inspectionPeriod: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Special Instructions (Optional)</label>
                                <textarea
                                    rows={4}
                                    placeholder="Specify any additional conditions..."
                                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:font-normal resize-none"
                                    value={formData.instructions}
                                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || isInsufficient || !formData.amount}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl shadow-xl shadow-emerald-500/20 font-black text-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create & Proposed Escrow'}
                            </Button>

                            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                FlapaPay Fee: 2.0% applies upon fund release
                            </p>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};
