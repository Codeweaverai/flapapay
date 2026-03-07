import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCountryFlag from 'react-country-flag';
import {
    ArrowUpRight,
    ArrowDownLeft,
    ShieldCheck,
    Globe,
    RefreshCw
} from 'lucide-react';

export const Hero: React.FC = () => {
    const navigate = useNavigate();
    const [balance] = useState(24580.45);
    const [activeCurrency, setActiveCurrency] = useState(0);

    const currencies = [
        { code: 'USD', symbol: '$', rate: 1, flag: 'US', name: 'US Dollar' },
        { code: 'ZMW', symbol: 'K', rate: 26.45, flag: 'ZM', name: 'Zambian Kwacha' },
        { code: 'NGN', symbol: '₦', rate: 1640.50, flag: 'NG', name: 'Nigerian Naira' },
        { code: 'KES', symbol: 'Ksh', rate: 132.20, flag: 'KE', name: 'Kenyan Shilling' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveCurrency(prev => (prev + 1) % currencies.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const transactions = [
        { type: 'in', amount: '850.00', currency: 'USD', country: 'US', party: 'Acme Corp', delay: '0s' },
        { type: 'out', amount: '12,450.00', currency: 'ZMW', country: 'ZM', party: 'Tech Hub Lusaka', delay: '1.5s' },
        { type: 'in', amount: '450,000', currency: 'NGN', country: 'NG', party: 'Lagos Merchant', delay: '3s' }
    ];

    return (
        <section className="relative overflow-hidden bg-[#050505] pb-24 lg:pb-32">
            {/* Ultra-Futuristic Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

                {/* Digital Grid Lines */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
                </div>

                {/* Floating Particles/Nodes */}
                <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-orange-500/20 rounded-full blur-xl animate-float"
                            style={{
                                width: Math.random() * 100 + 50 + 'px',
                                height: Math.random() * 100 + 50 + 'px',
                                top: Math.random() * 100 + '%',
                                left: Math.random() * 100 + '%',
                                animationDuration: Math.random() * 10 + 10 + 's',
                                animationDelay: Math.random() * 5 + 's'
                            }}
                        ></div>
                    ))}
                </div>
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-32 lg:pt-48">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                    {/* Left: Content */}
                    <div className="relative">
                        <div className="inline-flex items-center gap-3 rounded-full px-5 py-2 text-xs font-black text-white bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                            <span className="flex h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)] animate-pulse"></span>
                            <span className="uppercase tracking-[0.2em]">The Unified Financial Operating Technology</span>
                        </div>

                        <h1 className="text-6xl font-black tracking-tight text-white sm:text-8xl mb-8 leading-[0.85]">
                            Financial <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-600">Infrastructure</span> <br />
                            for Modern Africa.
                        </h1>

                        <p className="mt-8 text-xl text-gray-400 mb-12 leading-relaxed font-medium max-w-xl">
                            Move money as fast as data. FlapaPay is the digital rail connect Africa's economy to the world through high-speed APIs and secure liquidity pools.
                        </p>

                        <div className="flex flex-wrap items-center gap-8">
                            <button
                                onClick={() => navigate('/signup')}
                                className="group relative px-10 py-5 bg-white text-black rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                            >
                                <span className="relative z-10">Start Transacting</span>
                                <div className="absolute inset-x-0 -bottom-px mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                            </button>
                            <a
                                href="mailto:sales@flapapay.com"
                                className="text-lg font-black text-white hover:text-orange-500 transition-colors flex items-center gap-3 py-4"
                            >
                                Contact Sales <ArrowUpRight className="w-5 h-5 text-orange-500" />
                            </a>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-20 pt-10 border-t border-white/5">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Trusted by innovators</p>
                            <div className="flex flex-wrap items-center gap-12">
                                <img src="/assets/images/MASTERCARD02.svg" className="h-10 w-auto" alt="Mastercard" />
                                <img src="/assets/images/visa02.svg" className="h-8 w-auto" alt="Visa" />
                                <img src="/assets/images/Airtel_Africa_logo.svg" className="h-12 w-auto" alt="Airtel Africa" />
                                <img src="/assets/images/MTN_Logo.svg" className="h-10 w-auto" alt="MTN" />
                                <img src="/assets/images/zamtel.png" className="h-10 w-auto object-contain" alt="Zamtel" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Futuristic Balance Engine */}
                    <div className="relative">
                        {/* Orbiting Elements */}
                        <div className="absolute inset-0 -z-10 animate-spin-slow">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)]"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: `rotate(${i * 90}deg) translateX(240px)`
                                    }}
                                ></div>
                            ))}
                        </div>

                        {/* Main Balance Container */}
                        <div className="relative mx-auto w-full max-w-[440px] perspective-2000">
                            <div className="relative bg-[#0A0A0A] backdrop-blur-2xl rounded-[48px] border border-white/10 p-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] transform-gpu rotate-y-[-10deg] hover:rotate-y-0 transition-transform duration-1000">

                                {/* Top Header */}
                                <div className="flex justify-between items-start mb-12">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                            <Globe className="w-8 h-8 text-white animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Wallet</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-white font-black text-2xl tracking-tighter">
                                                    {currencies[activeCurrency].symbol}
                                                </span>
                                                <span className="text-white font-black text-3xl tracking-tighter tabular-nums transition-all duration-500">
                                                    {(balance * currencies[activeCurrency].rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-black text-green-400">
                                            <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> LIVE
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-Currency Ticker */}
                                <div className="grid grid-cols-4 gap-3 mb-12">
                                    {currencies.map((curr, i) => (
                                        <div
                                            key={curr.code}
                                            onClick={() => setActiveCurrency(i)}
                                            className={`cursor-pointer p-4 rounded-3xl border transition-all duration-500 flex flex-col items-center gap-2 ${activeCurrency === i ? 'bg-white/10 border-white/20' : 'bg-white/5 border-transparent opacity-40 hover:opacity-100'}`}
                                        >
                                            <ReactCountryFlag countryCode={curr.flag} svg style={{ width: '24px', height: '18px', borderRadius: '4px' }} />
                                            <span className="text-[10px] font-black text-white">{curr.code}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Animated Activity Feed */}
                                <div className="space-y-4 mb-10 overflow-hidden h-[180px] relative">
                                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0A0A] to-transparent z-10"></div>
                                    {transactions.map((tx, idx) => (
                                        <div
                                            key={idx}
                                            className="group flex items-center justify-between p-4 bg-white/5 rounded-[24px] border border-white/5 animate-in slide-in-from-bottom-8 fade-in"
                                            style={{ animationDelay: tx.delay, animationFillMode: 'both' }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'in' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                                    {tx.type === 'in' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white">{tx.party}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <ReactCountryFlag countryCode={tx.country} svg style={{ width: '12px' }} />
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase">{tx.currency} Wallet</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-black ${tx.type === 'in' ? 'text-green-400' : 'text-white'}`}>
                                                {tx.type === 'in' ? '+' : '-'}{tx.amount}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Security Badge & Action */}
                                <div className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">AES-256 <br /> SECURED</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="py-3 px-6 bg-orange-500 hover:bg-orange-600 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                                    >
                                        Go to Dashboard
                                    </button>
                                </div>

                            </div>

                            {/* Decorative Floating Flags around the card */}
                            <div className="absolute -top-12 -left-12 animate-float pointer-events-none">
                                <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                                    <ReactCountryFlag countryCode="ZM" svg style={{ width: '32px' }} />
                                </div>
                            </div>
                            <div className="absolute -bottom-12 -right-12 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>
                                <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                                    <ReactCountryFlag countryCode="NG" svg style={{ width: '32px' }} />
                                </div>
                            </div>
                            <div className="absolute top-1/2 -right-20 animate-float pointer-events-none" style={{ animationDelay: '4s' }}>
                                <div className="p-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl opacity-50 text-[10px] font-black text-orange-500 italic">
                                    AFRICA CORE
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin 30s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .perspective-2000 {
                    perspective: 2000px;
                }
                .rotate-y-0 {
                    transform: rotateY(0deg);
                }
                .rotate-y-[-10deg] {
                    transform: rotateY(-10deg);
                }
            `}</style>
        </section>
    );
};
