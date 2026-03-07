import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const ProductCard: React.FC<{
    title: string;
    desc: string;
    icon: string;
    features: string[];
    color: string;
    link: string;
    badge?: string;
}> = ({ title, desc, icon, features, color, link, badge }) => (
    <div className="group relative p-8 md:p-10 rounded-[40px] bg-white border border-gray-100 hover:border-orange-500/20 hover:shadow-[0_32px_64px_-12px_rgba(249,115,22,0.1)] hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full">
        <div className={`absolute top-0 right-0 w-48 h-48 ${color} opacity-0 group-hover:opacity-10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 transition-opacity duration-700`}></div>

        <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-8">
                <div className="w-20 h-20 rounded-[28px] bg-gray-50 flex items-center justify-center text-4xl group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-sm border border-gray-50">
                    {icon}
                </div>
                {badge && (
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest border border-orange-200">
                        {badge}
                    </span>
                )}
            </div>

            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">{title}</h3>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">{desc}</p>

            <div className="mt-auto space-y-6">
                <ul className="space-y-3">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-600 font-medium">
                            <svg className="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                        </li>
                    ))}
                </ul>

                <Link to={link || '#'} className="block">
                    <Button variant="outline" className="w-full justify-between group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                        Explore {title}
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Button>
                </Link>
            </div>
        </div>
    </div>
);

export const ProductsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-orange-100 selection:text-orange-900">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-24 md:py-32 bg-black relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
                        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-[100px] animate-pulse"></div>
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/20 rounded-full blur-[100px]"></div>
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Product Suite 2.0</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                            Financial infrastructure <br />
                            for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">Internet of Africa</span>.
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            A complete suite of certified payment products to accept payments, send payouts, and manage your business finances online.
                        </p>
                    </div>
                </section>

                {/* Products Grid */}
                <section className="py-24 bg-white relative">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <ProductCard
                                title="Payments"
                                desc="Accept credit cards, mobile money, and bank transfers from customers globally with a single integration."
                                icon="💳"
                                features={["Global card acceptance", "Mobile Money (MTN, Airtel)", "Smart fraud protection", "Real-time settlement"]}
                                color="bg-blue-500"
                                link="/payments-overview"
                            />
                            <ProductCard
                                title="App Payouts"
                                desc="Programmatically send money to bank accounts and mobile wallets across 30+ African countries."
                                icon="💸"
                                features={["Instant transfers", "Bulk disbarments", "Beneficiary validation", "Automated retry logic"]}
                                color="bg-green-500"
                                link="/payouts"
                            />
                            <ProductCard
                                title="Issuing"
                                desc="Create and manage virtual cards for your business expenses, employee perks, or on-demand payouts."
                                icon="🃏"
                                features={["Instant virtual cards", "Spending controls", "Real-time transaction data", "Mastercard network"]}
                                color="bg-orange-500"
                                link="/virtual-cards"
                                badge="New"
                            />
                            <ProductCard
                                title="Connect"
                                desc="The programmable payments platform for platforms and marketplaces. Onboard users and split payments."
                                icon="🔗"
                                features={["KYC/KYB onboarding", "Split payments", "Complex routing", "Platform accounts"]}
                                color="bg-indigo-500"
                                link="/merchant/connect"
                            />
                            <ProductCard
                                title="Billing"
                                desc="The fastest way to bill your customers with subscriptions or invoices. Handle upgrades and downgrades."
                                icon="🧾"
                                features={["Recurring billing", "Hosted invoices", "Customer portal", "Usage-based pricing"]}
                                color="bg-pink-500"
                                link="/invoices"
                            />
                            <ProductCard
                                title="Capital"
                                desc="Get fast, flexible financing to grow your business based on your transaction history and performance."
                                icon="📈"
                                features={["Instant offers", "Automatic repayment", "One flat fee", "No collateral needed"]}
                                color="bg-yellow-500"
                                link="#"
                                badge="Coming Soon"
                            />
                        </div>
                    </div>
                </section>

                {/* Developer Experience Section */}
                <section className="py-32 bg-black text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>

                    <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1">
                            <div className="inline-block px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-sm mb-8">
                                $ curl https://api.flapapay.com/v1/charges
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                                Built for <span className="text-orange-500">Developers</span>
                            </h2>
                            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                                We obsess over our API design so you can focus on building your product. robust client libraries, webhooks, and detailed documentation.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button className="bg-white text-black hover:bg-gray-100 font-bold px-8 py-4 rounded-xl">
                                    Read Documentation
                                </Button>
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl">
                                    View API Reference
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-700"></div>
                            <div className="relative bg-[#0d0d0d] rounded-2xl border border-white/10 p-6 font-mono text-sm leading-relaxed overflow-hidden shadow-2xl">
                                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="ml-4 text-gray-500">create-payment.js</span>
                                </div>
                                <div className="space-y-1">
                                    <p><span className="text-purple-400">const</span> <span className="text-blue-400">payment</span> <span className="text-white">=</span> <span className="text-purple-400">await</span> <span className="text-yellow-400">flapa</span>.<span className="text-blue-400">charges</span>.<span className="text-yellow-400">create</span>({'{'}</p>
                                    <p className="pl-4"><span className="text-blue-400">amount</span>: <span className="text-green-400">5000</span>,</p>
                                    <p className="pl-4"><span className="text-blue-400">currency</span>: <span className="text-orange-400">'ZMW'</span>,</p>
                                    <p className="pl-4"><span className="text-blue-400">source</span>: <span className="text-orange-400">'tok_visa'</span>,</p>
                                    <p className="pl-4"><span className="text-blue-400">description</span>: <span className="text-orange-400">'Order #1234'</span>,</p>
                                    <p className="pl-4"><span className="text-blue-400">metadata</span>: {'{'}</p>
                                    <p className="pl-8"><span className="text-blue-400">customer_id</span>: <span className="text-orange-400">'cus_8723'</span></p>
                                    <p className="pl-4">{'}'}</p>
                                    <p>{'});'}</p>
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