import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative py-24 lg:py-32 overflow-hidden bg-black text-white">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(249,115,22,0.1),_transparent_70%)]"></div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-bold text-orange-400 uppercase tracking-widest mb-8">
                                Our Story
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1]">
                                Building the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">future</span> of African finance.
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-400 leading-relaxed mb-10">
                                FlapaPay is more than a payment processor. We're building the unified operating system for digital commerce across the continent.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button size="lg" onClick={() => navigate('/signup')} className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-lg">
                                    Join the Mission
                                </Button>
                                <Button size="lg" variant="outline" onClick={() => navigate('/careers')} className="px-10 py-5 rounded-2xl font-black border-white/20 text-white hover:bg-white/5 active:scale-95 transition-all text-lg">
                                    View Open Roles
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="py-24 bg-white relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className="relative">
                                <div className="aspect-[4/5] bg-gray-100 rounded-[64px] overflow-hidden shadow-2xl relative group">
                                    <img
                                        src="https://images.unsplash.com/photo-1522071823991-b1ae5e6a3048?auto=format&fit=crop&w=800&q=80"
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                        alt="Our Team"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute bottom-10 left-10 text-white">
                                        <p className="text-3xl font-black">2026</p>
                                        <p className="text-sm font-bold uppercase tracking-widest text-orange-400">Founded in Lusaka</p>
                                    </div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400 rounded-full blur-[80px] opacity-20"></div>
                            </div>

                            <div>
                                <h2 className="text-4xl font-black text-gray-900 mb-8">Our Mission</h2>
                                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                    At FlapaPay, we believe that borders shouldn't define the limits of your business. Our mission is to democratize financial access by building a borderless digital ecosystem for Africa.
                                </p>
                                <div className="space-y-8">
                                    {[
                                        { title: 'The Barrier', desc: 'Fragmented payment systems across Africa make cross-border trade slow and expensive.', icon: '🚧' },
                                        { title: 'The Solution', desc: 'A unified API and platform that bridges Mobile Money, Card, and Bank payments instantly.', icon: '💡' },
                                        { title: 'The Impact', desc: 'Empowering millions of entrepreneurs to reach global markets from their local wallets.', icon: '🚀' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-6 group">
                                            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 text-lg mb-1">{item.title}</h4>
                                                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-24 bg-gray-50 border-y border-gray-100">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-gray-900 mb-4">Values that drive us</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto">Our culture is built on transparency, innovation, and a relentless focus on our customers.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: 'Integrity First', desc: 'Trust is our currency. We operate with radical transparency and bank-grade security.', icon: '🛡️' },
                                { title: 'Local Context', desc: 'We build for Africa first, understanding the unique challenges of our diverse markets.', icon: '🌍' },
                                { title: 'Speed of Light', desc: 'We move fast, iterate constantly, and deliver results to our partners in real-time.', icon: '⚡' }
                            ].map((value, i) => (
                                <div key={i} className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                                    <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-3xl mb-8">{value.icon}</div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-4">{value.title}</h3>
                                    <p className="text-gray-500 leading-relaxed">{value.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-24 bg-black text-white relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                            {[
                                { label: 'Settled Volume', value: '$250M+' },
                                { label: 'Monthly Users', value: '45k+' },
                                { label: 'Supported MNOs', value: '12' },
                                { label: 'Uptime', value: '99.9%' }
                            ].map((stat, i) => (
                                <div key={i}>
                                    <p className="text-5xl font-black text-orange-500 mb-2">{stat.value}</p>
                                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
                        <div className="bg-gradient-to-br from-orange-400 to-yellow-500 rounded-[64px] p-16 md:p-24 shadow-[0_50px_100px_-20px_rgba(249,115,22,0.3)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
                            <h2 className="text-4xl md:text-6xl font-black text-black mb-10 leading-tight relative z-10">
                                Be part of the change. <br />
                                Join us today.
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                                <Button size="lg" onClick={() => navigate('/signup')} className="bg-black text-white px-10 py-5 rounded-2xl font-black shadow-2xl active:scale-95 transition-all text-xl">
                                    Create Account
                                </Button>
                                <Button size="lg" variant="outline" className="px-10 py-5 rounded-2xl font-black border-black/10 text-black hover:bg-black/5 active:scale-95 transition-all text-xl">
                                    Talk to Sales
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