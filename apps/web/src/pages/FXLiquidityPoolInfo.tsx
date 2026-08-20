import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Check,
    Globe2,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Zap,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const highlights = [
    {
        icon: Globe2,
        label: '50+ markets',
        title: 'One balance, many markets',
        copy: 'Operate across currencies without stitching together a new banking partner for every corridor.',
        tone: 'bg-[#fff8ea] border-[#f2dfb4]',
    },
    {
        icon: Zap,
        label: 'Real-time settlement',
        title: 'Move at the speed of business',
        copy: 'Quotes, conversions, and wallet updates stay in sync so your team can act with confidence.',
        tone: 'bg-[#fff1df] border-[#f5d1a5]',
    },
    {
        icon: ShieldCheck,
        label: 'Auditable by default',
        title: 'Every conversion accounted for',
        copy: 'Double-entry ledgers and clear transaction trails make your treasury easier to understand and govern.',
        tone: 'bg-[#fffaf4] border-[#eedcc8]',
    },
];

const workflow = [
    { step: '01', title: 'Hold local balances', copy: 'Keep operating funds where your customers and teams need them.' },
    { step: '02', title: 'Get a clear quote', copy: 'See your rate, spread, and expected settlement before you confirm.' },
    { step: '03', title: 'Settle instantly', copy: 'Approve the move and update both wallets in one dependable flow.' },
];

export const FXLiquidityPoolInfo: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen overflow-hidden bg-[#fbf8f3] font-sans text-[#0b1715] selection:bg-[#ffe29a] selection:text-[#0b1715]">
            <Navbar />

            <main>
                <section className="relative overflow-hidden bg-[#07110f] text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_10%,rgba(251,146,60,0.26),transparent_28%),radial-gradient(circle_at_6%_74%,rgba(247,165,26,0.16),transparent_32%)]" />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(30deg, rgba(247,165,26,0.9) 12%, transparent 12.5%, transparent 87%, rgba(247,165,26,0.9) 87.5%, rgba(247,165,26,0.9)), linear-gradient(150deg, rgba(247,165,26,0.9) 12%, transparent 12.5%, transparent 87%, rgba(247,165,26,0.9) 87.5%, rgba(247,165,26,0.9)), linear-gradient(30deg, rgba(247,165,26,0.9) 12%, transparent 12.5%, transparent 87%, rgba(247,165,26,0.9) 87.5%, rgba(247,165,26,0.9)), linear-gradient(150deg, rgba(247,165,26,0.9) 12%, transparent 12.5%, transparent 87%, rgba(247,165,26,0.9) 87.5%, rgba(247,165,26,0.9)), linear-gradient(60deg, rgba(255,255,255,0.08) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.08) 75%)', backgroundPosition: '0 0, 0 0, 26px 45px, 26px 45px, 0 0', backgroundSize: '52px 90px' }} />
                    <div className="absolute -right-24 top-32 h-80 w-80 rounded-full border border-[#f7b63b]/15" />
                    <div className="absolute -right-10 top-48 h-56 w-56 rounded-full border border-[#ff9f2f]/20" />

                    <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-28 lg:px-8 lg:pb-28 lg:pt-36">
                        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
                            <div className="max-w-xl">
                                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#f7b63b]/30 bg-white/[0.06] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#ffd66a]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    FX liquidity, simplified
                                </div>
                                <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.65rem]">
                                    Your money should move as fast as your business.
                                </h1>
                                <p className="mt-7 max-w-lg text-lg leading-8 text-white/65 sm:text-xl">
                                    Hold global balances, exchange with clarity, and settle locally through one treasury layer built for modern African commerce.
                                </p>
                                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        to="/signup/individual"
                                        className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#f8b51b] via-[#f59a17] to-[#ef6c14] px-6 py-3.5 text-sm font-extrabold text-[#17110a] shadow-[0_12px_34px_rgba(245,145,24,0.3)] transition hover:-translate-y-0.5 hover:from-[#ffc33d] hover:via-[#ff9f1f] hover:to-[#f57918]"
                                    >
                                        Start transacting
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/developers')}
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/[0.09]"
                                    >
                                        Explore the platform
                                        <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-white/45">
                                    <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#ffd66a]" /> Multi-currency wallets</span>
                                    <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#ffd66a]" /> Transparent quotes</span>
                                    <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#ffd66a]" /> Built-in audit trail</span>
                                </div>
                            </div>

                            <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
                                <div className="absolute -inset-8 rounded-[3rem] bg-[#f7a51a]/10 blur-3xl" />
                                <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.08] p-3 shadow-2xl backdrop-blur-xl">
                                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs font-semibold text-white/55">
                                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ffd66a] shadow-[0_0_14px_rgba(255,214,106,0.9)]" /> Treasury workspace</div>
                                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Live view</span>
                                    </div>
                                    <div className="overflow-hidden rounded-[1.4rem] bg-[#fff8ea]">
                                        <img
                                            src="/assets/images/fx-liquidity-showcase.png"
                                            alt="FlapaPay FX liquidity dashboard showing a USD to ZMW conversion"
                                            className="block h-auto w-full object-cover object-center"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 px-1 pt-3">
                                        <div className="rounded-2xl bg-white/[0.07] px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Currencies</p><p className="mt-1 text-lg font-black text-white">14+</p></div>
                                        <div className="rounded-2xl bg-white/[0.07] px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Settlement</p><p className="mt-1 text-lg font-black text-white">Instant</p></div>
                                        <div className="rounded-2xl bg-white/[0.07] px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Ledger</p><p className="mt-1 text-lg font-black text-white">Double-entry</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-b border-[#eadfce] bg-white">
                    <div className="mx-auto grid max-w-7xl gap-0 px-6 lg:grid-cols-3 lg:px-8">
                        <div className="flex items-center gap-4 border-b border-[#eee5d9] py-6 lg:border-b-0 lg:border-r lg:py-7 lg:pr-8">
                            <div className="rounded-2xl bg-[#fff2d8] p-3 text-[#d9870d]"><Activity className="h-5 w-5" /></div>
                            <div><p className="text-2xl font-black tracking-tight text-[#0b1715]">Real-time</p><p className="text-sm font-medium text-[#658077]">quote-to-settlement flow</p></div>
                        </div>
                        <div className="flex items-center gap-4 border-b border-[#eee5d9] py-6 lg:border-b-0 lg:border-r lg:px-8 lg:py-7">
                            <div className="rounded-2xl bg-[#fff2d8] p-3 text-[#d9870d]"><Globe2 className="h-5 w-5" /></div>
                            <div><p className="text-2xl font-black tracking-tight text-[#0b1715]">Global-ready</p><p className="text-sm font-medium text-[#658077]">local rails, one control layer</p></div>
                        </div>
                        <div className="flex items-center gap-4 py-6 lg:py-7 lg:pl-8">
                            <div className="rounded-2xl bg-[#fff0e0] p-3 text-[#e4771b]"><LockKeyhole className="h-5 w-5" /></div>
                            <div><p className="text-2xl font-black tracking-tight text-[#0b1715]">Auditable</p><p className="text-sm font-medium text-[#658077]">by design, not afterthought</p></div>
                        </div>
                    </div>
                </section>

                <section className="bg-white px-6 py-24 lg:px-8 lg:py-32">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#d88910]">Designed for control</p>
                                <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[#0b1715] sm:text-5xl">Treasury clarity without the operational drag.</h2>
                            </div>
                            <p className="max-w-2xl text-lg leading-8 text-[#60756c] lg:justify-self-end">FlapaPay turns foreign exchange from a fragmented back-office task into a simple, visible workflow your finance and product teams can trust.</p>
                        </div>
                        <div className="mt-14 grid gap-5 md:grid-cols-3">
                            {highlights.map(({ icon: Icon, label, title, copy, tone }) => (
                                <article key={title} className={`rounded-[2rem] border p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#9b6515]/[0.12] ${tone}`}>
                                    <div className="flex items-center justify-between"><div className="rounded-2xl bg-white p-3 text-[#d88910] shadow-sm"><Icon className="h-5 w-5" /></div><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#759086]">{label}</span></div>
                                    <h3 className="mt-12 text-2xl font-black tracking-[-0.035em] text-[#0b1715]">{title}</h3>
                                    <p className="mt-4 leading-7 text-[#60756c]">{copy}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-[#fbf8f3] px-6 py-24 lg:px-8 lg:py-32">
                    <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#d88910]">A calmer way to convert</p>
                            <h2 className="mt-4 max-w-xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-[#0b1715] sm:text-5xl">Make every currency move feel intentional.</h2>
                            <p className="mt-6 max-w-lg text-lg leading-8 text-[#60756c]">From funding a local wallet to paying out across borders, the same three-step flow keeps your teams aligned and your margins visible.</p>
                            <div className="mt-10 space-y-7">
                                {workflow.map(({ step, title, copy }) => (
                                    <div key={step} className="flex gap-5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f0c66d] bg-white text-xs font-black text-[#c67708]">{step}</div>
                                        <div><h3 className="text-lg font-black text-[#0b1715]">{title}</h3><p className="mt-1.5 leading-7 text-[#60756c]">{copy}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative rounded-[2rem] border border-[#eadfce] bg-white p-5 shadow-[0_22px_70px_rgba(139,87,20,0.1)] sm:p-7">
                            <div className="flex items-start justify-between border-b border-[#eee5d9] pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b9187]">Indicative quote</p><p className="mt-2 text-2xl font-black tracking-tight text-[#0b1715]">USD → ZMW</p></div><div className="rounded-full bg-[#fff1d5] px-3 py-1.5 text-xs font-bold text-[#b97206]">Ready to settle</div></div>
                            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-3"><div><p className="text-xs font-bold text-[#7b9187]">You send</p><p className="mt-2 text-3xl font-black tracking-tight text-[#0b1715]">$2,500</p><p className="mt-1 text-sm font-semibold text-[#7b9187]">USD wallet</p></div><RefreshCw className="mb-3 h-5 w-5 text-[#efa01c]" /><div className="text-right"><p className="text-xs font-bold text-[#7b9187]">Recipient gets</p><p className="mt-2 text-3xl font-black tracking-tight text-[#0b1715]">K48,850</p><p className="mt-1 text-sm font-semibold text-[#7b9187]">ZMW wallet</p></div></div>
                            <div className="mt-7 rounded-2xl bg-[#fbf8f3] p-4"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-[#60756c]">Indicative rate</span><span className="font-black text-[#0b1715]">1 USD = 19.54 ZMW</span></div><div className="mt-3 flex items-center justify-between text-sm"><span className="font-semibold text-[#60756c]">Estimated arrival</span><span className="font-black text-[#d88910]">Instant</span></div></div>
                            <button type="button" onClick={() => navigate('/signup/individual')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b1715] px-5 py-4 text-sm font-extrabold text-white transition hover:bg-[#2a1b0b]">Open your treasury workspace <ArrowRight className="h-4 w-4" /></button>
                            <p className="mt-4 text-center text-[11px] font-medium leading-5 text-[#9d8b76]">Illustrative quote for product demonstration. Final pricing is shown before you confirm.</p>
                        </div>
                    </div>
                </section>

                <section className="bg-[#0b1715] px-6 py-24 text-white lg:px-8 lg:py-28">
                    <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffd66a]">One platform. More room to grow.</p><h2 className="mt-4 text-4xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl">Give your money a better operating system.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-white/60">Bring balances, payouts, payments, and reporting together with the infrastructure your next market expects.</p></div>
                        <div className="flex flex-col gap-3 sm:flex-row"><Link to="/signup/individual" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f8b51b] via-[#f59a17] to-[#ef6c14] px-6 py-3.5 text-sm font-extrabold text-[#17110a] transition hover:from-[#ffc33d] hover:via-[#ff9f1f] hover:to-[#f57918]">Create your account <ArrowRight className="h-4 w-4" /></Link><Link to="/developers" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/[0.08]">Read the docs <ArrowUpRight className="h-4 w-4" /></Link></div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
