import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    BellRing,
    Check,
    ChevronRight,
    ClipboardCheck,
    KeyRound,
    Plus,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const members = [
    { name: 'Emma Wilson', role: 'Admin', status: 'Active', initials: 'E', color: 'from-[#ef6c14] to-[#ffd66a]' },
    { name: 'Sarah Mukuka', role: 'Finance Manager', status: 'Active', initials: 'S', color: 'from-[#f59a17] to-[#ffca4b]' },
    { name: 'John Phiri', role: 'Developer', status: 'Invited', initials: 'J', color: 'from-[#6c645a] to-[#29251f]' },
];

const capabilities = [
    { icon: KeyRound, eyebrow: 'Permissioning', title: 'Granular roles', copy: 'Give every teammate the right level of access without slowing down the work.', tone: 'bg-[#fff8ea] border-[#f2dfb4]' },
    { icon: Activity, eyebrow: 'Visibility', title: 'Activity logs', copy: 'Keep a clear record of what changed, who changed it, and when it happened.', tone: 'bg-[#fff1df] border-[#f5d1a5]' },
    { icon: ClipboardCheck, eyebrow: 'Finance ops', title: 'Reconciliation', copy: 'Let finance manage payouts and reports while the rest of the team keeps moving.', tone: 'bg-[#fffaf4] border-[#eedcc8]' },
    { icon: BellRing, eyebrow: 'Automation', title: 'Smart notifications', copy: 'Route important events to the people who can act on them, not everyone else.', tone: 'bg-[#fff7e4] border-[#f0d9a8]' },
];

const workflow = [
    { number: '01', title: 'Invite the right people', copy: 'Bring operations, finance, product, and support into the same workspace.' },
    { number: '02', title: 'Set clear boundaries', copy: 'Use roles and permissions to make access simple, intentional, and reversible.' },
    { number: '03', title: 'Keep the trail visible', copy: 'Monitor approvals, edits, and events with an audit trail your team can trust.' },
];

export const TeamsOverview: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen overflow-hidden bg-[#fbf8f3] font-sans text-[#0b1715] selection:bg-[#ffe29a] selection:text-[#0b1715]">
            <Navbar />

            <main>
                <section className="relative overflow-hidden bg-[#080706] text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_12%,rgba(251,146,60,0.24),transparent_30%),radial-gradient(circle_at_7%_82%,rgba(247,165,26,0.13),transparent_32%)]" />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "url('/assets/images/cubes.png')", backgroundAttachment: 'fixed' }} />
                    <div className="absolute -right-28 top-24 h-96 w-96 rounded-full border border-[#f7b63b]/15" />
                    <div className="absolute right-12 top-48 h-56 w-56 rounded-full border border-[#ff9f2f]/20" />

                    <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-28 lg:px-8 lg:pb-28 lg:pt-36">
                        <div className="grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
                            <div className="max-w-xl">
                                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#f7b63b]/30 bg-white/[0.06] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#ffd66a]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Team management
                                </div>
                                <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.65rem]">
                                    Give every teammate room to do their best work.
                                </h1>
                                <p className="mt-7 max-w-lg text-lg leading-8 text-white/65 sm:text-xl">
                                    Bring your workforce into one controlled workspace. Manage permissions, reconciliation, approvals, and notifications without losing momentum.
                                </p>
                                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                    <Link to="/signup" className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#ef6c14] via-[#f59a17] to-[#ffd44d] px-6 py-3.5 text-sm font-extrabold text-[#17110a] shadow-[0_12px_34px_rgba(245,145,24,0.3)] transition hover:-translate-y-0.5 hover:from-[#ff8a24] hover:via-[#ffb52f] hover:to-[#ffe178]">
                                        Invite your team
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                    <button type="button" onClick={() => navigate('/developers')} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/[0.09]">
                                        View roles
                                        <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-white/45">
                                    <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#ffd66a]" /> Role-based access</span>
                                    <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#ffd66a]" /> Approval visibility</span>
                                    <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#ffd66a]" /> Full activity trail</span>
                                </div>
                            </div>

                            <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
                                <div className="absolute -inset-8 rounded-[3rem] bg-[#f7a51a]/10 blur-3xl" />
                                <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.08] p-3 shadow-2xl backdrop-blur-xl">
                                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs font-semibold text-white/55">
                                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ffd66a] shadow-[0_0_14px_rgba(255,214,106,0.9)]" /> Team workspace</div>
                                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">Access control</span>
                                    </div>
                                    <div className="rounded-[1.4rem] bg-[#15120e] p-5 sm:p-7">
                                        <div className="flex items-start justify-between gap-4">
                                            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d3b37a]">Workspace members</p><h2 className="mt-2 text-2xl font-black text-white">Team Members (12)</h2></div>
                                            <button type="button" aria-label="Add team member" className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#ef6c14] to-[#ffd66a] text-[#17110a] shadow-[0_8px_22px_rgba(245,145,24,0.25)]"><Plus className="h-5 w-5" /></button>
                                        </div>
                                        <div className="mt-8 space-y-3">
                                            {members.map((member) => (
                                                <div key={member.name} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.055] px-4 py-3.5">
                                                    <div className="flex items-center gap-3.5"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${member.color} text-sm font-black text-[#17110a]`}>{member.initials}</div><div><p className="font-bold text-white">{member.name}</p><p className="mt-0.5 text-xs text-white/40">{member.role}</p></div></div>
                                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] ${member.status === 'Active' ? 'bg-[#4b3410] text-[#ffd66a]' : 'bg-white/10 text-white/45'}`}>{member.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5 text-xs"><span className="inline-flex items-center gap-2 text-white/45"><Users className="h-4 w-4 text-[#f7b63b]" /> 3 roles configured</span><span className="inline-flex items-center gap-1 font-bold text-[#ffd66a]">Manage access <ChevronRight className="h-3.5 w-3.5" /></span></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 px-1 pt-3"><div className="rounded-2xl bg-white/[0.07] px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Members</p><p className="mt-1 text-lg font-black text-white">12</p></div><div className="rounded-2xl bg-white/[0.07] px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Roles</p><p className="mt-1 text-lg font-black text-white">3</p></div><div className="rounded-2xl bg-white/[0.07] px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Audit</p><p className="mt-1 text-lg font-black text-white">On</p></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-b border-[#eadfce] bg-white">
                    <div className="mx-auto grid max-w-7xl gap-0 px-6 lg:grid-cols-3 lg:px-8">
                        <div className="flex items-center gap-4 border-b border-[#eee5d9] py-6 lg:border-b-0 lg:border-r lg:py-7 lg:pr-8"><div className="rounded-2xl bg-[#fff2d8] p-3 text-[#d9870d]"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-2xl font-black tracking-tight text-[#0b1715]">Controlled</p><p className="text-sm font-medium text-[#776958]">access by role</p></div></div>
                        <div className="flex items-center gap-4 border-b border-[#eee5d9] py-6 lg:border-b-0 lg:border-r lg:px-8 lg:py-7"><div className="rounded-2xl bg-[#fff1df] p-3 text-[#e4771b]"><Users className="h-5 w-5" /></div><div><p className="text-2xl font-black tracking-tight text-[#0b1715]">One team</p><p className="text-sm font-medium text-[#776958]">one operating view</p></div></div>
                        <div className="flex items-center gap-4 py-6 lg:py-7 lg:pl-8"><div className="rounded-2xl bg-[#fff7e4] p-3 text-[#c67708]"><Activity className="h-5 w-5" /></div><div><p className="text-2xl font-black tracking-tight text-[#0b1715]">Always visible</p><p className="text-sm font-medium text-[#776958]">activity and approvals</p></div></div>
                    </div>
                </section>

                <section className="bg-white px-6 py-24 lg:px-8 lg:py-32">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-[#d88910]">Built for the whole operation</p><h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[#0b1715] sm:text-5xl">The right access for every part of the work.</h2></div><p className="max-w-2xl text-lg leading-8 text-[#776958] lg:justify-self-end">A strong team workspace does more than add users. It creates clarity around who can act, what needs attention, and how work gets done.</p></div>
                        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{capabilities.map(({ icon: Icon, eyebrow, title, copy, tone }) => <article key={title} className={`rounded-[2rem] border p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#9b6515]/[0.12] ${tone}`}><div className="flex items-center justify-between"><div className="rounded-2xl bg-white p-3 text-[#d88910] shadow-sm"><Icon className="h-5 w-5" /></div><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9d8b76]">{eyebrow}</span></div><h3 className="mt-12 text-2xl font-black tracking-[-0.035em] text-[#0b1715]">{title}</h3><p className="mt-4 leading-7 text-[#776958]">{copy}</p></article>)}</div>
                    </div>
                </section>

                <section className="bg-[#fbf8f3] px-6 py-24 lg:px-8 lg:py-32">
                    <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-[#d88910]">A better way to collaborate</p><h2 className="mt-4 max-w-xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-[#0b1715] sm:text-5xl">Make teamwork feel intentional.</h2><p className="mt-6 max-w-lg text-lg leading-8 text-[#776958]">From the first invite to the final approval, FlapaPay gives every team member a clear place in the flow.</p><div className="mt-10 space-y-7">{workflow.map(({ number, title, copy }) => <div key={number} className="flex gap-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f0c66d] bg-white text-xs font-black text-[#c67708]">{number}</div><div><h3 className="text-lg font-black text-[#0b1715]">{title}</h3><p className="mt-1.5 leading-7 text-[#776958]">{copy}</p></div></div>)}</div></div><div className="relative rounded-[2rem] border border-[#eadfce] bg-white p-5 shadow-[0_22px_70px_rgba(139,87,20,0.1)] sm:p-7"><div className="rounded-[1.5rem] bg-[#0f0d0a] p-6 text-white sm:p-8"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d3b37a]">Approval queue</p><h3 className="mt-2 text-2xl font-black">Today’s team activity</h3></div><span className="rounded-full bg-[#4b3410] px-3 py-1.5 text-xs font-bold text-[#ffd66a]">3 pending</span></div><div className="mt-7 space-y-3"><div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4"><div><p className="font-bold">Payout batch review</p><p className="mt-1 text-xs text-white/40">Finance Manager · 4 minutes ago</p></div><span className="rounded-full bg-[#fff1d5] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-[#b97206]">Review</span></div><div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4"><div><p className="font-bold">New developer invited</p><p className="mt-1 text-xs text-white/40">Admin · 18 minutes ago</p></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-white/55">Open</span></div><div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4"><div><p className="font-bold">Role updated</p><p className="mt-1 text-xs text-white/40">Admin · 36 minutes ago</p></div><span className="rounded-full bg-[#fff1d5] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-[#b97206]">Logged</span></div></div><button type="button" onClick={() => navigate('/signup')} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ef6c14] via-[#f59a17] to-[#ffd44d] px-5 py-4 text-sm font-extrabold text-[#17110a] transition hover:from-[#ff8a24] hover:via-[#ffb52f] hover:to-[#ffe178]">Open your team workspace <ArrowRight className="h-4 w-4" /></button></div></div></div>
                </section>

                <section className="bg-[#0b0a08] px-6 py-24 text-white lg:px-8 lg:py-28"><div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffd66a]">One platform. More alignment.</p><h2 className="mt-4 text-4xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl">Build a team that moves with confidence.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-white/60">Give your people the context, access, and visibility they need to move money responsibly.</p></div><div className="flex flex-col gap-3 sm:flex-row"><Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ef6c14] via-[#f59a17] to-[#ffd44d] px-6 py-3.5 text-sm font-extrabold text-[#17110a] transition hover:from-[#ff8a24] hover:via-[#ffb52f] hover:to-[#ffe178]">Create your account <ArrowRight className="h-4 w-4" /></Link><Link to="/developers" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/[0.08]">Read the docs <ArrowUpRight className="h-4 w-4" /></Link></div></div></section>
            </main>

            <Footer />
        </div>
    );
};
