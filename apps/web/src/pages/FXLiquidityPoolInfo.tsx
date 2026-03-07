import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const FXLiquidityPoolInfo: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-emerald-100 flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 relative overflow-hidden">
                {/* Hero Section */}
                <section className="relative pt-20 pb-32 px-6 lg:px-8 z-10 text-center">
                    {/* Background Orbs */}
                    <div className="absolute top-0 right-1/2 translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-emerald-400/20 via-emerald-300/5 to-transparent rounded-full -mt-64 blur-3xl pointer-events-none -z-10 animate-pulse"></div>

                    <div className="max-w-5xl mx-auto">
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white border border-emerald-100 shadow-sm mb-10 mx-auto animate-in slide-in-from-bottom-4 duration-500">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="text-sm font-black text-gray-900 uppercase tracking-widest">FlapaPay FX Liquidity</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-8 animate-in slide-in-from-bottom-6 duration-700">
                            Global currency swaps <br className="hidden md:block" /> at <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">lightning speed</span>.
                        </h1>
                        <p className="text-xl md:text-2xl font-medium text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-100">
                            Convert between USD, ZMW, NGN, GBP, and EUR instantly securely and at competitive real-time market rates directly from your wallet.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom-10 duration-700 delay-200">
                            <Button size="lg" onClick={() => navigate('/login')} className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-full font-black text-lg shadow-2xl hover:-translate-y-1 hover:shadow-black/20 hover:bg-neutral-900 transition-all">
                                Open Your Wallet
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="w-full sm:w-auto px-10 py-5 rounded-full font-black text-lg border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all">
                                View Exchange Rates
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Animated UI Preview */}
                <section className="relative px-6 pb-40 max-w-6xl mx-auto animate-in zoom-in-95 duration-1000 delay-300">
                    <div className="bg-gray-900 rounded-[48px] p-6 md:p-12 shadow-2xl border border-gray-800 relative overflow-hidden">
                        {/* Glow in container */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent"></div>

                        <div className="grid md:grid-cols-2 gap-12 relative z-10 items-center">
                            <div className="space-y-6">
                                <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-white">
                                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Live Market Spread</p>
                                            <p className="text-4xl font-black text-emerald-400">2.00%</p>
                                        </div>
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-black text-xl text-white">
                                            FX
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-400">Rates updated every 60 seconds matching global indices.</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { from: '100.00 USD', to: '1,883.42 ZMW', status: 'Converted', color: 'text-emerald-400', delay: '0s' },
                                        { from: '5,000.00 ZMW', to: '265.43 USD', status: 'Converted', color: 'text-emerald-400', delay: '0.2s' },
                                        { from: '500.00 GBP', to: '632.10 USD', status: 'Processing', color: 'text-teal-400', delay: '0.4s' }
                                    ].map((p, i) => (
                                        <div key={i} className={`flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all transform animate-in slide-in-from-right-4 duration-500`} style={{ animationDelay: p.delay, animationFillMode: 'both' }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg font-black text-white shadow-inner">➔</div>
                                                <div>
                                                    <p className="text-sm font-black text-white font-mono">{p.from}</p>
                                                    <p className="text-xs font-bold text-gray-500 font-mono mt-1">To: {p.to}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[10px] uppercase tracking-widest font-black mt-1 ${p.color} animate-pulse`}>{p.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-white space-y-8 pl-0 md:pl-10">
                                <div>
                                    <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/20">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    </div>
                                    <h3 className="text-3xl font-black mb-4">Deep Liquidity Pool</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed">Our unified reserves allow you to convert unlimited funds across any supported currency pairings flawlessly without routing delays.</p>
                                </div>
                                <hr className="border-white/10" />
                                <div>
                                    <div className="h-14 w-14 bg-teal-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-teal-500/20">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h3 className="text-3xl font-black mb-4">Transparent Pricing</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed">Know exactly what you get. A guaranteed spread locked in for 60 seconds with simple, transparent metrics mapped line by line.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-32 bg-white relative">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Unlocking borderless finance.</h2>
                            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Maintain global balances seamlessly without needing multiple multi-currency banking partners.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-12 bg-gray-50 rounded-[40px] hover:-translate-y-2 transition-transform duration-300">
                                <div className="text-5xl mb-8 transform hover:scale-110 transition-transform">🌍</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">Global Reach</h3>
                                <p className="text-gray-600 font-medium leading-relaxed">Supported by our integration with leading Forex APIs, process localized currencies globally and accurately.</p>
                            </div>
                            <div className="p-12 bg-emerald-50 rounded-[40px] hover:-translate-y-2 transition-transform duration-300 border border-emerald-100">
                                <div className="text-5xl mb-8 transform hover:scale-110 transition-transform">⚡</div>
                                <h3 className="text-2xl font-black text-emerald-950 mb-4">Instant Settlement</h3>
                                <p className="text-emerald-900/70 font-medium leading-relaxed">As soon as you approve your quote, both your source wallet and target wallet are instantly updated locally in real-time.</p>
                            </div>
                            <div className="p-12 bg-gray-50 rounded-[40px] hover:-translate-y-2 transition-transform duration-300">
                                <div className="text-5xl mb-8 transform hover:scale-110 transition-transform">🔒</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">Secure</h3>
                                <p className="text-gray-600 font-medium leading-relaxed">Double-entry bookkeeping is natively integrated making your conversions unshakeable and auditable.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};
