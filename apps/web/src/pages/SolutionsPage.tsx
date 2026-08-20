import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, Banknote, Building2, CreditCard, Layers3, ReceiptText, ShieldCheck, Smartphone, Store, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const solutionGroups = [
    {
        title: 'Checkout and POS',
        desc: 'Card and mobile money collections for branches, counters, field sales, and in-person payments.',
        icon: <CreditCard className="h-5 w-5" />,
        items: ['POS Systems', 'Payment Links', 'Card payments', 'Mobile money'],
    },
    {
        title: 'Marketplaces',
        desc: 'Merchant onboarding, wallet settlement, and controlled payouts for multi-party platforms.',
        icon: <Layers3 className="h-5 w-5" />,
        items: ['Vendor payouts', 'Wallet settlement', 'Merchant onboarding', 'Compliance flows'],
    },
    {
        title: 'Business operations',
        desc: 'Recurring collections, invoicing, and settlement tools for finance teams.',
        icon: <Banknote className="h-5 w-5" />,
        items: ['Subscriptions', 'Invoices', 'Mass payouts', 'Reconciliation'],
    },
    {
        title: 'Retail and services',
        desc: 'Collections built for fuel stations, restaurants, logistics, service desks, and stores.',
        icon: <Store className="h-5 w-5" />,
        items: ['Fuel stations', 'Restaurants', 'Retail stores', 'Service desks'],
    },
];

const workflow = [
    {
        title: 'Choose the payment path',
        desc: 'Use checkout links, POS, invoices, or marketplace flows depending on the customer touchpoint.',
        icon: <WalletCards className="h-5 w-5" />,
    },
    {
        title: 'Verify and link',
        desc: 'Email verification and saved payment details keep repeat checkout fast without losing control.',
        icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
        title: 'Settle and reconcile',
        desc: 'Track receipts, confirmations, and payouts in a way finance can actually use.',
        icon: <ReceiptText className="h-5 w-5" />,
    },
];

const highlights = [
    { label: 'Unified rails', value: 'Cards, mobile money, invoices' },
    { label: 'Operational control', value: 'Approvals, reconciliation, payout tracking' },
    { label: 'Fast repeat checkout', value: 'Verified details saved for reuse' },
];

export const SolutionsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            className="min-h-screen bg-black font-sans selection:bg-orange-200/30"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
        >
            <Navbar />

            <main className="pt-20">
                <section className="relative overflow-hidden border-b border-white/10 py-24 md:py-32">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_28%)]" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
                    <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
                    <div className="absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-300 backdrop-blur">
                                    Solutions
                                </div>
                                <h1 className="mt-8 max-w-2xl text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                                    Real payment solutions for
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300">
                                        real business workflows.
                                    </span>
                                </h1>
                                <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300 md:text-xl">
                                    Built for the way merchants actually collect money: at the counter, in the field, in a marketplace, or from a recurring customer relationship.
                                </p>

                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <Button
                                        size="lg"
                                        onClick={() => navigate('/signup')}
                                        className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                                    >
                                        Talk to sales
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/developers')}
                                        className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10"
                                    >
                                        View developer docs
                                    </Button>
                                </div>

                                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                                    {highlights.map((item) => (
                                        <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-white/95 shadow-lg shadow-black/10 backdrop-blur">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{item.label}</p>
                                            <p className="mt-2 text-sm font-black text-white">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="rounded-[38px] border border-white/10 bg-white/95 p-4 shadow-[0_50px_120px_-24px_rgba(0,0,0,0.65)]">
                                    <div className="grid gap-4">
                                        <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Collections</p>
                                                    <p className="mt-2 text-lg font-black text-gray-900">Payments that link to verified customers</p>
                                                </div>
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
                                                    <CreditCard className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-[28px] border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-600">Saved details</p>
                                                    <p className="mt-2 text-lg font-black text-gray-900">Faster checkout on repeat visits</p>
                                                </div>
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-sm">
                                                    <Smartphone className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-[28px] border border-gray-100 bg-white p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Control</p>
                                                    <p className="mt-2 text-lg font-black text-gray-900">Receipts, settlement, and reconciliation</p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">What we solve</p>
                                <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">One platform. Multiple ways to collect.</h2>
                            </div>
                            <p className="max-w-xl text-sm leading-relaxed text-gray-300">
                                The site should read like a set of practical product choices, not a generic marketing grid.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {solutionGroups.map((group) => (
                                <div key={group.title} className="rounded-[30px] border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                            {group.icon}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Solution</span>
                                    </div>
                                    <h3 className="mt-5 text-2xl font-black text-gray-900">{group.title}</h3>
                                    <p className="mt-3 text-gray-600 leading-relaxed">{group.desc}</p>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {group.items.map((item) => (
                                            <span
                                                key={item}
                                                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-y border-white/10 bg-black/40 py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-3">
                            {workflow.map((step, index) => (
                                <div key={step.title} className="rounded-[28px] border border-white/10 bg-white/5 p-7 text-white shadow-2xl shadow-black/10 backdrop-blur">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                            {step.icon}
                                        </div>
                                        <span className="text-sm font-black text-gray-500">0{index + 1}</span>
                                    </div>
                                    <h3 className="mt-5 text-2xl font-black">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-300">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-[30px] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900">Trusted operational controls</h3>
                                </div>
                                <p className="mt-4 text-gray-600 leading-relaxed">
                                    The platform is designed to support real operations: saved methods, clear settlement states, payout visibility, and a trail finance teams can trust.
                                </p>
                            </div>

                            <div className="rounded-[30px] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-600">
                                        <Store className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900">Built for real merchants</h3>
                                </div>
                                <p className="mt-4 text-gray-600 leading-relaxed">
                                    Fuel stations, restaurants, retail counters, service desks, and marketplaces all need different flows. This page now reflects that reality.
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
                                    <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Choose the solution that matches your workflow.</h2>
                                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                                        Start with POS, payment links, marketplaces, or invoices, then expand as your operation grows.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Button
                                        size="lg"
                                        onClick={() => navigate('/signup')}
                                        className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                                    >
                                        Get started
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/contact')}
                                        className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10"
                                    >
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
