import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, BadgeCheck, Banknote, FileText, FileUp, LayoutGrid, ReceiptText, ShieldCheck, TimerReset } from 'lucide-react';

const invoicingHighlights = [
    {
        title: 'Invoice creation',
        desc: 'Build branded invoices with line items, tax, discounts, and due dates in one flow.',
        icon: FileText,
    },
    {
        title: 'Payment links',
        desc: 'Attach a checkout link so customers can pay by card or mobile money from the invoice itself.',
        icon: Banknote,
    },
    {
        title: 'Tracking and reminders',
        desc: 'See when an invoice is sent, opened, paid, or overdue without chasing spreadsheets.',
        icon: TimerReset,
    },
];

const invoicingWorkflow = [
    {
        step: '01',
        title: 'Create the invoice',
        desc: 'Add items, set the currency, define the due date, and lock in your terms.',
    },
    {
        step: '02',
        title: 'Send to the customer',
        desc: 'Share by email or payment link so the customer can review and settle in one click.',
    },
    {
        step: '03',
        title: 'Reconcile automatically',
        desc: 'Confirm payment status, update the record, and keep the audit trail in one place.',
    },
];

const invoicingUses = [
    'Professional service billing',
    'Project milestones and retainers',
    'Merchant collections and deposits',
    'Recurring client invoices',
];

export const InvoicingOverview: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-20">
                <section
                    className="relative overflow-hidden bg-black py-24 text-white"
                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_24%)]" />
                    <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">
                                Invoicing
                            </div>
                            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
                                Send invoices that
                                <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300 bg-clip-text text-transparent">
                                    are easy to pay.
                                </span>
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
                                FlapaPay invoicing keeps the document, the payment methods, and the reconciliation trail in one workflow for merchants and service businesses.
                            </p>

                            <div className="mt-10 flex flex-wrap gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/merchant/signup')}
                                    className="rounded-2xl bg-white px-8 py-4 font-black text-black shadow-xl transition-all hover:bg-gray-100"
                                >
                                    Start invoicing
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate('/developers')}
                                    className="rounded-2xl border-2 border-white/20 px-8 py-4 font-black text-white transition-all hover:bg-white/10"
                                >
                                    View API docs
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-[36px] border border-white/10 bg-white/95 p-4 shadow-[0_40px_120px_-25px_rgba(0,0,0,0.65)]">
                            <div className="rounded-[28px] border border-gray-100 bg-white p-6 text-gray-900">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Recent invoice</p>
                                        <h2 className="mt-2 text-2xl font-black">Invoice INV-9042</h2>
                                        <p className="mt-1 text-sm font-medium text-gray-500">Due in 3 days</p>
                                    </div>
                                    <div className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-black text-white shadow-sm">ZMW 24,500</div>
                                </div>

                                <div className="mt-6 grid gap-3">
                                    <div className="flex items-center justify-between rounded-[20px] bg-gray-50 px-4 py-4">
                                        <span className="text-sm font-bold text-gray-500">Customer</span>
                                        <span className="text-sm font-black text-gray-900">Afritech Solutions</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-[20px] bg-gray-50 px-4 py-4">
                                        <span className="text-sm font-bold text-gray-500">Status</span>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">
                                            <BadgeCheck className="h-3.5 w-3.5" />
                                            Pending
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-[24px] border border-gray-100 bg-gray-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Accepted at checkout</p>
                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                                        {[
                                            { name: 'Visa', src: '/assets/images/visa02.svg', className: 'h-8 w-auto' },
                                            { name: 'Mastercard', src: '/assets/images/MASTERCARD02.svg', className: 'h-9 w-auto' },
                                            { name: 'MTN', src: '/assets/images/MTN_Logo.svg', className: 'h-8 w-auto' },
                                            { name: 'Airtel', src: '/assets/images/Airtel_Africa_logo.svg', className: 'h-7 w-auto' },
                                            { name: 'Zamtel', src: '/assets/images/zamtel.png', className: 'h-8 w-auto' },
                                        ].map((item) => (
                                            <div
                                                key={item.name}
                                                className="flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 shadow-sm"
                                            >
                                                <img src={item.src} alt={item.name} className={`${item.className} object-contain`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 md:grid-cols-3">
                            {invoicingHighlights.map((item) => {
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
                                <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Simple enough for operations, structured enough for finance.</h2>
                                <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-300">
                                    The invoice flow keeps your billing process predictable from creation through settlement.
                                </p>
                                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Common use cases</p>
                                    <ul className="mt-4 space-y-3">
                                        {invoicingUses.map((item) => (
                                            <li key={item} className="flex items-center gap-3 text-sm font-bold text-white/90">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-black">
                                                    <FileUp className="h-4 w-4" />
                                                </span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {invoicingWorkflow.map((item) => (
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
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Why teams use it</p>
                                <h2 className="mt-4 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">A cleaner way to bill and collect.</h2>
                                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
                                    Use one page for invoice delivery, payment acceptance, and payment status without switching tools.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    'Branded invoice PDFs',
                                    'Card and mobile-money payment links',
                                    'Due date and reminder tracking',
                                    'Settlement and reconciliation visibility',
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
                            <h2 className="text-4xl font-black tracking-tight md:text-5xl">Ready to invoice with less back and forth?</h2>
                            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-orange-50">
                                Create an invoice once, send it with a payment link, and keep the full payment trail in FlapaPay.
                            </p>
                            <div className="mt-10 flex flex-wrap justify-center gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/merchant/signup')}
                                    className="rounded-2xl bg-white px-8 py-4 font-black text-black shadow-xl transition-all hover:bg-gray-100"
                                >
                                    Start invoicing
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate('/payment-links')}
                                    className="rounded-2xl border-2 border-white/20 px-8 py-4 font-black text-white transition-all hover:bg-white/10"
                                >
                                    Payment links
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
