/**
 * Structured Midnight Editorial — FlapaPay's public company narrative.
 * Cube-textured hero, warm signal accents, and an asymmetrical editorial flow make operational clarity the central visual theme.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, Compass, Globe2, Layers3, ShieldCheck, Sparkles, Store, Users, WalletCards, Workflow } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const foundations = [
    {
        number: '01',
        title: 'Start with the real workflow',
        description: 'We design around the practical moments that decide whether an operation runs smoothly: receiving a payment, confirming a result, moving funds, and finding the record later.',
        icon: <Store className="h-5 w-5" />,
    },
    {
        number: '02',
        title: 'Make control visible',
        description: 'Money movement should never feel opaque. We favour clear states, deliberate permissions, and information that helps teams understand what happened and what to do next.',
        icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
        number: '03',
        title: 'Leave room to grow',
        description: 'The payment layer must hold up as a business adds channels, people, markets, and more complex operational requirements.',
        icon: <Layers3 className="h-5 w-5" />,
    },
];

const operatingLanes = [
    {
        label: 'Collect',
        title: 'Bring customer payments into one operational flow.',
        description: 'The payment moment should be fast for customers and useful for the team that has to follow it through.',
        icon: <WalletCards className="h-5 w-5" />,
    },
    {
        label: 'Control',
        title: 'Keep the payment trail clear enough to act on.',
        description: 'Statuses, roles, and supporting records should make everyday decisions feel considered instead of improvised.',
        icon: <Workflow className="h-5 w-5" />,
    },
    {
        label: 'Grow',
        title: 'Give ambitious commerce a dependable base to build on.',
        description: 'A merchant should be able to expand without rebuilding the operational layer beneath the business.',
        icon: <Globe2 className="h-5 w-5" />,
    },
];

const standards = [
    { title: 'Practicality', description: 'Clear workflows matter more than decorative complexity.', icon: <Compass className="h-5 w-5" /> },
    { title: 'Craft', description: 'Every interaction should feel deliberate, legible, and ready for real use.', icon: <Sparkles className="h-5 w-5" /> },
    { title: 'People first', description: 'Merchants, finance teams, and support teams deserve tools that respect their time.', icon: <Users className="h-5 w-5" /> },
];

const founders = [
    {
        name: 'Mbolela Pule',
        role: 'Founder',
        initials: 'MP',
        description: 'Focused on product direction, merchant experience, and the broader payment infrastructure strategy.',
    },
    {
        name: 'George Munganga',
        role: 'Co-founder',
        initials: 'GM',
        description: 'Focused on operations, platform reliability, and execution across collections and payouts.',
    },
];

export const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f6f3ed] font-sans text-slate-950 selection:bg-orange-300/50">
            <Navbar />

            <main className="pt-20">
                <section
                    className="relative isolate overflow-hidden bg-[#07090e] py-20 text-white md:py-28"
                    style={{ backgroundImage: "linear-gradient(rgba(7,9,14,.78), rgba(7,9,14,.97)), url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
                >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(249,115,22,.22),transparent_30%),radial-gradient(circle_at_92%_82%,rgba(250,204,21,.14),transparent_26%)]" />
                    <div className="pointer-events-none absolute -right-28 top-16 h-96 w-96 rounded-full bg-orange-500/20 blur-[110px]" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-yellow-400/10 blur-[105px]" />

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,.72fr)] lg:items-end">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-3 border border-white/15 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-orange-200 backdrop-blur-sm">
                                    <span className="h-2 w-2 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300" />
                                    Company / FlapaPay
                                </div>
                                <h1 className="mt-8 text-5xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl md:text-7xl lg:text-[5.45rem]">
                                    Move money without
                                    <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300 bg-clip-text text-transparent"> losing the thread.</span>
                                </h1>
                                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
                                    FlapaPay is building the operational layer behind modern commerce: a clearer way for merchants to collect, control, and grow with money movement at the centre.
                                </p>
                                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="group rounded-none bg-gradient-to-r from-orange-500 via-orange-500 to-yellow-300 px-7 py-5 text-base font-black text-slate-950 shadow-[0_18px_45px_rgba(249,115,22,.24)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]">
                                        Build with FlapaPay <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/careers')} className="rounded-none border-white/25 bg-white/[0.02] px-7 py-5 text-base font-black text-white transition duration-200 hover:bg-white/10 active:scale-[0.98]">
                                        Explore careers
                                    </Button>
                                </div>
                            </div>

                            <aside className="relative border border-white/15 bg-[#0c1019]/85 p-5 shadow-[0_32px_90px_rgba(0,0,0,.48)] backdrop-blur-xl sm:p-7">
                                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-orange-500 via-amber-300 to-yellow-200" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Built from the operation outward</p>
                                <div className="mt-7 border-l border-white/15 pl-5">
                                    <p className="text-sm font-bold text-orange-200">A clear payment layer</p>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-300">Designed to make the flow of money more legible to the people who depend on it.</p>
                                </div>
                                <div className="mt-7 grid gap-px bg-white/10 sm:grid-cols-3">
                                    <div className="bg-[#0c1019] p-4"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Origin</p><p className="mt-2 text-sm font-black text-white">Zambia</p></div>
                                    <div className="bg-[#0c1019] p-4"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Focus</p><p className="mt-2 text-sm font-black text-white">Commerce</p></div>
                                    <div className="bg-[#0c1019] p-4"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Standard</p><p className="mt-2 text-sm font-black text-white">Clarity</p></div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </section>

                <section className="border-b border-black/10 bg-[#f6f3ed] py-16 md:py-24">
                    <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.68fr_1.32fr] lg:px-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Why we exist</p>
                            <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.035em] text-slate-950 md:text-5xl">Payment complexity should not become operating friction.</h2>
                        </div>
                        <div className="max-w-3xl border-l-2 border-orange-500 pl-6 md:pl-9">
                            <p className="text-xl leading-relaxed text-slate-700 md:text-2xl">The difference between a payment feature and a payment operation is everything that happens after someone presses pay. We focus on the workflows that keep teams informed, funds moving, and merchants in control.</p>
                            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500">That means building for the everyday realities of verification, payout timing, reconciliation, customer service, and the decisions that connect them.</p>
                        </div>
                    </div>
                </section>

                <section className="bg-white py-16 md:py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-10 border-b border-slate-200 pb-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
                            <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">How we build</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">A payment system that earns its place in the workflow.</h2></div>
                            <p className="max-w-2xl text-base leading-relaxed text-slate-600">Our product approach stays close to the payment operation itself. Each layer should reduce uncertainty, preserve context, and help businesses move forward with confidence.</p>
                        </div>
                        <div className="divide-y divide-slate-200">
                            {foundations.map((foundation) => (
                                <article key={foundation.number} className="group grid gap-6 py-7 transition-colors md:grid-cols-[82px_minmax(0,.95fr)_minmax(0,1.2fr)_42px] md:items-center">
                                    <p className="text-sm font-black tracking-[0.16em] text-orange-600">{foundation.number}</p>
                                    <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-yellow-300">{foundation.icon}</div><h3 className="text-2xl font-black tracking-[-0.025em] text-slate-950">{foundation.title}</h3></div>
                                    <p className="max-w-xl leading-relaxed text-slate-600">{foundation.description}</p>
                                    <ArrowUpRight className="hidden h-5 w-5 text-orange-500 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 md:block" />
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="relative overflow-hidden bg-[#0a0d13] py-16 text-white md:py-24">
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(249,115,22,.16),transparent_65%)]" />
                    <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-8">
                        <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">The operating layer</p><h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] md:text-5xl">Designed for the work behind the payment.</h2><p className="mt-6 max-w-md leading-relaxed text-slate-300">The product is not only about the point of payment. It is about the trail of context and control that helps a business decide what happens next.</p></div>
                        <div className="border-t border-white/15">
                            {operatingLanes.map((lane, index) => (
                                <article key={lane.label} className="grid gap-5 border-b border-white/15 py-7 sm:grid-cols-[86px_1fr_auto] sm:items-start">
                                    <div className="flex items-center gap-3"><span className="text-xs font-black tracking-[0.18em] text-orange-300">0{index + 1}</span><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-yellow-300 text-slate-950">{lane.icon}</div></div>
                                    <div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{lane.label}</p><h3 className="mt-2 text-2xl font-black tracking-[-0.02em] text-white">{lane.title}</h3><p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{lane.description}</p></div>
                                    <ChevronRight className="hidden h-5 w-5 text-yellow-300 sm:block" />
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-[#f6f3ed] py-16 md:py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-stretch">
                            <div className="relative min-h-[430px] overflow-hidden bg-slate-950">
                                <img src="/assets/images/aboutus.jpg" alt="FlapaPay team" className="absolute inset-0 h-full w-full object-cover opacity-85" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                                <div className="absolute bottom-0 left-0 max-w-lg p-7 text-white md:p-10"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-200">The people behind the platform</p><p className="mt-4 text-3xl font-black leading-tight tracking-[-0.035em] md:text-4xl">Product thinking and operational discipline, held to the same standard.</p></div>
                            </div>
                            <div className="flex flex-col justify-between border border-slate-200 bg-white p-7 md:p-10">
                                <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Founder story</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">A company shaped by the details that make commerce work.</h2><p className="mt-5 leading-relaxed text-slate-600">FlapaPay is shaped by product focus, operational rigour, and a belief that the payments layer should make complex work feel more manageable.</p></div>
                                <div className="mt-10 divide-y divide-slate-200 border-t border-slate-200">
                                    {founders.map((founder) => <div key={founder.name} className="py-5"><div className="flex items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-yellow-300 text-sm font-black text-slate-950">{founder.initials}</div><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-600">{founder.role}</p><h3 className="mt-1 text-xl font-black text-slate-950">{founder.name}</h3></div></div><p className="mt-3 pl-16 text-sm leading-relaxed text-slate-600">{founder.description}</p></div>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-white/10 bg-[#10131a] py-16 text-white md:py-24">
                    <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[.68fr_1.32fr] lg:px-8">
                        <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">Company standards</p><h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] md:text-5xl">The behaviour behind the interface.</h2></div>
                        <div className="grid gap-px bg-white/15 md:grid-cols-3">
                            {standards.map((standard) => <article key={standard.title} className="bg-[#10131a] p-6 md:p-7"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-yellow-300">{standard.icon}</div><h3 className="mt-7 text-xl font-black text-white">{standard.title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-300">{standard.description}</p></article>)}
                        </div>
                    </div>
                </section>

                <section className="bg-white py-16 md:py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="relative overflow-hidden bg-slate-950 p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,.25)] md:p-12 lg:p-16">
                            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-orange-500/25 blur-[90px]" />
                            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
                                <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-200">Work with FlapaPay</p><h2 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.045em] md:text-6xl">Build the payment workflow your operation can depend on.</h2><p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">Whether you are building a checkout, managing collections, or improving financial operations, start with a payment layer designed to stay clear as the business grows.</p></div>
                                <div className="flex flex-col gap-3"><Button size="lg" onClick={() => navigate('/signup')} className="group rounded-none bg-gradient-to-r from-orange-500 to-yellow-300 px-7 py-5 font-black text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]">Create a merchant account <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Button><Button size="lg" variant="outline" onClick={() => navigate('/careers')} className="rounded-none border-white/25 bg-white/[0.03] px-7 py-5 font-black text-white transition duration-200 hover:bg-white/10 active:scale-[0.98]">See open careers</Button></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
