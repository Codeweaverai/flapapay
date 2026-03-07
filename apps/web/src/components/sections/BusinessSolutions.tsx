import React from 'react';
import { useNavigate } from 'react-router-dom';

export const BusinessSolutions: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section id="business-solutions" className="py-24 bg-white overflow-hidden relative">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Content */}
                    <div className="max-w-xl">
                        <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold text-orange-700 bg-orange-100 mb-8 uppercase tracking-widest">
                            Business Solutions
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 sm:text-5xl mb-8 leading-tight">
                            Scale your business with <span className="text-orange-500">Unified Payments</span> across Africa.
                        </h2>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Collect payments from customers, manage collections, and handle payouts to mobile money and bank accounts instantly. All with a single integration.
                        </p>

                        <div className="space-y-6 mb-12">
                            {[
                                { title: 'Payment Links', desc: 'Create and share professional checkout links via WhatsApp, SMS, or Email.', icon: '🔗' },
                                { title: 'Seamless Collections', desc: 'Accept payments via Mobile Money (MTN, Airtel) and Cards effortlessly.', icon: '💰' },
                                { title: 'Mass Payouts', desc: 'Disburse funds to thousands of vendors and employees in seconds.', icon: '🏦' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-3xl hover:bg-orange-50 transition-colors">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shrink-0 text-xl shadow-lg shadow-yellow-200">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                                        <p className="text-gray-500 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/signup')}
                            className="px-10 py-5 bg-black text-white rounded-2xl font-black shadow-xl hover:shadow-2xl transition-all active:scale-95 text-lg"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Right: Payment Experience Mockup */}
                    <div className="relative">
                        <div className="bg-white rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden relative transform rotate-1">
                            {/* Header */}
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                                        <img src="/assets/images/flapapaylogoicon.png" className="w-6 h-6 object-contain" alt="FlapaPay" />
                                    </div>
                                    <span className="font-black text-xl tracking-tighter">FLAPAPAY</span>
                                </div>
                                <span className="px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase tracking-widest">Active Partner</span>
                            </div>

                            {/* Body */}
                            <div className="p-10">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-8">Select Payment Method</p>

                                <div className="space-y-4 mb-10">
                                    {/* MTN Mobile Money */}
                                    <div className="p-6 bg-white border-2 border-yellow-400 rounded-3xl flex items-center justify-between shadow-lg shadow-yellow-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center p-2">
                                                <img src="/assets/images/MTN_Logo.svg" className="w-full h-full object-contain" alt="MTN" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900">MTN Mobile Money</p>
                                                <p className="text-xs text-gray-500">Fast and Secure</p>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full border-4 border-yellow-400 bg-white"></div>
                                    </div>

                                    {/* Airtel Money */}
                                    <div className="p-6 bg-gray-50 border border-gray-100 rounded-3xl flex items-center justify-between opacity-80">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 border border-gray-100">
                                                <img src="/assets/images/Airtel_Africa_logo.svg" className="w-full h-full object-contain" alt="Airtel" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">Airtel Money</p>
                                                <p className="text-xs text-gray-500">Pay with Airtel Wallet</p>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full border border-gray-300 bg-white"></div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/pay-links')}
                                    className="w-full py-5 bg-yellow-400 text-black font-black rounded-2xl shadow-lg shadow-yellow-200 hover:bg-yellow-500 transition-all"
                                >
                                    Confirm Payment (K 1,250.00)
                                </button>
                            </div>
                        </div>

                        {/* Floating elements */}
                        <div className="absolute -top-10 -right-10 bg-black text-white p-6 rounded-3xl shadow-2xl z-20 animate-bounce">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Payouts</p>
                            <p className="text-2xl font-black text-yellow-400">K 145,000</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Background elements */}
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-yellow-50/30 -skew-y-6 transform translate-y-32 z-0"></div>
        </section>
    );
};
