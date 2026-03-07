import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { ConnectOnboarding } from '../components/connect/ConnectOnboarding';

export const SubMerchantOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeOnboarding = async () => {
            try {
                // 1. Create a "Shell" Account (Unified Identity)
                // In a real app, you might check if this user already has a connected account 
                // linked to your DB. For this demo, we create a new one each time.
                const accountRes = await api.post('/v1/connect/accounts', {
                    type: 'custom',
                    country: 'ZM',
                    email: `merchant_${Date.now()}@example.com`,
                    capabilities: {
                        transfers: { requested: true },
                        card_payments: { requested: true }
                    }
                });

                const accountId = accountRes.data.id;
                console.log('Created Connected Account:', accountId);

                // 2. Create an Account Session (Embedded UI Security)
                const sessionRes = await api.post('/v1/connect/account_sessions', {
                    account: accountId
                });

                setClientSecret(sessionRes.data.client_secret);
            } catch (err) {
                console.error('Failed to initialize onboarding:', err);
                alert('Failed to start onboarding. Check console.');
            } finally {
                setLoading(false);
            }
        };

        initializeOnboarding();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <div className="hidden md:block w-72 shrink-0">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <header className="mb-10 text-center">
                        <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 inline-block">FlapaPay Connect</span>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Onboard a Sub-merchant</h1>
                        <p className="text-gray-500 mt-2 font-medium">Add a new seller to your marketplace using Embedded Onboarding.</p>
                    </header>

                    {loading ? (
                        <div className="flex justify-center p-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                        </div>
                    ) : clientSecret ? (
                        <ConnectOnboarding
                            clientSecret={clientSecret}
                            onExit={() => navigate('/merchant/connect')}
                        />
                    ) : (
                        <div className="text-center p-10 bg-red-50 text-red-600 rounded-2xl">
                            Failed to load configuration. Please try again.
                        </div>
                    )}

                    <div className="mt-8 text-center text-gray-400 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">PCI-DSS Compliant Infrastructure</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

