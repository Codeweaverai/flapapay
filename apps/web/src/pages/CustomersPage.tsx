import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const caseStudies = [
    {
        company: "Zambian Logistics Co.",
        title: "Scaling rural deliveries with instant mobile payouts.",
        metric: "40%",
        metricLabel: "Efficiency Increase",
        description: "How ZLC used FlapaPay's Batch Payouts to pay 500+ drivers across Zambia in under 60 seconds.",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
    },
    {
        company: "ShopRite Africa",
        title: "Unified collections for a multi-country retail giant.",
        metric: "2.5M",
        metricLabel: "Transactions/mo",
        description: "ShopRite integrated FlapaPay Connect to accept 15+ different mobile money wallets through a single API.",
        image: "/assets/images/SHOPRITE.jpg"
    }
];

const partners = [
    { name: "MTN", logo: "/assets/images/MTN_Logo.svg" },
    { name: "Airtel", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Airtel_logo-01.png" },
    { name: "Zamtel", logo: "/assets/images/zamtel.png" },
    { name: "Standard Chartered", logo: "/assets/images/STANCHART.svg" },
    { name: "Absa", logo: "https://cdn.brandfetch.io/idIIZJY7QN/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667792595017" },
    { name: "Indo Zambia Bank", logo: "/assets/images/indozambiabank.png" }
];

export const CustomersPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-20">
                {/* Customers Hero */}
                <section className="py-24 bg-black overflow-hidden">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
                                Powering growth for <br />
                                <span className="text-orange-500">thousands</span> of businesses.
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                                From local SMEs to pan-African enterprises, FlapaPay is the infrastructure behind the fastest-growing companies.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button size="lg" className="bg-orange-500 text-white px-10 py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-xl">
                                    Read Success Stories
                                </Button>
                            </div>
                        </div>

                        {/* Partner Wall */}
                        <div className="bg-white rounded-[48px] p-12 shadow-sm border border-gray-100">
                            <p className="text-center text-sm font-black text-gray-400 uppercase tracking-[0.3em] mb-12">Trusted by global partners</p>
                            <div className="grid grid-cols-2 lg:grid-cols-6 gap-12 items-center">
                                {partners.map((partner, i) => (
                                    <div key={i} className="flex justify-center group cursor-pointer">
                                        <img src={partner.logo} alt={partner.name} className="h-8 md:h-12 w-auto group-hover:scale-110 transition-all duration-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Case Study Spotlight */}
                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="space-y-32">
                            {caseStudies.map((caseStudy, i) => (
                                <div key={i} className={`flex flex-col lg:flex-row gap-20 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                                    <div className="flex-1 relative group">
                                        <div className="aspect-[16/10] rounded-[64px] overflow-hidden shadow-2xl">
                                            <img src={caseStudy.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={caseStudy.company} />
                                        </div>
                                        {/* Metric Badge */}
                                        <div className={`absolute -bottom-10 shadow-2xl bg-white p-8 rounded-[32px] border border-gray-100 group-hover:-translate-y-4 transition-transform duration-500 ${i % 2 === 0 ? '-right-10' : '-left-10'}`}>
                                            <p className="text-5xl font-black text-orange-500 mb-1">{caseStudy.metric}</p>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{caseStudy.metricLabel}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-orange-500 uppercase tracking-widest mb-4">Case Study: {caseStudy.company}</p>
                                        <h3 className="text-4xl font-black text-gray-900 mb-8 leading-tight">{caseStudy.title}</h3>
                                        <p className="text-xl text-gray-500 mb-10 leading-relaxed">{caseStudy.description}</p>
                                        <Button variant="outline" className="px-10 py-5 rounded-2xl font-black border-gray-200 hover:border-orange-500 hover:text-orange-500 transition-all text-lg">
                                            Read Full Story
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonial Section */}
                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="bg-black rounded-[64px] p-12 md:p-24 relative overflow-hidden text-center text-white">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(249,115,22,0.2),_transparent_70%)]"></div>
                            <div className="relative z-10">
                                <span className="text-6xl text-orange-500 font-serif leading-none opacity-50 block mb-8">“</span>
                                <h2 className="text-3xl md:text-5xl font-black mb-12 leading-relaxed italic">
                                    FlapaPay didn't just give us a tool; they gave us a partnership that understands the nuances of African trade.
                                </h2>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden border-2 border-orange-500/20">
                                        <img src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=256" alt="Testimonial" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xl font-black">Samuel Phiri</p>
                                        <p className="text-gray-400 font-bold">CEO, Zambian Express</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 bg-gray-50">
                    <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
                        <h2 className="text-4xl font-black text-gray-900 mb-8">Join our network of innovators.</h2>
                        <p className="text-xl text-gray-500 mb-12">Start accepting payments securely across 50+ countries.</p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Button size="lg" className="bg-orange-500 text-white px-12 py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-xl">
                                Create Account
                            </Button>
                            <Button size="lg" variant="outline" className="px-12 py-5 rounded-2xl font-black bg-white border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-xl">
                                Contact Sales
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};