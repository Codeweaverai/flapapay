import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { Button } from '../components/ui/Button';
import { Sidebar } from '../components/layout/Sidebar';

export const MerchantActivation: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        businessType: 'INDIVIDUAL',
        country: 'Zambia',
    });

    // Check status on mount
    React.useEffect(() => {
        const checkStatus = async () => {
            console.log('Checking merchant status...');
            try {
                const res = await api.get('/merchants/status');
                console.log('Merchant status response:', res.data);
                if (res.data.isActive) {
                    console.log('User is already a merchant, redirecting...');
                    setIsSuccess(true);
                    setTimeout(() => navigate('/merchant/dashboard'), 1500);
                }
            } catch (err) {
                console.error('Status check failed', err);
            }
        };
        checkStatus();
    }, [navigate]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/merchants/activate', formData);
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/merchant/dashboard');
            }, 2000);
        } catch (err: any) {
            console.error('Activation failed', err);
            // Fallback for race conditions
            if (err.response?.status === 400 && err.response?.data?.error === 'Merchant account already exists') {
                setIsSuccess(true);
                setTimeout(() => navigate('/merchant/dashboard'), 1500);
            } else {
                alert('Failed to activate merchant account. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                        ✓
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Activated!</h1>
                    <p className="text-gray-500">Welcome to FlapaPay for Business. Redirecting to your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <div className="hidden md:block w-72 shrink-0">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto pt-10">
                    <header className="mb-10">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Activate FlapaPay Business</h1>
                        <p className="text-gray-500 mt-2 text-lg">Start accepting payments across Africa in minutes.</p>
                    </header>

                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 overflow-hidden relative">
                        {/* Visual Background Element */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-50"></div>

                        <form onSubmit={handleActivate} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Business Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                                    placeholder="Enter your registered business name"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Business Type</label>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-gray-900"
                                        value={formData.businessType}
                                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                    >
                                        <option value="INDIVIDUAL">Individual / Sole Proprietor</option>
                                        <option value="COMPANY">Registered Company</option>
                                        <option value="NON_PROFIT">Non-Profit Organization</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Country</label>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-gray-900"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    >
                                        <option value="Zambia">Zambia 🇿🇲</option>
                                        <option value="Nigeria">Nigeria 🇳🇬</option>
                                        <option value="Ghana">Ghana 🇬🇭</option>
                                        <option value="Kenya">Kenya 🇰🇪</option>
                                        <option value="South Africa">South Africa 🇿🇦</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg shadow-2xl hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-70"
                                >
                                    {isLoading ? 'Activating Hub...' : 'Complete Activation →'}
                                </Button>
                            </div>

                            <p className="text-xs text-gray-400 text-center mt-6">
                                By completing activation, you agree to FlapaPay's Merchant Services Agreement and Privacy Policy.
                            </p>
                        </form>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'Instant Sandbox', desc: 'Get test keys immediately after activation.', icon: '🧪' },
                            { title: 'Unified API', desc: 'Cards and Mobile Money via one integration.', icon: '🔌' },
                            { title: 'Compliance Ready', desc: 'Secure KYB processing for live transactions.', icon: '🛡️' }
                        ].map((feat, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <span className="text-2xl">{feat.icon}</span>
                                <div>
                                    <h4 className="font-bold text-gray-900">{feat.title}</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};
