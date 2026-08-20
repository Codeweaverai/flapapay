import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Cookie, Shield, Settings, Eye, Clock, ShieldCheck, Bell, Layers3 } from 'lucide-react';

export const CookiePolicyPage: React.FC = () => {
    const sections = [
        { id: 'overview', title: '1. Overview', icon: <Cookie className="w-5 h-5" /> },
        { id: 'types', title: '2. Cookie Types', icon: <Layers3 className="w-5 h-5" /> },
        { id: 'usage', title: '3. How We Use Cookies', icon: <Settings className="w-5 h-5" /> },
        { id: 'choices', title: '4. Your Choices', icon: <Eye className="w-5 h-5" /> },
        { id: 'retention', title: '5. Retention', icon: <Clock className="w-5 h-5" /> },
        { id: 'security', title: '6. Security', icon: <ShieldCheck className="w-5 h-5" /> },
        { id: 'updates', title: '7. Updates', icon: <Bell className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans selection:bg-orange-200/30">
            <Navbar />
            <main className="pt-20">
                <section
                    className="relative overflow-hidden border-b border-white/10 py-28"
                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-transparent to-yellow-500/10" />
                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-orange-400 mr-3 animate-pulse"></span>
                            <span className="text-xs font-black text-orange-300 uppercase tracking-widest">Cookie Policy</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
                            Cookies that keep
                            <br />
                            the platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">smooth and secure</span>.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
                            Last Updated: July 2026. This policy explains how FlapaPay uses cookies and similar technologies to run the site, protect accounts, and improve checkout.
                        </p>
                    </div>
                </section>

                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row gap-16">
                            <aside className="hidden lg:block w-72 shrink-0">
                                <div className="sticky top-32 space-y-2">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 px-4">Policy Sections</p>
                                    {sections.map((section) => (
                                        <a
                                            key={section.id}
                                            href={`#${section.id}`}
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                                        >
                                            <span className="text-gray-500 group-hover:text-orange-300 transition-colors">{section.icon}</span>
                                            {section.title}
                                        </a>
                                    ))}
                                </div>
                            </aside>

                            <div className="flex-1 max-w-4xl space-y-16">
                                <section id="overview" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-400/20 flex items-center justify-center text-orange-300">
                                            <Cookie className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">1. Overview</h2>
                                    </div>
                                    <div className="rounded-[36px] border border-white/10 bg-white p-8 shadow-2xl shadow-black/20">
                                        <p className="text-gray-600 font-medium leading-relaxed">
                                            FlapaPay uses cookies and similar technologies to keep you signed in, remember preferences, secure payments, measure performance, and improve the merchant and customer experience.
                                        </p>
                                    </div>
                                </section>

                                <section id="types" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-400/20 flex items-center justify-center text-orange-300">
                                            <Layers3 className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">2. Cookie Types</h2>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="rounded-[30px] bg-white p-7 shadow-2xl shadow-black/20 border border-white/10">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Essential Cookies</h3>
                                            <p className="text-gray-600 font-medium leading-relaxed">
                                                Required for login sessions, security, fraud prevention, checkout flows, and core site functionality.
                                            </p>
                                        </div>
                                        <div className="rounded-[30px] bg-white p-7 shadow-2xl shadow-black/20 border border-white/10">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Preference Cookies</h3>
                                            <p className="text-gray-600 font-medium leading-relaxed">
                                                Remember language, region, and UI preferences so the platform feels consistent between visits.
                                            </p>
                                        </div>
                                        <div className="rounded-[30px] bg-white p-7 shadow-2xl shadow-black/20 border border-white/10">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Analytics Cookies</h3>
                                            <p className="text-gray-600 font-medium leading-relaxed">
                                                Help us understand page usage, conversion drop-offs, and performance so we can improve the product.
                                            </p>
                                        </div>
                                        <div className="rounded-[30px] bg-white p-7 shadow-2xl shadow-black/20 border border-white/10">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Marketing Cookies</h3>
                                            <p className="text-gray-600 font-medium leading-relaxed">
                                                Used to measure campaign performance and show relevant product updates where permitted.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section id="usage" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-400/20 flex items-center justify-center text-orange-300">
                                            <Settings className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">3. How We Use Cookies</h2>
                                    </div>
                                    <div className="rounded-[36px] border border-white/10 bg-white p-8 shadow-2xl shadow-black/20 space-y-4">
                                        <p className="text-gray-600 font-medium leading-relaxed">We use cookies to:</p>
                                        <ul className="space-y-3 text-gray-600 font-medium">
                                            <li>• keep sessions active and secure</li>
                                            <li>• recognize returning users and merchants</li>
                                            <li>• prevent fraud and suspicious activity</li>
                                            <li>• improve dashboard performance and usability</li>
                                            <li>• remember consent and privacy choices</li>
                                        </ul>
                                    </div>
                                </section>

                                <section id="choices" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-400/20 flex items-center justify-center text-orange-300">
                                            <Eye className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">4. Your Choices</h2>
                                    </div>
                                    <div className="rounded-[36px] border border-white/10 bg-white p-8 shadow-2xl shadow-black/20">
                                        <p className="text-gray-600 font-medium leading-relaxed">
                                            You can control non-essential cookies through browser settings or any consent prompts we provide. Blocking essential cookies may break sign-in, checkout, and security features.
                                        </p>
                                    </div>
                                </section>

                                <section id="retention" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-400/20 flex items-center justify-center text-orange-300">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">5. Retention</h2>
                                    </div>
                                    <div className="rounded-[36px] border border-white/10 bg-white p-8 shadow-2xl shadow-black/20">
                                        <p className="text-gray-600 font-medium leading-relaxed">
                                            Cookie lifetimes vary by purpose. Session cookies expire when you close the browser, while preference and analytics cookies may persist longer until they expire or are deleted.
                                        </p>
                                    </div>
                                </section>

                                <section id="security" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-400/20 flex items-center justify-center text-orange-300">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">6. Security</h2>
                                    </div>
                                    <div className="rounded-[36px] border border-white/10 bg-white p-8 shadow-2xl shadow-black/20">
                                        <p className="text-gray-600 font-medium leading-relaxed">
                                            We use cookies alongside secure session controls, encrypted connections, and risk checks to reduce fraud and unauthorized access.
                                        </p>
                                    </div>
                                </section>

                                <section id="updates" className="scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-400/20 flex items-center justify-center text-orange-300">
                                            <Bell className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">7. Updates</h2>
                                    </div>
                                    <div className="rounded-[36px] border border-white/10 bg-white p-8 shadow-2xl shadow-black/20">
                                        <p className="text-gray-600 font-medium leading-relaxed">
                                            We may update this policy when our website, legal requirements, or cookie usage changes. The updated version will appear on this page.
                                        </p>
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
