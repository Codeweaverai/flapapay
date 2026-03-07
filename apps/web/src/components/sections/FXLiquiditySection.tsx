import React, { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { ArrowRightLeft, TrendingUp, Zap, ShieldCheck, RefreshCcw } from 'lucide-react';

export const FXLiquiditySection: React.FC = () => {
    const [rateAnimation, setRateAnimation] = useState(19.2450);
    const [activePair, setActivePair] = useState(0);

    const pairs = [
        { from: 'USD', to: 'ZMW', rate: 19.2450, color: '#10b981' },
        { from: 'EUR', to: 'NGN', rate: 1640.80, color: '#3b82f6' },
        { from: 'GBP', to: 'ZMW', rate: 24.1200, color: '#8b5cf6' },
        { from: 'USD', to: 'KES', rate: 132.50, color: '#f59e0b' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setRateAnimation(prev => prev + (Math.random() * 0.002 - 0.001));
            if (Math.random() > 0.9) {
                setActivePair(prev => (prev + 1) % pairs.length);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const floatingFlags = [
        { code: 'US', delay: '0s', top: '10%', left: '15%' },
        { code: 'ZM', delay: '1s', top: '25%', left: '80%' },
        { code: 'NG', delay: '2s', top: '65%', left: '10%' },
        { code: 'GB', delay: '3s', top: '80%', left: '70%' },
        { code: 'EU', delay: '1.5s', top: '40%', left: '90%' },
        { code: 'KE', delay: '2.5s', top: '75%', left: '20%' },
    ];

    return (
        <section className="relative py-24 overflow-hidden bg-[#064e3b]">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -mr-64 -mt-64"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -ml-64 -mb-64"></div>

                {/* Animated Grid lines */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>
            </div>

            {/* Floating React Country Flags */}
            {floatingFlags.map((flag, idx) => (
                <div
                    key={idx}
                    className="absolute z-10 animate-floating pointer-events-none opacity-20 md:opacity-40"
                    style={{
                        top: flag.top,
                        left: flag.left,
                        animationDelay: flag.delay,
                        fontSize: '2rem'
                    }}
                >
                    <ReactCountryFlag
                        countryCode={flag.code}
                        svg
                        style={{ width: '2.5em', height: 'auto', borderRadius: '4px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))' }}
                    />
                </div>
            ))}

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Content */}
                    <div className="animate-in fade-in slide-in-from-left-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 mb-8">
                            <RefreshCcw className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Real-Time Core Liquidity</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-tight">
                            Global FX Swaps, <br />
                            <span className="text-emerald-400">Powered by Intelligence.</span>
                        </h2>
                        <p className="text-lg text-emerald-100/60 mb-12 font-medium leading-relaxed max-w-xl">
                            Our proprietary FX Liquidity Pool aggregates multi-source market data to provide institutional-grade exchange rates for African corridors. Swap currencies instantly with zero hidden slippage.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-700/50">
                                    <Zap className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Instant Settlement</h4>
                                    <p className="text-xs text-emerald-100/40 font-medium">Funds reflect in your wallet milliseconds after confirmation.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-700/50">
                                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Secured Vaults</h4>
                                    <p className="text-xs text-emerald-100/40 font-medium">All liquidity pools are collateralized 1:1 with tier-1 reserves.</p>
                                </div>
                            </div>
                        </div>

                        <button className="px-10 py-5 bg-emerald-500 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300">
                            Explore Liquidity Pools
                        </button>
                    </div>

                    {/* Right Visual: Animated Rate Card */}
                    <div className="relative group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[48px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative bg-[#042f24] border border-emerald-800/50 rounded-[48px] p-12 shadow-2xl overflow-hidden">
                            <div className="flex justify-between items-center mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        <div className="w-12 h-12 rounded-full border-4 border-[#042f24] overflow-hidden translate-z-10">
                                            <ReactCountryFlag countryCode={pairs[activePair].from.substring(0, 2)} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div className="w-12 h-12 rounded-full border-4 border-[#042f24] overflow-hidden translate-z-10">
                                            <ReactCountryFlag countryCode={pairs[activePair].to.substring(0, 2)} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-xl leading-none">{pairs[activePair].from}/{pairs[activePair].to}</p>
                                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-1">Live Market Pair</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-emerald-400 font-black">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-xs tracking-widest">+0.42%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-12">
                                <div className="text-[10px] font-black text-emerald-100/40 uppercase tracking-[0.2em]">Exchange Rate</div>
                                <div className="text-6xl md:text-7xl font-black text-white tracking-tighter tabular-nums flex items-baseline gap-2">
                                    {Math.floor(rateAnimation)}
                                    <span className="text-4xl text-emerald-500">.</span>
                                    <span className="text-4xl text-emerald-500">
                                        {(rateAnimation % 1).toFixed(4).substring(2)}
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-emerald-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 animate-shimmer" style={{ width: '65%' }}></div>
                                </div>
                            </div>

                            <div className="p-6 rounded-3xl bg-emerald-900/40 border border-emerald-800/50">
                                <div className="flex justify-between items-center text-[10px] font-black mb-4">
                                    <span className="text-emerald-100/40 uppercase tracking-widest">Pricing Pool Details</span>
                                    <span className="text-emerald-400 uppercase tracking-widest">Active</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-white/40 font-medium">Liquidity Depth</span>
                                        <span className="text-xs text-white font-bold">$1.4M / Day</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-white/40 font-medium">Spread Index</span>
                                        <span className="text-xs text-emerald-400 font-bold">0.02%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Wave animation inside card */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-20 scale-x-150 animate-pulse"></div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-30px) rotate(5deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .animate-floating {
                    animation: float 8s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin 12s linear infinite;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}</style>
        </section>
    );
};
