import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const SolutionCard: React.FC<{ title: string; desc: string; icon: string; industries: string[]; color: string }> = ({ title, desc, icon, industries, color }) => (
    <div className="group p-10 rounded-[56px] bg-white border border-gray-100 hover:border-orange-500/20 hover:shadow-[0_48px_96px_-24px_rgba(249,115,22,0.1)] hover:-translate-y-4 transition-all duration-700 relative overflow-hidden flex flex-col items-center text-center">
        <div className={`absolute top-0 right-0 w-64 h-64 ${color} opacity-0 group-hover:opacity-10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 transition-opacity duration-700`}></div>

        <div className="w-24 h-24 rounded-[32px] bg-gray-50 flex items-center justify-center text-4xl mb-10 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-sm">
            {icon}
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{title}</h3>
        <p className="text-gray-500 text-xl leading-relaxed mb-10">{desc}</p>

        <div className="mt-auto w-full">
            <div className="flex flex-wrap justify-center gap-3 mb-12">
                {industries.map((ind, i) => (
                    <span key={i} className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-widest border border-gray-100 group-hover:bg-gray-100 transition-colors">
                        {ind}
                    </span>
                ))}
            </div>
            <Button className="w-full bg-black text-white px-8 py-5 rounded-[24px] font-black text-lg hover:bg-orange-500 transition-all active:scale-95 shadow-xl shadow-black/5">
                Learn More
            </Button>
        </div>
    </div>
);

export const SolutionsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-32 bg-black relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500 rounded-full blur-[250px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-black text-orange-400 uppercase tracking-widest mb-10">
                            Our Solutions
                        </div>
                        <h1 className="text-6xl md:text-9xl font-black text-white mb-10 tracking-tight leading-[0.8] animate-in fade-in slide-in-from-bottom-10 duration-1000">
                            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 italic">Every</span> <br className="hidden md:block" /> Ambition.
                        </h1>
                        <p className="text-2xl md:text-3xl text-gray-400 max-w-4xl mx-auto leading-relaxed mb-16 font-medium animate-in fade-in slide-in-from-bottom-10 delay-200 duration-1000">
                            From solo entrepreneurs to pan-African conglomerates, we provide the financial infrastructure to scale without friction.
                        </p>
                    </div>
                </section>

                {/* Solutions Grid */}
                <section className="py-32 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <SolutionCard
                                title="For Startups"
                                desc="Launch faster with developer-first APIs, pre-built checkout UI, and global payment rails designed for scale."
                                icon="🚀"
                                industries={["Fintech", "SaaS", "Direct Consumer", "EdTech"]}
                                color="bg-blue-500"
                            />
                            <SolutionCard
                                title="For Marketplaces"
                                desc="Orchestrate complex split payments, vendor payouts, and platform fees with automated compliance logic."
                                icon="🛍️"
                                industries={["Retail", "Shared Economy", "On-Demand", "B2B"]}
                                color="bg-orange-500"
                            />
                            <SolutionCard
                                title="For Enterprises"
                                desc="Modernize your financial stack with enterprise-grade security, custom reporting, and direct bank rails."
                                icon="🏗️"
                                industries={["Logistics", "Telecom", "Airlines", "Energy"]}
                                color="bg-indigo-500"
                            />
                            <SolutionCard
                                title="For Developers"
                                desc="A complete sandbox environment with detailed logs, SDKs in every language, and real-time support."
                                icon="💻"
                                industries={["Infrastructure", "Open Banking", "Security", "DevOps"]}
                                color="bg-emerald-500"
                            />
                        </div>
                    </div>
                </section>

                {/* Custom Solution CTA */}
                <section className="py-32 bg-black relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(249,115,22,0.15),_transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,_rgba(250,204,21,0.15),_transparent_50%)]"></div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[80px] p-16 md:p-32 text-center text-white">
                            <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tight leading-tight">Need something <span className="text-orange-500">bespoke</span>?</h2>
                            <p className="text-xl md:text-3xl text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed">
                                Our solution architects work directly with large organizations to build custom financial flows and proprietary integrations.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-8 justify-center">
                                <Button size="lg" className="bg-orange-500 text-white px-16 py-7 rounded-3xl font-black shadow-2xl hover:bg-orange-600 transition-all text-2xl active:scale-95">
                                    Talk to an Architect
                                </Button>
                                <Button size="lg" variant="outline" className="px-16 py-7 rounded-3xl font-black border-white/20 text-white hover:bg-white/10 transition-all text-2xl active:scale-95">
                                    View Use Cases
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