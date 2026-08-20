import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';

export const AccountTypeSelectionPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-20">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-12">
                        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-orange-500 mb-4">Create Account</p>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Choose how you want to use FlapaPay</h1>
                        <p className="mt-4 text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                            Open an individual wallet for personal payments, or create a business account and continue to merchant onboarding after signup.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <button
                            onClick={() => navigate('/signup/individual')}
                            className="group text-left rounded-[36px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                        >
                            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-orange-500 to-amber-400 text-white flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30">
                                👤
                            </div>
                            <h2 className="mt-8 text-3xl font-black text-slate-900">Individual account</h2>
                            <p className="mt-3 text-slate-500 font-medium leading-relaxed">
                                For personal wallets, transfers, deposits, withdrawals, and card-linked funding. Your existing 4-digit account PIN flow stays in place.
                            </p>
                            <div className="mt-8 flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Wallet Account</span>
                                <span className="text-sm font-black text-orange-500 group-hover:translate-x-1 transition-transform">Continue</span>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/merchant/signup')}
                            className="group text-left rounded-[36px] bg-slate-950 border border-slate-900 shadow-2xl shadow-slate-900/25 p-8 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-16 h-16 rounded-[20px] bg-white/10 text-white flex items-center justify-center text-3xl border border-white/10">
                                💼
                            </div>
                            <h2 className="mt-8 text-3xl font-black text-white">Business account</h2>
                            <p className="mt-3 text-slate-300 font-medium leading-relaxed">
                                For merchants, platforms, and organizations accepting payments. Create the account first, then continue with the existing onboarding and compliance flow.
                            </p>
                            <div className="mt-8 flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">Merchant Account</span>
                                <span className="text-sm font-black text-emerald-300 group-hover:translate-x-1 transition-transform">Continue</span>
                            </div>
                        </button>
                    </div>

                        <div className="mt-10 text-center text-sm font-bold text-slate-500">
                            Already have an account?
                        <Link to="/signup/individual" className="ml-2 text-slate-900 hover:text-orange-500 transition-colors">Individual sign in</Link>
                        <span className="mx-2 text-slate-300">|</span>
                        <Link to="/merchant/signup" className="text-slate-900 hover:text-orange-500 transition-colors">Business sign in</Link>
                    </div>
                </div>
            </main>
        </div>
    );
};
