import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Shield, Lock, Eye, Database, Share2, UserCheck, Bell, MessageSquare } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
    const sections = [
        { id: 'introduction', title: '1. Introduction', icon: <Shield className="w-5 h-5" /> },
        { id: 'collection', title: '2. Data Collection', icon: <Database className="w-5 h-5" /> },
        { id: 'usage', title: '3. Data Usage', icon: <UserCheck className="w-5 h-5" /> },
        { id: 'sharing', title: '4. Data Sharing', icon: <Share2 className="w-5 h-5" /> },
        { id: 'security', title: '5. Data Security', icon: <Lock className="w-5 h-5" /> },
        { id: 'rights', title: '6. Your Rights', icon: <Eye className="w-5 h-5" /> },
        { id: 'notifications', title: '7. Notifications', icon: <Bell className="w-5 h-5" /> },
        { id: 'contact', title: '8. Contact Us', icon: <MessageSquare className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-orange-100">
            <Navbar />

            <main className="pt-20">
                {/* Modern Hero Section */}
                <section className="relative overflow-hidden bg-white border-b border-gray-100 py-32">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/30 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-50/30 to-transparent rounded-full -ml-64 -mb-64 blur-3xl pointer-events-none"></div>

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-50 border border-orange-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-3 animate-pulse"></span>
                            <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Trust & Transparency</span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
                            Privacy is our <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">Core Infrastructure.</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                            Last Revised: March 2026. At FlapaPay, we build financial tools that prioritize your security and data sovereignty above all else.
                        </p>
                    </div>
                </section>

                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row gap-16">
                            {/* Sticky Sidebar Navigation */}
                            <aside className="hidden lg:block w-72 shrink-0">
                                <div className="sticky top-32 space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-4">Contents</p>
                                    {sections.map((section) => (
                                        <a
                                            key={section.id}
                                            href={`#${section.id}`}
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-900 hover:bg-white transition-all group"
                                        >
                                            <span className="text-gray-300 group-hover:text-orange-500 transition-colors uppercase tracking-widest text-[10px] font-black w-4 flex-shrink-0">
                                                {section.icon}
                                            </span>
                                            {section.title.split('. ')[1]}
                                        </a>
                                    ))}

                                    <div className="mt-12 p-6 rounded-3xl bg-gray-900 text-white shadow-xl shadow-gray-900/10">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Need help?</p>
                                        <p className="text-sm font-medium leading-relaxed text-gray-300 mb-6">Our compliance team is here to answer your questions regarding data protection.</p>
                                        <button className="w-full py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-500 hover:text-white transition-all">
                                            Contact DPO
                                        </button>
                                    </div>
                                </div>
                            </aside>

                            {/* Main Content Area */}
                            <div className="flex-1 space-y-24 max-w-3xl">
                                {/* Introduction */}
                                <div id="introduction" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Introduction</h2>
                                    </div>
                                    <div className="prose prose-lg prose-orange max-w-none text-gray-500 font-medium leading-relaxed space-y-6">
                                        <p>
                                            FlapaPay (referred to as "FlapaPay", "we", "us", or "our") operates a global financial infrastructure designed to facilitate secure payments, currency swaps, and digital banking services.
                                        </p>
                                        <p>
                                            This Privacy Policy outlines our commitment to protecting the personal data of our users, merchants, and partners. We comply with international data protection standards, including the GDPR, CCPA, and regional financial regulations in Zambia, Nigeria, and other operating regions.
                                        </p>
                                    </div>
                                </div>

                                {/* Data Collection */}
                                <div id="collection" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Information We Collect</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                        <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Direct Data</h3>
                                            <ul className="space-y-3 text-sm text-gray-500 font-bold">
                                                <li className="flex items-center gap-2">• KYC Identity Documents</li>
                                                <li className="flex items-center gap-2">• Full Name & Contact Info</li>
                                                <li className="flex items-center gap-2">• Security PIN & Passwords</li>
                                                <li className="flex items-center gap-2">• Business Registration Data</li>
                                            </ul>
                                        </div>
                                        <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Transactional Data</h3>
                                            <ul className="space-y-3 text-sm text-gray-500 font-bold">
                                                <li className="flex items-center gap-2">• Payment References</li>
                                                <li className="flex items-center gap-2">• Recipient Wallet Details</li>
                                                <li className="flex items-center gap-2">• Swap History & Rates</li>
                                                <li className="flex items-center gap-2">• Merchant Billing Info</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="prose prose-lg prose-orange max-w-none text-gray-500 font-medium leading-relaxed">
                                        <p>
                                            We also automatically collect technical data such as IP addresses, device identifiers, and geolocation to prevent account takeover and unauthorized access from restricted jurisdictions.
                                        </p>
                                    </div>
                                </div>

                                {/* Data Usage */}
                                <div id="usage" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                            <UserCheck className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">How We Use Your Data</h2>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="flex gap-6">
                                            <div className="shrink-0 w-1 rounded-full bg-emerald-500 h-16"></div>
                                            <div>
                                                <h4 className="text-lg font-black text-gray-900 mb-2">Service Provisioning</h4>
                                                <p className="text-gray-500 text-sm font-medium leading-relaxed">Executing currency swaps, processing mobile money payouts via PawaPay, and managing virtual card balances via Mastercard Rails.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="shrink-0 w-1 rounded-full bg-orange-500 h-16"></div>
                                            <div>
                                                <h4 className="text-lg font-black text-gray-900 mb-2">KYC & Compliance</h4>
                                                <p className="text-gray-500 text-sm font-medium leading-relaxed">Verifying your identity against global watchlists and anti-money laundering (AML) databases as required by central banking regulations.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="shrink-0 w-1 rounded-full bg-blue-500 h-16"></div>
                                            <div>
                                                <h4 className="text-lg font-black text-gray-900 mb-2">Fraud Prevention</h4>
                                                <p className="text-gray-500 text-sm font-medium leading-relaxed">Real-time monitoring of transaction patterns to detect and block suspicious activities, ensuring the safety of the entire FlapaPay ecosystem.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Data Sharing */}
                                <div id="sharing" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                                            <Share2 className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Data Sharing & Partners</h2>
                                    </div>
                                    <div className="p-10 rounded-[40px] bg-white border border-gray-100 shadow-inner">
                                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                                            We do not sell your data. We share only necessary data with authorized third-party partners to fulfill our core services:
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { name: 'Stripe', role: 'Card Payments' },
                                                { name: 'Mastercard', role: 'Virtual Cards' },
                                                { name: 'PawaPay', role: 'Momo Payouts' },
                                                { name: 'Regulators', role: 'AML Audits' }
                                            ].map((partner, i) => (
                                                <div key={i} className="text-center p-4">
                                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tighter mb-1">{partner.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{partner.role}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Security */}
                                <div id="security" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-sm">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Security & Infrastructure</h2>
                                    </div>
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[48px] p-12 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                        <p className="text-xl font-medium leading-relaxed text-gray-300 mb-8">
                                            Your financial data is protected via AES-256 encryption at rest and TLS 1.3 in transit.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-widest text-orange-500 mb-2">Vault Security</h4>
                                                <p className="text-sm text-gray-400 leading-relaxed font-medium">All sensitive fields (PINs, card details) are stored in decoupled secure vaults with strictly audited access control.</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-widest text-orange-500 mb-2">Live Monitoring</h4>
                                                <p className="text-sm text-gray-400 leading-relaxed font-medium">Our platform architecture triggers automated lockdowns in event of anomalous data access or credential brute-forcing.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rights */}
                                <div id="rights" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Eye className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Rights</h2>
                                    </div>
                                    <div className="prose prose-lg prose-orange max-w-none text-gray-500 font-medium leading-relaxed">
                                        <p>
                                            You have full control over your data. Residents of the EU, USA, and many African jurisdictions have legal rights to:
                                        </p>
                                        <ul className="list-none space-y-4 font-bold text-gray-700">
                                            <li className="flex items-center gap-3">
                                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                                                Access a copy of your personal data stored on our servers.
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                                                Request rectification of inaccurate identity or contact records.
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                                                Withdraw consent for non-essential marketing communications.
                                            </li>
                                            <li className="flex items-center gap-3 text-red-500">
                                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                                                Request permanent deletion (Right to be Forgotten)*.
                                            </li>
                                        </ul>
                                        <p className="text-xs italic mt-6">
                                            *Note: Some financial data must be retained by law for up to 7 years to comply with Anti-Money Laundering (AML) statutes.
                                        </p>
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div id="notifications" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                                            <Bell className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">7. Notifications & Marketing</h2>
                                    </div>
                                    <div className="prose prose-lg prose-orange max-w-none text-gray-500 font-medium leading-relaxed space-y-6">
                                        <p>
                                            We use your contact information to send transaction receipts, security alerts, and system updates. These "Transactional Messages" are essential for the security of your account and cannot be opted out of while your account is active.
                                        </p>
                                        <p>
                                            Marketing communications, such as newsletters or new feature announcements, are strictly opt-in. You can manage your preferences or unsubscribe at any time through your account settings or the link provided in the footer of our emails.
                                        </p>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div id="contact" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">8. Contact Us</h2>
                                    </div>
                                    <div className="p-10 rounded-[40px] bg-white border border-gray-100 shadow-sm">
                                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                                            If you have any questions about this Privacy Policy or our data practices, please reach out to our dedicated privacy team:
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm">
                                                    @
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                                                    <p className="text-sm font-bold text-gray-900">privacy@flapapay.com</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm">
                                                    📍
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Headquarters</p>
                                                    <p className="text-sm font-bold text-gray-900">FlapaPay Financial Center, Lusaka, Zambia</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom CTA */}
                                <div className="p-12 rounded-[48px] bg-white border border-gray-100 text-center shadow-sm">
                                    <h3 className="text-2xl font-black text-gray-900 mb-4">Account Security First</h3>
                                    <p className="text-gray-500 font-medium mb-8">Protecting your data is a collective effort. Remember to never share your security PIN or login credentials with anyone.</p>
                                    <a
                                        href="/settings"
                                        className="inline-flex items-center justify-center px-10 py-4 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-orange-500 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300"
                                    >
                                        Manage Security Settings
                                    </a>
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

