import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, Banknote, Building2, CreditCard, Layers3, ReceiptText, ShieldCheck, Smartphone, Store } from 'lucide-react';

const products = [
    {
        title: 'Payments',
        desc: 'Card and mobile money acceptance for checkout, payment links, and in-person collections.',
        icon: <CreditCard className="h-5 w-5" />,
        link: '/payments-overview',
        features: ['Card payments', 'Mobile money', 'Payment links', 'Receipts'],
    },
    {
        title: 'Payouts',
        desc: 'Send funds to bank accounts and mobile wallets with operator-aware payout handling.',
        icon: <Banknote className="h-5 w-5" />,
        link: '/payouts',
        features: ['Bulk payouts', 'Beneficiary checks', 'Retry logic', 'Payout reports'],
    },
    {
        title: 'Issuing',
        desc: 'Issue and manage virtual cards for business spend, customer wallets, and controlled disbursements.',
        icon: <Smartphone className="h-5 w-5" />,
        link: '/virtual-cards',
        badge: 'Cards',
        features: ['Virtual cards', 'Spend controls', 'Instant issuance', 'Mastercard network'],
    },
    {
        title: 'Merchant Hub',
        desc: 'Direct settlement into merchant wallets with hosted checkout, payment operations, and business controls in one workspace.',
        icon: <Building2 className="h-5 w-5" />,
        link: '/merchant/dashboard',
        features: ['Wallet settlement', 'Hosted checkout', 'Business controls', 'Operational reporting'],
    },
    {
        title: 'Billing',
        desc: 'Recurring payments, invoices, and customer payment history for businesses that bill regularly.',
        icon: <ReceiptText className="h-5 w-5" />,
        link: '/invoices',
        features: ['Invoices', 'Subscriptions', 'Customer portal', 'Usage billing'],
    },
    {
        title: 'POS Systems',
        desc: 'In-person collections for fuel stations, restaurants, retail stores, and branch counters.',
        icon: <Store className="h-5 w-5" />,
        link: '/pos-systems',
        features: ['Counter checkout', 'Mobile money', 'Card collections', 'Branch reporting'],
    },
];

const rails = [
    { title: 'Payments that fit your flow', desc: 'Web checkout, payment links, and in-person POS in one stack.' },
    { title: 'Operations that stay readable', desc: 'Receipts, settlement, and reconciliation are kept clear for finance teams.' },
    { title: 'Built for repeat business', desc: 'Verified customer details and saved methods reduce friction on repeat checkout.' },
];

export const ProductsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black font-sans selection:bg-orange-200/30" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            <Navbar />

            <main className="pt-20">
                <section className="relative overflow-hidden border-b border-white/10 py-24 md:py-32">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_28%)]" />
                    <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
                    <div className="absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-300 backdrop-blur">
                                Product suite
                            </div>
                            <h1 className="mt-8 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                                Products built for
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300">
                                    collections, payouts, and growth.
                                </span>
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
                                A practical suite of payment products that maps to real merchant workflows instead of a generic platform overview.
                            </p>

                            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/signup')}
                                    className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                                >
                                    Open an account
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate('/developers')}
                                    className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10"
                                >
                                    Read developer docs
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-3">
                            {rails.map((rail) => (
                                <div key={rail.title} className="rounded-[30px] border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <h2 className="mt-5 text-2xl font-black text-gray-900">{rail.title}</h2>
                                    <p className="mt-3 text-gray-600 leading-relaxed">{rail.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Core products</p>
                                <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">The pieces merchants actually use.</h2>
                            </div>
                            <p className="max-w-xl text-sm leading-relaxed text-gray-300">
                                Each product is framed around a specific workflow, not just a feature list.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {products.map((product) => (
                                <div key={product.title} className="group rounded-[32px] border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20 transition-transform duration-300 hover:-translate-y-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                            {product.icon}
                                        </div>
                                        {product.badge && (
                                            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-orange-700">
                                                {product.badge}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="mt-5 text-2xl font-black text-gray-900">{product.title}</h3>
                                    <p className="mt-3 text-gray-600 leading-relaxed">{product.desc}</p>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {product.features.map((feature) => (
                                            <span key={feature} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-8">
                                        <button onClick={() => navigate(product.link)} className="inline-flex items-center gap-2 text-sm font-black text-gray-900 transition-colors hover:text-orange-600">
                                            Explore {product.title}
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-y border-white/10 bg-black/40 py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 text-white shadow-2xl shadow-black/20 backdrop-blur">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-2xl font-black">Built for real operations</h3>
                                </div>
                                <p className="mt-4 text-sm leading-relaxed text-gray-300">
                                    Products are arranged the way teams use them in practice: accepting money, linking customers, paying out, and reconciling the result.
                                </p>
                            </div>
                            <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 text-white shadow-2xl shadow-black/20 backdrop-blur">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-2xl font-black">Modern checkout, not clutter</h3>
                                </div>
                                <p className="mt-4 text-sm leading-relaxed text-gray-300">
                                    The experience should feel polished on a browser, a cashier terminal, and a mobile device without forcing different mental models.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-zinc-950 to-black p-8 shadow-2xl shadow-black/30 md:p-10">
                            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Next step</p>
                                    <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Pick the product that matches your workflow.</h2>
                                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                                        Whether you are collecting at a counter, sending payouts, or building a marketplace, the stack stays consistent.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Button size="lg" onClick={() => window.location.assign('/signup')} className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]">
                                        Get started
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => window.location.assign('/contact')} className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10">
                                        Talk to us
                                    </Button>
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
