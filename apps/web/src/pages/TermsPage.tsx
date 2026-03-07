import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { FileText, UserPlus, CreditCard, Ban, Scale, AlertTriangle, HelpCircle, Landmark } from 'lucide-react';

export const TermsPage: React.FC = () => {
    const sections = [
        { id: 'acceptance', title: '1. Acceptance', icon: <FileText className="w-5 h-5" /> },
        { id: 'accounts', title: '2. User Accounts', icon: <UserPlus className="w-5 h-5" /> },
        { id: 'transactions', title: '3. Transactions', icon: <CreditCard className="w-5 h-5" /> },
        { id: 'prohibited', title: '4. Prohibited Use', icon: <Ban className="w-5 h-5" /> },
        { id: 'fees', title: '5. Fees & Payouts', icon: <Landmark className="w-5 h-5" /> },
        { id: 'liability', title: '6. Liability', icon: <Scale className="w-5 h-5" /> },
        { id: 'disclaimer', title: '7. Disclaimer', icon: <AlertTriangle className="w-5 h-5" /> },
        { id: 'support', title: '8. Support', icon: <HelpCircle className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-orange-100">
            <Navbar />

            <main className="pt-20">
                {/* Modern Hero Section */}
                <section className="relative overflow-hidden bg-white border-b border-gray-100 py-32">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/30 to-transparent rounded-full -ml-64 -mt-64 blur-3xl pointer-events-none"></div>

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-50 border border-orange-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-3 animate-pulse"></span>
                            <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Platform Guidelines</span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
                            The Rules of the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">Financial Rails.</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                            Last Updated: March 2026. By accessing FlapaPay, you agree to these Terms of Service. Please read them carefully to understand your rights and obligations.
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
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-900 hover:bg-white transition-all group"
                                        >
                                            <span className="text-gray-300 group-hover:text-orange-500 transition-colors uppercase tracking-widest text-[10px] font-black w-4 flex-shrink-0">
                                                {section.icon}
                                            </span>
                                            {section.title.split('. ')[1]}
                                        </a>
                                    ))}

                                    <div className="mt-12 p-8 rounded-[40px] bg-gradient-to-br from-orange-500 to-yellow-600 text-white shadow-2xl shadow-orange-500/20">
                                        <Landmark className="w-8 h-8 mb-6 text-orange-200" />
                                        <h4 className="text-lg font-black mb-2 leading-tight">Regulatory Compliance</h4>
                                        <p className="text-xs font-medium text-orange-100 leading-relaxed mb-6 italic">We operate under strict financial licenses and strictly enforce AML/KYC protocols.</p>
                                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                            <div className="w-2/3 h-full bg-white"></div>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            {/* Main Content Area */}
                            <div className="flex-1 space-y-24 max-w-3xl">
                                {/* Acceptance */}
                                <div id="acceptance" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm font-black">
                                            01
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Acceptance of Terms</h2>
                                    </div>
                                    <div className="prose prose-lg prose-orange max-w-none text-gray-500 font-medium leading-relaxed space-y-6">
                                        <p>
                                            By creating an account, accessing the FlapaPay Dashboard, or utilizing our API, you enter into a legally binding agreement with FlapaPay. These terms govern your use of the "Service", including all website features, merchant tools, and payment processing capabilities.
                                        </p>
                                        <p>
                                            If you are using the Service on behalf of a company or entity, you represent that you have the authority to bind that entity to these terms.
                                        </p>
                                    </div>
                                </div>

                                {/* User Accounts */}
                                <div id="accounts" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm font-black">
                                            02
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">User Accounts & Security</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-10 rounded-[40px] bg-white border border-gray-100 shadow-sm">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Registration Obligations</h4>
                                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                                You must provide accurate, current, and complete information during the registration process (KYC). Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
                                            </p>
                                        </div>
                                        <div className="p-10 rounded-[40px] bg-gray-900 text-white shadow-xl">
                                            <h4 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-4">Account Safeguards</h4>
                                            <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                                You are responsible for safeguarding the credentials and security PIN used to access the Service. You agree not to disclose your PIN to any third party. FlapaPay will never ask for your PIN via email or phone.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Transactions */}
                                <div id="transactions" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm font-black">
                                            03
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Financial Transactions</h2>
                                    </div>
                                    <div className="prose prose-lg prose-orange max-w-none text-gray-500 font-medium leading-relaxed">
                                        <p>All transactions processed through FlapaPay (Send Money, FX Swaps, Payouts) are subject to the following rules:</p>
                                        <ul className="list-none space-y-6 mt-8">
                                            <li className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">✓</div>
                                                <p><strong>Finality:</strong> Once authorized via PIN or biometric data, transactions are final and cannot be reversed by the user.</p>
                                            </li>
                                            <li className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">✓</div>
                                                <p><strong>FX Rates:</strong> Exchange rates provided in the FX Liquidity Pool are live market rates plus a platform spread. Quotes are valid for 60 seconds.</p>
                                            </li>
                                            <li className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">✓</div>
                                                <p><strong>Limits:</strong> FlapaPay reserves the right to impose transaction limits based on your KYC verification level.</p>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Prohibited Use */}
                                <div id="prohibited" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm font-black">
                                            04
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Prohibited Activities</h2>
                                    </div>
                                    <div className="p-10 rounded-[48px] border-2 border-red-50 bg-red-50/10">
                                        <p className="text-red-900 font-black uppercase tracking-widest text-xs mb-6">Zero Tolerance Policy</p>
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">You may not use FlapaPay for:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold text-gray-700">
                                            <div className="flex items-center gap-2">• Money Laundering</div>
                                            <div className="flex items-center gap-2">• Terrorist Financing</div>
                                            <div className="flex items-center gap-2">• Adult Entertainment Services</div>
                                            <div className="flex items-center gap-2">• Crypto-Asset Unlicensed Trading</div>
                                            <div className="flex items-center gap-2">• Gambling Operations</div>
                                            <div className="flex items-center gap-2">• IP Infringement</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fees & Payouts */}
                                <div id="fees" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm font-black">
                                            05
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Fees & Payouts</h2>
                                    </div>
                                    <div className="prose prose-lg prose-orange max-w-none text-gray-500 font-medium leading-relaxed space-y-6">
                                        <p>
                                            FlapaPay charges fees for its services as disclosed on the pricing page or within the platform interface prior to transaction execution.
                                        </p>
                                        <ul className="list-disc pl-6 space-y-2">
                                            <li><strong>Gateway Fees:</strong> Standard percentage + fixed fee per inbound transaction.</li>
                                            <li><strong>Payout Fees:</strong> Flat fees per mobile money or bank transfer disbursement.</li>
                                            <li><strong>FX Spread:</strong> A margin applied to the mid-market exchange rate for currency conversions.</li>
                                        </ul>
                                        <p>
                                            Payouts to merchants are settled according to the agreed schedule (e.g., T+1 or T+3) and are subject to minimum balance requirements and fraud holds.
                                        </p>
                                    </div>
                                </div>

                                {/* Liability */}
                                <div id="liability" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm font-black">
                                            06
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Limitation of Liability</h2>
                                    </div>
                                    <div className="prose prose-lg prose-orange max-w-none text-gray-500 font-medium leading-relaxed space-y-6 text-sm italic">
                                        <p>
                                            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, FLAPAPAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                                        </p>
                                        <p>
                                            IN NO EVENT SHALL OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICES EXCEED THE GREATER OF ONE HUNDRED ZAMBIAN KWACHA (ZMW 100) OR THE AMOUNT PAID BY YOU TO US FOR THE PAST THREE MONTHS OF SERVICES.
                                        </p>
                                    </div>
                                </div>

                                {/* Disclaimer */}
                                <div id="disclaimer" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600 shadow-sm font-black">
                                            07
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Disclaimer</h2>
                                    </div>
                                    <div className="p-10 rounded-[40px] bg-yellow-50 border border-yellow-100">
                                        <p className="text-yellow-900 font-bold leading-relaxed">
                                            FLAPAPAY SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE". WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. FINANCIAL DATA TRANSFERRED OVER PUBLIC NETWORKS CARRIES INHERENT RISKS WHICH THE USER ACCEPTS BY UTILIZING THE PLATFORM.
                                        </p>
                                    </div>
                                </div>

                                {/* Support */}
                                <div id="support" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm font-black">
                                            08
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Technical Support</h2>
                                    </div>
                                    <div className="prose prose-lg prose-orange max-w-none text-gray-500 font-medium leading-relaxed mb-10">
                                        <p>
                                            Users can access technical support via the help center or by contacting support@flapapay.com. Support response times are dependent on the user's service tier.
                                        </p>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-4">
                                        <a href="/help" className="flex-1 p-6 rounded-3xl bg-white border border-gray-100 hover:border-orange-500 transition-colors text-center group">
                                            <p className="text-sm font-black text-gray-900 group-hover:text-orange-600">Help Center</p>
                                            <p className="text-xs text-gray-400 font-medium mt-1">Documentation & FAQs</p>
                                        </a>
                                        <a href="mailto:support@flapapay.com" className="flex-1 p-6 rounded-3xl bg-white border border-gray-100 hover:border-orange-500 transition-colors text-center group">
                                            <p className="text-sm font-black text-gray-900 group-hover:text-orange-600">Email Support</p>
                                            <p className="text-xs text-gray-400 font-medium mt-1">Direct Assistance</p>
                                        </a>
                                    </div>
                                </div>

                                {/* Governing Law */}
                                <div className="p-12 rounded-[48px] bg-white border border-gray-100 text-center shadow-sm">
                                    <Scale className="w-10 h-10 mx-auto mb-6 text-orange-600" />
                                    <h3 className="text-2xl font-black text-gray-900 mb-4">Governing Law</h3>
                                    <p className="text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
                                        These Terms shall be governed by and defined following the laws of the Republic of Zambia. FlapaPay and yourself irrevocably consent that the courts of Zambia shall have exclusive jurisdiction to resolve any dispute.
                                    </p>
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

