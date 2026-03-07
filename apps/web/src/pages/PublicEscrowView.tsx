import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/Button';

// Public API instance (no auth token required for specific public endpoints if we add them, 
// but for now we'll use a slightly different approach or a public GET /escrows/:id/public)
const publicApi = axios.create({
    baseURL: 'http://localhost:3005'
});

export const PublicEscrowView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [escrow, setEscrow] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEscrow = async () => {
            try {
                // We'll need to allow this specific GET in unified-server.js or create a public version
                const res = await publicApi.get(`/escrow-public/${id}`);
                setEscrow(res.data);
            } catch (err) {
                console.error('Failed to fetch public escrow details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEscrow();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Verifying Transaction...</p>
            </div>
        </div>
    );

    if (!escrow) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center">
            <div>
                <h1 className="text-2xl font-black text-gray-900 mb-4">Transaction Not Found</h1>
                <p className="text-gray-500 mb-8 max-w-sm">This escrow link may have expired or is incorrect. Please contact the sender.</p>
                <Button onClick={() => navigate('/')} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black">Go to Homepage</Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-10">
                    <img src="/assets/images/logo.png" alt="FlapaPay" className="h-8 mx-auto mb-6" />
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Escrow Security</h1>
                    <p className="text-emerald-600 font-black mt-2 uppercase text-[10px] tracking-widest">Verified by FlapaPay</p>
                </div>

                <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />

                    <div className="relative">
                        <div className="bg-gray-50 rounded-3xl p-6 mb-8 text-center">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Escrow Amount</p>
                            <p className="text-4xl font-black text-gray-900">{escrow.amount} <span className="text-xl font-normal text-gray-400">{escrow.currency}</span></p>
                        </div>

                        <div className="space-y-6 mb-10">
                            <div className="flex justify-between items-center py-4 border-b border-gray-50">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</span>
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">{escrow.status}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-gray-50">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Service/Item</span>
                                <span className="text-sm font-black text-gray-900">{escrow.description}</span>
                            </div>
                            <div className="flex justify-between items-center py-4">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Seller</span>
                                <span className="text-sm font-black text-gray-900">{escrow.seller_email}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button
                                onClick={() => navigate('/login')}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                Log in to Manage
                            </Button>
                            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                Funds are currently being held in FlapaPay Escrow.<br />Sign in to Release or Dispute.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center text-gray-400">
                    <p className="text-xs font-bold mb-4">FlapaPay is a secure payment platform for Africa.</p>
                    <div className="flex justify-center gap-6">
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-colors">Privacy</a>
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-colors">Terms</a>
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-colors">Help</a>
                    </div>
                </div>
            </div>
        </div>
    );
};
