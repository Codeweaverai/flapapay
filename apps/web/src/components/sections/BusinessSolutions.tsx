import React from 'react';
import { useNavigate } from 'react-router-dom';

export const BusinessSolutions: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section id="business-solutions" className="py-24 bg-[#050505] overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[38%] h-[38%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[38%] h-[38%] bg-blue-600/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div
                    className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)', backgroundSize: '50px 50px' }}
                ></div>
            </div>
            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Content */}
                    <div className="max-w-xl">
                        <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold text-orange-300 bg-white/5 border border-white/10 mb-8 uppercase tracking-widest backdrop-blur-md">
                            Business Solutions
                        </div>
                        <h2 className="text-4xl font-black text-white sm:text-5xl mb-8 leading-tight">
                            Scale your business with <span className="text-orange-400">Unified Payments</span> across Africa.
                        </h2>
                        <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                            Collect payments from customers, manage collections, and handle payouts to mobile money and bank accounts instantly. All with a single integration.
                        </p>

                        <div className="space-y-6 mb-12">
                            {[
                                { title: 'Payment Links', desc: 'Create and share professional checkout links via WhatsApp, SMS, or Email.', icon: '🔗' },
                                { title: 'Seamless Collections', desc: 'Accept payments via Mobile Money (MTN, Airtel) and Cards effortlessly.', icon: '💰' },
                                { title: 'Mass Payouts', desc: 'Disburse funds to thousands of vendors and employees in seconds.', icon: '🏦' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-3xl border border-white/6 bg-white/4 hover:bg-white/8 transition-colors">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shrink-0 text-xl shadow-lg shadow-yellow-500/20">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                        <p className="text-gray-400 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/signup')}
                            className="px-10 py-5 bg-white text-black rounded-2xl font-black shadow-xl hover:shadow-2xl transition-all active:scale-95 text-lg"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Right: Business Dashboard Showcase */}
                    <div className="relative">
                        <div className="mx-auto max-w-[520px] rounded-[40px] border border-white/10 bg-white/8 p-4 shadow-[0_40px_100px_-24px_rgba(0,0,0,0.35)] backdrop-blur-md">
                            <div className="mb-3 flex items-center gap-2 px-3 pt-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                            </div>
                            <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-[#f7f4ef]">
                                <img
                                    src="/assets/images/business-solutions-showcase.png"
                                    alt="FlapaPay business dashboard experience"
                                    className="block w-full h-auto"
                                    loading="lazy"
                                />
                            </div>
                        </div>

                        {/* Floating elements */}
                        <div className="absolute -top-8 -right-4 rounded-3xl border border-white/10 bg-black/55 p-5 shadow-2xl z-20 backdrop-blur-xl">
                            <p className="mb-1 text-[10px] font-bold uppercase text-gray-500">Business View</p>
                            <p className="text-lg font-black text-white">Live dashboard</p>
                        </div>
                    </div>

                </div>
            </div>

        </section>
    );
};
