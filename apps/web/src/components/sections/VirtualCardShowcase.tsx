import React from 'react';
import { useNavigate } from 'react-router-dom';

export const VirtualCardShowcase: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section id="virtual-cards" className="py-24 mt-24 bg-white text-black overflow-hidden relative">
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-orange-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                    {/* Left: Content */}
                    <div>
                        <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 mb-8 uppercase tracking-widest">
                            Global Spending
                        </div>
                        <h2 className="text-4xl font-black sm:text-5xl mb-8 leading-tight">
                            Instant <span className="text-orange-500">Virtual Cards</span> for all your global payments.
                        </h2>
                        <p className="text-xl text-gray-700 mb-10 leading-relaxed">
                            Issue virtual Visa and Mastercard tailored for your needs. Whether it's for business SaaS, cloud subscriptions, or global shopping, FlapaPay cards work where others don't.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200 hover:border-orange-500/50 transition-colors">
                                <div className="text-3xl mb-4 text-orange-500">💳</div>
                                <h4 className="font-bold text-lg mb-2 text-black">Instant Issuance</h4>
                                <p className="text-sm text-gray-600">Create a card in seconds and start spending immediately.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200 hover:border-yellow-500/50 transition-colors">
                                <div className="text-3xl mb-4 text-yellow-500">🛡️</div>
                                <h4 className="font-bold text-lg mb-2 text-black">Spend Controls</h4>
                                <p className="text-sm text-gray-600">Set limits and freeze cards with a single tap in your dashboard.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/virtual-cards')}
                            className="px-10 py-5 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all active:scale-95 text-lg"
                        >
                            Get Your Card
                        </button>
                    </div>

                    {/* Right: Premium Card Stack */}
                    <div className="relative">
                        {/* Dynamic Card Animation Placeholder */}
                        <div className="relative h-[480px] flex items-center justify-center">
                            {/* Card 1: Top (Front) - Black Card */}
                            <div className="absolute z-20 w-84 h-56 bg-gradient-to-br from-gray-900 to-black rounded-[28px] p-8 shadow-2xl transform rotate-[-6deg] -translate-y-12 translate-x-4 group/card1 hover:rotate-0 transition-transform duration-500">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-2">
                                        <img src="/assets/images/flapapaylogoicon.png" className="w-8 h-8 object-contain" alt="FlapaPay" />
                                        <span className="text-white font-black tracking-tight text-lg">FlapaPay</span>
                                    </div>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1200px-Mastercard-logo.svg.png" className="w-10 h-auto opacity-90" alt="Mastercard" />
                                </div>
                                <div className="mb-6">
                                    <p className="text-xl font-black tracking-[0.25em] text-white">4829 5201 8830 1928</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Card Holder</p>
                                        <p className="text-xs font-bold text-white uppercase tracking-wide">ALEX MWANGI</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Expiry</p>
                                            <p className="text-xs font-bold text-white uppercase">12/28</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">CVV</p>
                                            <p className="text-xs font-bold text-white uppercase">***</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Middle - Orange Card */}
                            <div className="absolute z-10 w-84 h-56 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[28px] p-8 shadow-xl transform rotate-[4deg] translate-x-[-20px] transition-transform duration-500">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-2">
                                        <img src="/assets/images/flapapaylogoicon.png" className="w-8 h-8 object-contain brightness-0 invert" alt="FlapaPay" />
                                        <span className="text-white font-black tracking-tight text-lg">FlapaPay</span>
                                    </div>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1200px-Mastercard-logo.svg.png" className="w-10 h-auto opacity-90" alt="Mastercard" />
                                </div>
                                <div className="mb-6">
                                    <p className="text-xl font-black tracking-[0.25em] text-white">9102 4432 0091 7720</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-orange-200 mb-1">Card Holder</p>
                                        <p className="text-xs font-bold text-white uppercase tracking-wide">SARAH KAMARA</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-orange-200 mb-1">Expiry</p>
                                            <p className="text-xs font-bold text-white uppercase">08/27</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-orange-200 mb-1">CVV</p>
                                            <p className="text-xs font-bold text-white uppercase">921</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Bottom - Decorative */}
                            <div className="absolute z-0 w-80 h-52 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-[24px] p-6 shadow-lg transform rotate-[15deg] translate-x-12 translate-y-12 opacity-30"></div>
                        </div>

                        {/* White space indicator */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                            <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
