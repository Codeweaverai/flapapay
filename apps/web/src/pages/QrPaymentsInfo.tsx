import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const QrPaymentsInfo: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-24 bg-black overflow-hidden relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="animate-fade-in-up">
                                <div className="inline-flex items-center rounded-full px-4 py-1 text-sm font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 mb-6 uppercase tracking-widest">
                                    Instant Payments
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
                                    Paid in a <span className="text-orange-500">Flash</span> with QR Codes.
                                </h1>
                                <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                                    Scan, Pay, Go. FlapaPay QR codes make point-of-sale and peer-to-peer payments faster and more secure than ever.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="bg-white text-black px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-gray-200 transition-all">
                                        Get Started
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/developers')} className="px-8 py-4 rounded-2xl font-black border-2 border-white/20 text-white hover:bg-white/10 transition-all">
                                        View Integration Guide
                                    </Button>
                                </div>
                            </div>

                            <div className="relative animate-fade-in">
                                <div className="bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100 transform rotate-2 relative z-10">
                                    <div className="flex flex-col items-center">
                                        <div className="mb-8 p-6 bg-orange-50 rounded-[3rem] border-4 border-white shadow-inner">
                                            <div className="w-48 h-48 bg-white p-4 rounded-2xl flex items-center justify-center">
                                                {/* Mock QR Representation */}
                                                <div className="w-full h-full bg-black/5 rounded-lg flex items-center justify-center relative overflow-hidden">
                                                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 p-2 gap-1">
                                                        {[...Array(16)].map((_, i) => (
                                                            <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`} />
                                                        ))}
                                                    </div>
                                                    <div className="w-10 h-10 bg-white rounded-lg z-10 flex items-center justify-center shadow-lg border border-gray-100">
                                                        <span className="text-orange-500 text-lg font-black">FP</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black text-orange-600 uppercase tracking-[0.3em] mb-2 uppercase">Scan to Pay</p>
                                            <h2 className="text-2xl font-black text-gray-900">Mobile Checkout</h2>
                                            <p className="text-gray-500 font-medium text-sm mt-1">Instant Settlement • Zero Friction</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -top-10 -right-10 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl z-0"></div>
                                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl z-0"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Steps Section */}
                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center mb-20 leading-relaxed max-w-2xl mx-auto">
                            <h2 className="text-4xl font-black text-gray-900 mb-6">How it <span className="text-orange-500">Works</span>.</h2>
                            <p className="text-gray-500 text-lg font-bold">Simple, secure, and lightning fast. Just like it should be.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                {
                                    title: 'Generate Your Code',
                                    desc: 'Find your unique payment QR code in your dashboard or settings. Personalize it with your business name.',
                                    icon: '✨',
                                    step: '01'
                                },
                                {
                                    title: 'Present & Scan',
                                    desc: 'Show your code on your smartphone, print it for your shop, or add it to your website checkouts.',
                                    icon: '📷',
                                    step: '02'
                                },
                                {
                                    title: 'Instant Confirmation',
                                    desc: 'Funds are transferred instantly between wallets. Both parties receive real-time notifications.',
                                    icon: '⚡',
                                    step: '03'
                                }
                            ].map((item, i) => (
                                <div key={i} className="group p-10 rounded-[32px] bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute top-6 right-8 text-7xl font-black text-black/5 group-hover:text-orange-500/5 transition-colors">{item.step}</div>
                                    <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                    <h3 className="text-xl font-black text-gray-900 mb-4">{item.title}</h3>
                                    <p className="text-gray-600 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-gray-50">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 font-black">✓</div>
                                    <h4 className="font-black text-gray-900 mb-2">Secure</h4>
                                    <p className="text-xs text-gray-500 font-medium">Encrypted data resolution protects privacy.</p>
                                </div>
                                <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 translate-y-6">
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4 font-black">⚡</div>
                                    <h4 className="font-black text-gray-900 mb-2">Fast</h4>
                                    <p className="text-xs text-gray-500 font-medium">Milliseconds to scan and confirm.</p>
                                </div>
                                <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 font-black">🌍</div>
                                    <h4 className="font-black text-gray-900 mb-2">Inclusive</h4>
                                    <p className="text-xs text-gray-500 font-medium">Works for anyone with a smartphone.</p>
                                </div>
                                <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 translate-y-6">
                                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4 font-black">📈</div>
                                    <h4 className="font-black text-gray-900 mb-2">Scalable</h4>
                                    <p className="text-xs text-gray-500 font-medium">Handles unlimited scans simultaneously.</p>
                                </div>
                            </div>
                            <div className="animate-fade-in-right">
                                <h2 className="text-4xl font-black text-gray-900 mb-6 leading-tight">Payments that move at the <span className="text-orange-500">speed of business</span>.</h2>
                                <p className="text-lg text-gray-600 mb-8 leading-relaxed font-medium">
                                    Say goodbye to long bank account numbers and routing codes. With FlapaPay QR, receiving payment is as simple as taking a photo.
                                </p>
                                <ul className="space-y-4">
                                    {['Zero setup cost for QR payments', 'Downloadable high-resolution QR codes', 'Real-time transaction confirmation', 'Works offline for physical merchants'].map((text, i) => (
                                        <li key={i} className="flex items-center gap-3 font-black text-gray-900 text-sm">
                                            <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-24 bg-black text-white overflow-hidden relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-[48px] p-12 md:p-24 text-center">
                            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Ready to start receiving <br />instant QR payments?</h2>
                            <p className="text-orange-100 text-xl mb-12 max-w-xl mx-auto font-medium">Join the fast-growing network of businesses using FlapaPay QR across the continent.</p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <Button size="lg" onClick={() => navigate('/signup')} className="bg-white text-orange-600 px-10 py-5 rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-lg">
                                    Get Started Free
                                </Button>
                                <Button size="lg" variant="outline" onClick={() => navigate('/about')} className="text-white border-2 border-white/20 hover:bg-white/10 px-10 py-5 rounded-2xl font-black transition-all text-lg">
                                    Our Mission
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
