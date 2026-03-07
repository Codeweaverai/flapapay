import React, { useState } from 'react';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { ArrowRight, Mail, DollarSign, CheckCircle2, ChevronLeft, Copy, Send, Loader2, Sparkles } from 'lucide-react';

type Step = 'RECIPIENT' | 'AMOUNT' | 'SUCCESS';

export const RequestFunds: React.FC = () => {
    useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('RECIPIENT');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('ZMW');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState<any>(null);

    const handleNext = () => {
        if (step === 'RECIPIENT') {
            if (!recipientEmail.includes('@') || !recipientEmail.includes('.')) {
                setError('Please enter a valid email address');
                return;
            }
            setStep('AMOUNT');
            setError('');
        }
    };

    const handleRequest = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/v1/payment-requests', {
                recipientEmail,
                amount: parseFloat(amount),
                currency,
                description
            });
            setSuccessData(res.data);
            setStep('SUCCESS');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to send request');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] flex font-sans selection:bg-orange-500 selection:text-white">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.01)] z-10 relative">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto relative">
                {/* Background ambient light */}
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-50/50 to-transparent pointer-events-none" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-2xl mx-auto p-8 lg:p-12 relative z-10 h-full flex flex-col justify-center min-h-screen">

                    {/* Header */}
                    <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        <button
                            onClick={() => step === 'AMOUNT' ? setStep('RECIPIENT') : navigate('/dashboard')}
                            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-orange-600 hover:border-orange-100 hover:shadow-md hover:shadow-orange-500/10 transition-all mb-8 group"
                        >
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-orange-50 rounded-xl">
                                <Send className="w-6 h-6 text-orange-500" />
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                                {step === 'SUCCESS' ? 'Request Sent' : 'Request Funds'}
                            </h1>
                        </div>
                        <p className="text-gray-500 text-lg font-medium max-w-md">
                            {step === 'RECIPIENT' && 'Who would you like to request money from today?'}
                            {step === 'AMOUNT' && `Specify the amount to request from ${recipientEmail}`}
                            {step === 'SUCCESS' && 'Your payment request has been securely dispatched.'}
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    {step !== 'SUCCESS' && (
                        <div className="flex items-center gap-3 mb-12 animate-in fade-in duration-700 delay-100">
                            <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-full max-w-xs">
                                <div className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${step === 'RECIPIENT' ? 'bg-orange-50 text-orange-600' : 'text-gray-400'}`}>
                                    1. Recipient
                                </div>
                                <div className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${step === 'AMOUNT' ? 'bg-orange-50 text-orange-600' : 'text-gray-400'}`}>
                                    2. Details
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Interactive Form Area */}
                    <div className="relative">
                        {step === 'RECIPIENT' && (
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-50 to-transparent rounded-full -mr-10 -mt-10 blur-2xl" />

                                <div className="space-y-8 relative z-10">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">Recipient Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                                <Mail className="w-6 h-6" />
                                            </div>
                                            <input
                                                type="email"
                                                autoFocus
                                                value={recipientEmail}
                                                onChange={(e) => { setRecipientEmail(e.target.value); setError(''); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                                placeholder="colleague@company.com"
                                                className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-[2rem] pl-16 pr-6 py-6 font-bold text-xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-sm font-bold">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleNext}
                                        disabled={!recipientEmail}
                                        className="w-full flex items-center justify-between p-6 bg-gray-900 hover:bg-black text-white rounded-[2rem] font-black text-lg shadow-xl shadow-gray-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 group"
                                    >
                                        <span className="pl-2">Continue to Details</span>
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                            <ArrowRight className="w-5 h-5 text-white" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'AMOUNT' && (
                            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden animate-in slide-in-from-right-8 duration-500">
                                {/* Decor */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-b from-orange-50 to-transparent rounded-full blur-3xl" />

                                <div className="space-y-8 relative z-10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Currency</label>
                                            <div className="relative">
                                                <select
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-3xl pl-5 pr-10 py-5 font-black text-lg text-gray-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="ZMW">ZMW 🇿🇲</option>
                                                    <option value="USD">USD 🇺🇸</option>
                                                    <option value="NGN">NGN 🇳🇬</option>
                                                    <option value="EUR">EUR 🇪🇺</option>
                                                    <option value="GBP">GBP 🇬🇧</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-3">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Amount</label>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-orange-500 transition-colors">
                                                    {currency === 'ZMW' ? 'K' : currency === 'NGN' ? '₦' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                                                </div>
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    value={amount}
                                                    onChange={(e) => { setAmount(e.target.value); setError(''); }}
                                                    placeholder="0.00"
                                                    className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-3xl pl-12 pr-6 py-5 font-black text-3xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-gray-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-gray-50">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                            <span>What's this request for?</span>
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-[8px]">Optional</span>
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="e.g. Graphic design work, Project milestone..."
                                            className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-3xl px-6 py-5 font-medium text-gray-700 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all resize-none h-28 placeholder:text-gray-300"
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-sm font-bold">{error}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleRequest}
                                        disabled={isLoading || !amount}
                                        className="w-full flex items-center justify-center gap-3 py-6 bg-orange-600 hover:bg-orange-700 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-orange-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Processing Request...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 text-orange-300" />
                                                <span>Send Payment Request</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'SUCCESS' && (
                            <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(34,197,94,0.15)] border border-green-100/50 relative overflow-hidden animate-in zoom-in-95 duration-500 text-center">
                                {/* Success Ambient */}
                                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-green-50 to-transparent" />

                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30 animate-in slide-in-from-bottom-8 spring-bounce">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>

                                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Request Dispatched!</h2>
                                    <p className="text-gray-500 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                                        We've securely forwarded a payment request of <span className="text-black font-black">{currency} {parseFloat(amount).toLocaleString()}</span> to <span className="text-black font-black bg-gray-50 px-2 py-0.5 rounded-md">{recipientEmail}</span>.
                                    </p>

                                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 mb-10 text-left">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2 flex justify-between items-center">
                                            <span>Secure Payment Link</span>
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm font-mono font-medium text-gray-500 truncate shadow-inner">
                                                {`${window.location.origin}/pay-request/${successData?.id}`}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/pay-request/${successData?.id}`);
                                                    // Optional: Could add a mini toast here
                                                }}
                                                className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-2xl text-sm font-bold hover:bg-black transition-colors active:scale-95 whitespace-nowrap"
                                            >
                                                <Copy className="w-4 h-4" />
                                                <span>Copy Link</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={() => {
                                                setRecipientEmail('');
                                                setAmount('');
                                                setDescription('');
                                                setStep('RECIPIENT');
                                            }}
                                            className="flex-1 py-5 rounded-2xl font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-black transition-all"
                                        >
                                            Send Another
                                        </button>
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="flex-1 py-5 rounded-2xl font-black text-white bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-600/20 active:scale-95 transition-all"
                                        >
                                            Back to Dashboard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 text-center flex flex-col items-center justify-center gap-2 text-gray-400">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secured by FlapaPay Encryption Protocol</span>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};
