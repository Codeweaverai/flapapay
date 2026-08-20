import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Building2, Compass, ShieldCheck, Sparkles, Store, Users } from 'lucide-react';

const principles = [
    {
        title: 'Built for real operations',
        desc: 'We focus on the work merchants actually do: collecting, verifying, settling, and reconciling money.',
        icon: <Store className="h-5 w-5" />,
    },
    {
        title: 'Designed for trust',
        desc: 'The checkout and reporting experience should feel predictable, auditable, and calm for both merchants and customers.',
        icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
        title: 'Made for growth',
        desc: 'The product needs to scale from a single checkout flow to branch, payout, and marketplace operations.',
        icon: <Building2 className="h-5 w-5" />,
    },
];

const values = [
    { title: 'Practicality', desc: 'We prefer clear workflows over decorative complexity.', icon: <Compass className="h-5 w-5" /> },
    { title: 'Craft', desc: 'Interfaces should feel intentional, polished, and easy to use.', icon: <Sparkles className="h-5 w-5" /> },
    { title: 'People first', desc: 'Merchants, support teams, and finance operators all need usable tools.', icon: <Users className="h-5 w-5" /> },
];

const founders = [
    {
        name: 'Mbolela Pule',
        role: 'Founder',
        initials: 'MP',
        bio: 'Focused on product direction, merchant experience, and the broader payment infrastructure strategy.',
    },
    {
        name: 'George Munganga',
        role: 'Co-founder',
        initials: 'GM',
        bio: 'Focused on operations, platform reliability, and execution across collections and payouts.',
    },
];

export const AboutPage: React.FC = () => {
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
                                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-300 backdrop-blur">
                                    About FlapaPay
                                </div>
                                <h1 className="mt-8 max-w-2xl text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                                    Building a clearer
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300">
                                        payments stack for merchants.
                                    </span>
                                </h1>
                                <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300 md:text-xl">
                                    FlapaPay is focused on the unglamorous but important work behind payments: collecting money, verifying customers, moving funds, and keeping the trail usable.
                                </p>
                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <Button
                                        size="lg"
                                        onClick={() => navigate('/signup')}
                                        className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                                    >
                                        Join FlapaPay
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/contact')}
                                        className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10"
                                    >
                                        Contact us
                                    </Button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/95 shadow-[0_50px_120px_-24px_rgba(0,0,0,0.65)]">
                                    <img
                                        src="/assets/images/aboutus.jpg"
                                        alt="FlapaPay team"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-6 left-6 rounded-[24px] border border-white/10 bg-black/90 px-5 py-4 text-white shadow-2xl shadow-orange-500/20 backdrop-blur">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Founded in Zambia</p>
                                    <p className="mt-1 text-lg font-black text-white">Built for African commerce</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-3">
                            {principles.map((item) => (
                                <div key={item.title} className="rounded-[30px] border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                        {item.icon}
                                    </div>
                                    <h2 className="mt-5 text-2xl font-black text-gray-900">{item.title}</h2>
                                    <p className="mt-3 text-gray-600 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
                            <div className="rounded-[34px] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Vision</p>
                                <h2 className="mt-3 text-3xl font-black text-gray-900">A payments layer that feels local, modern, and dependable.</h2>
                                <p className="mt-4 text-gray-600 leading-relaxed">
                                    Our vision is a merchant stack that works well for African businesses first, while still feeling polished enough for global-grade commerce.
                                </p>
                            </div>
                            <div className="rounded-[34px] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Mission</p>
                                <h2 className="mt-3 text-3xl font-black text-gray-900">Make collections, payouts, and reconciliation feel simpler.</h2>
                                <p className="mt-4 text-gray-600 leading-relaxed">
                                    We build the operational tools that sit between money movement and the people who depend on it every day.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-white/10 bg-black/40 py-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                            <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 text-white shadow-2xl shadow-black/10 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">What we believe</p>
                                <h2 className="mt-4 text-3xl font-black">Good payments software should disappear into the workflow.</h2>
                                <p className="mt-4 text-sm leading-relaxed text-gray-300">
                                    The less merchants have to think about the payment layer, the more they can focus on sales, service, and operations.
                                </p>
                            </div>
                            <div className="grid gap-4">
                                {values.map((value) => (
                                    <div key={value.title} className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-black/10 backdrop-blur">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-black">{value.icon}</div>
                                            <h3 className="text-xl font-black">{value.title}</h3>
                                        </div>
                                        <p className="mt-3 text-sm leading-relaxed text-gray-300">{value.desc}</p>
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
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Core values</p>
                                <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">The standards behind the product.</h2>
                            </div>
                            <p className="max-w-xl text-sm leading-relaxed text-gray-300">
                                These values are meant to show up in the interface, the support experience, and the way the platform behaves.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {values.map((value) => (
                                <div key={value.title} className="rounded-[30px] border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black shadow-sm">
                                        {value.icon}
                                    </div>
                                    <h3 className="mt-5 text-2xl font-black text-gray-900">{value.title}</h3>
                                    <p className="mt-3 text-gray-600 leading-relaxed">{value.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="rounded-[36px] border border-white/10 bg-white p-7 shadow-2xl shadow-black/20 md:p-10">
                            <div className="mb-8 max-w-3xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Founder story</p>
                                <h2 className="mt-3 text-3xl font-black text-gray-900 md:text-5xl">The people behind the platform.</h2>
                                <p className="mt-4 text-gray-600 leading-relaxed">
                                    FlapaPay is shaped by product thinking, operational discipline, and a focus on merchant outcomes.
                                </p>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
                                <div className="overflow-hidden rounded-[32px] border border-gray-100 bg-gray-50">
                                    <img src="/assets/images/aboutus.jpg" alt="FlapaPay team" className="h-full w-full object-cover" />
                                </div>

                                <div className="grid gap-4">
                                    {founders.map((founder) => (
                                        <div key={founder.name} className="rounded-[28px] border border-gray-100 bg-gray-50 p-5 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-400 text-lg font-black text-white shadow-lg">
                                                    {founder.initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">{founder.role}</p>
                                                    <h3 className="mt-1 text-2xl font-black text-gray-900">{founder.name}</h3>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-gray-600 leading-relaxed">{founder.bio}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-[30px] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Product focus</p>
                                <h3 className="mt-3 text-2xl font-black text-gray-900">We keep the platform centered on money movement.</h3>
                                <p className="mt-3 text-gray-600 leading-relaxed">
                                    Checkout, collections, payouts, and operational visibility are the core product lanes. Everything else should support those lanes, not obscure them.
                                </p>
                            </div>
                            <div className="rounded-[30px] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Customer promise</p>
                                <h3 className="mt-3 text-2xl font-black text-gray-900">Clear interfaces. Reliable flows. Less friction.</h3>
                                <p className="mt-3 text-gray-600 leading-relaxed">
                                    The user experience should feel modern, but it also needs to be honest, readable, and useful in actual operations.
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
                                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Work with us</p>
                                    <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">If your business needs modern collections, we should talk.</h2>
                                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                                        Whether you are building for the counter, the marketplace, or the finance back office, FlapaPay is being designed to fit that workflow.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Button
                                        size="lg"
                                        onClick={() => navigate('/signup')}
                                        className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                                    >
                                        Create account
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/careers')}
                                        className="rounded-2xl border-white/20 px-8 py-5 text-lg font-black text-white transition-all hover:bg-white/10"
                                    >
                                        View careers
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
