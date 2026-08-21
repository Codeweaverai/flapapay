/**
 * Structured Midnight Editorial — profile-backed FlapaPay company page.
 * The cube-textured hero establishes payment infrastructure; supplied product and founder imagery anchors the story in tangible gateway capabilities.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, CircleCheck, Code2, CreditCard, Landmark, Link2, ReceiptText, Send, Store, WalletCards, Workflow } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const assets = {
    dashboard: '/assets/images/company/flapapay-dashboard-tools.png',
    checkoutSuccess: '/assets/images/company/flapapay-checkout-success.webp',
    checkoutSecurity: '/assets/images/company/flapapay-checkout-security.png',
    mbolela: '/assets/images/company/mbolela-pule.png',
    george: '/assets/images/company/george-munganga.png',
};

const platformLanes = [
    {
        number: '01',
        label: 'Accept',
        title: 'Collect payments across the channels customers already use.',
        description: 'Accept local and international card payments, mobile money, bank transfers, payment links, hosted checkout, and physical point-of-sale payments through one merchant platform.',
        icon: <CreditCard className="h-5 w-5" />,
    },
    {
        number: '02',
        label: 'Manage',
        title: 'Keep each transaction, status, settlement, and refund in view.',
        description: 'The FlapaPay Dashboard gives merchants a single place to monitor collection activity, payment statuses, settlements, refunds, and the movement of money across the business.',
        icon: <Workflow className="h-5 w-5" />,
    },
    {
        number: '03',
        label: 'Pay',
        title: 'Send funds through controlled individual or bulk payout workflows.',
        description: 'Move money to mobile-money wallets and bank accounts for supplier payments, merchant settlements, customer refunds, commissions, and business disbursements.',
        icon: <Send className="h-5 w-5" />,
    },
    {
        number: '04',
        label: 'Integrate',
        title: 'Connect payments to the systems your business already runs.',
        description: 'Use APIs and webhooks for collections, hosted checkout, payment verification, notifications, refunds, and payout automation, or start without code using Payment Links and Hosted Checkout.',
        icon: <Code2 className="h-5 w-5" />,
    },
];

const products = [
    { title: 'Hosted Checkout', description: 'A secure, ready-to-use online checkout where customers choose from supported payment methods before returning to your website or application.', icon: <CreditCard className="h-5 w-5" /> },
    { title: 'Payment Links', description: 'Create a link, share it through WhatsApp, email, SMS, social media, invoices, or your website, and let customers pay without an engineering build.', icon: <Link2 className="h-5 w-5" /> },
    { title: 'Invoicing', description: 'Send digital invoices with checkout embedded directly in the document for professional services, recurring billing, and B2B collections.', icon: <ReceiptText className="h-5 w-5" /> },
    { title: 'Payouts', description: 'Initiate individual payments, upload bulk payout files, or automate disbursements to mobile-money wallets and bank accounts with the API.', icon: <Send className="h-5 w-5" /> },
    { title: 'Virtual Cards', description: 'Issue and manage virtual cards for controlled business spend, customer wallets, and disbursement workflows.', icon: <WalletCards className="h-5 w-5" /> },
    { title: 'Point of Sale', description: 'Accept Visa, Mastercard, and Zambia’s leading mobile-money choices through one branded merchant device for in-person commerce.', icon: <Store className="h-5 w-5" /> },
];

const audiences = [
    ['Ecommerce', 'Accept online payments across cards, mobile money, bank transfers, and other supported methods.'],
    ['Retail', 'Bring online and in-person digital payments into one merchant experience.'],
    ['SMEs', 'Start with Payment Links and Hosted Checkout without needing an engineering team.'],
    ['Enterprise', 'Integrate scalable collections and payout infrastructure into existing systems.'],
    ['Digital platforms', 'Embed payment functionality directly into applications and online services.'],
    ['Professional services', 'Collect invoices and service payments with practical, traceable digital workflows.'],
];

const leadership = [
    {
        name: 'Mbolela Pule',
        title: 'Founder & Chief Executive Officer',
        image: assets.mbolela,
        description: 'Leads company strategy, product and platform development, partnerships, and regulatory engagement. His focus is practical, secure payment infrastructure that brings cards, mobile money, bank transfers, and digital collections into one connected merchant experience.',
    },
    {
        name: 'George Munganga',
        title: 'Co-founder & Chief Technology Officer',
        image: assets.george,
        description: 'Leads technology, platform architecture, engineering direction, and day-to-day operations. His work is centred on making the FlapaPay payment gateway reliable, connected, and ready for the operational needs of merchants.',
    },
];

export const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f7f4ed] font-sans text-slate-950 selection:bg-orange-300/50">
            <Navbar />

            <main className="pt-20">
                <section
                    className="relative isolate overflow-hidden bg-[#07090e] py-20 text-white md:py-28"
                    style={{ backgroundImage: "linear-gradient(rgba(7,9,14,.79), rgba(7,9,14,.97)), url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
                >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(249,115,22,.25),transparent_31%),radial-gradient(circle_at_93%_82%,rgba(250,204,21,.14),transparent_27%)]" />
                    <div className="pointer-events-none absolute -right-24 top-12 h-[28rem] w-[28rem] rounded-full bg-orange-500/20 blur-[125px]" />
                    <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-yellow-400/10 blur-[112px]" />

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.72fr)] lg:items-end">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-3 border border-white/15 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-orange-200 backdrop-blur-sm">
                                    <span className="h-2 w-2 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300" />
                                    FlapaPay Technologies Limited
                                </div>
                                <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-6xl md:text-7xl lg:text-[5.3rem]">
                                    The payment gateway built for how African businesses
                                    <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300 bg-clip-text text-transparent"> collect, pay, and grow.</span>
                                </h1>
                                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
                                    FlapaPay is a Lusaka-headquartered Zambian fintech company building one integrated payment platform for cards, mobile money, bank transfers, online checkout, payment links, APIs, payouts, and point-of-sale payments.
                                </p>
                                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="group rounded-none bg-gradient-to-r from-orange-500 via-orange-500 to-yellow-300 px-7 py-5 text-base font-black text-slate-950 shadow-[0_18px_45px_rgba(249,115,22,.24)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]">
                                        Start with FlapaPay <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/developers')} className="rounded-none border-white/25 bg-white/[0.02] px-7 py-5 text-base font-black text-white transition duration-200 hover:bg-white/10 active:scale-[0.98]">
                                        Explore the APIs
                                    </Button>
                                </div>
                            </div>

                            <aside className="relative border border-white/15 bg-[#0c1019]/90 p-6 shadow-[0_32px_90px_rgba(0,0,0,.48)] backdrop-blur-xl sm:p-7">
                                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-orange-500 via-amber-300 to-yellow-200" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">One gateway, connected rails</p>
                                <div className="mt-7 space-y-4 border-l border-white/15 pl-5">
                                    <div><p className="text-sm font-black text-orange-200">For every payment moment</p><p className="mt-1 text-sm leading-relaxed text-slate-300">Collect online and in person. Pay out at operating scale. Track the result from one merchant workspace.</p></div>
                                    <div><p className="text-sm font-black text-orange-200">For every build stage</p><p className="mt-1 text-sm leading-relaxed text-slate-300">Use Payment Links and Hosted Checkout with no code, or integrate gateway capabilities through APIs and webhooks.</p></div>
                                </div>
                                <div className="mt-7 grid gap-px bg-white/10 sm:grid-cols-3">
                                    <div className="bg-[#0c1019] p-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">HQ</p><p className="mt-2 text-sm font-black text-white">Lusaka</p></div>
                                    <div className="bg-[#0c1019] p-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Platform</p><p className="mt-2 text-sm font-black text-white">API-first</p></div>
                                    <div className="bg-[#0c1019] p-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Currencies</p><p className="mt-2 text-sm font-black text-white">ZMW / USD</p></div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </section>

                <section className="border-b border-black/10 bg-[#f7f4ed] py-16 md:py-24">
                    <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-8">
                        <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">What FlapaPay is</p><h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.035em] text-slate-950 md:text-5xl">Payment infrastructure, made practical.</h2></div>
                        <div className="max-w-3xl border-l-2 border-orange-500 pl-6 md:pl-9"><p className="text-xl leading-relaxed text-slate-700 md:text-2xl">FlapaPay replaces disconnected payment providers and manual workarounds with a single merchant platform to accept payments, run payouts, manage transaction activity, and integrate payment services into websites, applications, and enterprise systems.</p><p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500">The outcome is simple: customers choose how they pay; merchants keep one clear view of money in motion.</p></div>
                    </div>
                </section>

                <section className="bg-white py-16 md:py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-10 border-b border-slate-200 pb-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">The FlapaPay platform</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">Accept. Manage. Pay. Integrate.</h2></div><p className="max-w-2xl text-base leading-relaxed text-slate-600">Four connected capabilities bring digital collections, transaction visibility, controlled disbursements, and developer integration into one payment-gateway experience.</p></div>
                        <div className="divide-y divide-slate-200">
                            {platformLanes.map((lane) => <article key={lane.number} className="group grid gap-6 py-7 transition-colors md:grid-cols-[82px_minmax(0,.95fr)_minmax(0,1.2fr)_42px] md:items-center"><p className="text-sm font-black tracking-[0.16em] text-orange-600">{lane.number}</p><div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-yellow-300">{lane.icon}</div><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600">{lane.label}</p><h3 className="mt-1 text-2xl font-black tracking-[-0.025em] text-slate-950">{lane.title}</h3></div></div><p className="max-w-xl leading-relaxed text-slate-600">{lane.description}</p><ArrowUpRight className="hidden h-5 w-5 text-orange-500 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 md:block" /></article>)}
                        </div>
                    </div>
                </section>

                <section className="relative overflow-hidden bg-[#0a0d13] py-16 text-white md:py-24">
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(249,115,22,.17),transparent_65%)]" />
                    <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[.75fr_1.25fr] lg:items-center lg:px-8">
                        <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">One merchant workspace</p><h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] md:text-5xl">Every tool. One place.</h2><p className="mt-6 max-w-md leading-relaxed text-slate-300">From payment links and invoices to virtual cards, payouts, and transaction activity, FlapaPay gives merchant teams one operating view instead of a patchwork of disconnected services.</p><div className="mt-8 border-l border-orange-400 pl-5 text-sm leading-relaxed text-slate-300">Built for businesses that need to see what was paid, what is pending, what has settled, and what needs action next.</div></div>
                        <div className="relative bg-white p-3 shadow-[0_30px_80px_rgba(0,0,0,.42)]"><img src={assets.dashboard} alt="FlapaPay merchant tools including payment links, invoices, virtual cards, request funds, and withdrawals" className="block h-full w-full object-cover" /></div>
                    </div>
                </section>

                <section className="bg-[#f7f4ed] py-16 md:py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8"><div className="grid gap-10 lg:grid-cols-[1.03fr_.97fr] lg:items-center"><div className="relative order-2 overflow-hidden border border-slate-200 bg-white p-4 shadow-[0_28px_65px_rgba(15,23,42,.12)] lg:order-1"><img src={assets.checkoutSuccess} alt="FlapaPay hosted checkout payment success confirmation" className="block max-h-[660px] w-full object-contain" /></div><div className="order-1 lg:order-2"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Gateway products</p><h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] text-slate-950 md:text-5xl">Start with a link. Scale through the gateway.</h2><p className="mt-6 max-w-xl leading-relaxed text-slate-600">FlapaPay products work independently or together. Start collecting without code, then connect the same payment infrastructure to the systems and customer journeys that matter to your business.</p><div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">{products.slice(0, 4).map((product) => <div key={product.title} className="flex gap-4 py-4"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">{product.icon}</div><div><h3 className="font-black text-slate-950">{product.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{product.description}</p></div></div>)}</div></div></div></div>
                </section>

                <section className="bg-white py-16 md:py-24"><div className="mx-auto max-w-7xl px-6 lg:px-8"><div className="grid gap-10 border-b border-slate-200 pb-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">More ways to move money</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">Products for the payment operation after checkout.</h2></div><p className="max-w-2xl text-base leading-relaxed text-slate-600">FlapaPay also supports the operational flows around collections: controlled business spend, in-person acceptance, bulk disbursement, and the integrations that make payment data useful beyond the checkout moment.</p></div><div className="grid gap-px bg-slate-200 md:grid-cols-3">{products.slice(4).map((product) => <article key={product.title} className="bg-white p-7"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-yellow-300">{product.icon}</div><h3 className="mt-7 text-xl font-black text-slate-950">{product.title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{product.description}</p></article>)}<article className="bg-[#fff4e5] p-7"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-yellow-300 text-slate-950"><Landmark className="h-5 w-5" /></div><h3 className="mt-7 text-xl font-black text-slate-950">ZMW, USD & FX</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">Collect, hold, and move Zambian Kwacha and US Dollars through FlapaPay, with FX liquidity and in-platform swaps available.</p></article></div></div></section>

                <section className="relative overflow-hidden bg-[#10131a] py-16 text-white md:py-24"><div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-orange-500/14 blur-[120px]" /><div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">Trust in the transaction layer</p><h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] md:text-5xl">Secure by design, from payment to confirmation.</h2><p className="mt-6 max-w-xl leading-relaxed text-slate-300">Security, privacy, reliability, and regulatory compliance are built into the FlapaPay operating model. Merchant onboarding and ongoing monitoring use documented KYC, KYB, and AML controls.</p><div className="mt-8 space-y-3"><div className="flex gap-3"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" /><p className="text-sm leading-relaxed text-slate-200">Hosted Checkout provides a secure, ready-to-use payment experience for online transactions.</p></div><div className="flex gap-3"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" /><p className="text-sm leading-relaxed text-slate-200">Payment APIs support verification, notifications, and webhooks so merchants can keep payment events connected to their own systems.</p></div><div className="flex gap-3"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" /><p className="text-sm leading-relaxed text-slate-200">Customers can choose familiar methods, including Visa, Mastercard, Airtel Money, MTN Mobile Money, Zamtel Kwacha, and bank transfers.</p></div></div></div><div className="relative overflow-hidden border border-white/10 bg-white p-3 shadow-[0_30px_80px_rgba(0,0,0,.38)]"><img src={assets.checkoutSecurity} alt="FlapaPay secure hosted checkout and payment confirmation experience" className="block h-full w-full object-cover" /></div></div></section>

                <section className="bg-[#f7f4ed] py-16 md:py-24"><div className="mx-auto max-w-7xl px-6 lg:px-8"><div className="grid gap-10 lg:grid-cols-[.68fr_1.32fr]"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Who we serve</p><h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] text-slate-950 md:text-5xl">Payment tools for every stage of commerce.</h2><p className="mt-6 max-w-sm leading-relaxed text-slate-600">From a business accepting its first online payment to an organisation integrating high-volume collections and payouts, the gateway is designed to meet merchants where they are.</p></div><div className="grid gap-px bg-slate-300 sm:grid-cols-2 lg:grid-cols-3">{audiences.map(([title, description]) => <article key={title} className="bg-[#f7f4ed] p-6"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600">{title}</p><p className="mt-3 text-sm leading-relaxed text-slate-700">{description}</p><ChevronRight className="mt-7 h-4 w-4 text-slate-400" /></article>)}</div></div></div></section>

                <section className="bg-white py-16 md:py-24"><div className="mx-auto max-w-7xl px-6 lg:px-8"><div className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Leadership</p><h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">The team building FlapaPay’s payment infrastructure.</h2><p className="mt-5 max-w-2xl leading-relaxed text-slate-600">FlapaPay was founded in 2025 to address the disconnected payment options available to merchants in Zambia. FlapaPay Technologies Limited was incorporated in 2026 to bring a connected cards, mobile-money, and bank-transfer platform to market.</p></div><div className="mt-12 grid gap-8 md:grid-cols-2">{leadership.map((person) => <article key={person.name} className="group overflow-hidden border border-slate-200 bg-[#fbfaf7] shadow-[0_18px_45px_rgba(15,23,42,.08)]"><div className="aspect-[4/3] overflow-hidden bg-slate-950"><img src={person.image} alt={person.name} className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.025]" /></div><div className="border-t-4 border-orange-500 p-7"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600">{person.title}</p><h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">{person.name}</h3><p className="mt-4 text-sm leading-relaxed text-slate-600">{person.description}</p></div></article>)}</div></div></section>

                <section className="bg-[#0a0d13] py-16 text-white md:py-24"><div className="mx-auto max-w-7xl px-6 lg:px-8"><div className="relative overflow-hidden border border-white/10 bg-[#10151e] p-8 shadow-[0_30px_80px_rgba(0,0,0,.32)] md:p-12 lg:p-16"><div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-orange-500/25 blur-[90px]" /><div className="relative grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-200">Payments made simple</p><h2 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.045em] md:text-6xl">Accept. Pay. Move money.</h2><p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">Bring customer collections, merchant payouts, and connected payment operations into one FlapaPay gateway platform.</p></div><div className="flex flex-col gap-3"><Button size="lg" onClick={() => navigate('/signup')} className="group rounded-none bg-gradient-to-r from-orange-500 to-yellow-300 px-7 py-5 font-black text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]">Create a merchant account <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Button><Button size="lg" variant="outline" onClick={() => navigate('/contact')} className="rounded-none border-white/25 bg-white/[0.03] px-7 py-5 font-black text-white transition duration-200 hover:bg-white/10 active:scale-[0.98]">Talk to our team</Button></div></div></div></div></section>
            </main>

            <Footer />
        </div>
    );
};
