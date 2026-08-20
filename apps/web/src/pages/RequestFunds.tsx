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

    const currencySymbol = currency === 'ZMW' ? 'K' : currency === 'NGN' ? '₦' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

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
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-500 selection:text-white" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.01)] z-10 relative">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto relative">
                {/* Background ambient light */}
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-50/50 to-transparent pointer-events-none" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-6xl mx-auto p-6 lg:p-10 relative z-10 min-h-screen flex flex-col justify-center">

                    {/* Header */}
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <button
                            onClick={() => step === 'AMOUNT' ? setStep('RECIPIENT') : navigate('/dashboard')}
                            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-orange-600 hover:border-orange-100 hover:shadow-md hover:shadow-orange-500/10 transition-all mb-8 group"
                        >
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-orange-600 shadow-sm backdrop-blur-sm mb-4">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    FlapaPay Collect
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_14px_30px_rgba(234,88,12,0.28)]">
                                        <Send className="w-6 h-6" />
                                    </div>
                                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                                        {step === 'SUCCESS' ? 'Request Sent' : 'Request Funds'}
                                    </h1>
                                </div>
                                <p className="text-gray-500 text-lg font-medium max-w-2xl leading-relaxed">
                                    {step === 'RECIPIENT' && 'Create a clean payment request and send it in seconds. Enter the recipient first, then set the amount and note.'}
                                    {step === 'AMOUNT' && `You’re requesting funds from ${recipientEmail}. Review the amount, currency, and add context before sending.`}
                                    {step === 'SUCCESS' && 'Your payment request has been securely generated and is ready to share.'}
                                </p>
                            </div>

                            {step !== 'SUCCESS' && (
                                <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
                                    <div className="rounded-[1.75rem] border border-white/70 bg-white/75 px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 mb-2">Current Step</p>
                                        <p className="text-sm font-black text-gray-900">{step === 'RECIPIENT' ? 'Choose recipient' : 'Set amount'}</p>
                                    </div>
                                    <div className="rounded-[1.75rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-white px-5 py-4 shadow-[0_10px_30px_rgba(249,115,22,0.08)]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400 mb-2">Experience</p>
                                        <p className="text-sm font-black text-gray-900">Fast and secure request flow</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    {step !== 'SUCCESS' && (
                        <div className="mb-10 animate-in fade-in duration-700 delay-100">
                            <div className="flex w-full max-w-md rounded-[1.75rem] border border-white/70 bg-white/75 p-2 shadow-[0_14px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                                <div className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.18em] transition-all duration-500 ${step === 'RECIPIENT' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_10px_20px_rgba(234,88,12,0.18)]' : 'text-gray-400'}`}>
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${step === 'RECIPIENT' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>1</span>
                                    Recipient
                                </div>
                                <div className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.18em] transition-all duration-500 ${step === 'AMOUNT' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_10px_20px_rgba(234,88,12,0.18)]' : 'text-gray-400'}`}>
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${step === 'AMOUNT' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>2</span>
                                    Details
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Interactive Form Area */}
                    <div className="relative">
                        {step === 'RECIPIENT' && (
                            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] animate-in fade-in zoom-in-95 duration-500">
                                <div className="bg-white rounded-[2.75rem] p-8 md:p-10 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.08)] border border-gray-100/60 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-50 via-orange-50/40 to-transparent rounded-full -mr-12 -mt-12 blur-2xl" />

                                    <div className="relative z-10 space-y-8">
                                        <div className="space-y-3">
                                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-500">Recipient Details</p>
                                            <h2 className="text-3xl font-black tracking-tight text-gray-900">Who should receive the request?</h2>
                                            <p className="max-w-xl text-sm font-medium leading-relaxed text-gray-500">
                                                Use the recipient’s email address. They’ll receive a payment link they can open and complete securely.
                                            </p>
                                        </div>

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
                                                    className="w-full bg-gray-50/60 border-2 border-gray-100 rounded-[2rem] pl-16 pr-6 py-6 font-bold text-xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-gray-300"
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

                                <div className="rounded-[2.75rem] border border-orange-100/70 bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white shadow-[0_30px_70px_-20px_rgba(234,88,12,0.45)] relative overflow-hidden">
                                    <div className="absolute -right-16 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                                    <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-yellow-300/20 blur-2xl" />
                                    <div className="relative z-10">
                                        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                                            <Mail className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-2xl font-black tracking-tight mb-3">Cleaner request flow</h3>
                                        <p className="text-sm font-medium leading-relaxed text-orange-50/90 mb-8">
                                            Start with the person, then finish with amount and context. The page keeps the process focused and low-friction.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-100/80 mb-2">Step 1</p>
                                                <p className="text-sm font-black">Enter a valid recipient email</p>
                                            </div>
                                            <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-100/80 mb-2">Step 2</p>
                                                <p className="text-sm font-black">Set the amount and optional note</p>
                                            </div>
                                            <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-100/80 mb-2">Step 3</p>
                                                <p className="text-sm font-black">Share the generated secure payment link</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'AMOUNT' && (
                            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] animate-in slide-in-from-right-8 duration-500">
                                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-b from-orange-50 to-transparent rounded-full blur-3xl" />

                                    <div className="space-y-8 relative z-10">
                                        <div className="space-y-3">
                                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-500">Payment Details</p>
                                            <h2 className="text-3xl font-black tracking-tight text-gray-900">Set the amount and context</h2>
                                            <p className="text-sm font-medium leading-relaxed text-gray-500">
                                                Choose the currency, enter the amount, and optionally explain what the request is for.
                                            </p>
                                        </div>

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
                                                        {currencySymbol}
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

                                <div className="rounded-[3rem] border border-gray-100 bg-white/80 p-8 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.06)] backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 mb-2">Request Preview</p>
                                            <h3 className="text-2xl font-black tracking-tight text-gray-900">Ready to send</h3>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <div className="rounded-[2rem] bg-gradient-to-br from-gray-900 to-black text-white p-6 shadow-[0_18px_36px_rgba(17,24,39,0.2)] mb-6">
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-3">Recipient</p>
                                        <p className="text-lg font-black break-all">{recipientEmail}</p>
                                        <div className="mt-8 flex items-end justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">Amount</p>
                                                <p className="text-4xl font-black tracking-tight">{currencySymbol}{amount || '0.00'}</p>
                                            </div>
                                            <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200">
                                                {currency}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 mb-2">Description</p>
                                            <p className="text-sm font-medium text-gray-700 leading-relaxed">
                                                {description || 'No description added yet.'}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400 mb-2">Delivery</p>
                                            <p className="text-sm font-medium text-gray-700 leading-relaxed">
                                                The recipient receives a secure payment request link they can open and complete online.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'SUCCESS' && (
                            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_40px_100px_-20px_rgba(34,197,94,0.15)] border border-green-100/50 relative overflow-hidden animate-in zoom-in-95 duration-500">
                                <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-green-50 to-transparent" />
                                <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-green-100/70 blur-3xl" />

                                <div className="relative z-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                                    <div className="text-center lg:text-left">
                                        <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-8 shadow-2xl shadow-green-500/30 animate-in slide-in-from-bottom-8 spring-bounce">
                                            <CheckCircle2 className="w-12 h-12" />
                                        </div>

                                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-green-600 mb-3">Request Complete</p>
                                        <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Request Dispatched!</h2>
                                        <p className="text-gray-500 font-medium leading-relaxed max-w-md">
                                            We've securely forwarded a payment request of <span className="text-black font-black">{currency} {parseFloat(amount).toLocaleString()}</span> to <span className="text-black font-black bg-gray-50 px-2 py-0.5 rounded-md">{recipientEmail}</span>.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-left">
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
                                                    }}
                                                    className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-2xl text-sm font-bold hover:bg-black transition-colors active:scale-95 whitespace-nowrap"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    <span>Copy Link</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <button
                                                onClick={() => {
                                                    setRecipientEmail('');
                                                    setAmount('');
                                                    setDescription('');
                                                    setStep('RECIPIENT');
                                                }}
                                                className="py-5 rounded-2xl font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-black transition-all"
                                            >
                                                Send Another
                                            </button>
                                            <button
                                                onClick={() => navigate('/dashboard')}
                                                className="py-5 rounded-2xl font-black text-white bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-600/20 active:scale-95 transition-all"
                                            >
                                                Back to Dashboard
                                            </button>
                                        </div>
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
