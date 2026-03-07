import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const BulkRemittanceInfo: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-orange-100 flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 relative overflow-hidden">
                {/* Hero Section */}
                <section className="relative pt-20 pb-32 px-6 lg:px-8 z-10 text-center">
                    {/* Background Orbs */}
                    <div className="absolute top-0 right-1/2 translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-orange-400/20 via-orange-300/5 to-transparent rounded-full -mt-64 blur-3xl pointer-events-none -z-10 animate-pulse"></div>

                    <div className="max-w-5xl mx-auto">
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white border border-orange-100 shadow-sm mb-10 mx-auto animate-in slide-in-from-bottom-4 duration-500">
                            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>
                            <span className="text-sm font-black text-gray-900 uppercase tracking-widest">FlapaPay Bulk Remittance</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-8 animate-in slide-in-from-bottom-6 duration-700">
                            Disburse funds <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">instantly</span> <br className="hidden md:block" /> to thousands.
                        </h1>
                        <p className="text-xl md:text-2xl font-medium text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-100">
                            Make up to 5,000 payouts to Mobile Money wallets or bank accounts in seconds. Scale your operations across African markets effortlesly.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom-10 duration-700 delay-200">
                            <Button size="lg" onClick={() => navigate('/merchant/signup')} className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-full font-black text-lg shadow-2xl hover:-translate-y-1 hover:shadow-black/20 hover:bg-neutral-900 transition-all">
                                Open a Merchant Account
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => navigate('/developers')} className="w-full sm:w-auto px-10 py-5 rounded-full font-black text-lg border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all">
                                Read API Docs
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Animated UI Preview */}
                <section className="relative px-6 pb-40 max-w-6xl mx-auto animate-in zoom-in-95 duration-1000 delay-300">
                    <div className="bg-gray-900 rounded-[48px] p-6 md:p-12 shadow-2xl border border-gray-800 relative overflow-hidden">
                        {/* Glow in container */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-transparent to-transparent"></div>

                        <div className="grid md:grid-cols-2 gap-12 relative z-10 items-center">
                            <div className="space-y-6">
                                <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-white">
                                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Batch Progress</p>
                                            <p className="text-4xl font-black">84%</p>
                                        </div>
                                        <div className="w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                                            <svg className="w-16 h-16 transform -rotate-90 absolute text-orange-500" viewBox="0 0 36 36">
                                                <path strokeDasharray="84, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-400">Processing 4,201 of 5,000 requests...</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { name: 'Sarah Mukuka', account: '+260 971 234 567', amount: 'K 1,200.00', status: 'Success', color: 'text-emerald-400', delay: '0s' },
                                        { name: 'John Phiri', account: '+260 765 432 109', amount: 'K 850.00', status: 'Success', color: 'text-emerald-400', delay: '0.2s' },
                                        { name: 'David Banda', account: 'Standard Chartered', amount: 'K 4,500.00', status: 'Processing', color: 'text-orange-400', delay: '0.4s' }
                                    ].map((p, i) => (
                                        <div key={i} className={`flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all transform animate-in slide-in-from-right-4 duration-500`} style={{ animationDelay: p.delay, animationFillMode: 'both' }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg font-black text-white shadow-inner">{p.name.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-black text-white">{p.name}</p>
                                                    <p className="text-xs font-bold text-gray-500 font-mono mt-1">{p.account}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[15px] font-black text-white font-mono">{p.amount}</p>
                                                <p className={`text-[10px] uppercase tracking-widest font-black mt-1 ${p.color} animate-pulse`}>{p.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-white space-y-8 pl-0 md:pl-10">
                                <div>
                                    <div className="h-14 w-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <h3 className="text-3xl font-black mb-4">Blazing Fast Execution</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed">We optimize our payout queues to achieve milliseconds latency. Distribute payroll, vendor settlements, and supplier fees simultaneously.</p>
                                </div>
                                <hr className="border-white/10" />
                                <div>
                                    <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/20">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    </div>
                                    <h3 className="text-3xl font-black mb-4">Bank-level Resilience</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed">Our infrastructure treats your bulk batches as atomic entities ensuring accurate debits and zero overlapping edge-cases.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-32 bg-white relative">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Built for scale.</h2>
                            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Everything you need to automate large-scale capital disbursements.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-12 bg-gray-50 rounded-[40px] hover:-translate-y-2 transition-transform duration-300">
                                <div className="text-5xl mb-8 transform hover:scale-110 transition-transform">📁</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">Dashboard Bulk Upload</h3>
                                <p className="text-gray-600 font-medium leading-relaxed">Upload a CSV file to make bulk payouts directly from your Merchant dashboard without writing a single line of code.</p>
                            </div>
                            <div className="p-12 bg-orange-50 rounded-[40px] hover:-translate-y-2 transition-transform duration-300 border border-orange-100">
                                <div className="text-5xl mb-8 transform hover:scale-110 transition-transform">🔌</div>
                                <h3 className="text-2xl font-black text-orange-950 mb-4">Powerful API</h3>
                                <p className="text-orange-900/70 font-medium leading-relaxed">Integrate our RESTful API endpoint locally to automate instant granular payouts to your vendors, employees, or customers.</p>
                            </div>
                            <div className="p-12 bg-gray-50 rounded-[40px] hover:-translate-y-2 transition-transform duration-300">
                                <div className="text-5xl mb-8 transform hover:scale-110 transition-transform">📊</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">Smart Reconciliation</h3>
                                <p className="text-gray-600 font-medium leading-relaxed">We expose native webhooks allowing for real-time tracking and automated reconciliation for all your outbound transfers.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};
