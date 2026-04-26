import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005';

type ClaimStatus = 'loading' | 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'error';

interface ClaimData {
    status: ClaimStatus;
    amount?: string;
    currency?: string;
    description?: string;
    senderName?: string;
    recipientEmail?: string;
    expiresAt?: string;
    message?: string;
}

const currencySymbol = (c?: string) => c === 'ZMW' ? 'K' : c === 'NGN' ? '₦' : '$';

export const ClaimFundsPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [claim, setClaim] = useState<ClaimData>({ status: 'loading' });

    useEffect(() => {
        if (!token) { setClaim({ status: 'error', message: 'Invalid link.' }); return; }
        axios.get(`${API_BASE}/payments/claim/${token}`)
            .then(res => setClaim({ ...res.data, status: res.data.status as ClaimStatus }))
            .catch(() => setClaim({ status: 'error', message: 'Unable to load payment. The link may be invalid.' }));
    }, [token]);

    const handleClaim = () => {
        const params = new URLSearchParams();
        if (claim.recipientEmail) params.set('email', claim.recipientEmail);
        if (token) params.set('claimToken', token);
        navigate(`/signup?${params.toString()}`);
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (claim.status === 'loading') {
        return (
            <div className="min-h-screen bg-orange-500 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    // ── Already claimed ──────────────────────────────────────────────────────
    if (claim.status === 'CLAIMED') {
        return (
            <ClaimShell>
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-green-500 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-3">Already Claimed</h1>
                    <p className="text-gray-400 font-bold text-sm">These funds have already been collected by the recipient.</p>
                    <button onClick={() => navigate('/login')} className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-orange-500 transition-all">
                        Sign In to FlapaPay
                    </button>
                </div>
            </ClaimShell>
        );
    }

    // ── Expired / Error ──────────────────────────────────────────────────────
    if (claim.status === 'EXPIRED' || claim.status === 'CANCELLED' || claim.status === 'error') {
        return (
            <ClaimShell>
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-gray-300 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-md">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-3">
                        {claim.status === 'error' ? 'Link Not Found' : 'Payment Expired'}
                    </h1>
                    <p className="text-gray-400 font-bold text-sm">
                        {claim.message || 'This payment link has expired. The sender has been refunded.'}
                    </p>
                    <button onClick={() => navigate('/')} className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-orange-500 transition-all">
                        Go to FlapaPay
                    </button>
                </div>
            </ClaimShell>
        );
    }

    // ── Pending — main claim flow ────────────────────────────────────────────
    const sym = currencySymbol(claim.currency);
    const amountFormatted = claim.amount
        ? parseFloat(claim.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';
    const expiresFormatted = claim.expiresAt
        ? new Date(claim.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    return (
        <div className="min-h-screen bg-orange-500 flex items-center justify-center p-4"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}>

            {/* FlapaPay brand bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-center">
                <span className="text-white font-black text-2xl tracking-tight">FlapaPay</span>
            </div>

            <div className="w-full max-w-md mt-16">
                {/* Hero amount card */}
                <div className="bg-white rounded-[40px] shadow-[0_32px_80px_-8px_rgba(0,0,0,0.25)] p-8 mb-4 text-center relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-50 rounded-full" />
                    <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-orange-100/50 rounded-full" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full mb-6">
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                            <span className="text-orange-600 text-[10px] font-black uppercase tracking-widest">Funds Waiting For You</span>
                        </div>

                        <p className="text-gray-400 font-bold text-sm mb-2">
                            <span className="font-black text-gray-700">{claim.senderName}</span> sent you
                        </p>

                        <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-4xl font-black text-orange-500">{sym}</span>
                            <span className="text-6xl font-black text-gray-900 tracking-tight leading-none">{amountFormatted}</span>
                        </div>
                        <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-6">{claim.currency}</p>

                        {claim.description && (
                            <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-6 border border-gray-100">
                                <p className="text-gray-500 text-sm font-bold italic">"{claim.description}"</p>
                            </div>
                        )}

                        <button
                            onClick={handleClaim}
                            className="w-full py-5 bg-orange-500 text-white rounded-[24px] font-black text-lg shadow-xl hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Claim Your Funds →
                        </button>

                        <p className="text-gray-400 text-[10px] font-bold mt-4 uppercase tracking-widest">
                            Free to create · Takes 60 seconds
                        </p>
                    </div>
                </div>

                {/* How it works */}
                <div className="bg-white/20 backdrop-blur-sm rounded-[28px] p-6 mb-4 border border-white/30">
                    <p className="text-white font-black text-[10px] uppercase tracking-widest mb-4">How to claim</p>
                    <div className="space-y-3">
                        {[
                            { step: '1', text: 'Create a free FlapaPay account using this email address' },
                            { step: '2', text: 'Funds are instantly credited to your new wallet' },
                            { step: '3', text: 'Send, receive, and withdraw money across Africa' },
                        ].map(s => (
                            <div key={s.step} className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-xl bg-white/30 flex items-center justify-center text-white font-black text-xs shrink-0">{s.step}</div>
                                <p className="text-white/90 text-sm font-bold">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expiry notice */}
                {expiresFormatted && (
                    <div className="text-center">
                        <p className="text-white/70 text-[11px] font-bold">
                            ⏱ Expires {expiresFormatted} — unclaimed funds are returned to the sender
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ClaimShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen bg-orange-500 flex flex-col items-center justify-center p-4"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}>
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-center">
            <span className="text-white font-black text-2xl tracking-tight">FlapaPay</span>
        </div>
        <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 mt-16">
            {children}
        </div>
    </div>
);

export default ClaimFundsPage;
