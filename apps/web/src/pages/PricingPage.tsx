import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Calculator,
    ChevronRight,
    CreditCard,
    Landmark,
    ShieldCheck,
    Smartphone,
    Sparkles,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const collectionFees = [
    {
        id: 'local_card',
        label: 'Local Card',
        rate: 3.5,
        displayRate: '3.5%',
        icon: CreditCard,
        description: 'Domestic card collections across hosted checkout and payment links.',
    },
    {
        id: 'international_card',
        label: 'International Card',
        rate: 3.8,
        displayRate: '3.8%',
        icon: Sparkles,
        description: 'Cross-border card acceptance with the same merchant workflow.',
    },
    {
        id: 'mobile_money',
        label: 'Mobile Money',
        rate: 1,
        displayRate: '1%',
        icon: Smartphone,
        description: 'Mobile money collections for day-to-day local payment flows.',
    },
] as const;

const mnoLogos = [
    { name: 'MTN MoMo', src: '/assets/images/MTN_Logo.svg', className: 'h-7 w-auto' },
    { name: 'Airtel Money', src: '/assets/images/Airtel_Africa_logo.svg', className: 'h-7 w-auto' },
    { name: 'Zamtel Money', src: '/assets/images/zamtel.png', className: 'h-8 w-auto' },
] as const;

const cardLogos = [
    { name: 'Visa', src: '/assets/images/visa02.svg', className: 'h-6 w-auto' },
    { name: 'Mastercard', src: '/assets/images/mastercard.svg', className: 'h-7 w-auto' },
] as const;

const payoutPricing = {
    mobile_money: [
        { min: 0, max: 1000, label: 'K0 - K1,000', feeRange: 'K8.50 - K12', estimate: 12 },
        { min: 1000.01, max: 50000, label: 'K1,000.01 - K50,000', feeRange: 'K15 - K25', estimate: 25 },
        { min: 50000.01, max: 100000000, label: 'K50,000.01 - K100,000,000', feeRange: 'K35', estimate: 35 },
    ],
    bank_account: [
        { min: 0, max: 1000, label: 'K0 - K1,000', feeRange: 'K8.50 - K10', estimate: 10 },
        { min: 1000.01, max: 50000, label: 'K1,000.01 - K50,000', feeRange: 'K15 - K25', estimate: 25 },
        { min: 50000.01, max: 100000000, label: 'K50,000.01 - K100,000,000', feeRange: 'K35', estimate: 35 },
    ],
} as const;

type CollectionChannel = (typeof collectionFees)[number]['id'];
type PayoutChannel = keyof typeof payoutPricing;
type PricingMode = 'collections' | 'payout';

const formatKwacha = (value: number) =>
    `K${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getPayoutTier = (channel: PayoutChannel, amount: number) => {
    const tiers = payoutPricing[channel];
    return tiers.find((tier) => amount >= tier.min && amount <= tier.max) || tiers[tiers.length - 1];
};

const SectionEyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-600">
        <span className="h-2 w-2 rounded-full bg-orange-500" />
        {children}
    </div>
);

export const PricingPage: React.FC = () => {
    const navigate = useNavigate();
    const [pricingMode, setPricingMode] = useState<PricingMode>('collections');
    const [collectionChannel, setCollectionChannel] = useState<CollectionChannel>('mobile_money');
    const [payoutChannel, setPayoutChannel] = useState<PayoutChannel>('mobile_money');
    const [collectionAmount, setCollectionAmount] = useState('2500000');
    const [payoutAmount, setPayoutAmount] = useState('50000');

    const parsedCollectionAmount = Math.max(0, Number(collectionAmount) || 0);
    const parsedPayoutAmount = Math.max(0, Number(payoutAmount) || 0);

    const activeCollection = collectionFees.find((item) => item.id === collectionChannel) || collectionFees[0];
    const collectionFeeAmount = parsedCollectionAmount * (activeCollection.rate / 100);

    const activePayoutTier = getPayoutTier(payoutChannel, parsedPayoutAmount);

    return (
        <div
            className="min-h-screen bg-black font-sans text-gray-900 selection:bg-orange-200/60"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
        >
            <Navbar />

            <main className="pt-20">
                <section className="relative overflow-hidden border-b border-white/10 px-6 py-20 lg:px-8 lg:py-28">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_28%)]" />
                    <div className="relative z-10 mx-auto max-w-7xl">
                        <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                            <div>
                                <SectionEyebrow>Pricing</SectionEyebrow>
                                <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white md:text-7xl">
                                    Transparent and
                                    <span className="block text-orange-600">straightforward pricing.</span>
                                </h1>
                                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
                                    No hidden fees. No guesswork. FlapaPay merchants can see collections and payout pricing in one place, with calculators that show the charge before money moves.
                                </p>

                                <div className="mt-10 flex flex-wrap gap-4">
                                    <Button
                                        size="lg"
                                        onClick={() => navigate('/merchant/signup')}
                                        className="rounded-full bg-gray-950 px-8 py-4 text-base font-black text-white shadow-xl shadow-orange-900/10 transition-all hover:-translate-y-0.5 hover:bg-orange-600"
                                    >
                                        Get started
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/developers')}
                                        className="rounded-full border-2 border-white/15 bg-white/8 px-8 py-4 text-base font-black text-white backdrop-blur transition-all hover:border-orange-300 hover:bg-white/12"
                                    >
                                        View developer docs
                                    </Button>
                                </div>

                                <div className="mt-10 flex flex-wrap items-center gap-6 text-white/90">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Accepted Card Payments</p>
                                        <div className="mt-3 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                                            {cardLogos.map((logo) => (
                                                <div key={logo.name} className="flex h-12 items-center rounded-2xl bg-white px-4 shadow-sm">
                                                    <img src={logo.src} alt={logo.name} className={logo.className} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Supported Mobile Networks</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[28px] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                                            {mnoLogos.map((logo) => (
                                                <div key={logo.name} className="flex h-12 items-center rounded-2xl bg-white px-4 shadow-sm">
                                                    <img src={logo.src} alt={logo.name} className={logo.className} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-6 top-8 h-40 w-40 rounded-full bg-orange-300/35 blur-3xl" />
                                <div className="absolute -right-8 bottom-2 h-40 w-40 rounded-full bg-amber-400/25 blur-3xl" />

                                <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-white/92 p-6 shadow-[0_30px_90px_rgba(146,64,14,0.24)] backdrop-blur">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-[#fff6ea] to-white p-5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Accepted Card Payments</p>
                                            <div className="mt-4 flex items-center gap-3">
                                                {cardLogos.map((logo) => (
                                                    <div key={logo.name} className="flex h-14 items-center rounded-2xl border border-gray-100 bg-white px-4 shadow-sm">
                                                        <img src={logo.src} alt={logo.name} className={logo.className} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-[#fff6ea] to-white p-5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Mobile Money Operators</p>
                                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                                {mnoLogos.map((logo) => (
                                                    <div key={logo.name} className="flex h-14 items-center rounded-2xl border border-gray-100 bg-white px-4 shadow-sm">
                                                        <img src={logo.src} alt={logo.name} className={logo.className} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-[30px] border border-gray-100 bg-[#1f140a] p-6 text-white">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Payout snapshot</p>
                                                <h2 className="mt-3 text-2xl font-black">Tiered payout fees for mobile money and bank account.</h2>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const target = document.getElementById('payout-breakdown');
                                                    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }}
                                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition-all hover:bg-white/15"
                                            >
                                                See full breakdown
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-6 grid gap-3 md:grid-cols-2">
                                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-200">Mobile Money</p>
                                                <p className="mt-2 text-sm text-gray-300">K8.50 - K12, K15 - K25, then K35 for larger payout sizes.</p>
                                            </div>
                                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-200">Bank Account</p>
                                                <p className="mt-2 text-sm text-gray-300">K8.50 - K10, K15 - K25, then K35 across high-value transfers.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="relative px-6 pb-8 pt-4 lg:px-8">
                    <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.12),_transparent_55%)]" />
                    <div className="relative z-10 mx-auto max-w-7xl">
                        <div className="rounded-[38px] border border-white/10 bg-white/6 p-6 text-white shadow-[0_30px_90px_rgba(146,64,14,0.18)] backdrop-blur md:p-8">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <SectionEyebrow>Collections</SectionEyebrow>
                                    <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-white">Card and mobile money rates in one pricing band.</h2>
                                </div>
                                <p className="max-w-xl text-sm leading-relaxed text-gray-200">
                                    These are the base collection rates for domestic cards, international cards, and mobile money payments across FlapaPay checkout and payment links.
                                </p>
                            </div>

                            <div className="mt-8 grid gap-4 md:grid-cols-3">
                                {collectionFees.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.id} className="rounded-[28px] border border-white/10 bg-white/8 p-6">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-black">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-orange-200">{item.label}</p>
                                            <p className="mt-3 text-5xl font-black tracking-[-0.05em] text-white">{item.displayRate}</p>
                                            <p className="mt-4 text-sm leading-relaxed text-gray-200">{item.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="relative px-6 py-10 lg:px-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.08),_transparent_35%)]" />
                    <div className="relative z-10 mx-auto max-w-7xl">
                        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                            <div className="rounded-[34px] border border-[#eadccd] bg-white/85 p-7 shadow-[0_20px_70px_rgba(120,53,15,0.08)] backdrop-blur">
                                <SectionEyebrow>Collections</SectionEyebrow>
                                <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-gray-950">Simple rates for funds coming in.</h2>
                                <div className="mt-8 space-y-4">
                                    {collectionFees.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.id} className="flex items-center justify-between gap-4 rounded-[26px] border border-gray-100 bg-[#fcfaf7] p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-gray-900">{item.label}</p>
                                                        <p className="text-sm text-gray-500">{item.description}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black tracking-[-0.04em] text-gray-950">{item.displayRate}</p>
                                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Per successful collection</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div id="payout-breakdown" className="rounded-[34px] border border-[#eadccd] bg-[#fffaf2] p-7 shadow-[0_20px_70px_rgba(120,53,15,0.08)]">
                                <SectionEyebrow>Payout</SectionEyebrow>
                                <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-gray-950">Tiered pricing for funds going out.</h2>

                                <div className="mt-8 grid gap-5 md:grid-cols-2">
                                    <div className="rounded-[28px] border border-gray-200 bg-white p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-white">
                                                <Smartphone className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-gray-950">Mobile Money</p>
                                                <p className="text-sm text-gray-500">Flat fee by transaction band</p>
                                            </div>
                                        </div>
                                        <div className="mt-5 space-y-3">
                                            {payoutPricing.mobile_money.map((tier) => (
                                                <div key={tier.label} className="rounded-[22px] border border-gray-100 bg-[#fcfaf7] p-4">
                                                    <div className="flex items-baseline justify-between gap-4">
                                                        <p className="text-xl font-black text-gray-950">{tier.feeRange}</p>
                                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Fee</p>
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-500">{tier.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-[28px] border border-gray-200 bg-white p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-white">
                                                <Landmark className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-gray-950">Bank Account</p>
                                                <p className="text-sm text-gray-500">Flat fee by transaction band</p>
                                            </div>
                                        </div>
                                        <div className="mt-5 space-y-3">
                                            {payoutPricing.bank_account.map((tier) => (
                                                <div key={tier.label} className="rounded-[22px] border border-gray-100 bg-[#fcfaf7] p-4">
                                                    <div className="flex items-baseline justify-between gap-4">
                                                        <p className="text-xl font-black text-gray-950">{tier.feeRange}</p>
                                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Fee</p>
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-500">{tier.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="relative px-6 py-20 lg:px-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.08),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.06),_transparent_28%)]" />
                    <div className="relative z-10 mx-auto max-w-7xl">
                        <div className="rounded-[38px] border border-[#eadccd] bg-white/90 p-6 shadow-[0_25px_90px_rgba(120,53,15,0.10)] backdrop-blur md:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-5">
                                <div>
                                    <SectionEyebrow>Pricing Calculators</SectionEyebrow>
                                    <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] text-gray-950">Check the fee before you move money.</h2>
                                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
                                        Use the collections and payout calculators to estimate charges instantly. Larger monthly volume can be priced separately.
                                    </p>
                                </div>

                                <div className="flex rounded-full border border-gray-200 bg-[#f7f3ec] p-1.5">
                                    {[
                                        { id: 'collections', label: 'Collections' },
                                        { id: 'payout', label: 'Payout' },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setPricingMode(item.id as PricingMode)}
                                            className={`rounded-full px-5 py-3 text-sm font-black transition-all ${
                                                pricingMode === item.id
                                                    ? 'bg-gray-950 text-white shadow-lg'
                                                    : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
                                <div className="rounded-[30px] bg-[#1f140a] p-6 text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white">
                                            <Calculator className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-200">Fee summary</p>
                                            <h3 className="mt-2 text-2xl font-black">
                                                {pricingMode === 'collections' ? 'Collection Fees Calculator' : 'Payout Fees Calculator'}
                                            </h3>
                                        </div>
                                    </div>

                                    {pricingMode === 'collections' ? (
                                        <div className="mt-8 space-y-5">
                                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200">Selected channel</p>
                                                <p className="mt-2 text-2xl font-black">{activeCollection.label}</p>
                                            </div>
                                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200">I want to collect</p>
                                                <p className="mt-2 text-3xl font-black">{formatKwacha(parsedCollectionAmount)}</p>
                                            </div>
                                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200">Estimated fee</p>
                                                <p className="mt-2 text-3xl font-black">{formatKwacha(collectionFeeAmount)}</p>
                                                <p className="mt-2 text-sm text-gray-300">Fee rate: {activeCollection.displayRate}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-8 space-y-5">
                                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200">Selected channel</p>
                                                <p className="mt-2 text-2xl font-black">{payoutChannel === 'mobile_money' ? 'Mobile Money' : 'Bank Account'}</p>
                                            </div>
                                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200">I want to send</p>
                                                <p className="mt-2 text-3xl font-black">{formatKwacha(parsedPayoutAmount)}</p>
                                            </div>
                                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200">Flat fee</p>
                                                <p className="mt-2 text-3xl font-black">{formatKwacha(activePayoutTier.estimate)}</p>
                                                <p className="mt-2 text-sm text-gray-300">Applicable band: {activePayoutTier.feeRange}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-[30px] border border-gray-100 bg-[#fcfaf7] p-6">
                                    {pricingMode === 'collections' ? (
                                        <>
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-600">Collections</p>
                                            <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-gray-950">Enter amount and select payment channel.</h3>
                                            <p className="mt-3 text-gray-600">
                                                See how much you will be charged for processing card or mobile money collections.
                                            </p>

                                            <div className="mt-8">
                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Select Payment Channel</p>
                                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                    {collectionFees.map((item) => {
                                                        const Icon = item.icon;
                                                        const active = collectionChannel === item.id;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => setCollectionChannel(item.id)}
                                                                className={`rounded-[24px] border p-4 text-left transition-all ${
                                                                    active
                                                                        ? 'border-orange-300 bg-white shadow-lg shadow-orange-100'
                                                                        : 'border-gray-200 bg-[#f5efe6] hover:border-orange-200 hover:bg-white'
                                                                }`}
                                                            >
                                                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-gray-950 text-white' : 'bg-white text-gray-700'}`}>
                                                                    <Icon className="h-5 w-5" />
                                                                </div>
                                                                <p className="mt-4 text-base font-black text-gray-950">{item.label}</p>
                                                                <p className="mt-1 text-sm text-gray-500">{item.displayRate}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_0.9fr]">
                                                <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                                                    <label className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">I want to collect</label>
                                                    <div className="mt-3 flex items-center rounded-[20px] border border-gray-200 bg-[#fcfaf7] px-5 py-4">
                                                        <span className="text-2xl font-black text-orange-600">K</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={collectionAmount}
                                                            onChange={(e) => setCollectionAmount(e.target.value)}
                                                            className="ml-3 w-full bg-transparent text-3xl font-black tracking-[-0.04em] text-gray-950 outline-none"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Fees</p>
                                                    <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-gray-950">{activeCollection.displayRate}</p>
                                                    <p className="mt-2 text-sm text-gray-500">Estimated fee</p>
                                                    <p className="mt-1 text-2xl font-black text-orange-600">{formatKwacha(collectionFeeAmount)}</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-600">Payout</p>
                                            <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-gray-950">Estimate payout charges by transfer rail.</h3>
                                            <p className="mt-3 text-gray-600">
                                                Select a payout channel and transaction amount to see the applicable fee band and estimated flat charge.
                                            </p>

                                            <div className="mt-8">
                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Select Payment Channel</p>
                                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                    {[
                                                        { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                                                        { id: 'bank_account', label: 'Bank Account', icon: Landmark },
                                                    ].map((item) => {
                                                        const Icon = item.icon;
                                                        const active = payoutChannel === item.id;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => setPayoutChannel(item.id as PayoutChannel)}
                                                                className={`rounded-[24px] border p-4 text-left transition-all ${
                                                                    active
                                                                        ? 'border-orange-300 bg-white shadow-lg shadow-orange-100'
                                                                        : 'border-gray-200 bg-[#f5efe6] hover:border-orange-200 hover:bg-white'
                                                                }`}
                                                            >
                                                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-gray-950 text-white' : 'bg-white text-gray-700'}`}>
                                                                    <Icon className="h-5 w-5" />
                                                                </div>
                                                                <p className="mt-4 text-base font-black text-gray-950">{item.label}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_0.9fr]">
                                                <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                                                    <label className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">I want to send</label>
                                                    <div className="mt-3 flex items-center rounded-[20px] border border-gray-200 bg-[#fcfaf7] px-5 py-4">
                                                        <span className="text-2xl font-black text-orange-600">K</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={payoutAmount}
                                                            onChange={(e) => setPayoutAmount(e.target.value)}
                                                            className="ml-3 w-full bg-transparent text-3xl font-black tracking-[-0.04em] text-gray-950 outline-none"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Flat Fee</p>
                                                    <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-gray-950">{formatKwacha(activePayoutTier.estimate)}</p>
                                                    <p className="mt-2 text-sm text-gray-500">Fee range</p>
                                                    <p className="mt-1 text-xl font-black text-orange-600">{activePayoutTier.feeRange}</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 rounded-[24px] border border-dashed border-orange-200 bg-orange-50/70 p-5">
                                                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">Applicable payout tier</p>
                                                <p className="mt-2 text-lg font-black text-gray-950">{activePayoutTier.label}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="relative px-6 pb-20 lg:px-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.06),_transparent_42%)]" />
                    <div className="relative z-10 mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-[34px] border border-[#eadccd] bg-white/85 p-7 shadow-[0_20px_70px_rgba(120,53,15,0.08)] backdrop-blur">
                            <SectionEyebrow>Included</SectionEyebrow>
                            <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-gray-950">What sits around the fee.</h2>
                            <div className="mt-8 space-y-4">
                                {[
                                    'Checkout sessions, payment links, and public payment pages',
                                    'Wallet settlement and ledger visibility inside Merchant Hub',
                                    'Transaction receipts, reporting, and operational histories',
                                    'Mobile money and card support in one merchant stack',
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-4 rounded-[24px] border border-gray-100 bg-[#fcfaf7] p-5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm leading-relaxed text-gray-600">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[34px] border border-gray-950 bg-gray-950 p-7 text-white shadow-[0_25px_90px_rgba(17,24,39,0.28)]">
                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Volume pricing</p>
                            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em]">Need a custom commercial structure?</h2>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-300">
                                High-volume merchants, platforms, institutions, and payout-heavy operations can request tailored pricing aligned to monthly throughput and settlement behavior.
                            </p>

                            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5">
                                <p className="text-sm font-bold text-gray-300">
                                    Process large monthly volume or need a different commercial shape? Speak with sales for enterprise pricing and payout terms.
                                </p>
                                <p className="mt-3 text-sm font-bold text-orange-300">
                                    sales@flapapay.com
                                </p>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/merchant/signup')}
                                    className="rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 px-8 py-4 text-base font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:-translate-y-0.5"
                                >
                                    Open an account
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate('/about')}
                                    className="rounded-full border-2 border-white/15 bg-transparent px-8 py-4 text-base font-black text-white transition-all hover:bg-white/5"
                                >
                                    Learn more
                                </Button>
                            </div>

                            <div className="mt-10 grid gap-4 md:grid-cols-3">
                                {[
                                    { label: 'Collections', value: '3 channels' },
                                    { label: 'Payout rails', value: '2 rails' },
                                    { label: 'Fee model', value: 'Transparent' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">{item.label}</p>
                                        <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
