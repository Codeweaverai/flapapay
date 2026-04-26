import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import ReactCountryFlag from 'react-country-flag';
import { PinApprovalModal } from '../components/ui/PinApprovalModal';
import { ArrowUpDown, RefreshCcw, Info, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Wallet {
    id: string;
    currency: string;
    balance: string;
}

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', country: 'US' },
    { code: 'ZMW', name: 'Zambian Kwacha', country: 'ZM' },
    { code: 'EUR', name: 'Euro', country: 'EU' },
    { code: 'GBP', name: 'British Pound', country: 'GB' },
];

export const FXLiquidityPool: React.FC = () => {
    const { } = useAuth();
    const navigate = useNavigate();

    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('ZMW');
    const [amount, setAmount] = useState('');
    const [quote, setQuote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isQuoting, setIsQuoting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
    const [countdown, setCountdown] = useState(60);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        try {
            const res = await api.get('/auth/me');
            const supportedCurrencies = ['USD', 'ZMW', 'EUR', 'GBP'];
            const filteredWallets = (res.data.wallets || []).filter((wallet: Wallet) => 
                supportedCurrencies.includes(wallet.currency)
            );
            setWallets(filteredWallets);
        } catch (err) {
            console.error('Failed to fetch wallets');
        }
    };

    const getWallet = (currency: string) => wallets.find(w => w.currency === currency);

    const handleGetQuote = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        const fromWallet = getWallet(fromCurrency);
        if (!fromWallet || parseFloat(fromWallet.balance) < parseFloat(amount)) {
            setError(`Insufficient ${fromCurrency} balance`);
            return;
        }

        setIsQuoting(true);
        setError(null);
        try {
            const res = await api.post('/fx/quote', {
                amount: parseFloat(amount),
                fromCurrency,
                toCurrency
            });
            setQuote(res.data);
            setStep('preview');
            setCountdown(60);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch exchange rate');
        } finally {
            setIsQuoting(false);
        }
    };

    const handleSwapClick = () => {
        setIsPinModalOpen(true);
    };

    const handlePinSuccess = async (pin: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.post('/fx/convert', {
                amount: parseFloat(amount),
                fromCurrency,
                toCurrency,
                quoteId: quote.quoteId,
                pin
            });
            setStep('success');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Conversion failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let timer: any;
        if (step === 'preview' && countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        } else if (countdown === 0 && step === 'preview') {
            setError('Quote expired. Please refresh.');
        }
        return () => clearInterval(timer);
    }, [step, countdown]);

    const swapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        setQuote(null);
    };

    return (
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-100" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 min-h-screen p-6 md:p-8 relative overflow-x-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/20 via-orange-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <header className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">FX Liquidity Pool</h1>
                            <p className="text-gray-500 mt-1">Convert funds between your multi-currency wallets instantly.</p>
                        </div>
                    </header>

                    <div className="max-w-2xl mx-auto mt-10">
                        {/* Header */}
                        <div className="mb-10 text-center">
                            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-6 shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Liquidity Pool</span>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Swap Currencies</h2>
                            <p className="text-gray-500 font-medium mt-2">Instant multi-currency conversion with low fees.</p>
                        </div>

                        <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 p-8 md:p-12 border border-gray-50 relative overflow-hidden">
                            {step === 'input' && (
                                <div className="space-y-8">
                                    {/* From */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">You Send</label>
                                            <span className="text-xs font-bold text-gray-500">
                                                Balance: <span className="text-gray-900">{getWallet(fromCurrency)?.balance || '0.00'} {fromCurrency}</span>
                                            </span>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-[28px] py-6 px-8 text-3xl font-black transition-all outline-none"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                                                <ReactCountryFlag countryCode={CURRENCIES.find(c => c.code === fromCurrency)?.country || 'US'} svg className="w-6 h-6 rounded-full object-cover" />
                                                <select
                                                    value={fromCurrency}
                                                    onChange={(e) => setFromCurrency(e.target.value)}
                                                    className="bg-transparent font-black outline-none focus:ring-0 border-none p-0 pr-4 cursor-pointer"
                                                >
                                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Swap Button */}
                                    <div className="flex justify-center -my-4 relative z-10">
                                        <button
                                            onClick={swapCurrencies}
                                            className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center hover:rotate-180 transition-all duration-500 shadow-xl"
                                        >
                                            <ArrowUpDown size={24} />
                                        </button>
                                    </div>

                                    {/* To */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">You Receive</label>
                                            <span className="text-xs font-bold text-gray-500">
                                                Pool Capacity: <span className="text-gray-900">Unlimited</span>
                                            </span>
                                        </div>
                                        <div className="relative group opacity-80">
                                            <div className="w-full bg-gray-50 border-2 border-transparent rounded-[28px] py-6 px-8 text-3xl font-black text-gray-300">
                                                {quote ? (parseFloat(amount) * quote.platform_rate).toFixed(2) : '0.00'}
                                            </div>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                                                <ReactCountryFlag countryCode={CURRENCIES.find(c => c.code === toCurrency)?.country || 'ZM'} svg className="w-6 h-6 rounded-full object-cover" />
                                                <select
                                                    value={toCurrency}
                                                    onChange={(e) => setToCurrency(e.target.value)}
                                                    className="bg-transparent font-black outline-none focus:ring-0 border-none p-0 pr-4 cursor-pointer"
                                                >
                                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-5 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4 text-red-600 animate-in fade-in zoom-in">
                                            <AlertCircle size={20} className="shrink-0" />
                                            <p className="text-sm font-bold">{error}</p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleGetQuote}
                                        className="w-full py-6 rounded-[28px] bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                                        disabled={isQuoting}
                                    >
                                        {isQuoting ? <Loader2 className="animate-spin" /> : 'Review Swap'}
                                    </Button>

                                    <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-3xl">
                                        <Info className="text-gray-400 shrink-0" size={20} />
                                        <p className="text-xs font-medium text-gray-500 leading-relaxed italic">
                                            Rates are updated every 60 seconds. A small 2% liquidity spread is applied to maintain the pool and support ecosystem growth.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 'preview' && quote && (
                                <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                                    <div>
                                        <h3 className="text-2xl font-black mb-2 text-gray-900 text-center">Review Selection</h3>
                                        <p className="text-gray-500 text-center font-medium">Please confirm your swap details</p>
                                    </div>

                                    <div className="p-8 bg-gray-50 rounded-[32px] space-y-4 border border-gray-100">
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                                            <span className="text-gray-500 font-bold">Swap Amount</span>
                                            <span className="font-black text-xl">{amount} {fromCurrency}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-500 font-bold">Market Rate</span>
                                            <span className="font-bold text-gray-900">1 {fromCurrency} = {quote.market_rate} {toCurrency}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-500 font-bold">Platform Rate (2% Spread)</span>
                                            <span className="font-bold text-emerald-600">1 {fromCurrency} = {quote.platform_rate} {toCurrency}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                            <span className="text-gray-900 font-black">You Receive</span>
                                            <span className="font-black text-2xl text-emerald-600">
                                                {(parseFloat(amount) * quote.platform_rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="inline-flex items-center gap-2 text-sm font-bold text-orange-500 mb-6 px-4 py-2 bg-orange-50 rounded-full border border-orange-100">
                                            <RefreshCcw size={16} className={countdown > 0 ? "animate-spin" : ""} style={{ animationDuration: '3s' }} />
                                            Rate expires in {countdown}s
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-5 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4 text-red-600">
                                            <AlertCircle size={20} className="shrink-0" />
                                            <p className="text-sm font-bold">{error}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant="outline" onClick={() => setStep('input')} className="py-6 rounded-[28px] font-black border-2">Cancel</Button>
                                        <Button
                                            onClick={handleSwapClick}
                                            className="py-6 rounded-[28px] bg-emerald-600 text-white font-black shadow-xl shadow-emerald-600/20"
                                            disabled={isLoading || countdown === 0}
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" /> : 'Confirm Swap'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="py-10 text-center animate-in zoom-in-95 duration-500">
                                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                        <CheckCircle2 size={48} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 mb-4">Swap Successful!</h3>
                                    <p className="text-gray-500 text-lg font-medium mb-10 max-w-xs mx-auto leading-relaxed">
                                        Your funds have been converted and are available in your {toCurrency} wallet instantly.
                                    </p>
                                    <Button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-6 rounded-[28px] bg-black text-white font-black shadow-2xl"
                                    >
                                        Back to Dashboard
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isPinModalOpen && (
                    <PinApprovalModal
                        isOpen={isPinModalOpen}
                        onClose={() => setIsPinModalOpen(false)}
                        onSuccess={handlePinSuccess}
                        title="Confirm FX Swap"
                        description={`Enter your PIN to instantly swap ${amount} ${fromCurrency} to ${toCurrency}.`}
                    />
                )}
            </main>
        </div>
    );
};
