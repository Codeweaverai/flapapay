import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, BadgeCheck, CreditCard, QrCode, ScanLine, ShieldCheck, Store, Smartphone, TimerReset } from 'lucide-react';

const qrHighlights = [
    {
        title: 'Merchant-linked checkout',
        desc: 'Each scan opens a payment page tied to the merchant account and collection flow.',
        icon: ScanLine,
    },
    {
        title: 'Card and mobile money',
        desc: 'Customers can pay by card or mobile money from the same QR-triggered page.',
        icon: Store,
    },
    {
        title: 'Instant confirmation',
        desc: 'The cashier sees payment status quickly, so receipts and order release stay in sync.',
        icon: TimerReset,
    },
];

const qrWorkflow = [
    {
        step: '01',
        title: 'Display the code',
        desc: 'Print it, pin it at the till, or place it in your checkout screen.',
    },
    {
        step: '02',
        title: 'Customer scans',
        desc: 'The customer opens their phone camera or wallet app and scans the merchant code.',
    },
    {
        step: '03',
        title: 'Payment confirms',
        desc: 'FlapaPay confirms the payment and your cashier can continue the transaction.',
    },
];

const qrUseCases = [
    'Fuel stations',
    'Restaurants and cafes',
    'Retail counters',
    'Field collections',
];

export const QrPaymentsInfo: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-20">
                <section
                    className="relative overflow-hidden bg-black py-24 text-white"
                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.10),_transparent_24%)]" />
                    <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">
                                QR Payments
                            </div>
                            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
                                QR scans that
                                <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300 bg-clip-text text-transparent">
                                    open a merchant payment page.
                                </span>
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
                                Use one visible code to generate a payment page linked to the merchant for collections. Customers can pay by card or mobile money from that page.
                            </p>

                            <div className="mt-10 flex flex-wrap gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/merchant/signup')}
                                    className="rounded-2xl bg-white px-8 py-4 font-black text-black shadow-xl transition-all hover:bg-gray-100"
                                >
                                    Get started
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate('/developers')}
                                    className="rounded-2xl border-2 border-white/20 px-8 py-4 font-black text-white transition-all hover:bg-white/10"
                                >
                                    Integration guide
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-[36px] border border-white/10 bg-white/95 p-4 shadow-[0_40px_120px_-25px_rgba(0,0,0,0.65)]">
                            <div className="rounded-[28px] border border-gray-100 bg-white p-6 text-gray-900">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Merchant QR</p>
                                        <h2 className="mt-2 text-2xl font-black">Scan to open checkout</h2>
                                        <p className="mt-1 text-sm font-medium text-gray-500">Card and mobile-money collections in one flow</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
                                        <QrCode className="h-6 w-6" />
                                    </div>
                                </div>

                                <div className="mt-6 rounded-[28px] border border-gray-100 bg-gray-50 p-6">
                                    <div className="mx-auto max-w-[22rem] rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm">
                                        <img src="/assets/images/qr-payments-merchant.png" alt="Merchant QR code" className="mx-auto h-56 w-56 rounded-[24px] object-contain" />
                                        <div className="mt-5 grid grid-cols-5 gap-2">
                                            {[
                                                { name: 'Visa', src: '/assets/images/visa02.svg', className: 'h-6 w-auto' },
                                                { name: 'Mastercard', src: '/assets/images/MASTERCARD02.svg', className: 'h-7 w-auto' },
                                                { name: 'Airtel', src: '/assets/images/Airtel_Africa_logo.svg', className: 'h-5 w-auto' },
                                                { name: 'MTN', src: '/assets/images/MTN_Logo.svg', className: 'h-5 w-auto' },
                                                { name: 'Zamtel', src: '/assets/images/zamtel.png', className: 'h-6 w-auto' },
                                            ].map((item) => (
                                                <div key={item.name} className="flex h-10 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                                                    <img src={item.src} alt={item.name} className={`${item.className} object-contain`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between rounded-[20px] bg-gray-50 px-4 py-4">
                                    <span className="text-sm font-bold text-gray-500">Payment page</span>
                                    <span className="text-sm font-black text-gray-900">Card · Mobile Money · Merchant linked</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 md:grid-cols-3">
                            {qrHighlights.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="rounded-[28px] border border-gray-100 bg-gray-50/80 p-7 shadow-sm transition-shadow hover:shadow-lg">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="mt-5 text-xl font-black text-gray-900">{item.title}</h3>
                                        <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="bg-zinc-950 py-20 text-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Workflow</p>
                                <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">A payment flow that stays close to the counter.</h2>
                                <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-300">
                                    QR payments are best when the code opens a branded payment page that the merchant controls.
                                </p>
                                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Best for</p>
                                    <ul className="mt-4 space-y-3">
                                        {qrUseCases.map((item) => (
                                            <li key={item} className="flex items-center gap-3 text-sm font-bold text-white/90">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-black">
                                                    <BadgeCheck className="h-4 w-4" />
                                                </span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {qrWorkflow.map((item) => (
                                    <div key={item.step} className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                                        <div className="flex items-start gap-5">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-lg font-black text-black">
                                                {item.step}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black">{item.title}</h3>
                                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300">{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">What it supports</p>
                                <h2 className="mt-4 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">Built for everyday point-of-sale collections.</h2>
                                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
                                    QR payments work well when you need a visible checkout touchpoint that does not slow the cashier down.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    'Card collections',
                                    'Mobile money collections',
                                    'Merchant payment pages',
                                    'Restaurant and retail counters',
                                ].map((item) => (
                                    <div key={item} className="rounded-[24px] border border-gray-100 bg-gray-50 p-5 text-sm font-black text-gray-800 shadow-sm">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-black py-20 text-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="rounded-[40px] border border-white/10 bg-gradient-to-br from-orange-500 to-amber-600 px-8 py-14 text-center md:px-16 md:py-20">
                            <h2 className="text-4xl font-black tracking-tight md:text-5xl">Offer QR checkout without changing your till.</h2>
                            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-orange-50">
                                Use one visible code to receive payment across the counter, at the table, or on a receipt stand.
                            </p>
                            <div className="mt-10 flex flex-wrap justify-center gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/merchant/signup')}
                                    className="rounded-2xl bg-white px-8 py-4 font-black text-black shadow-xl transition-all hover:bg-gray-100"
                                >
                                    Get started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate('/pos-systems')}
                                    className="rounded-2xl border-2 border-white/20 px-8 py-4 font-black text-white transition-all hover:bg-white/10"
                                >
                                    POS systems
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
