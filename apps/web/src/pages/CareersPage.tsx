import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { api } from '../lib/axios';
import { Link } from 'react-router-dom';

interface JobPosting {
    id: number;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string[];
    slug: string;
}

const benefits = [
    { title: "Competitive Salary", description: "Above-market compensation including stock options.", icon: "💰" },
    { title: "Global Freedom", description: "Remote-first culture. Work from anywhere you thrive.", icon: "🌍" },
    { title: "L&D Budget", description: "$2,000 annual budget for your professional growth.", icon: "📚" },
    { title: "Health & Wellness", description: "Comprehensive coverage for you and your family.", icon: "🏥" },
    { title: "Equipment", description: "The best tools for the job. New MacBook, monitor, etc.", icon: "🖥️" },
    { title: "Paid Time Off", description: "Unlimited vacation. We trust you to recharge.", icon: "🏝️" }
];

export const CareersPage: React.FC = () => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/content/jobs');
                setJobs(res.data);
            } catch (err) {
                console.error('Failed to fetch jobs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-20">
                {/* Careers Hero */}
                <section className="relative py-24 lg:py-32 overflow-hidden bg-black text-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-bold text-yellow-400 uppercase tracking-widest mb-8">
                            Careers at FlapaPay
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
                            Build the infrastructure <br />
                            of a <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">new economy</span>.
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
                            We're a team of dreamers and builders solving the most fundamental challenges in African commerce. Join us.
                        </p>
                        <div className="flex justify-center">
                            <Button size="lg" className="bg-orange-500 text-white px-12 py-5 rounded-2xl font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-xl" onClick={() => document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' })}>
                                View Open Roles
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Culture Section */}
                <section className="py-24 bg-white relative overflow-hidden">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div>
                                <h2 className="text-4xl font-black text-gray-900 mb-8 leading-tight">
                                    A culture of high ownership and low ego.
                                </h2>
                                <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                                    At FlapaPay, we don't care where you went to school or what your previous title was. We care about your ability to solve complex problems and your drive to make an impact.
                                </p>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-4xl font-black text-orange-500 mb-2">100%</p>
                                        <p className="font-bold text-gray-900">Remote First</p>
                                        <p className="text-sm text-gray-500">Work from 15+ countries.</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black text-yellow-500 mb-2">4.9</p>
                                        <p className="font-bold text-gray-900">Culture Score</p>
                                        <p className="text-sm text-gray-500">Internal employee feedback.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="aspect-square bg-gray-100 rounded-[32px] overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=600" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Office Life" />
                                    </div>
                                    <div className="aspect-[3/4] bg-gray-100 rounded-[32px] overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&w=600" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Meetings" />
                                    </div>
                                </div>
                                <div className="space-y-4 py-8">
                                    <div className="aspect-[3/4] bg-gray-100 rounded-[32px] overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Collab" />
                                    </div>
                                    <div className="aspect-square bg-gray-100 rounded-[32px] overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Workshop" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Grid */}
                <section className="py-24 bg-gray-50">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-gray-900 mb-4">You take care of our customers, we take care of you.</h2>
                            <p className="max-w-2xl mx-auto text-gray-500">We provide everything you need to do the best work of your life.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {benefits.map((benefit, i) => (
                                <div key={i} className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                                    <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-3xl mb-8 group-hover:bg-orange-500 group-hover:scale-110 transition-all duration-300">
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-4">{benefit.title}</h3>
                                    <p className="text-gray-500 leading-relaxed">{benefit.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Open Positions */}
                <section id="open-roles" className="py-24 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                            <div className="max-w-2xl">
                                <h2 className="text-4xl font-black text-gray-900 mb-4">Help us write history.</h2>
                                <p className="text-xl text-gray-500">Find the role that fits your ambition.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-center text-gray-500">Loading open roles...</p>
                            ) : jobs.length > 0 ? (
                                jobs.map((job) => (
                                    <Link
                                        to={`/careers/${job.slug}`}
                                        key={job.id}
                                        className="p-10 rounded-[40px] border border-gray-100 hover:border-orange-500 hover:bg-orange-50/30 transition-all duration-300 group flex flex-col md:flex-row justify-between items-center gap-8 block"
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl group-hover:bg-white group-hover:shadow-lg transition-all">
                                                💼
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 mb-1">{job.title}</h3>
                                                <div className="flex gap-4 text-sm font-bold text-gray-500">
                                                    <span>{job.department}</span>
                                                    <span>•</span>
                                                    <span>{job.location}</span>
                                                    <span>•</span>
                                                    <span>{job.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="bg-black text-white px-8 py-3 rounded-xl font-black group-hover:bg-orange-500 transition-colors">
                                                Apply Now
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-center text-gray-500">No open roles at the moment.</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="py-24">
                    <div className="mx-auto max-w-5xl px-6 lg:px-8">
                        <div className="bg-black rounded-[64px] p-12 md:p-24 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[120px] opacity-20"></div>
                            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight relative z-10">
                                Ready to build the <br />
                                next big thing?
                            </h2>
                            <p className="text-xl text-gray-400 mb-12 relative z-10">If you don't see a role that fits but still want to join us, reach out.</p>
                            <Button size="lg" className="bg-white text-black px-12 py-5 rounded-2xl font-black shadow-2xl relative z-10 hover:bg-orange-500 hover:text-white transition-all">
                                General Application
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};