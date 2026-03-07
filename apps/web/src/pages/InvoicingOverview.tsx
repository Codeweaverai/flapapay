import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const InvoicingOverview: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-24 bg-black overflow-hidden relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="animate-fade-in-up">
                                <div className="inline-flex items-center rounded-full px-4 py-1 text-sm font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 mb-6 uppercase tracking-widest">
                                    Invoicing & Billing
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
                                    Professional Invoicing <span className="text-blue-500">Simplified</span>.
                                </h1>
                                <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                                    Create, send, and manage professional invoices in seconds. Get paid faster with integrated Mobile Money and Card payments.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button size="lg" onClick={() => navigate('/merchant/signup')} className="bg-white text-black px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-gray-200 transition-all">
                                        Start Invoicing
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/developers')} className="px-8 py-4 rounded-2xl font-black border-2 border-white/20 text-white hover:bg-white/10 transition-all">
                                        View API Docs
                                    </Button>
                                </div>
                            </div>

                            <div className="relative animate-fade-in">
                                <div className="bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100 transform -rotate-2 relative z-10">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">📄</div>
                                                <div>
                                                    <p className="font-black text-gray-900">Invoice #INV-9042</p>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Due in 3 days</p>
                                                </div>
                                            </div>
                                            <span className="text-blue-700 font-black text-lg">ZMW 24,500</span>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-bold">Client</span>
                                                <span className="text-gray-900 font-black">Afritech Solutions</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-bold">Status</span>
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase">Pending</span>
                                            </div>
                                        </div>

                                        <div className="pt-6">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Express Payment Methods</p>
                                            <div className="flex gap-3">
                                                <div className="h-10 w-16 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                                    <img src="/assets/images/MTN_Logo.svg" className="h-6 object-contain" alt="MTN" />
                                                </div>
                                                <div className="h-10 w-16 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                                    <img src="/assets/images/Airtel_Africa_logo.svg" className="h-6 object-contain" alt="Airtel" />
                                                </div>
                                                <div className="h-10 w-16 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6 object-contain" alt="Visa" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl z-0"></div>
                                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl z-0"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center mb-20 leading-relaxed max-w-2xl mx-auto">
                            <h2 className="text-4xl font-black text-gray-900 mb-6">Built for scale, designed for <span className="text-blue-600">simplicity</span>.</h2>
                            <p className="text-gray-500 text-lg font-bold">Everything you need to get paid faster, all in one place.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                {
                                    title: 'Custom Branding',
                                    desc: 'Upload your logo, set your brand color, and create a professional identity that matches your business.',
                                    icon: '🎨',
                                    color: 'blue'
                                },
                                {
                                    title: 'Automated Reminders',
                                    desc: 'Let FlapaPay chase late payments for you with smart automated email reminders to your clients.',
                                    icon: '⏰',
                                    color: 'orange'
                                },
                                {
                                    title: 'Global Payments',
                                    desc: 'Accept multi-currency payments including ZMW, NGN, USD, and more with integrated FX support.',
                                    icon: '🌍',
                                    color: 'green'
                                },
                                {
                                    title: 'Real-time Tracking',
                                    desc: 'Know exactly when an invoice is viewed, paid, or overdue with our detailed audit trails.',
                                    icon: '📊',
                                    color: 'purple'
                                },
                                {
                                    title: 'PDF Generation',
                                    desc: 'Download and send high-quality PDF invoices directly from your dashboard or via email.',
                                    icon: '📥',
                                    color: 'red'
                                },
                                {
                                    title: 'Developer Friendly',
                                    desc: 'Integrate invoicing into your apps using our robust API and webhook system.',
                                    icon: '⚙️',
                                    color: 'gray'
                                }
                            ].map((item, i) => (
                                <div key={i} className="group p-10 rounded-[32px] bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                                    <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                    <h3 className="text-xl font-black text-gray-900 mb-4">{item.title}</h3>
                                    <p className="text-gray-600 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Integration Section */}
                <section className="py-24 bg-black text-white overflow-hidden relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[48px] p-12 md:p-24 text-center">
                            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Ready to transform your <br />billing experience?</h2>
                            <p className="text-blue-100 text-xl mb-12 max-w-xl mx-auto font-medium">Join thousands of businesses across Africa managing their global payments with FlapaPay.</p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <Button size="lg" onClick={() => navigate('/merchant/signup')} className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-lg">
                                    Join the Waitlist
                                </Button>
                                <Button size="lg" variant="outline" onClick={() => navigate('/about')} className="text-white border-2 border-white/20 hover:bg-white/10 px-10 py-5 rounded-2xl font-black transition-all text-lg">
                                    Learn More
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};
