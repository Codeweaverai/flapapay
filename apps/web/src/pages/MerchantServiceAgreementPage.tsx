import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { 
    FileText, 
    UserCheck, 
    CreditCard, 
    Shield, 
    AlertCircle, 
    DollarSign, 
    Lock, 
    Headphones,
    CheckCircle2,
    Building2,
    Globe,
    Clock
} from 'lucide-react';

export const MerchantServiceAgreementPage: React.FC = () => {
    const sections = [
        { id: 'overview', title: '1. Overview', icon: <FileText className="w-5 h-5" /> },
        { id: 'eligibility', title: '2. Merchant Eligibility', icon: <UserCheck className="w-5 h-5" /> },
        { id: 'services', title: '3. Services Provided', icon: <Building2 className="w-5 h-5" /> },
        { id: 'fees', title: '4. Fees & Settlement', icon: <DollarSign className="w-5 h-5" /> },
        { id: 'compliance', title: '5. Compliance & Security', icon: <Shield className="w-5 h-5" /> },
        { id: 'obligations', title: '6. Merchant Obligations', icon: <CheckCircle2 className="w-5 h-5" /> },
        { id: 'liability', title: '7. Liability & Indemnification', icon: <AlertCircle className="w-5 h-5" /> },
        { id: 'termination', title: '8. Termination', icon: <Clock className="w-5 h-5" /> },
        { id: 'support', title: '9. Support & Disputes', icon: <Headphones className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-purple-100">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-white border-b border-gray-100 py-32">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-100/30 to-transparent rounded-full -ml-64 -mt-64 blur-3xl pointer-events-none"></div>

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-50 border border-purple-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="flex h-2 w-2 rounded-full bg-purple-500 mr-3 animate-pulse"></span>
                            <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Merchant Agreement</span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
                            Merchant Service <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400">Agreement</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                            Last Updated: March 2026. This agreement governs your use of FlapaPay's merchant services, payment processing, and related financial products.
                        </p>
                    </div>
                </section>

                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row gap-16">
                            {/* Sticky Sidebar Navigation */}
                            <aside className="hidden lg:block w-72 shrink-0">
                                <div className="sticky top-32 space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-4">Agreement Sections</p>
                                    {sections.map((section) => (
                                        <a
                                            key={section.id}
                                            href={`#${section.id}`}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-all group"
                                        >
                                            <span className="text-gray-400 group-hover:text-purple-500 transition-colors">{section.icon}</span>
                                            {section.title}
                                        </a>
                                    ))}
                                </div>
                            </aside>

                            {/* Main Content */}
                            <div className="flex-1 max-w-4xl">
                                {/* Overview */}
                                <section id="overview" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">1. Overview</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            This Merchant Service Agreement ("Agreement") is a legally binding contract between you ("Merchant") and FlapaPay Inc. ("FlapaPay", "we", "us", "our") governing your access to and use of our payment processing services, merchant dashboard, and related financial products.
                                        </p>
                                        <div className="grid md:grid-cols-3 gap-6 mt-8">
                                            <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
                                                <Globe className="w-8 h-8 text-purple-600 mb-4" />
                                                <p className="text-sm font-black text-purple-900">Global Coverage</p>
                                                <p className="text-xs text-purple-600 mt-2">50+ countries supported</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
                                                <Shield className="w-8 h-8 text-purple-600 mb-4" />
                                                <p className="text-sm font-black text-purple-900">PCI-DSS Compliant</p>
                                                <p className="text-xs text-purple-600 mt-2">Level 1 certified</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
                                                <Clock className="w-8 h-8 text-purple-600 mb-4" />
                                                <p className="text-sm font-black text-purple-900">24/7 Processing</p>
                                                <p className="text-xs text-purple-600 mt-2">Always available</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Eligibility */}
                                <section id="eligibility" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <UserCheck className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">2. Merchant Eligibility</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            To qualify for FlapaPay merchant services, you must meet the following requirements:
                                        </p>
                                        <ul className="space-y-4">
                                            {[
                                                'Be a legally registered business entity in good standing',
                                                'Maintain a valid business bank account in an approved jurisdiction',
                                                'Comply with all applicable laws and regulations in your operating region',
                                                'Not be engaged in prohibited or restricted business activities',
                                                'Provide accurate and complete information during onboarding',
                                                'Maintain adequate systems to process transactions and refunds',
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <CheckCircle2 className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                                                    <span className="text-gray-600 font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>

                                {/* Services */}
                                <section id="services" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">3. Services Provided</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            FlapaPay provides the following services to merchants:
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {[
                                                { title: 'Payment Processing', desc: 'Accept card, mobile money, and bank transfer payments' },
                                                { title: 'Payment Links', desc: 'Create and share customizable payment link pages' },
                                                { title: 'Virtual Cards', desc: 'Issue virtual cards for online purchases and subscriptions' },
                                                { title: 'Invoicing', desc: 'Generate and send professional invoices to customers' },
                                                { title: 'Collections', desc: 'Automated recurring billing and subscription management' },
                                                { title: 'Payouts', desc: 'Send bulk payments to vendors, employees, or customers' },
                                                { title: 'Escrow Services', desc: 'Secure held payments for marketplace transactions' },
                                                { title: 'Analytics & Reports', desc: 'Real-time transaction data and financial insights' },
                                            ].map((service, i) => (
                                                <div key={i} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all">
                                                    <p className="text-sm font-black text-gray-900 mb-2">{service.title}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{service.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* Fees */}
                                <section id="fees" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">4. Fees & Settlement</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            Merchant agrees to pay FlapaPay the fees as outlined in the pricing schedule applicable to their account tier and transaction volume.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                                <span className="text-sm font-bold text-gray-700">Payment Processing</span>
                                                <span className="text-sm font-black text-gray-900">2.9% + Fixed Fee</span>
                                            </div>
                                            <div className="flex justify-between items-center p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                                <span className="text-sm font-bold text-gray-700">Virtual Cards</span>
                                                <span className="text-sm font-black text-gray-900">1.5% + Issuance Fee</span>
                                            </div>
                                            <div className="flex justify-between items-center p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                                <span className="text-sm font-bold text-gray-700">Cross-Border FX</span>
                                                <span className="text-sm font-black text-gray-900">0.5% - 1.5%</span>
                                            </div>
                                            <div className="flex justify-between items-center p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                                <span className="text-sm font-bold text-gray-700">Settlement Period</span>
                                                <span className="text-sm font-black text-gray-900">T+1 to T+3</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium mt-6">
                                            * Custom pricing available for high-volume merchants. Contact sales for enterprise rates.
                                        </p>
                                    </div>
                                </section>

                                {/* Compliance */}
                                <section id="compliance" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">5. Compliance & Security</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            Merchant acknowledges and agrees to comply with all applicable regulatory requirements:
                                        </p>
                                        <ul className="space-y-4">
                                            {[
                                                'Know Your Customer (KYC) and Customer Due Diligence (CDD) requirements',
                                                'Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) regulations',
                                                'Payment Card Industry Data Security Standard (PCI-DSS)',
                                                'General Data Protection Regulation (GDPR) for EU customers',
                                                'Local data protection and privacy laws in operating jurisdictions',
                                                'Sanctions screening and prohibited persons lists',
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <Lock className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                                                    <span className="text-gray-600 font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>

                                {/* Obligations */}
                                <section id="obligations" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">6. Merchant Obligations</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            As a FlapaPay merchant, you agree to:
                                        </p>
                                        <ul className="space-y-4">
                                            {[
                                                'Deliver goods or services as described to customers',
                                                'Maintain accurate transaction records and documentation',
                                                'Respond to customer inquiries and disputes in a timely manner',
                                                'Process refunds according to your stated refund policy',
                                                'Notify FlapaPay of any material changes to your business',
                                                'Implement appropriate fraud prevention measures',
                                                'Not use FlapaPay services for prohibited activities',
                                                'Maintain adequate customer support channels',
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <CheckCircle2 className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                                                    <span className="text-gray-600 font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>

                                {/* Liability */}
                                <section id="liability" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">7. Liability & Indemnification</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 mb-3">Limitation of Liability</h3>
                                                <p className="text-gray-600 font-medium leading-relaxed">
                                                    FlapaPay's total liability under this agreement shall not exceed the total fees paid by Merchant to FlapaPay in the 12 months preceding the claim. We shall not be liable for indirect, incidental, consequential, or punitive damages.
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 mb-3">Indemnification</h3>
                                                <p className="text-gray-600 font-medium leading-relaxed">
                                                    Merchant agrees to indemnify, defend, and hold harmless FlapaPay from any claims, losses, damages, or expenses arising from Merchant's breach of this agreement, violation of law, or negligent or willful misconduct.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Termination */}
                                <section id="termination" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">8. Termination</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 mb-3">Termination by Merchant</h3>
                                                <p className="text-gray-600 font-medium leading-relaxed">
                                                    Merchant may terminate this agreement at any time by providing 30 days written notice. All outstanding fees and pending transactions must be settled before termination is effective.
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 mb-3">Termination by FlapaPay</h3>
                                                <p className="text-gray-600 font-medium leading-relaxed">
                                                    FlapaPay may suspend or terminate merchant services immediately if Merchant breaches this agreement, engages in prohibited activities, or poses a risk to FlapaPay or its partners. Funds may be held for up to 180 days to cover potential chargebacks.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Support */}
                                <section id="support" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Headphones className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">9. Support & Disputes</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 mb-3">Customer Support</h3>
                                                <p className="text-gray-600 font-medium leading-relaxed">
                                                    FlapaPay provides 24/7 support via email, live chat, and phone for enterprise merchants. Standard response times: Critical issues (1 hour), General inquiries (24 hours).
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 mb-3">Dispute Resolution</h3>
                                                <p className="text-gray-600 font-medium leading-relaxed">
                                                    Any disputes arising from this agreement shall first be resolved through good-faith negotiation. If unresolved, disputes shall be settled by binding arbitration in accordance with applicable commercial arbitration rules.
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 mb-3">Governing Law</h3>
                                                <p className="text-gray-600 font-medium leading-relaxed">
                                                    This agreement is governed by the laws of the jurisdiction in which FlapaPay Inc. is registered, without regard to conflict of law principles.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Acceptance */}
                                <section className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-12 text-center">
                                    <h2 className="text-3xl font-black text-white mb-6">Ready to Get Started?</h2>
                                    <p className="text-purple-100 font-medium mb-8 max-w-xl mx-auto">
                                        Join thousands of merchants processing payments with FlapaPay. Create your account and start accepting payments in minutes.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <a href="/signup" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-purple-600 font-black hover:bg-purple-50 transition-all">
                                            Create Merchant Account
                                        </a>
                                        <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-purple-700 text-white font-black border border-purple-500 hover:bg-purple-600 transition-all">
                                            Contact Sales
                                        </a>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
