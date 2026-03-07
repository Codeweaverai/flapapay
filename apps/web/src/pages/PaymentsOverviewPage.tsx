import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const PaymentsOverviewPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-20">
                {/* Payments Hero */}
                <section className="py-24 bg-black text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500 rounded-full blur-[150px] opacity-20"></div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div>
                                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-bold text-orange-400 uppercase tracking-widest mb-8">
                                    Core Payments
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
                                    Unify your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">entire</span> payment stack.
                                </h1>
                                <p className="text-xl md:text-2xl text-gray-400 leading-relaxed mb-12">
                                    From local mobile money in Lusaka to global card payments in London. FlapaPay is the only API you'll ever need.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="bg-orange-500 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-xl">
                                        Accept Payments Now
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/developers')} className="px-10 py-5 rounded-2xl font-black border-white/20 text-white hover:bg-white/10 active:scale-95 transition-all text-xl">
                                        Read API Docs
                                    </Button>
                                </div>
                            </div>
                            <div className="relative lg:block hidden">
                                <div className="bg-gradient-to-br from-gray-900 to-black rounded-[64px] p-12 border border-white/10 shadow-2xl">
                                    <div className="space-y-6">
                                        {[
                                            { name: 'MTN Mobile Money', icon: '📱', color: 'bg-yellow-400' },
                                            { name: 'Visa & Mastercard', icon: '💳', color: 'bg-orange-500' },
                                            { name: 'Bank Transfer (EFT)', icon: '🏛️', color: 'bg-blue-500' },
                                            { name: 'Airtel Money', icon: '📱', color: 'bg-red-500' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-xl`}>{item.icon}</div>
                                                    <p className="font-bold text-lg">{item.name}</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-gray-900 mb-4">Enterprise-grade capabilities.</h2>
                            <p className="max-w-2xl mx-auto text-gray-500">Built for reliability, speed, and absolute security at scale.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                { title: 'Local Expertise', desc: 'Direct integrations with all major African MNOs and banks for maximum reliability.', icon: '📍' },
                                { title: 'Global Reach', desc: 'Settle in USD, GBP, or EUR and accept payments from over 135+ countries.', icon: '🌍' },
                                { title: 'No-Code Tools', desc: 'Not a developer? Use our dashboard to create links and manage subscriptions.', icon: '🛠️' },
                                { title: 'Smart Routing', desc: 'Automatically route transactions through the path with the highest success rate.', icon: '🔀' },
                                { title: 'Fraud Detection', desc: 'Bank-grade AI that screens every transaction in real-time for security.', icon: '🛡️' },
                                { title: 'Instant Webhooks', desc: 'Get real-time updates for every payment, refund, and chargeback.', icon: '⚡' }
                            ].map((feature, i) => (
                                <div key={i} className="group">
                                    <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-3xl mb-8 group-hover:bg-black group-hover:text-white transition-all duration-300">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-4">{feature.title}</h3>
                                    <p className="text-gray-500 leading-relaxed text-lg">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 bg-gray-50">
                    <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
                        <div className="bg-orange-500 rounded-[64px] p-16 md:p-24 text-white shadow-2xl shadow-orange-500/30">
                            <h2 className="text-4xl md:text-6xl font-black mb-10 leading-tight">Ready to power your payments?</h2>
                            <p className="text-xl mb-12 opacity-90">Start growing your business with FlapaPay today. Registration takes less than 2 minutes.</p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Button size="lg" onClick={() => navigate('/signup')} className="bg-black text-white px-12 py-5 rounded-2xl font-black shadow-2xl active:scale-95 transition-all text-xl">
                                    Get Started
                                </Button>
                                <Button size="lg" variant="outline" className="px-12 py-5 rounded-2xl font-black border-white/20 text-white hover:bg-white/10 active:scale-95 transition-all text-xl">
                                    Contact Sales
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
