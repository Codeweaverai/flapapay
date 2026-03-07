import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const CollectionsOverview: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-20">
                <section className="py-24 bg-black overflow-hidden relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center rounded-full px-4 py-1 text-sm font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 mb-6 uppercase tracking-widest">
                                    Payments & Collections
                                </div>
                                <h1 className="text-5xl font-black text-white mb-8 leading-tight">
                                    Collect payments <span className="text-orange-500">seamlessly</span> from anywhere.
                                </h1>
                                <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                                    FlapaPay provides a unified API and dashboard to accept payments via Cards, Mobile Money, and Bank Transfers across Africa and beyond.
                                </p>
                                <div className="flex gap-4">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="bg-white text-black px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-gray-200 transition-colors">
                                        Start Collecting
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/developers')} className="px-8 py-4 rounded-2xl font-black text-white border-white/20 hover:bg-white/10 transition-colors">
                                        View API Docs
                                    </Button>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100 transform rotate-3">
                                    <div className="space-y-6">
                                        <div className="p-6 bg-orange-50 rounded-3xl flex justify-between items-center border border-orange-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-xl">💳</div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Card Payment</p>
                                                    <p className="text-xs text-gray-500">Visa, Mastercard</p>
                                                </div>
                                            </div>
                                            <span className="text-orange-600 font-bold">ZMW 1,250</span>
                                        </div>
                                        <div className="p-6 bg-yellow-50 rounded-3xl flex justify-between items-center border border-yellow-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-white text-xl">📱</div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Mobile Money</p>
                                                    <p className="text-xs text-gray-500">MTN, Airtel</p>
                                                </div>
                                            </div>
                                            <span className="text-yellow-700 font-bold">K 850.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                            {[
                                { title: 'Global Reach', desc: 'Accept payments in 50+ currencies from over 100 countries.', icon: '🌍' },
                                { title: 'Fraud Protection', desc: 'Built-in security and fraud detection for every transaction.', icon: '🛡️' },
                                { title: 'Instant Settlement', desc: 'Get your funds settled according to your business needs.', icon: '⚡' }
                            ].map((item, i) => (
                                <div key={i} className="p-8">
                                    <div className="text-4xl mb-6">{item.icon}</div>
                                    <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-gray-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};
