import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const PaymentLinksOverview: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-20">
                <section className="py-24 bg-black overflow-hidden relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center rounded-full px-4 py-1 text-sm font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 mb-6 uppercase tracking-widest">
                                    No-Code Payments
                                </div>
                                <h1 className="text-5xl font-black text-white mb-8 leading-tight">
                                    Sell online <span className="text-yellow-400">without a website</span> using Payment Links.
                                </h1>
                                <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                                    Create a professional payment page in seconds. Share it via WhatsApp, SMS, or Email and start collecting payments immediately with zero coding required.
                                </p>
                                <div className="flex gap-4">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="bg-yellow-400 text-black px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-yellow-500 transition-colors">
                                        Create Your Link
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/pay-links')} className="px-8 py-4 rounded-2xl font-black border-white/20 text-white hover:bg-white/10 transition-colors">
                                        How it Works
                                    </Button>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="bg-white rounded-[40px] shadow-2xl p-1 shrink-0 overflow-hidden transform -rotate-2">
                                    <div className="bg-gray-50 p-8 text-center border-b border-gray-100">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center mb-4">
                                            <img src="/assets/images/flapapaylogoicon.png" alt="Logo" className="w-10 h-10 object-contain" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">Custom Payment Link</h3>
                                        <p className="text-sm text-indigo-500 font-bold">flapapay.me/store/order782</p>
                                    </div>
                                    <div className="p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Product</span>
                                            <span className="text-gray-900 font-black">Professional Web Set</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-10">
                                            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Total</span>
                                            <span className="text-3xl font-black">K 1,250.00</span>
                                        </div>
                                        <div className="w-full bg-black text-white py-4 rounded-2xl text-center font-black">Pay Now</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="max-w-3xl mx-auto text-center mb-16">
                            <h2 className="text-4xl font-black mb-6">Beautiful checkouts for every platform.</h2>
                            <p className="text-xl text-gray-500 leading-relaxed">Whether you are selling a product, a service, or collecting donations, FlapaPay links are optimized for conversion on any device.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="group p-10 bg-gray-50 rounded-[40px] hover:bg-black hover:text-white transition-all duration-500">
                                <h4 className="text-2xl font-black mb-4">Social Media Selling</h4>
                                <p className="opacity-60 leading-relaxed">The perfect way to sell on Instagram, Facebook, and TikTok. Just paste your link in your bio and you're in business.</p>
                            </div>
                            <div className="group p-10 bg-gray-50 rounded-[40px] hover:bg-black hover:text-white transition-all duration-500">
                                <h4 className="text-2xl font-black mb-4">Invoice Management</h4>
                                <p className="opacity-60 leading-relaxed">Turn any outstanding invoice into a payment link and get paid 2x faster with convenient mobile money options.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};
