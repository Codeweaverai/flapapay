import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, Fuel, UtensilsCrossed, Store, ScanLine, CreditCard, ShieldCheck, Smartphone, ReceiptText } from 'lucide-react';

const useCases = [
    {
        title: 'Fuel stations',
        desc: 'Fast pump-side collections, cashier reconciliation, and cashless settlement for high-volume forecourts.',
        icon: <Fuel className="w-6 h-6" />,
    },
    {
        title: 'Restaurants',
        desc: 'Tableside checkout, split bills, tips, and instant receipts for dine-in and takeaway.',
        icon: <UtensilsCrossed className="w-6 h-6" />,
    },
    {
        title: 'Retail stores',
        desc: 'Barcode-friendly collections with card and mobile money support for everyday stores.',
        icon: <Store className="w-6 h-6" />,
    },
];

const features = [
    'Card and Mobile Money collections in one POS flow',
    'Receipt and transaction history for every sale',
    'Multi-operator and multi-location reconciliation',
    'Refunds, voids, and manager approvals',
    'Fuel, restaurant, and retail-ready reporting',
    'Quick checkout with QR, tap, and PIN-friendly flows',
];

const supportedLogos = [
    { name: 'Visa', src: '/assets/images/visa02.svg', className: 'h-9 w-auto' },
    { name: 'Mastercard', src: '/assets/images/mastercard.svg', className: 'h-11 w-auto' },
    { name: 'Airtel', src: '/assets/images/Airtel_Africa_logo.svg', className: 'h-8 w-auto' },
    { name: 'MTN', src: '/assets/images/MTN_Logo.svg', className: 'h-8 w-auto' },
    { name: 'Zamtel', src: '/assets/images/zamtel.png', className: 'h-9 w-auto' },
];

const heroStats = [
    { label: 'Unified checkout', value: 'Card + Mobile Money' },
    { label: 'Fast setup', value: 'Deploy in branches' },
    { label: 'Built for growth', value: 'Multi-location ready' },
];

export const PosSystemsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            className="min-h-screen bg-black font-sans selection:bg-orange-200/30"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
        >
            <Navbar />

            <main className="pt-20">
                <section className="relative overflow-hidden border-b border-white/10 py-24 md:py-32">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_28%)]" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
                    <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
                    <div className="absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-300 backdrop-blur">
                                    POS Systems
                                </div>
                                <h1 className="mt-8 max-w-xl text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                                    Premium collections for
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300">
                                        every checkout point.
                                    </span>
                                </h1>
                                <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300 md:text-xl">
                                    A polished POS experience for card and mobile money collections, built to feel fast at the counter and clean in operations.
                                </p>
                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <Button
                                        size="lg"
                                        onClick={() => navigate('/signup')}
                                        className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                                    >
                                        Request POS
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/collections')}
                                        className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10"
                                    >
                                        Explore Collections
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
                                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {[
                                        { label: 'Card', icon: <CreditCard className="h-4 w-4" /> },
                                        { label: 'Mobile', icon: <Smartphone className="h-4 w-4" /> },
                                        { label: 'Scan', icon: <ScanLine className="h-4 w-4" /> },
                                        { label: 'Receipt', icon: <ReceiptText className="h-4 w-4" /> },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white shadow-lg shadow-black/20">
                                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                                {item.icon}
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-300">{item.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="relative mx-auto max-w-6xl">
                                    <div className="absolute left-1/2 top-1/2 hidden h-[72%] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-white/15 to-transparent md:block" />
                                    <div className="grid gap-6 md:grid-cols-2 md:items-end">
                                        <div className="flex flex-col gap-3">
                                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-orange-200 backdrop-blur">
                                                Card collections
                                            </div>
                                            <div className="aspect-square overflow-hidden rounded-[36px] border border-white/10 bg-white p-3 shadow-[0_44px_100px_-28px_rgba(0,0,0,0.72)]">
                                                <img
                                                    src="/assets/images/pos/fuel-pos.png"
                                                    alt="FlapaPay card collections POS"
                                                    className="h-full w-full rounded-[28px] object-contain p-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 md:translate-y-8">
                                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-yellow-200 backdrop-blur">
                                                Mobile money collections
                                            </div>
                                            <div className="aspect-square overflow-hidden rounded-[36px] border border-white/10 bg-white p-3 shadow-[0_44px_100px_-28px_rgba(0,0,0,0.72)]">
                                                <img
                                                    src="/assets/images/pos/mobile-pos.png"
                                                    alt="FlapaPay mobile money collections POS"
                                                    className="h-full w-full rounded-[28px] object-contain p-1"
                                                />
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
                        <div className="grid gap-6 md:grid-cols-3">
                            {useCases.map((item) => (
                                <div key={item.title} className="rounded-[30px] border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                        {item.icon}
                                    </div>
                                    <h3 className="mt-5 text-2xl font-black text-gray-900">{item.title}</h3>
                                    <p className="mt-3 text-gray-600 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-14">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-[34px] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
                                <div className="inline-flex items-center rounded-full bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">
                                    Built for operations
                                </div>
                                <h2 className="mt-4 text-3xl font-black text-gray-900">Everything your cashier needs in one workflow.</h2>
                                <div className="mt-6 grid gap-3">
                                    {features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3 rounded-3xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600">
                                                <ShieldCheck className="h-4 w-4" />
                                            </div>
                                            <p className="text-sm font-semibold leading-relaxed text-gray-700">{feature}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[34px] border border-white/10 bg-gradient-to-br from-zinc-950 to-black p-8 shadow-2xl shadow-black/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">Deployment</p>
                                        <h2 className="mt-2 text-3xl font-black text-white">Fast rollout across your locations.</h2>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center text-black">
                                        <ArrowRight className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="mt-8 space-y-4">
                                    {[
                                        'Configure terminals and cashier roles',
                                        'Connect collections to your merchant account',
                                        'Track every sale with receipts and reports',
                                        'Expand to more branches without changing your stack',
                                    ].map((step, index) => (
                                        <div key={step} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-white">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 font-black text-black">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-200">{step}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 rounded-3xl bg-white/5 p-5 text-sm leading-relaxed text-gray-300">
                                    Ideal for fuel stations, restaurants, retail stores, and service businesses that need a polished payment experience with strong back-office controls.
                                </div>
                                <div className="mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-3">
                                    <img
                                        src="/assets/images/pos/mobile-pos.png"
                                        alt="POS payment interface preview"
                                        className="w-full rounded-[24px] object-cover"
                                    />
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
