import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, CreditCard, Smartphone, ReceiptText, ShieldCheck, ScanLine, Gauge, Repeat2, Layers3 } from 'lucide-react';

const heroStats = [
    { label: 'Cards', value: 'Visa + Mastercard' },
    { label: 'Mobile money', value: 'Airtel, MTN, Zamtel' },
    { label: 'Settlement', value: 'Fast merchant payout' },
];

const collectionSteps = [
    {
        title: 'Collect',
        desc: 'Accept cards, mobile money, and reference-based payments from one clean checkout flow.',
        icon: <CreditCard className="h-5 w-5" />,
    },
    {
        title: 'Verify',
        desc: 'Link verified email, customer details, and payment method for faster repeat checkout.',
        icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
        title: 'Reconcile',
        desc: 'Track status, receipts, and merchant settlement without jumping between systems.',
        icon: <Repeat2 className="h-5 w-5" />,
    },
];

const features = [
    {
        title: 'Unified rails',
        desc: 'Cards, mobile money, QR, and transfer-style collection experiences in one stack.',
        icon: <Layers3 className="h-5 w-5" />,
    },
    {
        title: 'Fast approvals',
        desc: 'Verified checkout states keep the payment path short and reduce re-entry friction.',
        icon: <Gauge className="h-5 w-5" />,
    },
    {
        title: 'Customer friendly',
        desc: 'Auto-saved payment details make repeat checkout feel closer to tap-and-pay.',
        icon: <Smartphone className="h-5 w-5" />,
    },
    {
        title: 'Receipts and history',
        desc: 'Every collection keeps a trail for customer support, operations, and finance teams.',
        icon: <ReceiptText className="h-5 w-5" />,
    },
];

const supportedLogos = [
    { name: 'Visa', src: '/assets/images/visa02.svg', className: 'h-9 w-auto' },
    { name: 'Mastercard', src: '/assets/images/mastercard.svg', className: 'h-11 w-auto' },
    { name: 'Airtel', src: '/assets/images/Airtel_Africa_logo.svg', className: 'h-8 w-auto' },
    { name: 'MTN', src: '/assets/images/MTN_Logo.svg', className: 'h-8 w-auto' },
    { name: 'Zamtel', src: '/assets/images/zamtel.png', className: 'h-9 w-auto' },
];

export const CollectionsOverview: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            className="min-h-screen bg-black font-sans selection:bg-orange-200/30"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
        >
            <Navbar />

            <main className="pt-20">
                <section className="relative overflow-hidden border-b border-white/10 py-24 md:py-32">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_28%)]" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
                    <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
                    <div className="absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-300 backdrop-blur">
                                    Payments & Collections
                                </div>
                                <h1 className="mt-8 max-w-xl text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                                    Collections that feel
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300">
                                        premium at the counter.
                                    </span>
                                </h1>
                                <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300 md:text-xl">
                                    A modern collections stack for businesses that want one flow for cards, mobile money, and repeat payments without the old operational clutter.
                                </p>
                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <Button
                                        size="lg"
                                        onClick={() => navigate('/signup')}
                                        className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                                    >
                                        Start collecting
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/developers')}
                                        className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10"
                                    >
                                        View API docs
                                    </Button>
                                </div>
                                <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {heroStats.map((stat) => (
                                        <div key={stat.label} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-white/95 shadow-lg shadow-black/10 backdrop-blur">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{stat.label}</p>
                                            <p className="mt-2 text-sm font-black text-white">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="rounded-[38px] border border-white/10 bg-white/95 p-4 shadow-[0_50px_120px_-24px_rgba(0,0,0,0.65)]">
                                    <div className="grid gap-4">
                                        <div className="rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
                                                        <CreditCard className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">Card collection</p>
                                                        <p className="text-xs font-semibold text-gray-500">Visa and Mastercard ready</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black text-orange-600">ZMW 1,250</span>
                                            </div>
                                        </div>
                                        <div className="rounded-[30px] border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-sm">
                                                        <Smartphone className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">Mobile money collection</p>
                                                        <p className="text-xs font-semibold text-gray-500">Airtel, MTN, Zamtel</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black text-yellow-700">K 850.00</span>
                                            </div>
                                        </div>
                                        <div className="rounded-[30px] border border-gray-100 bg-white p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
                                                        <ScanLine className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">One unified receipt trail</p>
                                                        <p className="text-xs font-semibold text-gray-500">Check status, confirm, and reconcile</p>
                                                    </div>
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

                <section className="border-b border-white/10 bg-black/40 py-10">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="rounded-[30px] border border-white/10 bg-white/5 px-6 py-6 shadow-2xl shadow-black/20 backdrop-blur">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-xl">
                                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Supported payment networks</p>
                                    <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">
                                        Cards and mobile money operators ready for checkout.
                                    </h2>
                                </div>
                                <p className="max-w-lg text-sm leading-relaxed text-gray-300">
                                    Accept the payment methods customers already use, with a checkout experience built for fast collections and clear operator recognition.
                                </p>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
                                {supportedLogos.map((logo) => (
                                    <div
                                        key={logo.name}
                                        className="flex min-h-[84px] items-center justify-center rounded-[22px] border border-white/10 bg-white/95 px-4 py-4 shadow-lg shadow-black/10 transition-transform duration-200 hover:-translate-y-0.5"
                                    >
                                        <img src={logo.src} alt={`${logo.name} logo`} className={`${logo.className} object-contain`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Collections workflow</p>
                                <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">A cleaner flow from payment to reconciliation.</h2>
                            </div>
                            <p className="max-w-xl text-sm leading-relaxed text-gray-300">
                                The page mirrors how the product should feel: simple to start, clear at the point of payment, and calm when finance needs the trail later.
                            </p>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {collectionSteps.map((step, index) => (
                                <div key={step.title} className="rounded-[30px] border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                            {step.icon}
                                        </div>
                                        <span className="text-sm font-black text-gray-300">0{index + 1}</span>
                                    </div>
                                    <h3 className="mt-5 text-2xl font-black text-gray-900">{step.title}</h3>
                                    <p className="mt-3 text-gray-600 leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            {features.map((feature) => (
                                <div key={feature.title} className="rounded-[30px] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">{feature.title}</h3>
                                            <p className="mt-2 text-gray-600 leading-relaxed">{feature.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-zinc-950 to-black p-8 shadow-2xl shadow-black/30 md:p-10">
                            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Ready to launch</p>
                                    <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Collections built for the counter, the branch, and the finance team.</h2>
                                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                                        Use the same payment infrastructure for in-person card collections, mobile money, and repeat checkout while keeping the visual experience modern and consistent.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Button
                                        size="lg"
                                        onClick={() => navigate('/signup')}
                                        className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                                    >
                                        Open a merchant account
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/pos-systems')}
                                        className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10"
                                    >
                                        View POS systems
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
