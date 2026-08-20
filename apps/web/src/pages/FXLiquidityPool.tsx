import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import ReactCountryFlag from 'react-country-flag';
import { PinApprovalModal } from '../components/ui/PinApprovalModal';
import { ArrowUpDown, Banknote, CheckCircle2, AlertCircle, Loader2, RefreshCcw } from 'lucide-react';

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
    useAuth();
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
            const res = await api.get('/auth/me', {
                params: { _t: Date.now() },
                headers: {
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache',
                },
            });
            const supportedCurrencies = ['USD', 'ZMW', 'EUR', 'GBP'];
            const filteredWallets = (res.data.wallets || []).filter((wallet: Wallet) => supportedCurrencies.includes(wallet.currency));
            setWallets(filteredWallets);
        } catch {
            // no-op
        }
    };

    const getWallet = (currency: string) => wallets.find((w) => w.currency === currency);

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
                toCurrency,
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

    const handlePinSuccess = async (pin: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.post('/fx/convert', {
                amount: parseFloat(amount),
                fromCurrency,
                toCurrency,
                quoteId: quote.quoteId,
                pin,
            });
            await fetchWallets();
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
            timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
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
        <div
            className="min-h-screen bg-white font-sans selection:bg-orange-200/30"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
        >
            <div className="hidden md:block fixed left-0 top-0 z-20 h-screen w-72 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl">
                <Sidebar />
            </div>

            <main className="min-h-screen px-6 py-8 md:pl-80">
                <div className="mx-auto max-w-7xl">
                    <section>
                        <div className="mx-auto max-w-4xl">
                            <div className="rounded-[34px] border border-gray-100 bg-white p-6 shadow-xl shadow-black/5 md:p-8">
                                {step === 'input' && (
                                    <div className="space-y-8">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Swap currencies</p>
                                            <h2 className="mt-3 text-3xl font-black text-gray-900">Move balances between wallets</h2>
                                            <p className="mt-2 text-gray-500">Enter the amount, choose the source and destination, then review the quote.</p>
                                        </div>

                                        <div>
                                            <div className="mb-4 flex items-center justify-between">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">You send</label>
                                                <span className="text-xs font-bold text-gray-500">
                                                    Balance: <span className="text-gray-900">{getWallet(fromCurrency)?.balance || '0.00'} {fromCurrency}</span>
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full rounded-[28px] border-2 border-gray-100 bg-gray-50 px-8 py-6 text-3xl font-black outline-none transition-all focus:border-orange-500"
                                                />
                                                <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-md">
                                                    <ReactCountryFlag
                                                        countryCode={CURRENCIES.find((c) => c.code === fromCurrency)?.country || 'US'}
                                                        svg
                                                        className="h-6 w-6 rounded-full object-cover"
                                                    />
                                                    <select
                                                        value={fromCurrency}
                                                        onChange={(e) => setFromCurrency(e.target.value)}
                                                        className="cursor-pointer border-none bg-transparent p-0 pr-4 font-black outline-none focus:ring-0"
                                                    >
                                                        {CURRENCIES.map((c) => (
                                                            <option key={c.code} value={c.code}>
                                                                {c.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 -my-4 flex justify-center">
                                            <button
                                                onClick={swapCurrencies}
                                                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-xl transition-transform duration-300 hover:rotate-180"
                                            >
                                                <ArrowUpDown size={24} />
                                            </button>
                                        </div>

                                        <div>
                                            <div className="mb-4 flex items-center justify-between">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">You receive</label>
                                                <span className="text-xs font-bold text-gray-500">
                                                    Pool capacity: <span className="text-gray-900">Unlimited</span>
                                                </span>
                                            </div>
                                            <div className="relative opacity-90">
                                                <div className="w-full rounded-[28px] border-2 border-gray-100 bg-gray-50 px-8 py-6 text-3xl font-black text-gray-300">
                                                    {quote ? (parseFloat(amount) * quote.platform_rate).toFixed(2) : '0.00'}
                                                </div>
                                                <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-md">
                                                    <ReactCountryFlag
                                                        countryCode={CURRENCIES.find((c) => c.code === toCurrency)?.country || 'ZM'}
                                                        svg
                                                        className="h-6 w-6 rounded-full object-cover"
                                                    />
                                                    <select
                                                        value={toCurrency}
                                                        onChange={(e) => setToCurrency(e.target.value)}
                                                        className="cursor-pointer border-none bg-transparent p-0 pr-4 font-black outline-none focus:ring-0"
                                                    >
                                                        {CURRENCIES.map((c) => (
                                                            <option key={c.code} value={c.code}>
                                                                {c.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-600">
                                                <AlertCircle size={20} className="shrink-0" />
                                                <p className="text-sm font-bold">{error}</p>
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleGetQuote}
                                            className="flex w-full items-center justify-center gap-3 rounded-[28px] bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 py-6 text-lg font-black text-white shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                                            disabled={isQuoting}
                                        >
                                            {isQuoting ? <Loader2 className="animate-spin" /> : 'Review swap'}
                                        </Button>
                                    </div>
                                )}

                                {step === 'preview' && quote && (
                                    <div className="space-y-8">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Review</p>
                                            <h2 className="mt-3 text-3xl font-black text-gray-900">Confirm the conversion</h2>
                                            <p className="mt-2 text-gray-500">Please confirm your swap details before approval.</p>
                                        </div>

                                        <div className="space-y-4 rounded-[32px] border border-gray-100 bg-gray-50 p-6">
                                            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                                <span className="font-bold text-gray-500">Swap amount</span>
                                                <span className="text-xl font-black text-gray-900">
                                                    {amount} {fromCurrency}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gray-500">Market rate</span>
                                                <span className="font-bold text-gray-900">
                                                    1 {fromCurrency} = {quote.market_rate} {toCurrency}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gray-500">Platform rate</span>
                                                <span className="font-bold text-emerald-600">
                                                    1 {fromCurrency} = {quote.platform_rate} {toCurrency}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                                                <span className="font-black text-gray-900">You receive</span>
                                                <span className="text-2xl font-black text-emerald-600">
                                                    {(parseFloat(amount) * quote.platform_rate).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}{' '}
                                                    {toCurrency}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-500">
                                                <RefreshCcw size={16} className={countdown > 0 ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
                                                Rate expires in {countdown}s
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-600">
                                                <AlertCircle size={20} className="shrink-0" />
                                                <p className="text-sm font-bold">{error}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <Button variant="outline" onClick={() => setStep('input')} className="rounded-[28px] border-2 py-6 font-black">
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => setIsPinModalOpen(true)}
                                                className="rounded-[28px] bg-black py-6 font-black text-white shadow-xl"
                                                disabled={isLoading || countdown === 0}
                                            >
                                                {isLoading ? <Loader2 className="animate-spin" /> : 'Confirm swap'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {step === 'success' && (
                                    <div className="py-10 text-center">
                                        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
                                            <CheckCircle2 size={48} className="text-emerald-500" />
                                        </div>
                                        <h3 className="mb-4 text-3xl font-black text-gray-900">Swap successful</h3>
                                        <p className="mx-auto mb-10 max-w-xs text-lg font-medium leading-relaxed text-gray-500">
                                            Your funds have been converted and are available in your {toCurrency} wallet.
                                        </p>
                                        <Button onClick={() => navigate('/dashboard')} className="w-full rounded-[28px] bg-black py-6 font-black text-white shadow-2xl">
                                            Back to dashboard
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <PinApprovalModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                title="Confirm FX Swap"
                description={`Convert ${amount || '0'} ${fromCurrency} into ${toCurrency}`}
                onSuccess={async (pin) => {
                    await handlePinSuccess(pin);
                }}
                isSubmitting={isLoading}
            />
        </div>
    );
};
