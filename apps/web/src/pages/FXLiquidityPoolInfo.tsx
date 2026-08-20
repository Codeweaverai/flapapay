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
                <section className="relative overflow-hidden bg-[#050505]">
                    <img
                        src="/assets/images/fx-liquidity-showcase.png"
                        alt="FlapaPay FX liquidity dashboard"
                        className="block w-full h-auto object-contain object-center"
                    />
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
