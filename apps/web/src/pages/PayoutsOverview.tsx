import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const PayoutsOverview: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-20">
                <section className="py-24 bg-black text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-orange-500/10 blur-[120px]"></div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center rounded-full px-4 py-1 text-sm font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 mb-6 uppercase tracking-widest">
                                    Mass Payouts
                                </div>
                                <h1 className="text-5xl font-black mb-8 leading-tight">
                                    Disburse funds <span className="text-orange-400">instantly</span> to thousands.
                                </h1>
                                <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                                    Make up to 5,000 payouts to Mobile money wallets or Bank accounts instantly with no effort. Scale your operations across African markets.
                                </p>
                                <div className="flex gap-4">
                                    <Button size="lg" onClick={() => navigate('/signup')} className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-orange-500/20">
                                        Start Paying Out
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => navigate('/developers')} className="px-8 py-4 rounded-2xl font-black border-white/20 text-white hover:bg-white/5">
                                        API Reference
                                    </Button>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="bg-gray-900 rounded-[40px] shadow-2xl p-8 border border-white/10">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-xs">CSV</div>
                                            <span className="font-bold">payouts_batch_24.csv</span>
                                        </div>
                                        <span className="text-orange-400 text-sm font-bold">Processing...</span>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { name: 'Sarah Mukuka', account: 'MTN Mobile Money', amount: 'K 1,200.00', status: 'Success' },
                                            { name: 'John Phiri', account: 'Airtel Money', amount: 'K 850.00', status: 'Success' },
                                            { name: 'David Banda', account: 'Standard Chartered', amount: 'K 4,500.00', status: 'Pending' }
                                        ].map((p, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-lg">👤</div>
                                                    <div>
                                                        <p className="text-sm font-bold">{p.name}</p>
                                                        <p className="text-[10px] text-gray-500">{p.account}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black">{p.amount}</p>
                                                    <p className={`text-[10px] font-bold ${p.status === 'Success' ? 'text-green-400' : 'text-orange-400'}`}>{p.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            <div className="p-10 bg-gray-50 rounded-[40px]">
                                <div className="text-3xl mb-6">📁</div>
                                <h3 className="text-2xl font-black mb-4">Bulk Upload</h3>
                                <p className="text-gray-600 leading-relaxed">Upload a file to make bulk payouts from the dashboard without writing a single line of code.</p>
                            </div>
                            <div className="p-10 bg-orange-50 rounded-[40px]">
                                <div className="text-3xl mb-6">🔌</div>
                                <h3 className="text-2xl font-black mb-4">Powerful API</h3>
                                <p className="text-gray-600 leading-relaxed">Integrate our API to automate instant payouts to your vendors, employees, or customers.</p>
                            </div>
                            <div className="p-10 bg-gray-50 rounded-[40px]">
                                <div className="text-3xl mb-6">📊</div>
                                <h3 className="text-2xl font-black mb-4">Reconciliation</h3>
                                <p className="text-gray-600 leading-relaxed">Real-time tracking and automated reconciliation for all your outbound transfers.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};
