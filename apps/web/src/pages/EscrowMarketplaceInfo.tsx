import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import {
    ShieldCheck,
    Lock,
    CheckCircle2,
    TrendingUp,
    Zap,
    Users,
    CreditCard,
    ArrowRight,
    Gavel
} from 'lucide-react';

export const EscrowMarketplaceInfo: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-orange-500 selection:text-white">
            <Navbar />
            <main className="pt-20">
                {/* HERO SECTION - Deep Black with Premium Gradients */}
                <section className="relative py-24 md:py-36 bg-slate-950 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(249,115,22,0.1),_transparent_50%)]"></div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className="animate-in fade-in slide-in-from-left duration-1000">
                                <div className="inline-flex items-center rounded-full px-5 py-2 text-xs font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 mb-8 uppercase tracking-[0.2em]">
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Marketplace Trust Infrastructure
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight tracking-tighter">
                                    P2P Trust at <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Scale.</span>
                                </h1>
                                <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-xl font-medium">
                                    FlapaPay Escrow secures the exchange of goods and services between strangers, eliminating fraud and ensuring satisfaction for both buyers and sellers worldwide.
                                </p>
                                <div className="flex flex-wrap gap-6">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="bg-orange-500 text-white px-10 py-6 rounded-2xl font-black shadow-2xl shadow-orange-500/30 hover:bg-orange-600 hover:-translate-y-1 transition-all text-lg">
                                        Start Transacting
                                    </Button>
                                    <Button size="lg" variant="outline" className="px-10 py-6 rounded-2xl font-black border-2 border-white/10 text-white hover:bg-white/5 transition-all text-lg">
                                        Partner with Us
                                    </Button>
                                </div>
                            </div>

                            {/* ANIMATED ESCROW VISUAL */}
                            <div className="relative h-[450px] flex items-center justify-center animate-in fade-in zoom-in duration-1000 delay-300">
                                <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full"></div>

                                {/* Participant: Buyer */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                                    <div className="w-20 h-20 bg-slate-900 border-2 border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
                                        <Users className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <p className="mt-4 text-xs font-black text-slate-500 uppercase tracking-widest">Buyer</p>
                                </div>

                                {/* Central Vault: FlapaPay */}
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-orange-500/20 blur-2xl group-hover:bg-orange-500/40 transition-all duration-700"></div>
                                    <div className="w-40 h-40 bg-gradient-to-br from-slate-800 to-slate-950 border-4 border-slate-700 rounded-[4rem] flex flex-col items-center justify-center shadow-3xl relative z-10 overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-400"></div>
                                        <Lock className="w-12 h-12 text-orange-500 mb-2 animate-pulse" />
                                        <span className="text-[10px] font-black text-white px-3 py-1 bg-slate-800 rounded-full border border-slate-700">FLAPAPAY VAULT</span>
                                    </div>
                                </div>

                                {/* Participant: Seller */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                                    <div className="w-20 h-20 bg-slate-900 border-2 border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-orange-500" />
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs font-black text-slate-500 uppercase tracking-widest">Seller</p>
                                </div>

                                {/* ANIMATED PAYMENTS (The "Flying" Effect) */}
                                <style>{`
                                    @keyframes moveFundsBuyerToVault {
                                        0% { transform: translate(-150px, 0) scale(0); opacity: 0; }
                                        20% { opacity: 1; transform: translate(-120px, 0) scale(1.2); }
                                        50% { transform: translate(0, 0) scale(0.5); opacity: 0.5; }
                                        100% { transform: translate(0, 0) scale(0); opacity: 0; }
                                    }
                                    @keyframes moveFundsVaultToSeller {
                                        0% { transform: translate(0, 0) scale(0); opacity: 0; }
                                        20% { transform: translate(0, 0) scale(0.5); opacity: 0.5; }
                                        80% { opacity: 1; transform: translate(120px, 0) scale(1.2); }
                                        100% { transform: translate(150px, 0) scale(0); opacity: 0; }
                                    }
                                    @keyframes scrollLeft {
                                        from { transform: translateX(0); }
                                        to { transform: translateX(-50%); }
                                    }
                                    @keyframes spinSlow {
                                        from { transform: rotate(0deg); }
                                        to { transform: rotate(360deg); }
                                    }
                                    .payment-particle {
                                        position: absolute;
                                        width: 12px;
                                        height: 12px;
                                        background: #f97316;
                                        border-radius: 4px;
                                        box-shadow: 0 0 15px #f97316;
                                        z-index: 30;
                                    }
                                    .animate-scroll-left {
                                        animation: scrollLeft 30s linear infinite;
                                    }
                                    .animate-spin-slow {
                                        animation: spinSlow 8s linear infinite;
                                    }
                                `}</style>

                                {/* Fund flow (Buyer -> Vault) */}
                                <div className="payment-particle" style={{ animation: 'moveFundsBuyerToVault 3s infinite linear' }}></div>
                                <div className="payment-particle" style={{ animation: 'moveFundsBuyerToVault 3s infinite linear 1s' }}></div>
                                <div className="payment-particle" style={{ animation: 'moveFundsBuyerToVault 3s infinite linear 2s' }}></div>

                                {/* Payout flow (Vault -> Seller) */}
                                <div className="payment-particle" style={{ animation: 'moveFundsVaultToSeller 3s infinite linear 0.5s', background: '#10b981', boxShadow: '0 0 15px #10b981' }}></div>
                                <div className="payment-particle" style={{ animation: 'moveFundsVaultToSeller 3s infinite linear 1.5s', background: '#10b981', boxShadow: '0 0 15px #10b981' }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* THE PROTECTION LOOP - Double-Sided Guarantee */}
                <section className="py-24 bg-white relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Zero-Risk Commerce.</h2>
                            <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto italic">
                                We've engineered the escrow process to be self-regulating, protecting everyone involved in the trade.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Buyer Box */}
                            <div className="group p-12 bg-slate-50 border border-slate-100 rounded-[3rem] hover:bg-slate-900 hover:text-white transition-all duration-500 shadow-sm hover:shadow-2xl">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8 font-black text-2xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    <CreditCard />
                                </div>
                                <h3 className="text-3xl font-black mb-6">Buyer Protection</h3>
                                <ul className="space-y-4 text-slate-500 group-hover:text-slate-400 font-bold">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                                        <span>Money is held in our secure vault until you confirm delivery.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                                        <span>Full refund guarantee if the seller fails to deliver.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                                        <span>Dedicated inspection period to verify quality.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Seller Box */}
                            <div className="group p-12 bg-slate-50 border border-slate-100 rounded-[3rem] hover:bg-slate-900 hover:text-white transition-all duration-500 shadow-sm hover:shadow-2xl">
                                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mb-8 font-black text-2xl group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    <TrendingUp />
                                </div>
                                <h3 className="text-3xl font-black mb-6">Seller Protection</h3>
                                <ul className="space-y-4 text-slate-500 group-hover:text-slate-400 font-bold">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                                        <span>Ship with confidence knowing the buyer's funds are already secured.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                                        <span>Protection against chargebacks and fraudulent disputes.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                                        <span>Automated payouts the moment the buyer approves.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* THE LIFECYCLE - Interactive Timeline */}
                <section className="py-32 bg-slate-50">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">The Escrow Lifecycle</h2>
                            <p className="text-slate-500 font-bold tracking-widest text-[11px] uppercase opacity-60">4 Steps to Total Transaction Certainty</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                            {/* Connecting Line */}
                            <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-[2px] bg-slate-200 z-0"></div>

                            {[
                                {
                                    step: '01',
                                    title: 'Funding',
                                    desc: 'Buyer funds the project or purchase. Funds are moved to FlapaPay Cold Storage.',
                                    icon: <Zap />
                                },
                                {
                                    step: '02',
                                    title: 'Delivery',
                                    desc: 'Seller provides the goods or services and marks the transaction as delivered.',
                                    icon: <ArrowRight />
                                },
                                {
                                    step: '03',
                                    title: 'Inspection',
                                    desc: 'Buyer reviews the delivery within a pre-negotiated timeframe to ensure quality.',
                                    icon: <ShieldCheck />
                                },
                                {
                                    step: '04',
                                    title: 'Release',
                                    desc: 'Upon approval, funds are instantly released to the seller\'s FlapaPay wallet.',
                                    icon: <TrendingUp />
                                }
                            ].map((item, i) => (
                                <div key={i} className="relative z-10 flex flex-col items-center text-center p-8">
                                    <div className="w-32 h-32 rounded-full bg-white border border-slate-100 shadow-xl mb-8 flex items-center justify-center text-slate-900 group relative">
                                        <div className="absolute inset-2 border-2 border-dashed border-slate-100 rounded-full animate-spin-slow"></div>
                                        <span className="text-2xl font-black">{item.icon}</span>
                                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-4 border-white">
                                            {item.step}
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 mb-4">{item.title}</h4>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* VOLUME & SCALE SECTION */}
                <section className="py-24 bg-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 flex flex-col gap-8 -rotate-12 translate-x-12">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex gap-8 animate-scroll-left whitespace-nowrap text-9xl font-black text-orange-500">
                                SECURE ESCROW • TOTAL TRUST • GLOBAL PAYMENTS • SECURE ESCROW • TOTAL TRUST • GLOBAL PAYMENTS • SECURE ESCROW • TOTAL TRUST • GLOBAL PAYMENTS
                            </div>
                        ))}
                    </div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-white py-12">
                            <div className="p-8 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 hover:border-orange-500/50 transition-colors">
                                <h5 className="text-6xl font-black mb-2 text-orange-500">$500M+</h5>
                                <p className="font-bold uppercase tracking-widest text-[10px] opacity-60">Annual P2P Volume</p>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 hover:border-orange-500/50 transition-colors md:translate-y-8">
                                <h5 className="text-6xl font-black mb-2 text-orange-500">12ms</h5>
                                <p className="font-bold uppercase tracking-widest text-[10px] opacity-60">Avg Settlement Speed</p>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 hover:border-orange-500/50 transition-colors">
                                <h5 className="text-6xl font-black mb-2 text-orange-500">0.05%</h5>
                                <p className="font-bold uppercase tracking-widest text-[10px] opacity-60">Global Dispute Rate</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FINAL CALL TO ACTION */}
                <section className="py-32 bg-white flex justify-center text-center">
                    <div className="max-w-4xl px-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-600 rounded-full font-black text-xs uppercase tracking-widest mb-10">
                            <Zap className="w-4 h-4" /> Ready for the future
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-10 leading-tight">
                            Build trust into every <span className="text-orange-500 underline decoration-slate-900 decoration-8 underline-offset-8">transaction.</span>
                        </h2>
                        <p className="text-xl text-slate-500 font-bold mb-12 leading-relaxed">
                            Join 5,000+ marketplaces using FlapaPay Escrow to secure their ecosystem and drive user growth.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Button size="lg" onClick={() => navigate('/signup')} className="bg-slate-900 text-white px-12 py-7 rounded-3xl font-black shadow-3xl hover:bg-slate-800 transition-all text-xl flex items-center gap-4">
                                Create an Account <ArrowRight className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};
