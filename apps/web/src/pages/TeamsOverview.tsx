import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const TeamsOverview: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-20">
                <section className="py-24 bg-gradient-to-br from-indigo-900 via-black to-gray-900 text-white overflow-hidden relative">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center rounded-full px-4 py-1 text-sm font-bold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 mb-6 uppercase tracking-widest">
                                    Team Management
                                </div>
                                <h1 className="text-5xl font-black mb-8 leading-tight">
                                    Supercharge your <span className="text-indigo-400">workforce</span> collaboration.
                                </h1>
                                <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                                    Add your entire team to your FlapaPay account. Manage permissions, reconciliation, and transaction notifications all in one centralized place.
                                </p>
                                <div className="flex gap-4">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="bg-white text-black px-8 py-4 rounded-2xl font-black shadow-xl">
                                        Invite Your Team
                                    </Button>
                                    <Button size="lg" variant="outline" className="px-8 py-4 rounded-2xl font-black border-white/20 text-white hover:bg-white/5">
                                        View Roles
                                    </Button>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="bg-white/5 backdrop-blur-xl rounded-[40px] shadow-2xl p-10 border border-white/10 group">
                                    <div className="flex justify-between items-center mb-10">
                                        <h3 className="font-black text-xl">Team Members (12)</h3>
                                        <button className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">+</button>
                                    </div>
                                    <div className="space-y-6">
                                        {[
                                            { name: 'Emma Wilson', role: 'Admin', status: 'Active', color: 'bg-blue-400' },
                                            { name: 'Sarah Mukuka', role: 'Finance Manager', status: 'Active', color: 'bg-orange-400' },
                                            { name: 'John Phiri', role: 'Developer', status: 'Invited', color: 'bg-gray-400' }
                                        ].map((m, i) => (
                                            <div key={i} className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 ${m.color} rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner`}>
                                                        {m.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{m.name}</p>
                                                        <p className="text-xs text-gray-500">{m.role}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${m.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'}`}>
                                                    {m.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-gray-50">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { title: 'Granular Roles', desc: 'Define exactly what each team member can see and do.', icon: '🔑' },
                                { title: 'Activity Logs', desc: 'Track every action taken within your business account.', icon: '📝' },
                                { title: 'Reconciliation', desc: 'Allow your finance team to manage payouts and reports.', icon: '⚖️' },
                                { title: 'Notifications', desc: 'Dynamic alerts for the right team members on every event.', icon: '🔔' }
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <div className="text-3xl mb-4">{item.icon}</div>
                                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};
