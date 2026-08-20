import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, Banknote, FileUp, Layers3, ShieldCheck, Smartphone, Split, Workflow } from 'lucide-react';

const payoutModes = [
    {
        title: 'Bulk uploads',
        desc: 'Upload CSV files and disburse at scale without building a custom tool.',
        icon: <FileUp className="h-5 w-5" />,
    },
    {
        title: 'API payouts',
        desc: 'Trigger bank and mobile-wallet payouts programmatically from your product.',
        icon: <Layers3 className="h-5 w-5" />,
    },
    {
        title: 'Managed workflows',
        desc: 'Add approvals, limits, and payout reconciliation for finance teams.',
        icon: <Workflow className="h-5 w-5" />,
    },
];

const destinations = [
    { title: 'Mobile wallets', desc: 'Airtel, MTN, and other wallet-led disbursements.', icon: <Smartphone className="h-5 w-5" /> },
    { title: 'Bank accounts', desc: 'Direct settlement to bank accounts with clearer payout trails.', icon: <Banknote className="h-5 w-5" /> },
    { title: 'Split flows', desc: 'Useful for marketplaces and multi-party payout logic.', icon: <Split className="h-5 w-5" /> },
];

export const PayoutsOverview: React.FC = () => {
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
                        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-300 backdrop-blur">
                                    Payouts
                                </div>
                                <h1 className="mt-8 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                                    Disburse funds
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300">
                                        with more control.
                                    </span>
                                </h1>
                                <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300 md:text-xl">
                                    Modern payout infrastructure for merchants, marketplaces, and operations teams that need to settle funds to bank accounts and mobile-money wallets without losing visibility.
                                </p>
                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]">
                                        Start paying out
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/developers')} className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10">
                                        View API reference
                                    </Button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="rounded-[38px] border border-white/10 bg-white/95 p-4 shadow-[0_50px_120px_-24px_rgba(0,0,0,0.65)]">
                                    <div className="rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Batch payout</p>
                                                <h2 className="mt-2 text-2xl font-black text-gray-900">24 merchants queued</h2>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
                                                <ArrowRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div className="mt-6 space-y-3">
                                            {[
                                                { name: 'Sarah Mukuka', dest: 'MTN Mobile Money', amount: 'K 1,200.00', status: 'Completed' },
                                                { name: 'John Phiri', dest: 'Airtel Money', amount: 'K 850.00', status: 'Completed' },
                                                { name: 'David Banda', dest: 'ZANACO', amount: 'K 4,500.00', status: 'Queued' },
                                            ].map((item) => (
                                                <div key={item.name} className="flex items-center justify-between rounded-[22px] border border-gray-100 bg-white p-4">
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{item.name}</p>
                                                        <p className="text-xs font-semibold text-gray-500">{item.dest}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-gray-900">{item.amount}</p>
                                                        <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${item.status === 'Completed' ? 'text-emerald-600' : 'text-orange-500'}`}>{item.status}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-3">
                            {payoutModes.map((mode) => (
                                <div key={mode.title} className="rounded-[30px] border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                        {mode.icon}
                                    </div>
                                    <h3 className="mt-5 text-2xl font-black text-gray-900">{mode.title}</h3>
                                    <p className="mt-3 text-gray-600 leading-relaxed">{mode.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-y border-white/10 bg-black/40 py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Supported destinations</p>
                                <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Payouts to bank accounts and mobile-money wallets.</h2>
                            </div>
                            <p className="max-w-xl text-sm leading-relaxed text-gray-300">
                                Mobile wallets, bank accounts, and split destinations all need clean controls. The page now reflects that reality.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {destinations.map((dest) => (
                                <div key={dest.title} className="rounded-[28px] border border-white/10 bg-white/5 p-7 text-white shadow-2xl shadow-black/10 backdrop-blur">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-sm">
                                        {dest.icon}
                                    </div>
                                    <h3 className="mt-5 text-2xl font-black">{dest.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-300">{dest.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-[32px] border border-white/10 bg-white p-7 shadow-2xl shadow-black/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900">Built-in controls</h3>
                                </div>
                                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                                    Use payout validation, reporting, and approval layers that keep operations and finance in sync.
                                </p>
                            </div>
                            <div className="rounded-[32px] border border-white/10 bg-white p-7 shadow-2xl shadow-black/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-600">
                                        <Workflow className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900">Works with real teams</h3>
                                </div>
                                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                                    Whether you upload a CSV or call the API, the payout flow should feel consistent and clear.
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
                                    <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Launch payouts with less operational overhead.</h2>
                                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                                        Keep payout work inside the same financial system you use for collections, settlement, and reporting.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]">
                                        Open an account
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/contact')} className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10">
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
