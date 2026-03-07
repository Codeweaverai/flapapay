import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const PricingFeature: React.FC<{ title: string; desc: string; icon: string }> = ({ title, desc, icon }) => (
    <div className="flex gap-6 items-start group">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm">
            {icon}
        </div>
        <div>
            <h4 className="text-xl font-black text-gray-900 mb-2">{title}</h4>
            <p className="text-gray-500 leading-relaxed">{desc}</p>
        </div>
    </div>
);

export const PricingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'cards' | 'momo' | 'payouts'>('cards');

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-32 bg-black relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500 rounded-full blur-[200px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-black text-orange-400 uppercase tracking-widest mb-10">
                            Transparent Pricing
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black text-white mb-10 tracking-tight leading-[0.9]">
                            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">Economics</span> for <br className="hidden md:block" /> Global Growth.
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-16">
                            Simple, pay-as-you-go pricing with no hidden fees. Powering businesses of all sizes from startups to enterprises.
                        </p>

                        {/* Pricing Selector Tabs */}
                        <div className="max-w-2xl mx-auto bg-gray-900/50 backdrop-blur-xl p-2 rounded-[32px] shadow-2xl mb-16 flex gap-2 border border-white/10">
                            {[
                                { id: 'cards', label: 'Card Payments', icon: '💳' },
                                { id: 'momo', label: 'Mobile Money', icon: '📲' },
                                { id: 'payouts', label: 'Payouts', icon: '💸' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[24px] font-black text-lg transition-all duration-500 ${activeTab === tab.id
                                        ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Main Display */}
                <section className="py-32 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className="animate-in fade-in slide-in-from-left-10 duration-700">
                                {activeTab === 'cards' && (
                                    <div className="space-y-12">
                                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Global Card Acceptance</h2>
                                        <div className="flex items-baseline gap-4 mb-10">
                                            <span className="text-7xl font-black text-orange-500">2.9%</span>
                                            <span className="text-3xl font-bold text-gray-400">+ $0.30 per transaction</span>
                                        </div>
                                        <div className="space-y-8">
                                            <PricingFeature icon="🌍" title="Local & International" desc="Accept Visa, Mastercard, and American Express from customers anywhere in the world." />
                                            <PricingFeature icon="⚡" title="Instant Settlement" desc="Funds are settled to your FlapaPay wallet immediately after transaction confirmation." />
                                            <PricingFeature icon="🛡️" title="Fraud Protection" desc="Built-in 3D Secure 2.0 and automated fraud detection at no extra cost." />
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'momo' && (
                                    <div className="space-y-12">
                                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Mobile Money Collections</h2>
                                        <div className="flex items-baseline gap-4 mb-10">
                                            <span className="text-7xl font-black text-orange-500">1.8%</span>
                                            <span className="text-3xl font-bold text-gray-400">per transaction</span>
                                        </div>
                                        <div className="space-y-8">
                                            <PricingFeature icon="📱" title="MTN, Airtel, Zamtel" desc="Deep integration with all major African MNOs for seamless collections." />
                                            <PricingFeature icon="📶" title="Offline Capabilities" desc="Support for USSD based collections for users with limited internet connectivity." />
                                            <PricingFeature icon="🔄" title="Real-time Reconciliation" desc="Automatic status updates and ledger management for every mobile wallet transaction." />
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'payouts' && (
                                    <div className="space-y-12">
                                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Mass Payout Infrastructure</h2>
                                        <div className="flex items-baseline gap-4 mb-10">
                                            <span className="text-7xl font-black text-orange-500">$0.10</span>
                                            <span className="text-3xl font-bold text-gray-400">fixed per payout</span>
                                        </div>
                                        <div className="space-y-8">
                                            <PricingFeature icon="🚀" title="Bulk Disbursement" desc="Send funds to thousands of vendors or employees with a single API call." />
                                            <PricingFeature icon="🏛️" title="Direct-to-Bank" desc="Proprietary routing to clear funds to any bank account in Zambia & beyond." />
                                            <PricingFeature icon="💼" title="Treasury Management" desc="Advanced roles and approval workflows for large-scale financial operations." />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-900 rounded-[64px] p-16 text-white relative overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 opacity-10 blur-[100px]"></div>
                                <h3 className="text-3xl font-black mb-10">Everything included:</h3>
                                <ul className="space-y-6">
                                    {[
                                        "Consolidated dashboard for all methods",
                                        "Automated financial reporting & exports",
                                        "Developer-first REST APIs & SDKs",
                                        "Free 24/7 technical support",
                                        "Regular security updates & compliance",
                                        "No recurring monthly or annual fees"
                                    ].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-4 text-gray-300 text-lg">
                                            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-16 pt-16 border-t border-white/10">
                                    <h4 className="text-2xl font-black mb-4">Enterprise Scaling?</h4>
                                    <p className="text-gray-400 mb-10 leading-relaxed text-lg">
                                        Businesses with high transaction volume or unique business models can get custom volume-based pricing.
                                    </p>
                                    <Button className="bg-white text-black px-10 py-5 rounded-2xl font-black w-full text-xl hover:bg-orange-500 hover:text-white transition-all">
                                        Contact Sales
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Virtual Cards Add-on */}
                <section className="py-32 bg-gray-50">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-[80px] p-16 md:p-24 shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                                <div className="flex-1 text-center lg:text-left">
                                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Virtual Card Issuing</h2>
                                    <p className="text-white/80 text-xl md:text-2xl mb-12 leading-relaxed">
                                        Issue instant, secure virtual Mastercards to your customers.
                                        Only <span className="text-white font-black underline underline-offset-8">$0.50 per card</span> created.
                                    </p>
                                    <Button className="bg-black text-white px-12 py-6 rounded-3xl font-black shadow-2xl active:scale-95 transition-all text-xl">
                                        Explore Card API
                                    </Button>
                                </div>
                                <div className="w-full lg:w-1/2 flex justify-center">
                                    <div className="w-96 h-64 bg-black rounded-[24px] border border-gray-800 p-8 shadow-2xl shadow-black/50 overflow-hidden relative group-hover:scale-105 transition-transform duration-700 flex flex-col justify-between">
                                        {/* Subtle internal gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 to-transparent"></div>

                                        <div className="relative z-10 flex justify-between items-start">
                                            <div className="text-white font-black text-xl flex items-center gap-3">
                                                <img
                                                    src="/assets/images/flapapaylogoicon.png"
                                                    alt="FlapaPay"
                                                    className="w-10 h-10 object-contain drop-shadow-md"
                                                />
                                                <span className="tracking-tight">FlapaPay</span>
                                            </div>
                                            {/* Mastercard Logo CSS rendering */}
                                            <div className="flex">
                                                <div className="w-10 h-10 bg-red-500 rounded-full mix-blend-screen opacity-90 -mr-4"></div>
                                                <div className="w-10 h-10 bg-yellow-500 rounded-full mix-blend-screen opacity-90"></div>
                                            </div>
                                        </div>
                                        <div className="relative z-10 text-white font-mono text-2xl tracking-[0.2em] mb-6 drop-shadow-md">
                                            5412 **** **** 4242
                                        </div>
                                        <div className="relative z-10 flex justify-between items-end">
                                            <div>
                                                <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Card Holder</div>
                                                <div className="text-white font-bold tracking-wider">MR JOHN DOE</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest text-right mb-1">Valid Thru</div>
                                                <div className="text-white font-bold tracking-wider text-right">12/28</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};