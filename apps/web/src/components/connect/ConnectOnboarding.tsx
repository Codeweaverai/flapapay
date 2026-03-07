import React, { useEffect, useState } from 'react';
import { api } from '../../lib/axios';
import { Button } from '../ui/Button';

// detailed-react-component: FlapaPay Connect Embedded Component
// This component simulates the behavior of Stripe's <ConnectComponentsProvider> and embedded UI.
// It uses the client_secret to "authenticate" with the Connect API and determine what to render.

interface ConnectOnboardingProps {
    clientSecret: string;
    onExit: () => void;
}

export const ConnectOnboarding: React.FC<ConnectOnboardingProps> = ({ clientSecret, onExit }) => {
    const [loading, setLoading] = useState(true);
    const [requirements, setRequirements] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});

    const [accountId, setAccountId] = useState<string | null>(null);
    const [status, setStatus] = useState<'onboarding' | 'success' | 'error'>('onboarding');
    const [errorMessage, setErrorMessage] = useState('');

    // Bank Linking States (from Settings.tsx)
    const [banks, setBanks] = useState<any[]>([]);
    const [isResolving, setIsResolving] = useState(false);
    const [resolvedAccount, setResolvedAccount] = useState<any>(null);
    const [bankSearch, setBankSearch] = useState('');

    const BANK_LOGOS: Record<string, string> = {
        'zanaco': 'https://cdn.brandfetch.io/id8rWWhZ0S/w/768/h/226/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1765290669363',
        'stanbic': 'https://cdn.brandfetch.io/idtBHsdHkP/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764691523293',
        'absa': 'https://cdn.brandfetch.io/idIIZJY7QN/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667792595017',
        'access': 'https://cdn.brandfetch.io/idPXJmyni4/w/400/h/400/theme/light/icon.png?c=1bxid64Mup7aczewSAYMX&t=1667560957752',
        'boc': 'https://cdn.brandfetch.io/ida3fnJjf9/w/1105/h/1105/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1677603041423',
        'citi': 'https://cdn.brandfetch.io/idr8xpMOko/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1761814355509',
        'ecobank': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ecobank_Logo_EN.png',
        'fnb': 'https://cdn.brandfetch.io/idMm5AKGl0/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668184013589',
        'stanchart': 'https://cdn.brandfetch.io/idasTAHEfB/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1766383628158',
        'uba': 'https://cdn.brandfetch.io/idbEJ2XWew/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1718352485394'
    };

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch account ID from session
                const res = await api.get(`/v1/connect/account_sessions/${clientSecret}`);
                setAccountId(res.data.account_id);

                // Fetch Banks (for step 3)
                const banksRes = await api.get('/merchants/lenco/banks?country=zm');
                if (banksRes.data.status) setBanks(banksRes.data.data);

                // Simulate requirement gathering
                setTimeout(() => {
                    setRequirements(['business_profile', 'indivudal_identity', 'bank_account']);
                    setLoading(false);
                }, 1000);
            } catch (err) {
                console.error('Failed to init onboarding:', err);
                setLoading(false);
                setStatus('error');
                setErrorMessage('Internal configuration error. Please try again later.');
            }
        };
        init();
    }, [clientSecret]);

    const handleResolveAccount = async () => {
        if (!formData.bank_id || !formData.bank_account) return;
        setIsResolving(true);
        try {
            const res = await api.post('/merchants/lenco/resolve', {
                bankId: formData.bank_id,
                accountNumber: formData.bank_account
            });
            if (res.data.status) {
                setResolvedAccount(res.data.data);
            } else {
                alert(res.data.message || 'Could not resolve account. Please check the details.');
            }
        } catch (err) {
            alert('Verification failed. Check your internet connection.');
        } finally {
            setIsResolving(false);
        }
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleNext = async () => {
        if (currentStep < requirements.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Complete - Save payout details
            if (!accountId) return;

            // Validation for Bank Account
            if (formData.payout_type === 'bank_account' && !resolvedAccount) {
                return alert('Please verify your bank account details before completing.');
            }

            setIsSaving(true);
            try {
                const payoutData: any = {
                    type: formData.payout_type || 'mobile_money',
                    is_default: true
                };

                if (payoutData.type === 'mobile_money') {
                    payoutData.details = {
                        provider: formData.mobile_network || 'mtn',
                        number: formData.mobile_number,
                        country: 'ZM'
                    };
                } else {
                    payoutData.details = {
                        bankId: formData.bank_id,
                        accountNumber: formData.bank_account,
                        accountName: resolvedAccount.accountName,
                        bankName: resolvedAccount.bank.name,
                        country: 'ZM'
                    };
                }

                await api.post(`/v1/connect/accounts/${accountId}/payout_methods`, payoutData);
                setStatus('success');
            } catch (err: any) {
                console.error('Failed to save payout details:', err);
                setStatus('error');
                setErrorMessage(err.response?.data?.message || 'We encountered a problem while saving your payout information.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    const renderStep = () => {
        const step = requirements[currentStep];
        switch (step) {
            case 'business_profile':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about your business</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Legal Business Name</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium"
                                    placeholder="Legal Name"
                                    value={formData.business_name || ''}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Business Website</label>
                                <input
                                    type="url"
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium"
                                    placeholder="https://"
                                    value={formData.website || ''}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">TPIN (Zambia Revenue Authority)</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium font-mono"
                                    placeholder="10-digit TPIN"
                                    maxLength={10}
                                    value={formData.tpin || ''}
                                    onChange={(e) => setFormData({ ...formData, tpin: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">PACRA Registration Number</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium"
                                    placeholder="PACRA Number"
                                    value={formData.pacra_number || ''}
                                    onChange={(e) => setFormData({ ...formData, pacra_number: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'indivudal_identity':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Verify your identity</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Legal Name</label>
                                <input type="text" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium" placeholder="First Last" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth</label>
                                <input type="date" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium" />
                            </div>
                            <div className="col-span-full">
                                <label className="block text-sm font-bold text-gray-700 mb-2">ID Number (NRC/Passport)</label>
                                <input type="text" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium" placeholder="ID Number" />
                            </div>
                        </div>
                    </div>
                );
            case 'bank_account':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-bold text-gray-900">Payout Details</h2>
                            <div className="flex p-1 bg-gray-100 rounded-xl">
                                <button
                                    onClick={() => setFormData({ ...formData, payout_type: 'mobile_money' })}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${(!formData.payout_type || formData.payout_type === 'mobile_money') ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                >
                                    Mobile Money
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, payout_type: 'bank_account' })}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${formData.payout_type === 'bank_account' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                >
                                    Bank Account
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-8 italic">Where should we send your earnings?</p>

                        {(!formData.payout_type || formData.payout_type === 'mobile_money') ? (
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Wallet Network</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'mtn', name: 'MTN', color: 'bg-yellow-400' },
                                            { id: 'airtel', name: 'Airtel', color: 'bg-red-500' },
                                            { id: 'zamtel', name: 'Zamtel', color: 'bg-green-600' }
                                        ].map(net => (
                                            <button
                                                key={net.id}
                                                onClick={() => setFormData({ ...formData, mobile_network: net.id })}
                                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.mobile_network === net.id ? 'border-orange-500 bg-orange-50' : 'border-gray-50 bg-gray-50'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg ${net.color}`}></div>
                                                <span className="text-[10px] font-black uppercase tracking-tight">{net.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">+260</span>
                                        <input
                                            type="tel"
                                            className="w-full pl-16 pr-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-mono font-black"
                                            placeholder="970000000"
                                            value={formData.mobile_number || ''}
                                            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Bank</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Search banks..."
                                            className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-t-2xl focus:border-orange-500 outline-none transition-all font-medium border-b-0"
                                            value={bankSearch}
                                            onChange={(e) => setBankSearch(e.target.value)}
                                        />
                                        <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-b-2xl bg-white shadow-sm">
                                            {banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase())).map(bank => (
                                                <button
                                                    key={bank.id}
                                                    onClick={() => {
                                                        setFormData({ ...formData, bank_id: bank.id, bank_name: bank.name });
                                                        setBankSearch(bank.name);
                                                        setResolvedAccount(null);
                                                    }}
                                                    className={`w-full flex items-center gap-4 px-5 py-3 hover:bg-orange-50 transition-colors text-left ${formData.bank_id === bank.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                        {BANK_LOGOS[bank.id] ? (
                                                            <img src={BANK_LOGOS[bank.id]} className="w-full h-full object-contain" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">BANK</div>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">{bank.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Account Number</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-mono font-black"
                                            placeholder="0000000000"
                                            value={formData.bank_account || ''}
                                            onChange={(e) => {
                                                setFormData({ ...formData, bank_account: e.target.value });
                                                setResolvedAccount(null);
                                            }}
                                        />
                                        <button
                                            onClick={handleResolveAccount}
                                            disabled={isResolving || !formData.bank_id || !formData.bank_account}
                                            className="px-6 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            {isResolving ? '...' : 'Verify'}
                                        </button>
                                    </div>
                                    {resolvedAccount && (
                                        <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-green-600 tracking-tight">Verified Account Holder</p>
                                                <p className="text-sm font-bold text-gray-900">{resolvedAccount.accountName}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-12 max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Onboarding Complete!</h2>
                <p className="text-gray-500 mb-10 font-medium">Your sub-merchant account has been successfully linked. You can now start processing payments.</p>
                <Button onClick={onExit} className="w-full py-4 rounded-2xl bg-black text-white font-black text-lg shadow-xl shadow-gray-200">
                    Go to Dashboard
                </Button>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-12 max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 text-red-600">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Onboarding Failed</h2>
                <p className="text-red-500 mb-10 font-medium">{errorMessage}</p>
                <Button onClick={() => setStatus('onboarding')} className="w-full py-4 rounded-2xl bg-black text-white font-black text-lg">
                    Try Again
                </Button>
                <button onClick={onExit} className="mt-6 text-sm font-bold text-gray-400 hover:text-gray-600 underline">Dismiss</button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-gray-100 p-10 max-w-2xl mx-auto">
            <div className="mb-8">
                {/* Progress Indicator */}
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-orange-600 transition-all duration-500"
                        style={{ width: `${((currentStep + 1) / requirements.length) * 100}%` }}
                    ></div>
                </div>
                <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest text-right">
                    Step {currentStep + 1} of {requirements.length}
                </p>
            </div>

            {renderStep()}

            <div className="mt-12 pt-8 border-t border-gray-50 flex justify-end">
                <Button
                    onClick={handleNext}
                    className="w-full md:w-auto py-4 px-10 rounded-2xl font-black text-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-95"
                    isLoading={isSaving}
                >
                    {currentStep === requirements.length - 1 ? 'Complete Setup' : 'Continue'}
                </Button>
            </div>

            <div className="mt-8 text-center flex items-center justify-center gap-2 text-gray-300">
                <span className="text-[10px] font-bold uppercase tracking-widest">Powered by FlapaPay Connect</span>
            </div>
        </div>
    );
};
