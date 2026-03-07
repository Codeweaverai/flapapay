import React from 'react';
import { useNavigate } from 'react-router-dom';

export const EmailTransferSection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section id="email-transfer" className="py-24 bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-50/50 -skew-x-12 transform translate-x-20 z-0"></div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Interactive Mockup */}
                    <div className="relative order-2 lg:order-1">
                        <div className="relative bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 border border-gray-100 max-w-md mx-auto transform -rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Send Money</h3>
                                    <p className="text-sm text-gray-500">Instantly via email</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recipient Email</label>
                                    <div className="relative">
                                        <input
                                            disabled
                                            value="mercy.k@flapapay.com"
                                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 transition-all"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <span className="flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount (ZMW)</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">K</span>
                                        <input
                                            disabled
                                            value="2,500"
                                            className="w-full pl-10 pr-5 py-4 bg-gray-50 rounded-2xl border-none font-bold text-xl text-gray-900"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-5 bg-black text-white rounded-2xl font-black shadow-xl hover:shadow-2xl transition-all transform active:scale-95"
                                >
                                    Confirm Transfer
                                </button>
                            </div>

                            {/* Floating "Success" Badge */}
                            <div className="absolute -bottom-6 -right-6 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                                <span className="font-bold">Sent!</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div className="order-1 lg:order-2">
                        <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold text-orange-700 bg-orange-100 mb-8 uppercase tracking-widest">
                            The PayPal of Africa
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 sm:text-5xl mb-8 leading-tight">
                            Send money across Africa as easily as <span className="text-orange-500 underline decoration-orange-200 decoration-8 underline-offset-4">sending an email.</span>
                        </h2>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            No account numbers, no swift codes, no stress. Just enter the recipient's email address and send funds instantly. FlapaPay handles the complex cross-border routing behind the scenes.
                        </p>

                        <ul className="space-y-4 mb-10">
                            {[
                                'Zero-config cross-border transfers',
                                'Real-time settlement to mobile wallets',
                                'Secure end-to-end encryption',
                                'Lowest transaction fees in the region'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all active:scale-95"
                            >
                                Start Sending
                            </button>
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                            >
                                How it works
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
